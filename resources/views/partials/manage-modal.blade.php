<div class="modal fade" id="manageModal" tabindex="-1" aria-labelledby="manageModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-xl modal-dialog-centered">
        <div class="modal-content bg-dark text-light border-secondary">
            <div class="modal-header border-secondary">
                <h5 class="modal-title" id="manageModalLabel">Manage Node</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                
                <ul class="nav nav-tabs border-secondary mb-3" id="nodeManageTabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active text-light bg-transparent" id="chart-tab" data-bs-toggle="tab" data-bs-target="#chart-pane" type="button" role="tab">
                            <i class="bi bi-graph-up"></i> Chart
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link text-light bg-transparent" id="table-tab" data-bs-toggle="tab" data-bs-target="#table-pane" type="button" role="tab">
                            <i class="bi bi-table"></i> Data Table
                        </button>
                    </li>

                    <li class="nav-item" role="presentation">
                        <button class="nav-link text-light bg-transparent" id="settings-tab" data-bs-toggle="tab" data-bs-target="#settings-pane" type="button" role="tab">
                            <i class="bi bi-gear"></i> Settings
                        </button>
                    </li>
                    <li class="nav-item ms-auto" role="presentation">
                        <button type="button" class="btn btn-sm bg-transparent" id="btn-center-node" title="Center on Map">
                        📌
                        </button>
                    </li>
                </ul>
                <div class="row g-2 mb-4 align-items-end" id = 'global-date-filters'>
                    <div class="col-md-5">
                        <label for="history-start" class="form-label small text-secondary">Start Date</label>
                        <input type="text" class="form-control bg-dark text-light border-secondary" id="history-start">
                    </div>
                    <div class="col-md-5">
                        <label for="history-end" class="form-label small text-secondary">End Date</label>
                        <input type="text" class="form-control bg-dark text-light border-secondary" id="history-end">
                    </div>
                    <div class="col-md-2">
                        <button id="btn-update-history" class="btn btn-primary w-100">Apply</button>
                    </div>
                </div>

                <div class="tab-content" id="nodeManageTabsContent">
                    
                    <div class="tab-pane fade show active" id="chart-pane" role="tabpanel" tabindex="0">

                        <div id="history-loading" class="text-center py-5 d-none">
                            <div class="spinner-border text-primary" role="status"></div>
                            <p class="mt-2 text-secondary">Fetching telemetry data...</p>
                        </div>
                        
                        <div id="history-error" class="alert alert-danger d-none" role="alert"></div>
                        
                        <div id="chart-container" style="position: relative; height:400px; width:100%">
                            <canvas id="historyChart"></canvas>
                        </div>
                    </div>

                    <div class="tab-pane fade" id="table-pane" role="tabpanel" tabindex="0">
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
                                <tbody id="telemetry-table-body">
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="tab-pane fade" id="settings-pane" role="tabpanel" tabindex="0">

                        <div class="card bg-dark border-secondary mb-3">
                            <div class="card-header border-secondary text-white fw-bold">Visibility Settings</div>
                            <div class="card-body">
                                <div class="form-check form-switch d-flex align-items-center gap-2">
                                    <input class="form-check-input mt-0 bg-dark border-secondary" type="checkbox" role="switch" id="modal-visibility-switch" style="width: 2.5em; height: 1.25em; cursor: pointer;">
                                    <label class="form-check-label mb-0 text-white" for="modal-visibility-switch" style="cursor: pointer;">
                                        Public Node
                                    </label>
                                </div>
                                <p class="text-secondary small mt-2 mb-0">Public nodes can be viewed by anyone on the map. Private nodes are only visible to you.</p>
                            </div>
                        </div>

                        <div class="card bg-dark border-secondary mb-3">
                            <div class="card-header border-secondary text-white fw-bold">Group Management</div>
                            <div class="card-body">
                                
                                <div class="mb-4 p-3 border border-secondary rounded bg-dark" style="background-color: rgba(255,255,255,0.02) !important;">
                                    <h6 class="text-secondary small text-uppercase fw-bold mb-2">Current Groups</h6>
                                    <div id="current-node-groups" class="d-flex flex-wrap gap-2">
                                        <span class="text-muted small">Carregando...</span>
                                    </div>
                                </div>
                                <p class="text-secondary small mb-3">Assign this node to a specific group for better organization.</p>
                                <label for="modal-group-select" class="form-label">Target Group</label>
                                <div class="d-flex gap-2">
                                    <select class="form-select bg-dark text-light border-secondary" id="modal-group-select">
                                        <option value="" selected disabled>Loading groups...</option>
                                    </select>
                                    <div class="btn-group" role="group">
                                        <button class="btn btn-primary" id="btn-modal-add-group">Add</button>
                                        <button class="btn btn-warning" id="btn-modal-move-group">Move</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>                   

                </div>
            </div>
        </div>
    </div>
</div>