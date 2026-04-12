import { eventBus } from './events';
import { ApiClient } from './api';
import Chart from 'chart.js/auto';
import flatpickr from 'flatpickr';

const formatDate = (dateString, includeYear = false) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    if (includeYear) {
        return `${day}/${month}/${date.getFullYear()} ${hours}:${minutes}`;
    }
    return `${day}/${month} ${hours}:${minutes}`;
};

export class ManageController {
    constructor() {
        this.initDOM();
        this.state = {
            chartInstance: null,
            currentNodeId: null,
            fpStart: null,
            fpEnd: null,
            canManageNode: false,
            longitude: null,
            latitude: null
        };
        this.initListeners();
    }

    initDOM() {
        this.elements = {
            modal: document.getElementById('manageModal'),
            title: document.getElementById('manageModalLabel'),
            loading: document.getElementById('history-loading'),
            error: document.getElementById('history-error'),
            chartContainer: document.getElementById('chart-container'),
            tableBody: document.getElementById('telemetry-table-body'),
            startDate: document.getElementById('history-start'),
            endDate: document.getElementById('history-end'),
            updateBtn: document.getElementById('btn-update-history'),
            groupSelect: document.getElementById('modal-group-select'),
            btnAddGroup: document.getElementById('btn-modal-add-group'),
            btnMoveGroup: document.getElementById('btn-modal-move-group'),
            currentGroupsContainer: document.getElementById('current-node-groups'),
            globalDateFilters: document.getElementById('global-date-filters'),
            visibilitySwitch: document.getElementById('modal-visibility-switch'),
            mapBtn: document.getElementById('btn-center-node'),
            settingsTab: document.getElementById('settings-tab'),
            tabs: document.querySelectorAll('button[data-bs-toggle="tab"]')
        };
        this.modalInstance = new bootstrap.Modal(this.elements.modal);
    }

    initListeners() {
        eventBus.subscribe('node:history:requested', (nodeId) => this.openManage(nodeId));

        this.elements.updateBtn?.addEventListener('click', () => {
            if (this.state.currentNodeId) this.fetchAndRenderData();
        });

        this.elements.btnAddGroup?.addEventListener('click', () => this.handleGroupAction(false));
        this.elements.btnMoveGroup?.addEventListener('click', () => this.handleGroupAction(true));

        this.elements.tabs.forEach(tab => {
            tab.addEventListener('show.bs.tab', (event) => {
                this.elements.globalDateFilters.classList.toggle('d-none', event.target.id === 'settings-tab');
            });
        });

        this.elements.visibilitySwitch?.addEventListener('change', async (e) => {
            const isPublic = e.target.checked;
            try {
                const response = await ApiClient.patch('/nodes/bulk-visibility', { 
                    node_ids: [this.state.currentNodeId],
                    is_public: isPublic 
                });
                
                if (!response.ok) throw new Error('Request failed');
                eventBus.publish('nodes:refresh'); 
            } catch (error) {
                e.target.checked = !isPublic; 
                alert('Error updating visibility.');
                console.error(error);
            }
        });

        this.elements.mapBtn?.addEventListener('click', () => {
            if (this.state.longitude !== null && this.state.latitude !== null) {
                eventBus.publish('map:center-on', { 
                    longitude: this.state.longitude, 
                    latitude: this.state.latitude 
                });
                this.modalInstance.hide();
            } else {
                alert('Node location data is not available.');
            }
        });
    }

    initDatePickers(defaultStart, defaultEnd) {
        const config = {
            enableTime: true,
            dateFormat: "d/m/Y H:i",
            time_24hr: true,
            allowInput: false
        };

        this.state.fpStart = flatpickr(this.elements.startDate, { ...config, defaultDate: defaultStart });
        this.state.fpEnd = flatpickr(this.elements.endDate, { ...config, defaultDate: defaultEnd });
    }

    async openManage(nodeId) {
        this.state.currentNodeId = nodeId;
        this.modalInstance.show();

        const firstTab = document.querySelector('#nodeManageTabs button[data-bs-target="#chart-pane"]');
        const tabInstance = bootstrap.Tab.getInstance(firstTab) || new bootstrap.Tab(firstTab);
        tabInstance.show();
        
        const end = new Date();
        const start = new Date();
        start.setHours(start.getHours() - 24);

        this.initDatePickers(start, end);
        
        this.state.canManageNode = await this.loadCanManageStatus();
        this.fetchAndRenderData();
        
        if (this.state.canManageNode) {
            this.loadGroups();
            this.loadCurrentNodeGroups();
        }
    }

    async loadCanManageStatus() {
        try {
            const response = await ApiClient.get(`/can-manage-node/${this.state.currentNodeId}`);
            const result = await response.json();
            
            this.elements.settingsTab?.classList.toggle('d-none', !result.data);
            return result.data;
        } catch (error) {
            return false;
        }
    }

    async loadGroups() {
        try {
            const response = await ApiClient.get('/node-groups');
            const groups = await response.json();
            
            const options = groups.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
            this.elements.groupSelect.innerHTML = `<option value="" selected disabled>Select target group...</option>${options}`;
        } catch (error) {
            console.error(error);
        }
    }

