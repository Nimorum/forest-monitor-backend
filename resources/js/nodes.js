import { eventBus } from './events';
import { ApiClient } from './api';

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit'
    });
};

export class NodesController {
    constructor() {
        this.initDOM();
        this.initListeners();
    }

    initDOM() {
        this.elements = {
            container: document.getElementById('nodes-view'),
            navItem: document.getElementById('nav-nodes'),
            accordionContainer: document.getElementById('nodes-accordion'),
            loadingState: document.getElementById('nodes-loading'),
            errorState: document.getElementById('nodes-error'),
            noNodesState: document.getElementById('no-nodes-message'),
            refreshBtn: document.getElementById('btn-refresh-nodes'),
            toolbar: document.getElementById('nodes-toolbar'),
            selectedCount: document.getElementById('selected-count'),
            moveSelect: document.getElementById('bulk-move-select'),
            buttons: {
                createGroup: document.getElementById('btn-create-group'),
                deleteGroup: document.getElementById('btn-delete-group'),
                bulkAdd: document.getElementById('btn-bulk-add'),
                bulkMove: document.getElementById('btn-bulk-move'),
                bulkDelete: document.getElementById('btn-bulk-delete'),
                bulkPublic: document.getElementById('btn-bulk-public'),
                bulkPrivate: document.getElementById('btn-bulk-private'),
                bulkAvg: document.getElementById('btn-bulk-avg')
            }
        };
    }

    initListeners() {
        eventBus.subscribe('view:changed', (viewName) => this.handleViewChange(viewName));

        this.elements.refreshBtn?.addEventListener('click', () => this.loadNodes());
        this.elements.accordionContainer?.addEventListener('click', (e) => this.handleAccordionClick(e));
        this.elements.accordionContainer?.addEventListener('change', (e) => this.handleAccordionChange(e));

        this.elements.buttons.createGroup?.addEventListener('click', () => this.handleCreateGroup());
        this.elements.buttons.deleteGroup?.addEventListener('click', () => this.handleDeleteGroup());
        this.elements.buttons.bulkAdd?.addEventListener('click', () => this.handleBulkTransfer(false));
        this.elements.buttons.bulkMove?.addEventListener('click', () => this.handleBulkTransfer(true));
        this.elements.buttons.bulkDelete?.addEventListener('click', () => this.handleBulkDelete());
        this.elements.buttons.bulkPublic?.addEventListener('click', () => this.handleVisibilityChange(true));
        this.elements.buttons.bulkPrivate?.addEventListener('click', () => this.handleVisibilityChange(false));
        this.elements.buttons.bulkAvg?.addEventListener('click', () => {
            eventBus.publish('node:group-history:requested', this.getSelectedNodeIds());
        });
    }

    getSelectedNodeIds() {
        return Array.from(document.querySelectorAll('.node-checkbox:checked')).map(cb => cb.value);
    }

    clearSelection() {
        document.querySelectorAll('.node-checkbox:checked').forEach(cb => cb.checked = false);
        this.updateToolbarState();
    }

    handleAccordionClick(e) {
        const toggleBtn = e.target.closest('.custom-toggle-btn');
        if (toggleBtn) {
            e.preventDefault();
            const targetId = toggleBtn.getAttribute('data-target-id');
            const contentDiv = document.getElementById(targetId);
            const chevronIcon = toggleBtn.querySelector('.chevron-icon');

            if (contentDiv) {
                const isHidden = contentDiv.classList.toggle('d-none');
                chevronIcon.classList.toggle('open', !isHidden);
            }
            return;
        }

        const macLink = e.target.closest('.node-history-link');
        if (macLink) {
            e.preventDefault();
            eventBus.publish('node:history:requested', macLink.dataset.id);
            return;
        }

        const centerBtn = e.target.closest('.btn-center-group');
        if (centerBtn) {
            e.preventDefault();
            eventBus.publish('map:center-on', {
                latitude: parseFloat(centerBtn.dataset.lat),
                longitude: parseFloat(centerBtn.dataset.lng),
                zoom: 14
            });
            this.handleViewChange("map");
        }
    }

