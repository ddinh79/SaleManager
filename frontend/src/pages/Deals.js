import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { dealService } from '../services/dealService';
import { DealCard } from '../components/deals/DealCard';
import { AddDealModal } from '../components/deals/AddDealModal';
import { DealDetailDrawer } from '../components/deals/DealDetailDrawer';
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
export const Deals = () => {
    const [pipeline, setPipeline] = useState({
        NEW: [],
        IN_PROGRESS: [],
        NEGOTIATION: [],
        WON: [],
        LOST: [],
    });
    const [loading, setLoading] = useState(true);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [detailDrawerId, setDetailDrawerId] = useState(null);
    useEffect(() => {
        loadPipeline();
    }, []);
    const loadPipeline = async () => {
        try {
            const data = await dealService.getPipeline();
            setPipeline(data.stages);
        }
        catch (error) {
            console.error('Failed to load pipeline:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleDragEnd = async (result) => {
        const { draggableId, destination } = result;
        if (!destination)
            return;
        const newStage = destination.droppableId;
        const dealId = draggableId;
        // Find current stage of the deal
        let currentStage = null;
        for (const [stage, deals] of Object.entries(pipeline)) {
            if (deals.some(d => d.id === dealId)) {
                currentStage = stage;
                break;
            }
        }
        if (!currentStage || currentStage === newStage)
            return;
        // Don't allow dragging out of WON/LOST
        if (currentStage === 'WON' || currentStage === 'LOST')
            return;
        // Don't allow dragging to WON/LOST directly (must go through NEGOTIATION)
        if ((newStage === 'WON' || newStage === 'LOST') && currentStage !== 'NEGOTIATION')
            return;
        try {
            await dealService.updateStage(dealId, newStage);
            loadPipeline();
        }
        catch (error) {
            console.error('Failed to update stage:', error);
            alert('Failed to move deal: ' + error.message);
        }
    };
    const handleCardClick = (dealId) => {
        setDetailDrawerId(dealId);
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-bold text-slate-800", children: "Deals Pipeline" }), _jsx("div", { className: "flex items-center gap-3", children: _jsxs(Button, { onClick: () => setAddModalOpen(true), children: [_jsx(Plus, { className: "w-4 h-4" }), "Add Deal"] }) })] }), loading ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" }) })) : (_jsx(DragDropContext, { onDragEnd: handleDragEnd, children: _jsx("div", { className: "flex gap-4 overflow-x-auto pb-4", children: STAGES.map((stage) => (_jsxs("div", { className: "flex-shrink-0 w-72", children: [_jsx("div", { className: "bg-slate-100 rounded-t-lg px-3 py-2", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "font-semibold text-slate-700", children: STAGE_LABELS[stage] }), _jsx("span", { className: "text-sm text-slate-500", children: pipeline[stage].length })] }) }), _jsx(Droppable, { droppableId: stage, children: (provided, snapshot) => (_jsxs("div", { ref: provided.innerRef, ...provided.droppableProps, className: `
                        bg-slate-50 rounded-b-lg p-2 min-h-[200px] space-y-2
                        ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}
                      `, children: [pipeline[stage].map((deal, index) => (_jsx(Draggable, { draggableId: deal.id, index: index, isDragDisabled: stage === 'WON' || stage === 'LOST', children: (provided, snapshot) => (_jsx("div", { ref: provided.innerRef, ...provided.draggableProps, ...provided.dragHandleProps, children: _jsx(DealCard, { deal: deal, onClick: () => handleCardClick(deal.id), isDragging: snapshot.isDragging }) })) }, deal.id))), provided.placeholder] })) })] }, stage))) }) })), _jsx(AddDealModal, { isOpen: addModalOpen, onClose: () => setAddModalOpen(false), onSuccess: loadPipeline }), _jsx(DealDetailDrawer, { dealId: detailDrawerId, isOpen: detailDrawerId !== null, onClose: () => setDetailDrawerId(null), onUpdate: loadPipeline })] }));
};
