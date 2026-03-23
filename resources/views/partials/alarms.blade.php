<div id="alarms-view" class="container py-4 d-none h-100 overflow-auto">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>System Alarms</h2>
        <button id="btn-refresh-alarms" class="btn btn-outline-light">
            <i class="bi bi-arrow-clockwise"></i> Refresh
        </button>
    </div>

    <div id="alarms-loading" class="text-center py-5 d-none">
        <div class="spinner-border text-danger" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2 text-secondary">Checking for active alarms...</p>
    </div>

    <div id="alarms-error" class="alert alert-danger d-none" role="alert"></div>

    <div id="alarms-container" class="row g-3">
        </div>
    
    <div id="no-alarms-message" class="text-center py-5 d-none">
        <h4 class="text-success">All Clear!</h4>
        <p class="text-secondary">There are currently no active alarms in your network.</p>
    </div>
</div>