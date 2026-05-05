import { useState, useEffect, useCallback, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import * as signalR from '@microsoft/signalr';
import { dealService } from '../services/dealService';
import { userService } from '../services/userService';
import { useAuthStore } from '../store/authStore';
import type { Deal, DealStage, StageMetric, LostReason, User } from '../types';
import { DealCard } from '../components/deals/DealCard';
import { AddDealModal } from '../components/deals/AddDealModal';
import { DealDetailDrawer } from '../components/deals/DealDetailDrawer';
import { LostReasonModal } from '../components/deals/LostReasonModal';
import { Button } from '../components/common/Button';
import { Plus } from 'lucide-react';

const STAGES: DealStage[] = ['NEW', 'IN_PROGRESS', 'NEGOTIATION', 'WON', 'LOST'];

const STAGE_LABELS: Record<DealStage, string> = {
  NEW: 'New',
  IN_PROGRESS: 'In Progress',
  NEGOTIATION: 'Negotiation',
  WON: 'Won',
  LOST: 'Lost',
};

const HUB_URL = '/hubs/deals';
const POLLING_INTERVAL = 30000; // 30 seconds

// Format VND currency
const formatVND = (amount: number) =>
  new Intl.NumberFormat('vi-VN').format(amount) + ' VND';

export const Deals: React.FC = () => {
  const [pipeline, setPipeline] = useState<Record<DealStage, Deal[]>>({
    NEW: [],
    IN_PROGRESS: [],
    NEGOTIATION: [],
    WON: [],
    LOST: [],
  });
  const [metrics, setMetrics] = useState<Record<DealStage, StageMetric>>({
    NEW: { count: 0, totalValue: 0 },
    IN_PROGRESS: { count: 0, totalValue: 0 },
    NEGOTIATION: { count: 0, totalValue: 0 },
    WON: { count: 0, totalValue: 0 },
    LOST: { count: 0, totalValue: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [detailDrawerId, setDetailDrawerId] = useState<string | null>(null);
  const [lostReasonModalOpen, setLostReasonModalOpen] = useState(false);
  const [pendingLostDeal, setPendingLostDeal] = useState<{ id: string; version: number } | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [filterSales, setFilterSales] = useState<string>('');
  const [filterProduct, setFilterProduct] = useState<string>('');
  const [salesUsers, setSalesUsers] = useState<User[]>([]);

  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { token, user } = useAuthStore();

  // Load pipeline data
  const loadPipeline = useCallback(async () => {
    try {
      const data = await dealService.getPipeline();
      setPipeline(data.stages);
      if (data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Failed to load pipeline:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Optimistic update for drag-drop
  const updateDealLocally = useCallback((dealId: string, fromStage: DealStage, toStage: DealStage, fromIndex: number, toIndex: number) => {
    setPipeline(prev => {
      const newPipeline = { ...prev };
      const sourceDeals = [...prev[fromStage]];
      const destDeals = fromStage === toStage ? sourceDeals : [...prev[toStage]];
      const [movedDeal] = sourceDeals.splice(fromIndex, 1);
      movedDeal.stage = toStage;
      movedDeal.version++;

      if (fromStage === toStage) {
        sourceDeals.splice(toIndex, 0, movedDeal);
        newPipeline[fromStage] = sourceDeals;
      } else {
        destDeals.splice(toIndex, 0, movedDeal);
        newPipeline[fromStage] = sourceDeals;
        newPipeline[toStage] = destDeals;
      }
      return newPipeline;
    });
  }, []);

  // Rollback on failure
  const rollbackDeal = useCallback(() => {
    loadPipeline(); // Full reload on failure
  }, [loadPipeline]);

  // Load sales users for filter dropdown
  const loadSalesUsers = useCallback(async () => {
    try {
      if (user?.role === 'Admin') {
        const users = await userService.getSalesMembers();
        setSalesUsers(users);
      } else if (user?.role === 'SalesManager') {
        const users = await userService.getTeam(user.id);
        setSalesUsers(users);
      } else {
        setSalesUsers([]);
      }
    } catch (error) {
      console.error('Failed to load sales users:', error);
    }
  }, [user?.role, user?.id]);

  // Handle drag end
  const handleDragEnd = async (result: DropResult) => {
    const { draggableId, destination, source } = result;
    if (!destination) return;

    const fromStage = source.droppableId as DealStage;
    const toStage = destination.droppableId as DealStage;
    const fromIndex = source.index;
    const toIndex = destination.index;

    if (fromStage === toStage && fromIndex === toIndex) return;

    // Find deal
    const deal = pipeline[fromStage].find(d => d.id === draggableId);
    if (!deal) return;

    // Locked stage check
    if (fromStage === 'WON' || fromStage === 'LOST') return;

    // Linear progression: can't skip to WON/LOST from NEW/IN_PROGRESS
    if ((toStage === 'WON' || toStage === 'LOST') && fromStage !== 'NEGOTIATION') {
      alert('Deals must go through Negotiation before moving to Won/Lost');
      return;
    }

    // If moving to LOST, show reason modal
    if (toStage === 'LOST') {
      setPendingLostDeal({ id: draggableId, version: deal.version });
      setLostReasonModalOpen(true);
      return;
    }

    // Optimistic update
    updateDealLocally(draggableId, fromStage, toStage, fromIndex, toIndex);

    try {
      await dealService.updateStage(draggableId, toStage, deal.version);
      loadPipeline(); // Reload to get fresh position/version
    } catch (error: any) {
      console.error('Failed to update stage:', error);
      rollbackDeal();
      if (error?.response?.data?.includes('CONCURRENCY_CONFLICT')) {
        alert('This deal was modified by another user. Refreshing...');
      } else {
        alert('Failed to move deal: ' + (error as Error).message);
      }
    }
  };

  // Confirm lost reason
  const handleLostReasonConfirm = async (reason: LostReason, notes: string) => {
    if (!pendingLostDeal) return;

    const { id, version } = pendingLostDeal;
    const fromStage = pipeline['NEGOTIATION'].find(d => d.id === id)
      ? 'NEGOTIATION'
      : pipeline['NEW'].find(d => d.id === id)
        ? 'NEW'
        : pipeline['IN_PROGRESS'].find(d => d.id === id)
          ? 'IN_PROGRESS'
          : 'NEGOTIATION';

    // Optimistic update
    setPipeline(prev => {
      const sourceDeals = [...prev[fromStage]];
      const destDeals = [...prev['LOST']];
      const idx = sourceDeals.findIndex(d => d.id === id);
      if (idx === -1) return prev;
      const [movedDeal] = sourceDeals.splice(idx, 1);
      movedDeal.stage = 'LOST';
      movedDeal.lostReason = reason;
      movedDeal.lostNotes = notes;
      sourceDeals.splice(idx, 1);
      destDeals.splice(0, 0, movedDeal);
      return { ...prev, [fromStage]: sourceDeals, LOST: destDeals };
    });

    try {
      await dealService.updateStage(id, 'LOST', version, reason, notes);
      loadPipeline();
    } catch (error) {
      console.error('Failed to mark as lost:', error);
      rollbackDeal();
      alert('Failed to mark deal as lost: ' + (error as Error).message);
    } finally {
      setLostReasonModalOpen(false);
      setPendingLostDeal(null);
    }
  };

  // SignalR connection with polling fallback
  useEffect(() => {
    const connectSignalR = async () => {
      try {
        const apiUrl = (import.meta as any).env?.VITE_API_URL || '';
        const connection = new signalR.HubConnectionBuilder()
          .withUrl(`${apiUrl}${HUB_URL}`, {
            accessTokenFactory: () => token || '',
          })
          .withAutomaticReconnect()
          .build();

        connection.on('DealMoved', (data: { dealId: string; fromStage: string; toStage: string; version: number }) => {
          console.log('[SignalR] DealMoved:', data);
          // Only update if we didn't originate this change
          loadPipeline();
        });

        connection.on('DealCreated', () => {
          console.log('[SignalR] DealCreated');
          loadPipeline();
        });

        connection.on('DealDeleted', (data: { dealId: string }) => {
          console.log('[SignalR] DealDeleted:', data);
          loadPipeline();
        });

        connection.onclose(() => {
          console.log('[SignalR] Disconnected, starting polling');
          setIsConnected(false);
          startPolling();
        });

        connection.onreconnected(() => {
          console.log('[SignalR] Reconnected');
          setIsConnected(true);
          stopPolling();
        });

        await connection.start();
        setIsConnected(true);
        stopPolling();

        connectionRef.current = connection;
      } catch (e) {
        console.warn('[SignalR] Connection failed, using polling:', e);
        setIsConnected(false);
        startPolling();
      }
    };

    const startPolling = () => {
      if (pollingRef.current) return;
      pollingRef.current = setInterval(() => {
        console.log('[Polling] Refreshing pipeline...');
        loadPipeline();
      }, POLLING_INTERVAL);
    };

    const stopPolling = () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };

    connectSignalR();

    return () => {
      connectionRef.current?.stop();
      stopPolling();
    };
  }, [token, loadPipeline]);

  // Initial load
  useEffect(() => {
    loadPipeline();
  }, [loadPipeline]);

  // Load sales users for filter
  useEffect(() => {
    loadSalesUsers();
  }, [loadSalesUsers]);

  // Apply filters to pipeline
  const filteredPipeline = Object.entries(pipeline).reduce((acc, [stage, deals]) => {
    let filtered = deals;
    if (filterSales) {
      filtered = filtered.filter(d => d.salesId === filterSales);
    }
    if (filterProduct) {
      filtered = filtered.filter(d => d.product === filterProduct);
    }
    acc[stage as DealStage] = filtered;
    return acc;
  }, {} as Record<DealStage, Deal[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-800">Deals Pipeline</h1>
          <span className={`px-2 py-0.5 text-xs rounded ${isConnected ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {isConnected ? 'Live' : 'Polling'}
          </span>
        </div>
        <Button onClick={() => setAddModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Deal
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4 bg-white p-3 rounded-lg border">
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600">Filter:</label>
          <select
            value={filterSales}
            onChange={(e) => setFilterSales(e.target.value)}
            className="px-3 py-1.5 border rounded-md text-sm"
          >
            <option value="">All Sales</option>
            {salesUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.fullName}</option>
            ))}
          </select>
          <select
            value={filterProduct}
            onChange={(e) => setFilterProduct(e.target.value)}
            className="px-3 py-1.5 border rounded-md text-sm"
          >
            <option value="">All Products</option>
            <option value="SILICONE">Silicone</option>
            <option value="CREAM">Cream</option>
          </select>
        </div>
        {(filterSales || filterProduct) && (
          <button
            onClick={() => { setFilterSales(''); setFilterProduct(''); }}
            className="text-sm text-blue-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STAGES.map((stage) => (
              <div key={stage} className="flex-shrink-0 w-72">
                {/* Column Header with Metrics */}
                <div className="bg-slate-100 rounded-t-lg px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">{STAGE_LABELS[stage]}</span>
                    <span className="text-sm text-slate-500">{filteredPipeline[stage].length}</span>
                  </div>
                  {metrics[stage] && metrics[stage].totalValue > 0 && (
                    <div className="text-xs text-slate-500 mt-0.5">
                      {formatVND(metrics[stage].totalValue)}
                    </div>
                  )}
                </div>

                <Droppable droppableId={stage}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`
                        bg-slate-50 rounded-b-lg p-2 min-h-[200px] space-y-2
                        ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}
                      `}
                    >
                      {filteredPipeline[stage].map((deal, index) => (
                        <Draggable
                          key={deal.id}
                          draggableId={deal.id}
                          index={index}
                          isDragDisabled={stage === 'WON' || stage === 'LOST'}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <DealCard
                                deal={deal}
                                onClick={() => setDetailDrawerId(deal.id)}
                                isDragging={snapshot.isDragging}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}

      {/* Add Deal Modal */}
      <AddDealModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={loadPipeline}
      />

      {/* Deal Detail Drawer */}
      <DealDetailDrawer
        dealId={detailDrawerId}
        isOpen={detailDrawerId !== null}
        onClose={() => setDetailDrawerId(null)}
        onUpdate={loadPipeline}
      />

      {/* Lost Reason Modal */}
      <LostReasonModal
        isOpen={lostReasonModalOpen}
        onClose={() => {
          setLostReasonModalOpen(false);
          setPendingLostDeal(null);
        }}
        onConfirm={handleLostReasonConfirm}
      />
    </div>
  );
};