    handleAccordionChange(e) {
        if (e.target.classList.contains('node-checkbox')) {
            this.updateToolbarState();
        } else if (e.target.classList.contains('select-all-checkbox')) {
            const checkboxes = e.target.closest('table').querySelectorAll('.node-checkbox');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
            this.updateToolbarState();
        }
    }

    async handleCreateGroup() {
        const groupName = prompt("Enter the new group name:");
        if (!groupName) return;

        try {
            const response = await ApiClient.post('/node-groups', { name: groupName });
            if (!response.ok) throw new Error('Request failed');
            
            alert('Group created successfully!');
            this.loadGroupsForDropdown();
            this.loadNodes();
        } catch (error) {
            alert('Error creating group.');
            console.error(error);
        }
    }

    async handleDeleteGroup() {
        const targetGroupId = this.elements.moveSelect?.value;
        if (!targetGroupId) return alert("Please select a group from the dropdown first to delete it.");

        if (!confirm('Are you sure you want to delete this group? The nodes will NOT be deleted, just unassigned.')) return;

        try {
            const response = await ApiClient.delete(`/node-groups/${targetGroupId}`);
            if (!response.ok) throw new Error('Request failed');

            alert('Group deleted successfully!');
            this.loadGroupsForDropdown();
            this.loadNodes();
        } catch (error) {
            alert('Error deleting group.');
            console.error(error);
        }
    }

    handleBulkDelete() {
        const selectedIds = this.getSelectedNodeIds();
        if (confirm(`Are you sure you want to delete ${selectedIds.length} nodes?`)) {
            console.log(`🚀 DELETE NODES: [${selectedIds.join(', ')}]`);
        }
    }

    async handleVisibilityChange(isPublic) {
        try {
            const response = await ApiClient.patch('/nodes/bulk-visibility', {
                node_ids: this.getSelectedNodeIds(),
                is_public: isPublic
            });
            
            if (!response.ok) throw new Error('Request failed');

            this.clearSelection();
            this.loadNodes();
        } catch (error) {
            alert('Error updating node visibility.');
            console.error(error);
        }
    }

    async handleBulkTransfer(isMove) {
        const targetGroupId = this.elements.moveSelect?.value;
        if (!targetGroupId) return alert("Please select a target group from the dropdown.");

        const selectedIds = this.getSelectedNodeIds();
        const actionText = isMove ? 'moved' : 'added';
        
        try {
            const response = await ApiClient.post(`/node-groups/${targetGroupId}/nodes`, {
                node_ids: selectedIds,
                is_move: isMove
            });
            
            if (!response.ok) throw new Error('Request failed');

            alert(`Successfully ${actionText} ${selectedIds.length} nodes!`);
            this.clearSelection();
            this.loadNodes();
        } catch (error) {
            alert('Error: Could not process the nodes.');
            console.error(error);
        }
    }

    handleViewChange(viewName) {
        const isNodesView = viewName === 'nodes';
        this.elements.container?.classList.toggle('d-none', !isNodesView);
        this.elements.navItem?.classList.toggle('active', isNodesView);

        if (isNodesView) {
            this.loadGroupsForDropdown();
            this.loadNodes();
        }
    }

    async loadNodes() {
        this.elements.loadingState?.classList.remove('d-none');
        this.elements.accordionContainer.innerHTML = '';
        this.elements.errorState?.classList.add('d-none');
        this.elements.noNodesState?.classList.add('d-none');

        try {
            const response = await ApiClient.get('/my-nodes');
            const result = await response.json();

            if (!response.ok) throw new Error(result.message || 'Failed to load nodes.');

            this.renderNodes(result.data || result);
        } catch (error) {
            if (this.elements.errorState) {
                this.elements.errorState.textContent = error.message;
                this.elements.errorState.classList.remove('d-none');
            }
        } finally {
            this.elements.loadingState?.classList.add('d-none');
        }
    }

