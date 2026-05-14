<div id="dashboard-view" class="container py-4 d-none h-100 overflow-auto">

    <div class="card bg-dark text-light border-secondary mb-4 p-3">
        <div class="form-check form-switch fs-5">
            <input class="form-check-input" type="checkbox" role="switch" id="alert-email-switch">
            <label class="form-check-label" for="alert-email-switch">Receive Alerts by Email</label>
        </div>
    </div>

    <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>API Tokens</h2>
        <button id="btn-toggle-new-token" class="btn btn-primary">+ New Token</button>
    </div>

    <div id="create-token-section" class="card bg-dark text-light border-secondary mb-4 d-none p-3">
        <h5 class="card-title mb-3">Create New API Token</h5>
        <div id="create-token-error" class="alert alert-danger d-none" role="alert"></div>
        <form id="create-token-form">
            <div class="mb-3">
                <label for="token-name" class="form-label">Token Name</label>
                <input type="text" class="form-control bg-dark text-light border-secondary" id="token-name" placeholder="e.g., Node ESP32 Forest Alpha" required>
                <div class="form-text text-secondary">Give your token a recognizable name to easily manage or revoke it later.</div>
            </div>
            <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-outline-light" id="btn-cancel-token">Cancel</button>
                <button type="submit" class="btn btn-success" id="btn-submit-token">Generate Token</button>
            </div>
        </form>
    </div>

    <div id="new-token-alert" class="alert alert-success d-none mb-4" role="alert">
        <div class="d-flex justify-content-between align-items-center mb-2">
            <h5 class="alert-heading mb-0">Token Created Successfully!</h5>
            <button type="button" class="btn-close" id="btn-close-token-alert" aria-label="Close"></button>
        </div>
        <p class="mb-2">Please copy your new API token now. For your security, it will not be shown again.</p>
        <div class="input-group">
            <input type="text" id="new-token-value" class="form-control font-monospace" readonly>
            <button class="btn btn-success" type="button" id="btn-copy-token">Copy</button>
        </div>
    </div>

    <div class="card p-3">
        <div class="table-responsive">
            <table class="table table-dark table-hover align-middle">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Created</th>
                        <th>Last Used</th>
                        <th class="text-end">Actions</th>
                    </tr>
                </thead>
                <tbody id="tokens-table-body">
                    <tr>
                        <td colspan="4" class="text-center py-4 text-secondary">
                            No active tokens found.
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>
