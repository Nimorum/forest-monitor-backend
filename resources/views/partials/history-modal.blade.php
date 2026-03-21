<div class="modal fade" id="historyModal" tabindex="-1" aria-labelledby="historyModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content bg-dark text-light border-secondary">
            <div class="modal-header border-secondary">
                <h5 class="modal-title" id="historyModalLabel">Node History</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                
                <div class="row g-2 mb-4 align-items-end">
                    <div class="col-md-5">
                        <label for="history-start" class="form-label small text-secondary">Start Date</label>
                        <input type="text" class="form-control bg-dark text-light border-secondary" id="history-start" placeholder="Selecione a data...">
                    </div>
                    <div class="col-md-5">
                        <label for="history-end" class="form-label small text-secondary">End Date</label>
                        <input type="text" class="form-control bg-dark text-light border-secondary" id="history-end" placeholder="Selecione a data...">
                    </div>
                    <div class="col-md-2">
                        <button id="btn-update-history" class="btn btn-primary w-100">Apply</button>
                    </div>
                </div>

                <div id="history-loading" class="text-center py-5 d-none">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2 text-secondary">Fetching telemetry data...</p>
                </div>
                
                <div id="history-error" class="alert alert-danger d-none" role="alert"></div>
                
                <div id="chart-container" style="position: relative; height:400px; width:100%">
                    <canvas id="historyChart"></canvas>
                </div>
            </div>
        </div>
    </div>
</div>