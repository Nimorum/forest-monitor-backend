import { eventBus } from './events';
import { ApiClient } from './api';

export class AlarmController {
    constructor() {
        this.initDOM();
        this.initListeners();
        
        // Initial check and interval setup
        this.checkAlarmsSilently();
        this.pollInterval = setInterval(() => this.checkAlarmsSilently(), 60000);
    }

    initDOM() {
        this.elements = {
            container: document.getElementById('alarms-view'),
            navItem: document.getElementById('nav-alarms'),
            badge: document.getElementById('alarm-badge'),
            alarmsContainer: document.getElementById('alarms-container'),
            refreshBtn: document.getElementById('btn-refresh-alarms'),
            states: {
                loading: document.getElementById('alarms-loading'),
                error: document.getElementById('alarms-error'),
                empty: document.getElementById('no-alarms-message')
            }
        };
    }

    initListeners() {
        eventBus.subscribe('view:changed', (viewName) => this.handleViewChange(viewName));
        eventBus.subscribe('auth:success', () => this.checkAlarmsSilently());

        this.elements.refreshBtn?.addEventListener('click', () => this.loadAlarms());

        this.elements.alarmsContainer?.addEventListener('click', (e) => {
            const resolveBtn = e.target.closest('.btn-resolve-alarm');
            if (resolveBtn) {
                this.resolveAlarm(resolveBtn.dataset.id);
                return;
            }
            
            const nodeLink = e.target.closest('.alarm-node-link');
            if (nodeLink) {
                e.preventDefault();
                eventBus.publish('node:history:requested', nodeLink.dataset.id);
            }
        });
    }

    handleViewChange(viewName) {
        const isAlarmsView = viewName === 'alarms';
        this.elements.container?.classList.toggle('d-none', !isAlarmsView);
        this.elements.navItem?.classList.toggle('active', isAlarmsView);

        if (isAlarmsView) {
            this.loadAlarms();
        }
    }

    setUIState(state, errorMessage = '') {
        const { loading, error, empty } = this.elements.states;
        
        loading?.classList.toggle('d-none', state !== 'loading');
        empty?.classList.toggle('d-none', state !== 'empty');
        
        if (error) {
            error.classList.toggle('d-none', state !== 'error');
            if (state === 'error') error.textContent = errorMessage;
        }
    }

    async checkAlarmsSilently() {
        if (!localStorage.getItem('auth_token')) return;

        try {
            const response = await ApiClient.get('/alarms');
            if (response.ok) {
                const result = await response.json();
                this.updateBadge(result.data.length);
            }
        } catch (error) {
            console.error('Failed silent alarm check', error);
        }
    }

    async loadAlarms() {
        this.setUIState('loading');
        this.elements.alarmsContainer.innerHTML = '';

        try {
            const response = await ApiClient.get('/alarms');
            const result = await response.json();

            if (!response.ok) throw new Error(result.message || 'Failed to load alarms.');

            this.updateBadge(result.data.length);
            this.renderAlarms(result.data);
        } catch (error) {
            this.setUIState('error', error.message);
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
        if (!this.elements.badge) return;
        
        this.elements.badge.textContent = count;
        this.elements.badge.classList.toggle('d-none', count === 0);
    }

    renderAlarms(alarms) {
        if (!alarms?.length) {
            this.setUIState('empty');
            return;
        }

        this.setUIState('loaded');

        this.elements.alarmsContainer.innerHTML = alarms.map(alarm => {
            const isFireRisk = alarm.type === 'fire_risk';
            
            const cardConfig = isFireRisk ? {
                cardClass: 'border-danger bg-danger bg-opacity-10',
                icon: '🔥',
                title: 'Critical Fire Risk',
                textClass: 'text-danger'
            } : {
                cardClass: 'border-warning bg-warning bg-opacity-10',
                icon: '🔋',
                title: 'Low Battery Voltage',
                textClass: 'text-warning'
            };

            const dateStr = new Date(alarm.created_at).toLocaleString();

            return `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card h-100 ${cardConfig.cardClass} shadow-sm">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h5 class="card-title ${cardConfig.textClass} mb-0">
                                    ${cardConfig.icon} ${cardConfig.title}
                                </h5>
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
                </div>
            `;
        }).join('');
    }
}