    async handleGroupAction(isMove) {
        const targetGroupId = this.elements.groupSelect.value;
        if (!targetGroupId) return alert("Please select a target group.");

        try {
            const response = await ApiClient.post(`/node-groups/${targetGroupId}/nodes`, { 
                node_ids: [this.state.currentNodeId],
                is_move: isMove 
            });
            
            if (!response.ok) throw new Error('Request failed');
            
            alert('Node assigned successfully!');
            this.loadCurrentNodeGroups(); 
        } catch (error) {
            alert('Error updating node group.');
            console.error(error);
        }
    }

    async loadCurrentNodeGroups() {
        this.elements.currentGroupsContainer.innerHTML = '<div class="spinner-border spinner-border-sm text-secondary" role="status"></div>';
        
        try {
            const response = await ApiClient.get(`/nodes/${this.state.currentNodeId}/groups`);
            const groups = await response.json();

            if (!response.ok) throw new Error('Failed to load current groups');

            if (groups.length === 0) {
                this.elements.currentGroupsContainer.innerHTML = '<span class="badge bg-secondary px-2 py-1">Unassigned</span>';
                return;
            }

            this.elements.currentGroupsContainer.innerHTML = groups.map(g => 
                `<span class="badge bg-info text-dark px-2 py-1"><i class="bi bi-tag-fill me-1"></i>${g.name}</span>`
            ).join('');

        } catch (error) {
            this.elements.currentGroupsContainer.innerHTML = '<span class="text-danger small">Error loading groups.</span>';
            console.error(error);
        }
    }

    async fetchAndRenderData() {
        this.updateUIState('loading');
        this.elements.title.textContent = `Loading Node Data...`;

        try {
            const startDate = this.state.fpStart.selectedDates[0];
            const endDate = this.state.fpEnd.selectedDates[0];

            if (!startDate || !endDate) {
                throw new Error("Please select valid start and end dates.");
            }

            const params = new URLSearchParams({
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString()
            });

            const response = await ApiClient.get(`/nodes/${this.state.currentNodeId}/telemetry?${params.toString()}`);
            const result = await response.json();

            if (!response.ok) throw new Error(result.message || 'Failed to load history.');

            this.elements.title.textContent = result.mac_address;
            this.elements.visibilitySwitch.checked = result.is_public;
            this.state.longitude = result.longitude;
            this.state.latitude = result.latitude;

            const sortedData = [...result.data].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            
            this.renderChart(sortedData);
            this.renderTable(sortedData);
            this.updateUIState('chart');

        } catch (error) {
            this.showError(error.message);
            this.elements.title.textContent = `Error Loading Data`;
        }
    }

    renderChart(sortedData) {
        if (this.state.chartInstance) {
            this.state.chartInstance.destroy();
        }

        if (!sortedData?.length) {
            this.showError("No telemetry data found for the selected date range.");
            return;
        }

        const labels = sortedData.map(t => formatDate(t.created_at));
        const extractData = (key) => sortedData.map(t => t[key]);
        const ctx = document.getElementById('historyChart').getContext('2d');
        
        Chart.defaults.color = '#a3a3a3';
        Chart.defaults.borderColor = '#333';

        const datasets = [
            { label: 'Temperature (°C)', data: extractData('temperature'), borderColor: '#ff6384', backgroundColor: 'rgba(255, 99, 132, 0.1)' },
            { label: 'Wind Speed (m/s)', data: extractData('wind_speed'), borderColor: '#9966ff', backgroundColor: 'rgba(153, 102, 255, 0.1)' },
            { label: 'Humidity (%)', data: extractData('humidity'), borderColor: '#36a2eb', backgroundColor: 'rgba(54, 162, 235, 0.1)' },
            { label: 'Soil Moisture (%)', data: extractData('soil_moisture'), borderColor: '#4bc0c0', backgroundColor: 'rgba(75, 192, 192, 0.1)', hidden: true },
            { label: 'Battery Voltage (V)', data: extractData('vbat'), borderColor: '#ff9f40', backgroundColor: 'rgba(255, 159, 64, 0.1)', hidden: true }
        ].map(ds => ({ ...ds, tension: 0.4, fill: true, yAxisID: 'y' }));

        this.state.chartInstance = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Temperature (°C)' } }
                }
            }
        });
    }

    renderTable(sortedData) {
        if (!sortedData?.length) {
            this.elements.tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-secondary">No data available</td></tr>';
            return;
        }

        this.elements.tableBody.innerHTML = [...sortedData].reverse().map(t => `
            <tr>
                <td class="text-secondary small">${formatDate(t.created_at, true)}</td>
                <td>${t.temperature ?? '-'}</td>
                <td>${t.humidity ?? '-'}</td>
                <td>${t.wind_speed ?? '-'}</td>
                <td>${t.soil_moisture ?? '-'}</td>
                <td>${t.vbat ?? '-'}</td>
            </tr>
        `).join('');
    }

    updateUIState(state) {
        this.elements.loading.classList.toggle('d-none', state !== 'loading');
        this.elements.error.classList.toggle('d-none', state !== 'error');
        this.elements.chartContainer.classList.toggle('d-none', state !== 'chart');
    }

    showError(message) {
        this.elements.error.textContent = message;
        this.updateUIState('error');
    }
}