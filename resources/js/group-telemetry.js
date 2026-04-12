import { eventBus } from './events';
import { ApiClient } from './api';
import Chart from 'chart.js/auto';
import flatpickr from 'flatpickr';

export class GroupTelemetryController {
    constructor() {
        this.modalElement = document.getElementById('groupTelemetryModal');
        this.modalInstance = new bootstrap.Modal(this.modalElement);
        this.titleElement = document.getElementById('groupTelemetryModalLabel');
        this.loadingElement = document.getElementById('group-history-loading');
        this.errorElement = document.getElementById('group-history-error');
        this.chartContainer = document.getElementById('group-chart-container');
        this.tableBody = document.getElementById('group-telemetry-table-body');

        this.startDateInput = document.getElementById('group-history-start');
        this.endDateInput = document.getElementById('group-history-end');
        this.updateBtn = document.getElementById('btn-group-update-history');

        this.currentGroupIds = null;
        this.chartInstance = null;
        this.fpStart = null;
        this.fpEnd = null;
        this.initListeners();
    }

    initListeners() {
        eventBus.subscribe('node:group-history:requested', (groupIds) => this.openGroupTelemetry(groupIds));

        if (this.updateBtn) {
            this.updateBtn.addEventListener('click', () => {
                if (this.currentGroupIds) {
                    this.fetchAndRenderData();
                }
            });
        }

        const tabElements = document.querySelectorAll('button[data-bs-toggle="tab"]');
        tabElements.forEach(tab => {
            tab.addEventListener('show.bs.tab', (event) => {
                if (event.target.id === 'group-chart-tab') {
                    this.showChart();
                } else if (event.target.id === 'group-table-tab') {
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

        this.fpStart = flatpickr(this.startDateInput, {
            ...config,
            defaultDate: defaultStart
        });

        this.fpEnd = flatpickr(this.endDateInput, {
            ...config,
            defaultDate: defaultEnd
        });
    }

    async openGroupTelemetry(groupIds) {
        this.currentGroupIds = groupIds;
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
        this.titleElement.textContent = `Loading Group Telemetry Data...`;

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

            const response = await ApiClient.post(`/average-telemetry`, {
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                node_ids: this.currentGroupIds
            });
            const result = await response.json();

            if (!response.ok) throw new Error(result.message || 'Failed to load history.');

            this.titleElement.textContent = `Group Telemetry (${this.currentGroupIds.length} nodes)`;

            const sortedData = result.data.sort((a, b) => new Date(a.hour) - new Date(b.hour));
            
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

        const sortedData = telemetryArray.sort((a, b) => new Date(a.hour) - new Date(b.hour));

        const labels = sortedData.map(t => {
            const date = new Date(t.hour);
            return `${date.getDate()}/${date.getMonth() + 1} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        });

        const tempData = sortedData.map(t => Math.round(t.avg_temperature * 10) / 10);//
        const humData = sortedData.map(t => Math.round(t.avg_humidity * 10) / 10);
        const soilMoistureData = sortedData.map(t => Math.round(t.avg_soil_moisture * 10) / 10);
        const vbatData = sortedData.map(t => Math.round(t.avg_vbat * 10) / 10);
        const windSpeedData = sortedData.map(t => Math.round(t.avg_wind_speed * 10) / 10);

        const ctx = document.getElementById('group-historyChart').getContext('2d');
        
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
            const date = new Date(t.hour);
            const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            
            return `
                <tr>
                    <td class="text-secondary small">${formattedDate}</td>
                    <td>${ Math.round(t.avg_temperature * 10) / 10 ?? '-'}</td>
                    <td>${ Math.round(t.avg_humidity * 10) / 10 ?? '-'}</td>
                    <td>${ Math.round(t.avg_wind_speed * 10) / 10 ?? '-'}</td>
                    <td>${ Math.round(t.avg_soil_moisture * 10) / 10 ?? '-'}</td>
                    <td>${ Math.round(t.avg_vbat * 10) / 10 ?? '-'}</td>
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
