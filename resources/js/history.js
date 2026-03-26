import { eventBus } from './events';
import { ApiClient } from './api';
import Chart from 'chart.js/auto';
import flatpickr from 'flatpickr';

export class HistoryController {
    constructor() {
        this.modalElement = document.getElementById('historyModal');
        this.modalInstance = new bootstrap.Modal(this.modalElement);
        this.titleElement = document.getElementById('historyModalLabel');
        this.loadingElement = document.getElementById('history-loading');
        this.errorElement = document.getElementById('history-error');
        this.chartContainer = document.getElementById('chart-container');
        this.tableBody = document.getElementById('telemetry-table-body');
        
        this.startDateInput = document.getElementById('history-start');
        this.endDateInput = document.getElementById('history-end');
        this.updateBtn = document.getElementById('btn-update-history');

        this.groupSelect = document.getElementById('modal-group-select');
        this.btnAddGroup = document.getElementById('btn-modal-add-group');
        this.btnMoveGroup = document.getElementById('btn-modal-move-group');

        this.currentGroupsContainer = document.getElementById('current-node-groups');
        this.globalDateFilters = document.getElementById('global-date-filters');

        this.chartInstance = null;
        this.currentNodeId = null;

        this.fpStart = null;
        this.fpEnd = null;

        this.initListeners();
    }

    initListeners() {
        eventBus.subscribe('node:history:requested', (nodeId) => this.openManage(nodeId));

        if (this.updateBtn) {
            this.updateBtn.addEventListener('click', () => {
                if (this.currentNodeId) {
                    this.fetchAndRenderData();
                }
            });
        }

        if (this.btnAddGroup) {
            this.btnAddGroup.addEventListener('click', () => this.handleGroupAction(false));
        }

        if (this.btnMoveGroup) {
            this.btnMoveGroup.addEventListener('click', () => this.handleGroupAction(true));
        }

        const tabElements = document.querySelectorAll('button[data-bs-toggle="tab"]');
        tabElements.forEach(tab => {
            tab.addEventListener('show.bs.tab', (event) => {
                if (event.target.id === 'settings-tab') {
                    this.globalDateFilters.classList.add('d-none');
                } else {
                    this.globalDateFilters.classList.remove('d-none');
                }
            });
        });
    }

    initDatePickers(defaultStart, defaultEnd) {
        const config = {
            enableTime: true,
            dateFormat: "d/m/Y H:i",
            time_24hr: true,
            allowInput: false
        };

        this.fpStart = flatpickr(this.startDateInput, {
            ...config,
            defaultDate: defaultStart
        });

        this.fpEnd = flatpickr(this.endDateInput, {
            ...config,
            defaultDate: defaultEnd
        });
    }

    formatForDatetimeLocal(dateObj) {
        const d = new Date(dateObj);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    }

    openManage(nodeId) {
        this.currentNodeId = nodeId;
        this.modalInstance.show();

        const firstTab = document.querySelector('#nodeManageTabs button[data-bs-target="#chart-pane"]');
        const tabInstance = bootstrap.Tab.getInstance(firstTab) || new bootstrap.Tab(firstTab);
        tabInstance.show();
        
        const end = new Date();
        const start = new Date();
        start.setHours(start.getHours() - 24);

        this.initDatePickers(start, end);

        this.fetchAndRenderData();
        this.loadGroups();
        this.loadCurrentNodeGroups();
    }

    async loadGroups() {
        try {
            const response = await ApiClient.get('/node-groups');
            const groups = await response.json();
            
            this.groupSelect.innerHTML = '<option value="" selected disabled>Select target group...</option>';
            groups.forEach(group => {
                this.groupSelect.innerHTML += `<option value="${group.id}">${group.name}</option>`;
            });
        } catch (error) {
            console.error(error);
        }
    }

