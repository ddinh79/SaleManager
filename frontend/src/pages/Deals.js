import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import * as signalR from '@microsoft/signalr';
import { dealService } from '../services/dealService';
import { userService } from '../services/userService';
import { useAuthStore } from '../store/authStore';
import { DealCard } from '../components/deals/DealCard';
import { AddDealModal } from '../components/deals/AddDealModal';
import { DealDetailDrawer } from '../components/deals/DealDetailDrawer';
import { LostReasonModal } from '../components/deals/LostReasonModal';
import { Button } from '../components/common/Button';
import { Plus } from 'lucide-react';
const STAGES = ['NEW', 'IN_PROGRESS', 'NEGOTIATION', 'WON', 'LOST'];
const STAGE_LABELS = {
    NEW: 'New',
    IN_PROGRESS: 'In Progress',
    NEGOTIATION: 'Negotiation',
    WON: 'Won',
    LOST: 'Lost',
};
const HUB_URL = '/hubs/deals';
const POLLING_INTERVAL = 30000; // 30 seconds
// Format VND currency
const formatVND = (amount) => new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
export const Deals = () => {
    const [pipeline, setPipeline] = useState({
        NEW: [],
        IN_PROGRESS: [],
        NEGOTIATION: [],
        WON: [],
        LOST: [],
    });
    const [metrics, setMetrics] = useState({
        NEW: { count: 0, totalValue: 0 },
        IN_PROGRESS: { count: 0, totalValue: 0 },
        NEGOTIATION: { count: 0, totalValue: 0 },
        WON: { count: 0, totalValue: 0 },
        LOST: { count: 0, totalValue: 0 },
    });
    const [loading, setLoading] = useState(true);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [detailDrawerId, setDetailDrawerId] = useState(null);
    const [lostReasonModalOpen, setLostReasonModalOpen] = useState(false);
    const [pendingLostDeal, setPendingLostDeal] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [filterSales, setFilterSales] = useState('');
    const [filterProduct, setFilterProduct] = useState('');
    const [salesUsers, setSalesUsers] = useState([]);
    const connectionRef = useRef(null);
    const pollingRef = useRef(null);
    const { token, user } = useAuthStore();
    // Load pipeline data
    const loadPipeline = useCallback(async () => {
        try {
            const data = await dealService.getPipeline();
            setPipeline(data.stages);
            if (data.metrics) {
                setMetrics(data.metrics);
            }
        }
        catch (error) {
            console.error('Failed to load pipeline:', error);
        }
        finally {
            setLoading(false);
        }
    }, []);
    // Optimistic update for drag-drop
    const updateDealLocally = useCallback((dealId, fromStage, toStage, fromIndex, toIndex) => {
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
            }
            else {
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
            }
            else if (user?.role === 'SalesManager') {
                const users = await userService.getTeam(user.id);
                setSalesUsers(users);
            }
            else {
                setSalesUsers([]);
            }
        }
        catch (error) {
            console.error('Failed to load sales users:', error);
        }
    }, [user?.role, user?.id]);
    // Handle drag end
    const handleDragEnd = async (result) => {
        const { draggableId, destination, source } = result;
        if (!destination)
            return;
        const fromStage = source.droppableId;
        const toStage = destination.droppableId;
        const fromIndex = source.index;
        const toIndex = destination.index;
        if (fromStage === toStage && fromIndex === toIndex)
            return;
        // Find deal
        const deal = pipeline[fromStage].find(d => d.id === draggableId);
        if (!deal)
            return;
        // Locked stage check
        if (fromStage === 'WON' || fromStage === 'LOST')
            return;
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
        }
        catch (error) {
            console.error('Failed to update stage:', error);
            rollbackDeal();
            if (error?.response?.data?.includes('CONCURRENCY_CONFLICT')) {
                alert('This deal was modified by another user. Refreshing...');
            }
            else {
                alert('Failed to move deal: ' + error.message);
            }
        }
    };
    // Confirm lost reason
    const handleLostReasonConfirm = async (reason, notes) => {
        if (!pendingLostDeal)
            return;
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
            if (idx === -1)
                return prev;
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
        }
        catch (error) {
            console.error('Failed to mark as lost:', error);
            rollbackDeal();
            alert('Failed to mark deal as lost: ' + error.message);
        }
        finally {
            setLostReasonModalOpen(false);
            setPendingLostDeal(null);
        }
    };
    // SignalR connection with polling fallback
    useEffect(() => {
        const connectSignalR = async () => {
            try {
                const apiUrl = import.meta.env?.VITE_API_URL || '';
                const connection = new signalR.HubConnectionBuilder()
                    .withUrl(`${apiUrl}${HUB_URL}`, {
                    accessTokenFactory: () => token || '',
                })
                    .withAutomaticReconnect()
                    .build();
                connection.on('DealMoved', (data) => {
                    console.log('[SignalR] DealMoved:', data);
                    // Only update if we didn't originate this change
                    loadPipeline();
                });
                connection.on('DealCreated', () => {
                    console.log('[SignalR] DealCreated');
                    loadPipeline();
                });
                connection.on('DealDeleted', (data) => {
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
            }
            catch (e) {
                console.warn('[SignalR] Connection failed, using polling:', e);
                setIsConnected(false);
                startPolling();
            }
        };
        const startPolling = () => {
            if (pollingRef.current)
                return;
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
        acc[stage] = filtered;
        return acc;
    }, {});
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("h1", { className: "text-2xl font-bold text-slate-800", children: "Deals Pipeline" }), _jsx("span", { className: `px-2 py-0.5 text-xs rounded ${isConnected ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`, children: isConnected ? 'Live' : 'Polling' })] }), _jsxs(Button, { onClick: () => setAddModalOpen(true), children: [_jsx(Plus, { className: "w-4 h-4" }), "Add Deal"] })] }), _jsxs("div", { className: "flex items-center gap-4 bg-white p-3 rounded-lg border", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("label", { className: "text-sm text-slate-600", children: "Filter:" }), _jsxs("select", { value: filterSales, onChange: (e) => setFilterSales(e.target.value), className: "px-3 py-1.5 border rounded-md text-sm", children: [_jsx("option", { value: "", children: "All Sales" }), salesUsers.map((u) => (_jsx("option", { value: u.id, children: u.fullName }, u.id)))] }), _jsxs("select", { value: filterProduct, onChange: (e) => setFilterProduct(e.target.value), className: "px-3 py-1.5 border rounded-md text-sm", children: [_jsx("option", { value: "", children: "All Products" }), _jsx("option", { value: "SILICONE", children: "Silicone" }), _jsx("option", { value: "CREAM", children: "Cream" })] })] }), (filterSales || filterProduct) && (_jsx("button", { onClick: () => { setFilterSales(''); setFilterProduct(''); }, className: "text-sm text-blue-600 hover:underline", children: "Clear filters" }))] }), loading ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" }) })) : (_jsx(DragDropContext, { onDragEnd: handleDragEnd, children: _jsx("div", { className: "flex gap-4 overflow-x-auto pb-4", children: STAGES.map((stage) => (_jsxs("div", { className: "flex-shrink-0 w-72", children: [_jsxs("div", { className: "bg-slate-100 rounded-t-lg px-3 py-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "font-semibold text-slate-700", children: STAGE_LABELS[stage] }), _jsx("span", { className: "text-sm text-slate-500", children: filteredPipeline[stage].length })] }), metrics[stage] && metrics[stage].totalValue > 0 && (_jsx("div", { className: "text-xs text-slate-500 mt-0.5", children: formatVND(metrics[stage].totalValue) }))] }), _jsx(Droppable, { droppableId: stage, children: (provided, snapshot) => (_jsxs("div", { ref: provided.innerRef, ...provided.droppableProps, className: `
                        bg-slate-50 rounded-b-lg p-2 min-h-[200px] space-y-2
                        ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}
                      `, children: [filteredPipeline[stage].map((deal, index) => (_jsx(Draggable, { draggableId: deal.id, index: index, isDragDisabled: stage === 'WON' || stage === 'LOST', children: (provided, snapshot) => (_jsx("div", { ref: provided.innerRef, ...provided.draggableProps, ...provided.dragHandleProps, children: _jsx(DealCard, { deal: deal, onClick: () => setDetailDrawerId(deal.id), isDragging: snapshot.isDragging }) })) }, deal.id))), provided.placeholder] })) })] }, stage))) }) })), _jsx(AddDealModal, { isOpen: addModalOpen, onClose: () => setAddModalOpen(false), onSuccess: loadPipeline }), _jsx(DealDetailDrawer, { dealId: detailDrawerId, isOpen: detailDrawerId !== null, onClose: () => setDetailDrawerId(null), onUpdate: loadPipeline }), _jsx(LostReasonModal, { isOpen: lostReasonModalOpen, onClose: () => {
                    setLostReasonModalOpen(false);
                    setPendingLostDeal(null);
                }, onConfirm: handleLostReasonConfirm })] }));
};
