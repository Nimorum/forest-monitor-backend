<div id="nodes-view" class="container py-4 d-none h-100 overflow-auto">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
            <h2 class="mb-0">My Nodes</h2>
            <p class="text-secondary small mb-0">Manage your sensors across different areas</p>
        </div>
        <button id="btn-refresh-nodes" class="btn btn-primary">
            <i class="bi bi-arrow-clockwise"></i> Refresh
        </button>
    </div>

    <div id="nodes-toolbar" class="d-flex justify-content-between align-items-center mb-4 p-3 bg-dark border border-secondary rounded d-none">
        <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-light" id="btn-create-group">
                <i class="bi bi-folder-plus"></i> Create Group
            </button>
            <button class="btn btn-sm btn-outline-danger" id="btn-delete-group">
                <i class="bi bi-folder-x"></i> Delete Group
            </button>
        </div>
        
        <div class="d-flex gap-2 align-items-center">
            <span class="text-info small me-2 fw-bold" id="selected-count">0 selected</span>

            <div class="btn-group me-2" role="group">
                <button class="btn btn-sm btn-success" id="btn-bulk-public" disabled title="Make Public">
                    <i class="bi bi-eye"></i> Public
                </button>
                <button class="btn btn-sm btn-secondary" id="btn-bulk-private" disabled title="Make Private">
                    <i class="bi bi-eye-slash"></i> Private
                </button>
            </div>
            
            <select class="form-select form-select-sm bg-dark text-light border-secondary" id="bulk-move-select" style="width: auto;">
                <option value="" selected disabled>Target group...</option>
                </select>
            
            <div class="btn-group" role="group">
                <button class="btn btn-sm btn-primary" id="btn-bulk-add" disabled title="Add to this group (Keep in current)">
                    <i class="bi bi-plus-circle"></i> Add
                </button>
                <button class="btn btn-sm btn-warning" id="btn-bulk-move" disabled title="Move to this group (Remove from current)">
                    <i class="bi bi-arrow-right-circle"></i> Move
                </button>
            </div>

            <button class="btn btn-sm btn-danger" id="btn-bulk-delete" disabled>
                Delete Nodes
            </button>
        </div>
    </div>

    <div id="nodes-loading" class="text-center py-5 d-none">
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2 text-secondary">Fetching your nodes...</p>
    </div>

    <div id="nodes-error" class="alert alert-danger d-none" role="alert"></div>

    <div class="accordion accordion-flush bg-dark border border-secondary rounded" id="nodes-accordion">
    </div>
    
    <div id="no-nodes-message" class="text-center py-5 d-none">
        <h4 class="text-warning">No Nodes Found</h4>
        <p class="text-secondary">You don't have any nodes assigned to your account yet.</p>
    </div>
</div>