import { eventBus } from './events';
import { ApiClient } from './api';


export class DashboardController {
    constructor() {
        this.container = document.getElementById('dashboard-view');
        this.navItem = document.getElementById('nav-item-dashboard');
        this.tableBody = document.getElementById('tokens-table-body');

        this.createSection = document.getElementById('create-token-section');
        this.createForm = document.getElementById('create-token-form');
        this.errorAlert = document.getElementById('create-token-error');

        // Listen for view changes
        eventBus.subscribe('view:changed', (viewName) => this.handleViewChange(viewName));

        this.initializeListeners();
    }
    initializeListeners() {

        const toggleBtn = document.getElementById('btn-toggle-new-token');
        const cancelBtn = document.getElementById('btn-cancel-token');

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.createSection.classList.toggle('d-none');
                if (!this.createSection.classList.contains('d-none')) {
                    document.getElementById('token-name').focus();
                }
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.createSection.classList.add('d-none');
                this.createForm.reset();
                this.errorAlert.classList.add('d-none');
            });
        }

        if (this.createForm) {
            this.createForm.addEventListener('submit', (e) => this.createNewToken(e));
        }

        const closeAlertBtn = document.getElementById('btn-close-token-alert');
        if (closeAlertBtn) {
            closeAlertBtn.addEventListener('click', () => {
                document.getElementById('new-token-alert').classList.add('d-none');
                document.getElementById('new-token-value').value = '';
            });
        }

        const copyBtn = document.getElementById('btn-copy-token');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const tokenInput = document.getElementById('new-token-value');
                tokenInput.select();
                document.execCommand('copy');
                
                copyBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyBtn.textContent = 'Copy';
                }, 2000);
            });
        }

        // Delegate delete button clicks to the table body
        this.tableBody.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-delete-token')) {
                const tokenId = e.target.getAttribute('data-id');
                this.deleteToken(tokenId);
            }
        });
    }

    createNewToken(e) {
        e.preventDefault();
        this.errorAlert.classList.add('d-none');
        this.errorAlert.classList.add('d-none');
        const submitBtn = document.getElementById('btn-submit-token');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Generating...';
        submitBtn.disabled = true;

        const name = document.getElementById('token-name').value;

        ApiClient.post('/create-gateway-token', { token_name: name })
            .then(response => response.json())
            .then(data => {
                if (data.token) {
                    document.getElementById('new-token-value').value = data.token;
                    document.getElementById('new-token-alert').classList.remove('d-none');
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                    this.createSection.classList.add('d-none');
                    this.createForm.reset();
                    this.loadData();
                } else {
                    throw new Error(data.message || 'Failed to create token.');
                }
            })
            .catch(error => {
                alert(error.message);
            });
    }

    deleteToken(tokenId) {
        if (confirm('Are you sure you want to revoke this token?')) {
            ApiClient.delete(`/tokens/${tokenId}`)
                .then(() => {
                    alert('Token revoked successfully.');
                    this.loadData();
                })
                .catch(() => alert('Failed to revoke token.'));
        }
    }

    handleViewChange(viewName) {
        if (viewName === 'dashboard') {
            this.container.classList.remove('d-none');
            this.navItem.classList.add('active');
            this.loadData();
        } else {
            this.container.classList.add('d-none');
            this.navItem.classList.remove('active');
        }
    }

    loadData() {
        ApiClient.get('/tokens')
            .then(response => response.json())
            .then(data => {
                console.log('Tokens data:', data);
                this.renderTable(data.tokens);
            });
    }

    renderTable(tokens) {
        if (!tokens || tokens.length === 0) {
            this.tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-3">No active tokens found.</td></tr>';
            return;
        }

        this.tableBody.innerHTML = '';

        tokens.forEach(token => {
            const tr = document.createElement('tr');

            const lastUsed = token.last_used_at ? new Date(token.last_used_at).toLocaleString() : 'Never';
            const createdAt = new Date(token.created_at).toLocaleString();

            tr.innerHTML = `
                <td>${token.name}</td>
                <td>${createdAt}</td>
                <td>${lastUsed}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-danger btn-delete-token" data-id="${token.id}">Revoke</button>
                </td>
            `;

            this.tableBody.appendChild(tr);
        });
    }
}