    updateToolbarState() {
        const count = document.querySelectorAll('.node-checkbox:checked').length;
        
        if (this.elements.selectedCount) {
            this.elements.selectedCount.textContent = `${count} selected`;
        }

        const disableBulk = count === 0;
        
        Object.entries(this.elements.buttons).forEach(([key, btn]) => {
            if (btn && key !== 'createGroup' && key !== 'deleteGroup') {
                btn.disabled = disableBulk;
            }
        });
    }

    renderNodes(groupedNodes) {
        if (!groupedNodes?.length) {
            this.elements.noNodesState?.classList.remove('d-none');
            this.elements.toolbar?.classList.add('d-none');
            return;
        }

        this.elements.toolbar?.classList.remove('d-none');

        this.elements.accordionContainer.innerHTML = groupedNodes.map((group, index) => {
            const isFirst = index === 0;
            const collapseId = `collapse-group-${index}`;

            const centerBtnHtml = (group.lat !== null && group.long !== null)
                ? `<span class="btn btn-sm me-3 btn-center-group" data-lat="${group.lat}" data-lng="${group.long}" title="Center map on group">📌</span>`
                : '';

            const tableRows = group.nodes.map(node => {
                const battery = node.latest_telemetry ? `${node.latest_telemetry.vbat}V` : '<span class="text-muted">N/A</span>';
                const statusColor = node.is_online !== false ? 'text-success' : 'text-danger';
                const visibilityClass = node.is_public ? 'bg-success' : 'bg-secondary';
                const visibilityText = node.is_public ? 'Public' : 'Private';

                return `
                    <tr>
                        <td>
                            <input class="form-check-input node-checkbox bg-dark border-secondary" type="checkbox" value="${node.id}" data-mac="${node.mac_address}">
                        </td>
                        <td class="fw-bold">
                            <a href="#" class="text-info text-decoration-none node-history-link" data-id="${node.id}">
                                <i class="bi bi-graph-up small me-1"></i> ${node.mac_address}
                            </a>
                        </td>
                        <td><i class="bi bi-battery-full ${statusColor}"></i> ${battery}</td>
                        <td class="small">${formatDate(node.created_at)}</td>
                        <td><span class="badge ${visibilityClass}">${visibilityText}</span></td>
                    </tr>
                `;
            }).join('');

            return `
                <div class="bg-dark border border-secondary rounded mb-2 overflow-hidden">
                    <div class="w-100 d-flex justify-content-between align-items-center p-3 bg-dark text-light border-0 custom-toggle-btn" role="button" data-target-id="${collapseId}">
                        <div>
                            <i class="bi bi-geo-alt-fill text-primary me-2"></i> 
                            <strong>${group.groupName}</strong> 
                            <span class="badge bg-secondary ms-2">${group.nodes.length} Nodes</span>
                        </div>
                        <div class="d-flex align-items-center">
                            ${centerBtnHtml}
                            <i class="bi bi-chevron-down chevron-icon ${isFirst ? 'open' : ''}"></i>
                        </div>
                    </div>
                    
                    <div id="${collapseId}" class="${isFirst ? '' : 'd-none'} border-top border-secondary">
                        <div class="table-responsive">
                            <table class="table table-dark table-hover table-striped mb-0 align-middle">
                                <thead>
                                    <tr>
                                        <th style="width: 40px;">
                                            <input class="form-check-input select-all-checkbox bg-dark border-secondary" type="checkbox" title="Select All in Group">
                                        </th>
                                        <th>MAC Address</th>
                                        <th>Battery</th>
                                        <th>Added On</th>
                                        <th>Visibility</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${tableRows}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.updateToolbarState();
    }

    async loadGroupsForDropdown() {
        if (!this.elements.moveSelect) return;

        try {
            const response = await ApiClient.get('/node-groups');
            const groups = await response.json();
            
            const options = groups.map(group => `<option value="${group.id}">${group.name}</option>`).join('');
            this.elements.moveSelect.innerHTML = `<option value="" selected disabled>Target group...</option>${options}`;
        } catch (error) {
            console.error(error);
        }
    }
}