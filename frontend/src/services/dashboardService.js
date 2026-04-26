import api from './api';
const dashboardService = {
    getCEODashboard: async () => {
        const response = await api.get('/dashboard/ceo');
        return response.data;
    },
    getManagerDashboard: async () => {
        const response = await api.get('/dashboard/manager');
        return response.data;
    },
    getSalesDashboard: async () => {
        const response = await api.get('/dashboard/sales');
        return response.data;
    },
};
export default dashboardService;
