import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
    timeout: 15000
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        if (status === 401) {
            localStorage.removeItem('token');
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const authApi = {
    login: (data) => api.post('/auth/login', data),
    register: (data) => api.post('/auth/register', data),
    sendCode: (phone) => api.post('/auth/send-code', { phone }),
    checkAvailability: (type, value) => api.post('/auth/check', { type, value }),
};

export const settingsApi = {
    get: () => api.get('/settings'),
    update: (data) => api.put('/settings', data),
};

export const profileApi = {
    get: () => api.get('/profile'),
    update: (data) => api.put('/profile', data),
};

export const projectsApi = {
    getAll: (params) => api.get('/projects', { params }),
    create: (data) => api.post('/projects', data),
    update: (id, data) => api.put(`/projects/${id}`, data),
    delete: (id) => api.delete(`/projects/${id}`),
    bulkDelete: (ids) => api.post('/projects/bulk-delete', { ids }),
};

export const resourcesApi = {
    getAll: (params) => api.get('/resources', { params }),
    create: (data) => api.post('/resources', data),
    update: (id, data) => api.put(`/resources/${id}`, data),
    delete: (id) => api.delete(`/resources/${id}`),
    bulkDelete: (ids) => api.post('/resources/bulk-delete', { ids }),
};

export const columnsApi = {
    getAll: (params) => api.get('/columns', { params }),
    getTree: (id) => api.get(`/columns/${id}/tree`),
    create: (data) => api.post('/columns', data),
    update: (id, data) => api.put(`/columns/${id}`, data),
    delete: (id) => api.delete(`/columns/${id}`),
    bulkDelete: (ids) => api.post('/columns/bulk-delete', { ids }),
    createNode: (columnId, data) => api.post(`/columns/${columnId}/nodes`, data),
    updateNode: (nodeId, data) => api.put(`/columns/nodes/${nodeId}`, data),
    deleteNode: (nodeId) => api.delete(`/columns/nodes/${nodeId}`),
};


export const adminApi = {
    getStats: () => api.get('/admin/stats'),
    getHealth: () => api.get('/admin/health'),
    listBackups: () => api.get('/admin/backups'),
    backup: () => api.post('/admin/backup'),
    restore: (file) => api.post('/admin/restore', { file }),
    logs: (params) => api.get('/admin/logs', { params }),
    exportLogs: (params) => api.get('/admin/logs/export', { params, responseType: 'blob' }),
    me: () => api.get('/admin/me'),
    updateMe: (data) => api.put('/admin/me', data),
    listUsers: (params) => api.get('/admin/users', { params }),
    updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
    updateUserMembership: (id, membershipType) => api.put(`/admin/users/${id}/membership`, { membershipType }),
    batchUpdateRole: (ids, role) => api.post('/admin/users/batch-role', { ids, role }),
    updateUserPassword: (id, newPassword) => api.put(`/admin/users/${id}/password`, { newPassword }),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
};


export const tagsApi = {
    getAll: (params) => api.get('/tags', { params }),
    getPublic: (params) => api.get('/tags/public', { params }),
    create: (data) => api.post('/tags', data),
    update: (id, data) => api.put(`/tags/${id}`, data),
    delete: (id) => api.delete(`/tags/${id}`),
    bulkDelete: (ids) => api.post('/tags/bulk-delete', { ids }),
};

export const categoriesApi = {
    getAll: (params) => api.get('/categories', { params }),
    getPublic: (params) => api.get('/categories/public', { params }),
    getTree: () => api.get('/categories/tree'),
    create: (data) => api.post('/categories', data),
    update: (id, data) => api.put(`/categories/${id}`, data),
    delete: (id) => api.delete(`/categories/${id}`),
    bulkDelete: (ids) => api.post('/categories/bulk-delete', { ids }),
};

export const visitApi = {
    record: (data) => api.post('/visit', data),
    getAnalytics: (params) => api.get('/visit/analytics', { params }),
    getRecentVisits: (params) => api.get('/visit/recent', { params }),
};

export const weightApi = {
    getAll: (params) => api.get('/weight', { params }),
    add: (data) => api.post('/weight', data),
    delete: (id) => api.delete(`/weight/${id}`),
};

export const dietApi = {
    getByDate: (date) => api.get('/diet', { params: { date } }),
    create: (data) => api.post('/diet', data),
    update: (id, data) => api.put(`/diet/${id}`, data),
    delete: (id) => api.delete(`/diet/${id}`),
};

export const commentsApi = {
    toggleLike: (id) => api.post(`/comments/${id}/like`),
    // 管理员接口
    getAll: (params) => api.get('/comments/admin/all', { params }),
    getStats: () => api.get('/comments/admin/stats'),
    delete: (id) => api.delete(`/comments/admin/${id}`),
    bulkDelete: (ids) => api.post('/comments/admin/bulk-delete', { ids }),
};

export default api;
