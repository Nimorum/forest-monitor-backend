<div class="modal fade" id="groupTelemetryModal" tabindex="-1" aria-labelledby="groupTelemetryModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-xl modal-dialog-centered">
        <div class="modal-content bg-dark text-light border-secondary">
            <div class="modal-header border-secondary">
                <h5 class="modal-title" id="groupTelemetryModalLabel">Group Telemetry</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                
                <ul class="nav nav-tabs border-secondary mb-3" id="groupManageTabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active text-light bg-transparent" id="group-chart-tab" data-bs-toggle="tab" data-bs-target="#group-chart-pane" type="button" role="tab">
                            <i class="bi bi-graph-up"></i> Telemetry Chart
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link text-light bg-transparent" id="group-table-tab" data-bs-toggle="tab" data-bs-target="#group-table-pane" type="button" role="tab">
                            <i class="bi bi-table"></i> Data Table
                        </button>
                    </li>
                </ul>
                
                <div class="row g-2 mb-4 align-items-end" id="group-date-filters">
                    <div class="col-md-5">
                        <label for="group-history-start" class="form-label small text-secondary">Start Date</label>
                        <input type="text" class="form-control bg-dark text-light border-secondary" id="group-history-start">
                    </div>
                    <div class="col-md-5">
                        <label for="group-history-end" class="form-label small text-secondary">End Date</label>
                        <input type="text" class="form-control bg-dark text-light border-secondary" id="group-history-end">
                    </div>
                    <div class="col-md-2">
                        <button id="btn-group-update-history" class="btn btn-primary w-100">Apply</button>
                    </div>
                </div>

                <div class="tab-content" id="groupManageTabsContent">
                    
                    <div class="tab-pane fade show active" id="group-chart-pane" role="tabpanel" tabindex="0">

                        <div id="group-history-loading" class="text-center py-5 d-none">
                            <div class="spinner-border text-primary" role="status"></div>
                            <p class="mt-2 text-secondary">Fetching telemetry data...</p>
                        </div>
                        
                        <div id="group-history-error" class="alert alert-danger d-none" role="alert"></div>
                        
                        <div id="group-chart-container" style="position: relative; height:400px; width:100%">
                            <canvas id="group-historyChart"></canvas>
                        </div>
                    </div>

                    <div class="tab-pane fade" id="group-table-pane" role="tabpanel" tabindex="0">
                        <div class="table-responsive" style="max-height: 450px; overflow-y: auto;">
                            <table class="table table-dark table-striped table-hover align-middle">
                                <thead class="position-sticky top-0 bg-dark" style="z-index: 1;">
                                    <tr>
                                        <th>Timestamp</th>
                                        <th>Temp (°C)</th>
                                        <th>Hum (%)</th>
                                        <th>Wind (m/s)</th>
                                        <th>Soil (%)</th>
                                        <th>Bat (V)</th>
                                    </tr>
                                </thead>
                                <tbody id="group-telemetry-table-body">
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </div>
</div>