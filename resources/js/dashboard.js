import { eventBus } from './events';
import { ApiClient } from './api';

const formatDate = (dateString) => {
    return dateString ? new Date(dateString).toLocaleString() : 'Never';
};

export class DashboardController {
    constructor() {
        this.initDOM();
        this.initListeners();
    }

    initDOM() {
        this.elements = {
            container: document.getElementById('dashboard-view'),
            navItem: document.getElementById('nav-item-dashboard'),
            tableBody: document.getElementById('tokens-table-body'),
            createSection: document.getElementById('create-token-section'),
            createForm: document.getElementById('create-token-form'),
            errorAlert: document.getElementById('create-token-error'),
            tokenNameInput: document.getElementById('token-name'),
            newTokenAlert: document.getElementById('new-token-alert'),
            newTokenValue: document.getElementById('new-token-value'),
            buttons: {
                toggleNew: document.getElementById('btn-toggle-new-token'),
                cancelToken: document.getElementById('btn-cancel-token'),
                submitToken: document.getElementById('btn-submit-token'),
                closeAlert: document.getElementById('btn-close-token-alert'),
                copyToken: document.getElementById('btn-copy-token')
            }
        };
    }

    initListeners() {
        eventBus.subscribe('view:changed', (viewName) => this.handleViewChange(viewName));

        this.elements.buttons.toggleNew?.addEventListener('click', () => {
            const isHidden = this.elements.createSection.classList.toggle('d-none');
            if (!isHidden) this.elements.tokenNameInput?.focus();
        });

        this.elements.buttons.cancelToken?.addEventListener('click', () => {
            this.elements.createSection.classList.add('d-none');
            this.elements.createForm?.reset();
            this.elements.errorAlert?.classList.add('d-none');
        });

        this.elements.createForm?.addEventListener('submit', (e) => this.createNewToken(e));

        this.elements.buttons.closeAlert?.addEventListener('click', () => {
            this.elements.newTokenAlert?.classList.add('d-none');
            if (this.elements.newTokenValue) this.elements.newTokenValue.value = '';
        });

        this.elements.buttons.copyToken?.addEventListener('click', async () => {
            const { newTokenValue, buttons } = this.elements;
            if (!newTokenValue || !buttons.copyToken) return;

            try {
                // Use modern Clipboard API
                await navigator.clipboard.writeText(newTokenValue.value);
                buttons.copyToken.textContent = 'Copied!';
            } catch (err) {
                // Fallback for older browser constraints
                newTokenValue.select();
                document.execCommand('copy');
                buttons.copyToken.textContent = 'Copied!';
            }

            setTimeout(() => {
                buttons.copyToken.textContent = 'Copy';
            }, 2000);
        });

        this.elements.tableBody?.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-delete-token')) {
                this.deleteToken(e.target.dataset.id);
            }
        });
    }

    async createNewToken(e) {
        e.preventDefault();
        this.elements.errorAlert?.classList.add('d-none');

        const submitBtn = this.elements.buttons.submitToken;
        const originalText = submitBtn.textContent;
        
        submitBtn.textContent = 'Generating...';
        submitBtn.disabled = true;

        try {
            const name = this.elements.tokenNameInput?.value;
            const response = await ApiClient.post('/create-gateway-token', { token_name: name });
            const data = await response.json();

            if (!data.token) {
                throw new Error(data.message || 'Failed to create token.');
            }

            this.elements.newTokenValue.value = data.token;
            this.elements.newTokenAlert.classList.remove('d-none');
            this.elements.createSection.classList.add('d-none');
            this.elements.createForm.reset();
            
            await this.loadData();
        } catch (error) {
            alert(error.message);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    async deleteToken(tokenId) {
        if (!confirm('Are you sure you want to revoke this token?')) return;

        try {
            await ApiClient.delete(`/tokens/${tokenId}`);
            alert('Token revoked successfully.');
            this.loadData();
        } catch {
            alert('Failed to revoke token.');
        }
    }

    handleViewChange(viewName) {
        const isDashboard = viewName === 'dashboard';
        this.elements.container?.classList.toggle('d-none', !isDashboard);
        this.elements.navItem?.classList.toggle('active', isDashboard);

        if (isDashboard) {
            this.loadData();
        }
    }

    async loadData() {
        try {
            const response = await ApiClient.get('/tokens');
            const data = await response.json();
            this.renderTable(data.tokens);
        } catch (error) {
            console.error('Failed to load tokens:', error);
            this.renderTable([]);
        }
    }

    renderTable(tokens) {
        if (!tokens?.length) {
            this.elements.tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-3">No active tokens found.</td></tr>';
            return;
        }

        this.elements.tableBody.innerHTML = tokens.map(token => `
            <tr>
                <td>${token.name}</td>
                <td>${formatDate(token.created_at)}</td>
                <td>${formatDate(token.last_used_at)}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-danger btn-delete-token" data-id="${token.id}">Revoke</button>
                </td>
            </tr>
        `).join('');
    }
}