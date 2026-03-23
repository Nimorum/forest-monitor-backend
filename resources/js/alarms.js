import { eventBus } from './events';
import { ApiClient } from './api';

export class AlarmController {
    constructor() {
        this.container = document.getElementById('alarms-view');
        this.navItem = document.getElementById('nav-alarms');
        this.badge = document.getElementById('alarm-badge');
        
        this.alarmsContainer = document.getElementById('alarms-container');
        this.loadingState = document.getElementById('alarms-loading');
        this.errorState = document.getElementById('alarms-error');
        this.noAlarmsState = document.getElementById('no-alarms-message');
        
        this.refreshBtn = document.getElementById('btn-refresh-alarms');

        this.initListeners();
        this.checkAlarmsSilently();
        setInterval(() => this.checkAlarmsSilently(), 60000);
    }

    initListeners() {
        eventBus.subscribe('view:changed', (viewName) => this.handleViewChange(viewName));
        eventBus.subscribe('auth:success', () => this.checkAlarmsSilently());

        if (this.refreshBtn) {
            this.refreshBtn.addEventListener('click', () => this.loadAlarms());
        }

        this.alarmsContainer.addEventListener('click', (e) => {
            if (e.target.closest('.btn-resolve-alarm')) {
                const btn = e.target.closest('.btn-resolve-alarm');
                this.resolveAlarm(btn.dataset.id);
            }
            if (e.target.closest('.alarm-node-link')) {
                e.preventDefault();
                const link = e.target.closest('.alarm-node-link');
                eventBus.publish('node:history:requested', link.dataset.id);
            }
        });
    }

    handleViewChange(viewName) {
        if (viewName === 'alarms') {
            this.container.classList.remove('d-none');
            this.navItem.classList.add('active');
            this.loadAlarms();
        } else {
            this.container.classList.add('d-none');
            if(this.navItem) this.navItem.classList.remove('active');
        }
    }

    async checkAlarmsSilently() {
        if (!localStorage.getItem('auth_token')) return;

        try {
            const response = await ApiClient.get('/alarms');
            if (!response.ok) return;
            const result = await response.json();
            
            this.updateBadge(result.data.length);
        } catch (error) {
            console.error('Failed silent alarm check', error);
        }
    }

    async loadAlarms() {
        this.loadingState.classList.remove('d-none');
        this.alarmsContainer.innerHTML = '';
        this.errorState.classList.add('d-none');
        this.noAlarmsState.classList.add('d-none');

        try {
            const response = await ApiClient.get('/alarms');
            const result = await response.json();

            if (!response.ok) throw new Error(result.message || 'Failed to load alarms.');

            this.updateBadge(result.data.length);
            this.renderAlarms(result.data);

        } catch (error) {
            this.errorState.textContent = error.message;
            this.errorState.classList.remove('d-none');
        } finally {
            this.loadingState.classList.add('d-none');
        }
    }

    async resolveAlarm(id) {
        try {
            const response = await ApiClient.patch(`/alarms/${id}/resolve`, {});
            
            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || 'Failed to resolve alarm.');
            }
            this.loadAlarms();

        } catch (error) {
            alert(error.message);
        }
    }

    updateBadge(count) {
        if (!this.badge) return;
        
        if (count > 0) {
            this.badge.textContent = count;
            this.badge.classList.remove('d-none');
        } else {
            this.badge.classList.add('d-none');
        }
    }

    renderAlarms(alarms) {
        if (!alarms || alarms.length === 0) {
            this.noAlarmsState.classList.remove('d-none');
            return;
        }

        alarms.forEach(alarm => {
            const isFireRisk = alarm.type === 'fire_risk';
            const cardClass = isFireRisk ? 'border-danger bg-danger bg-opacity-10' : 'border-warning bg-warning bg-opacity-10';
            const icon = isFireRisk ? '🔥' : '🔋';
            const title = isFireRisk ? 'Critical Fire Risk' : 'Low Battery Voltage';
            const textClass = isFireRisk ? 'text-danger' : 'text-warning';

            const col = document.createElement('div');
            col.className = 'col-md-6 col-lg-4';
            
            const dateStr = new Date(alarm.created_at).toLocaleString();

            col.innerHTML = `
                <div class="card h-100 ${cardClass} shadow-sm">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="card-title ${textClass} mb-0">${icon} ${title}</h5>
                            <span class="badge bg-dark border border-secondary">${dateStr}</span>
                        </div>
                        <h6 class="card-subtitle mb-2 text-light border-bottom border-secondary pb-2">
                            Node: <a href="#" class="text-info text-decoration-none alarm-node-link" data-id="${alarm.node_id}">
                                <i class="bi bi-graph-up"></i> ${alarm.node.mac_address}
                            </a>
                        </h6>
                        <p class="card-text text-secondary mt-2">${alarm.message}</p>
                    </div>
                    <div class="card-footer bg-transparent border-0 pt-0">
                        <button class="btn btn-outline-light w-100 btn-resolve-alarm" data-id="${alarm.id}">
                            Mark as Resolved
                        </button>
                    </div>
                </div>
            `;

            this.alarmsContainer.appendChild(col);
        });
    }
}