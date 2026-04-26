import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { dealService } from '../services/dealService';
import type { Deal, DealStage } from '../types';
import { DealCard } from '../components/deals/DealCard';
import { AddDealModal } from '../components/deals/AddDealModal';
import { DealDetailDrawer } from '../components/deals/DealDetailDrawer';
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

export const Deals: React.FC = () => {
  const [pipeline, setPipeline] = useState<Record<DealStage, Deal[]>>({
    NEW: [],
    IN_PROGRESS: [],
    NEGOTIATION: [],
    WON: [],
    LOST: [],
  });
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [detailDrawerId, setDetailDrawerId] = useState<string | null>(null);

  useEffect(() => {
    loadPipeline();
  }, []);

  const loadPipeline = async () => {
    try {
      const data = await dealService.getPipeline();
      setPipeline(data.stages);
    } catch (error) {
      console.error('Failed to load pipeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) return;

    const newStage = destination.droppableId as DealStage;
    const dealId = draggableId;

    // Find current stage of the deal
    let currentStage: DealStage | null = null;
    for (const [stage, deals] of Object.entries(pipeline)) {
      if (deals.some(d => d.id === dealId)) {
        currentStage = stage as DealStage;
        break;
      }
    }

    if (!currentStage || currentStage === newStage) return;

    // Don't allow dragging out of WON/LOST
    if (currentStage === 'WON' || currentStage === 'LOST') return;

    // Don't allow dragging to WON/LOST directly (must go through NEGOTIATION)
    if ((newStage === 'WON' || newStage === 'LOST') && currentStage !== 'NEGOTIATION') return;

    try {
      await dealService.updateStage(dealId, newStage);
      loadPipeline();
    } catch (error) {
      console.error('Failed to update stage:', error);
      alert('Failed to move deal: ' + (error as Error).message);
    }
  };

  const handleCardClick = (dealId: string) => {
    setDetailDrawerId(dealId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Deals Pipeline</h1>
        <div className="flex items-center gap-3">
          <Button onClick={() => setAddModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Deal
          </Button>
        </div>
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
              <div
                key={stage}
                className="flex-shrink-0 w-72"
              >
                <div className="bg-slate-100 rounded-t-lg px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">{STAGE_LABELS[stage]}</span>
                    <span className="text-sm text-slate-500">{pipeline[stage].length}</span>
                  </div>
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
                      {pipeline[stage].map((deal, index) => (
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
                                onClick={() => handleCardClick(deal.id)}
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
    </div>
  );
};