import { eventBus } from './events';
import { ApiClient } from './api';
import Chart from 'chart.js/auto';
import flatpickr from 'flatpickr';

const roundData = (val) => (val != null ? Math.round(val * 10) / 10 : '-');

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

export class GroupTelemetryController {
    constructor() {
        this.initDOM();
        this.state = {
            currentGroupIds: null,
            chartInstance: null,
            fpStart: null,
            fpEnd: null
        };
        this.initListeners();
    }

    initDOM() {
        this.elements = {
            modal: document.getElementById('groupTelemetryModal'),
            title: document.getElementById('groupTelemetryModalLabel'),
            loading: document.getElementById('group-history-loading'),
            error: document.getElementById('group-history-error'),
            chartContainer: document.getElementById('group-chart-container'),
            tableBody: document.getElementById('group-telemetry-table-body'),
            startDate: document.getElementById('group-history-start'),
            endDate: document.getElementById('group-history-end'),
            updateBtn: document.getElementById('btn-group-update-history'),
            tabs: document.querySelectorAll('button[data-bs-toggle="tab"]')
        };
        this.modalInstance = new bootstrap.Modal(this.elements.modal);
    }

    initListeners() {
        eventBus.subscribe('node:group-history:requested', (groupIds) => this.openGroupTelemetry(groupIds));

        this.elements.updateBtn?.addEventListener('click', () => {
            if (this.state.currentGroupIds) {
                this.fetchAndRenderData();
            }
        });

        this.elements.tabs.forEach(tab => {
            tab.addEventListener('show.bs.tab', (event) => {
                if (['group-chart-tab', 'group-table-tab'].includes(event.target.id)) {
                    this.showChart();
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

        this.state.fpStart = flatpickr(this.elements.startDate, { ...config, defaultDate: defaultStart });
        this.state.fpEnd = flatpickr(this.elements.endDate, { ...config, defaultDate: defaultEnd });
    }

    async openGroupTelemetry(groupIds) {
        this.state.currentGroupIds = groupIds;
        this.modalInstance.show();

        const firstTab = document.querySelector('#groupManageTabs button[data-bs-target="#group-chart-pane"]');
        const tabInstance = bootstrap.Tab.getInstance(firstTab) || new bootstrap.Tab(firstTab);
        tabInstance.show();
        
        const end = new Date();
        const start = new Date();
        start.setHours(start.getHours() - 24);

        this.initDatePickers(start, end);
        this.fetchAndRenderData();
    }

    async fetchAndRenderData() {
        this.showLoading();
        this.elements.title.textContent = 'Loading Group Telemetry Data...';

        try {
            const startDate = this.state.fpStart.selectedDates[0];
            const endDate = this.state.fpEnd.selectedDates[0];

            if (!startDate || !endDate) {
                throw new Error("Please select valid start and end dates.");
            }

            const response = await ApiClient.post('/average-telemetry', {
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                node_ids: this.state.currentGroupIds
            });
            
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to load history.');
            }

            this.elements.title.textContent = `Group Telemetry (${this.state.currentGroupIds.length} nodes)`;

            const sortedData = [...result.data].sort((a, b) => new Date(a.hour) - new Date(b.hour));
            
            this.renderChart(sortedData);
            this.renderTable(sortedData);
            this.showChart();

        } catch (error) {
            this.showError(error.message);
            this.elements.title.textContent = 'Error Loading Data';
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

        const labels = sortedData.map(t => formatDate(t.hour));
        const extractData = (key) => sortedData.map(t => roundData(t[key]));
        const ctx = document.getElementById('group-historyChart').getContext('2d');
        
        Chart.defaults.color = '#a3a3a3';
        Chart.defaults.borderColor = '#333';

        const datasets = [
            { label: 'Temperature (°C)', data: extractData('avg_temperature'), borderColor: '#ff6384', backgroundColor: 'rgba(255, 99, 132, 0.1)' },
            { label: 'Wind Speed (m/s)', data: extractData('avg_wind_speed'), borderColor: '#9966ff', backgroundColor: 'rgba(153, 102, 255, 0.1)' },
            { label: 'Humidity (%)', data: extractData('avg_humidity'), borderColor: '#36a2eb', backgroundColor: 'rgba(54, 162, 235, 0.1)' },
            { label: 'Soil Moisture (%)', data: extractData('avg_soil_moisture'), borderColor: '#4bc0c0', backgroundColor: 'rgba(75, 192, 192, 0.1)', hidden: true },
            { label: 'Battery Voltage (V)', data: extractData('avg_vbat'), borderColor: '#ff9f40', backgroundColor: 'rgba(255, 159, 64, 0.1)', hidden: true }
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
                <td class="text-secondary small">${formatDate(t.hour, true)}</td>
                <td>${roundData(t.avg_temperature)}</td>
                <td>${roundData(t.avg_humidity)}</td>
                <td>${roundData(t.avg_wind_speed)}</td>
                <td>${roundData(t.avg_soil_moisture)}</td>
                <td>${roundData(t.avg_vbat)}</td>
            </tr>
        `).join('');
    }

    showLoading() {
        this.elements.loading.classList.remove('d-none');
        this.elements.error.classList.add('d-none');
        this.elements.chartContainer.classList.add('d-none');
    }

    showChart() {
        this.elements.loading.classList.add('d-none');
        this.elements.error.classList.add('d-none');
        this.elements.chartContainer.classList.remove('d-none');
    }

    showError(message) {
        this.elements.loading.classList.add('d-none');
        this.elements.chartContainer.classList.add('d-none');
        this.elements.error.textContent = message;
        this.elements.error.classList.remove('d-none');
    }
}