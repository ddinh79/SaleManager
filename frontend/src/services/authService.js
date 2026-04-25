import api from './api';
export const authService = {
    login: (data) => {
        return api.post('/auth/login', data);
    },
};