    async handleGroupAction(isMove) {
        const targetGroupId = this.groupSelect.value;
        if (!targetGroupId) return alert("Please select a target group.");

        try {
            const response = await ApiClient.post(`/node-groups/${targetGroupId}/nodes`, { 
                node_ids: [this.currentNodeId],
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
        this.currentGroupsContainer.innerHTML = '<div class="spinner-border spinner-border-sm text-secondary" role="status"></div>';
        
        try {
            const response = await ApiClient.get(`/nodes/${this.currentNodeId}/groups`);
            const groups = await response.json();

            if (!response.ok) throw new Error('Failed to load current groups');

            if (groups.length === 0) {
                this.currentGroupsContainer.innerHTML = '<span class="badge bg-secondary px-2 py-1">Unassigned</span>';
                return;
            }

            this.currentGroupsContainer.innerHTML = groups.map(g => 
                `<span class="badge bg-info text-dark px-2 py-1"><i class="bi bi-tag-fill me-1"></i>${g.name}</span>`
            ).join('');

        } catch (error) {
            this.currentGroupsContainer.innerHTML = '<span class="text-danger small">Error loading groups.</span>';
            console.error(error);
        }
    }

    async fetchAndRenderData() {
        this.showLoading();
        this.titleElement.textContent = `Loading Node Data...`;

        try {
            const startDate = this.fpStart.selectedDates[0];
            const endDate = this.fpEnd.selectedDates[0];

            if (!startDate || !endDate) {
                throw new Error("Please select valid start and end dates.");
            }

            const params = new URLSearchParams({
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString()
            });

            const response = await ApiClient.get(`/nodes/${this.currentNodeId}/telemetry?${params.toString()}`);
            const result = await response.json();

            if (!response.ok) throw new Error(result.message || 'Failed to load history.');

            this.titleElement.textContent = `${result.mac_address}`;

            const sortedData = result.data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            
            this.renderChart(sortedData);
            this.renderTable(sortedData);
            this.showChart();

        } catch (error) {
            this.showError(error.message);
            this.titleElement.textContent = `Error Loading Data`;
        }
    }

    renderChart(telemetryArray) {
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        if (!telemetryArray || telemetryArray.length === 0) {
            this.showError("No telemetry data found for the selected date range.");
            return;
        }

        const sortedData = telemetryArray.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        const labels = sortedData.map(t => {
            const date = new Date(t.created_at);
            return `${date.getDate()}/${date.getMonth() + 1} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        });

        const tempData = sortedData.map(t => t.temperature);
        const humData = sortedData.map(t => t.humidity);
        const soilMoistureData = sortedData.map(t => t.soil_moisture);
        const vbatData = sortedData.map(t => t.vbat);
        const windSpeedData = sortedData.map(t => t.wind_speed);

        const ctx = document.getElementById('historyChart').getContext('2d');
        
        Chart.defaults.color = '#a3a3a3';
        Chart.defaults.borderColor = '#333';

        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Temperature (°C)',
                        data: tempData,
                        borderColor: '#ff6384',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Wind Speed (m/s)',
                        data: windSpeedData,
                        borderColor: '#9966ff',
                        backgroundColor: 'rgba(153, 102, 255, 0.1)',
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Humidity (%)',
                        data: humData,
                        borderColor: '#36a2eb',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Soil Moisture (%)',
                        data: soilMoistureData,
                        borderColor: '#4bc0c0',
                        backgroundColor: 'rgba(75, 192, 192, 0.1)',
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y',
                        hidden: true
                    },
                    {
                        label: 'Battery Voltage (V)',
                        data: vbatData,
                        borderColor: '#ff9f40',
                        backgroundColor: 'rgba(255, 159, 64, 0.1)',
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y',
                        hidden: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'Temperature (°C)' }
                    },
                }
            }
        });
    }

    renderTable(telemetryArray) {
        if (!telemetryArray || telemetryArray.length === 0) {
            this.tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-secondary">No data available</td></tr>';
            return;
        }

        const rows = telemetryArray.reverse().map(t => {
            const date = new Date(t.created_at);
            const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            
            return `
                <tr>
                    <td class="text-secondary small">${formattedDate}</td>
                    <td>${t.temperature ?? '-'}</td>
                    <td>${t.humidity ?? '-'}</td>
                    <td>${t.wind_speed ?? '-'}</td>
                    <td>${t.soil_moisture ?? '-'}</td>
                    <td>${t.vbat ?? '-'}</td>
                </tr>
            `;
        }).join('');

        this.tableBody.innerHTML = rows;
    }

    showLoading() {
        this.loadingElement.classList.remove('d-none');
        this.errorElement.classList.add('d-none');
        this.chartContainer.classList.add('d-none');
    }

    showChart() {
        this.loadingElement.classList.add('d-none');
        this.errorElement.classList.add('d-none');
        this.chartContainer.classList.remove('d-none');
    }

    showError(message) {
        this.loadingElement.classList.add('d-none');
        this.chartContainer.classList.add('d-none');
        this.errorElement.textContent = message;
        this.errorElement.classList.remove('d-none');
    }
}