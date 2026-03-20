import { eventBus } from './events';

export class ApiClient {
    static async request(endpoint, options = {}) {
        const token = localStorage.getItem('auth_token');

        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        const response = await fetch(`/api${endpoint}`, config);

        if (response.status === 401) {
            localStorage.removeItem('auth_token');
            eventBus.publish('auth:logout', {});
            eventBus.publish('view:changed', 'map');
            throw new Error('Session expired. Please login again.');
        }

        return response;
    }

    static async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    static async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    static async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}