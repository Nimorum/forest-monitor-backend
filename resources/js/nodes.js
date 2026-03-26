import { eventBus } from './events';
import { ApiClient } from './api';

export class NodesController {
    constructor() {
        this.container = document.getElementById('nodes-view');
        this.navItem = document.getElementById('nav-nodes');
        this.accordionContainer = document.getElementById('nodes-accordion');
        
        this.loadingState = document.getElementById('nodes-loading');
        this.errorState = document.getElementById('nodes-error');
        this.noNodesState = document.getElementById('no-nodes-message');
        
        this.refreshBtn = document.getElementById('btn-refresh-nodes');

        this.initListeners();
    }

    initListeners() {
        eventBus.subscribe('view:changed', (viewName) => this.handleViewChange(viewName));

        if (this.refreshBtn) {
            this.refreshBtn.addEventListener('click', () => this.loadNodes());
        }
        this.accordionContainer.addEventListener('click', (e) => {

            const toggleBtn = e.target.closest('.custom-toggle-btn');
            if (toggleBtn) {
                e.preventDefault();
                const targetId = toggleBtn.getAttribute('data-target-id');
                const contentDiv = document.getElementById(targetId);
                const chevronIcon = toggleBtn.querySelector('.chevron-icon');

                if (contentDiv) {
                    if (contentDiv.classList.contains('d-none')) {
                        contentDiv.classList.remove('d-none');
                        chevronIcon.classList.add('open');
                    } else {
                        contentDiv.classList.add('d-none');
                        chevronIcon.classList.remove('open');
                    }
                }
            }

            const macLink = e.target.closest('.node-history-link');
            if (macLink) {
                e.preventDefault(); 
                
                const nodeId = macLink.dataset.id;
                eventBus.publish('node:history:requested', nodeId);
                return; 
            }
        });

        this.accordionContainer.addEventListener('change', (e) => {
            if (e.target.classList.contains('node-checkbox')) {
                this.updateToolbarState();
            }
            
            if (e.target.classList.contains('select-all-checkbox')) {
                const table = e.target.closest('table');
                const checkboxes = table.querySelectorAll('.node-checkbox');
                checkboxes.forEach(cb => cb.checked = e.target.checked);
                this.updateToolbarState();
            }
        });

        const btnCreateGroup = document.getElementById('btn-create-group');
        if (btnCreateGroup) {
            btnCreateGroup.addEventListener('click', async () => {
                const groupName = prompt("Enter the new group name:");
                if (groupName) {
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
            });
        }

        const btnDeleteGroup = document.getElementById('btn-delete-group');
        if (btnDeleteGroup) {
            btnDeleteGroup.addEventListener('click', async () => {
                const targetGroupId = document.getElementById('bulk-move-select').value;
                if (!targetGroupId) return alert("Please select a group from the dropdown first to delete it.");

                if (confirm(`Are you sure you want to delete this group? The nodes will NOT be deleted, just unassigned.`)) {
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
            });
        }

        const handleBulkTransfer = async (isMove) => {
            const targetGroupId = document.getElementById('bulk-move-select').value;
            if (!targetGroupId) return alert("Please select a target group from the dropdown.");

            const selectedIds = Array.from(document.querySelectorAll('.node-checkbox:checked')).map(cb => cb.value);
            const actionText = isMove ? 'moved' : 'added';
            
            try {

                const response = await ApiClient.post(`/node-groups/${targetGroupId}/nodes`, { 
                    node_ids: selectedIds,
                    is_move: isMove
                });
                
                if (!response.ok) throw new Error('Request failed');

                alert(`Successfully ${actionText} ${selectedIds.length} nodes!`);
                
                document.querySelectorAll('.node-checkbox:checked').forEach(cb => cb.checked = false);
                this.updateToolbarState();
                this.loadNodes();
            } catch (error) {
                alert(`Error: Could not process the nodes.`);
                console.error(error);
            }
        };

        const btnBulkAdd = document.getElementById('btn-bulk-add');
        if (btnBulkAdd) {
            btnBulkAdd.addEventListener('click', () => handleBulkTransfer(false));
        }

        const btnBulkMoveBtn = document.getElementById('btn-bulk-move');
        if (btnBulkMoveBtn) {
            btnBulkMoveBtn.addEventListener('click', () => handleBulkTransfer(true));
        }

        const btnBulkDelete = document.getElementById('btn-bulk-delete');
        if (btnBulkDelete) {
            btnBulkDelete.addEventListener('click', () => {
                const selected = Array.from(document.querySelectorAll('.node-checkbox:checked'));
                if (confirm(`Are you sure you want to delete ${selected.length} nodes?`)) {
                    const selectedIds = selected.map(cb => cb.value);
                    console.log(`🚀 DELETE NODES: [${selectedIds.join(', ')}]`);
                }
            });
        }
    }

    handleViewChange(viewName) {
        if (viewName === 'nodes') {
            this.container.classList.remove('d-none');
            this.navItem.classList.add('active');
            this.loadGroupsForDropdown();
            this.loadNodes();
        } else {
            this.container.classList.add('d-none');
            if(this.navItem) this.navItem.classList.remove('active');
        }
    }

    async loadNodes() {
        this.loadingState.classList.remove('d-none');
        this.accordionContainer.innerHTML = '';
        this.errorState.classList.add('d-none');
        this.noNodesState.classList.add('d-none');

        try {
            const response = await ApiClient.get('/my-nodes');
            const result = await response.json();

            if (!response.ok) throw new Error(result.message || 'Failed to load nodes.');

            const nodesArray = result.data || result; 
            
            this.renderNodes(nodesArray);

        } catch (error) {
            this.errorState.textContent = error.message;
            this.errorState.classList.remove('d-none');
        } finally {
            this.loadingState.classList.add('d-none');
        }
    }

    updateToolbarState() {
        const selectedCheckboxes = document.querySelectorAll('.node-checkbox:checked');
        const count = selectedCheckboxes.length;
        
        document.getElementById('selected-count').textContent = `${count} selected`;

        const disableBulk = count === 0;
        const btnAdd = document.getElementById('btn-bulk-add');
        const btnMove = document.getElementById('btn-bulk-move');
        const btnDelete = document.getElementById('btn-bulk-delete');

        if (btnAdd) btnAdd.disabled = disableBulk;
        if (btnMove) btnMove.disabled = disableBulk;
        if (btnDelete) btnDelete.disabled = disableBulk;
    }

    renderNodes(groupedNodes) {
        if (!groupedNodes || Object.keys(groupedNodes).length === 0) {
            this.noNodesState.classList.remove('d-none');
            document.getElementById('nodes-toolbar').classList.add('d-none');
            return;
        }

        document.getElementById('nodes-toolbar').classList.remove('d-none');

        let html = '';
        let index = 0;

        for (const [groupName, groupNodes] of Object.entries(groupedNodes)) {
            const isFirst = index === 0;
            const collapseId = `collapse-group-${index}`;
            const displayClass = isFirst ? '' : 'd-none';
            const iconClass = isFirst ? 'open' : '';

            const tableRows = groupNodes.map(node => {
                const battery = node.latest_telemetry ? `${node.latest_telemetry.vbat}V` : '<span class="text-muted">N/A</span>';
                const statusColor = node.is_online !== false ? 'text-success' : 'text-danger';

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
                        <td class=" small">${new Date(node.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>
                `;
            }).join('');

            html += `
                <div class="bg-dark border border-secondary rounded mb-2 overflow-hidden">
                    <button class="w-100 d-flex justify-content-between align-items-center p-3 bg-dark text-light border-0 custom-toggle-btn" data-target-id="${collapseId}">
                        <div>
                            <i class="bi bi-geo-alt-fill text-primary me-2"></i> 
                            <strong>${groupName}</strong> 
                            <span class="badge bg-secondary ms-2">${groupNodes.length} Nodes</span>
                        </div>
                        <i class="bi bi-chevron-down chevron-icon ${iconClass}"></i>
                    </button>
                    
                    <div id="${collapseId}" class="${displayClass} border-top border-secondary">
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
            index++;
        }

        this.accordionContainer.innerHTML = html;
        this.updateToolbarState(); 
    }

    async loadGroupsForDropdown() {
        try {
            const response = await ApiClient.get('/node-groups');
            const groups = await response.json();
            
            const moveSelect = document.getElementById('bulk-move-select');
            moveSelect.innerHTML = '<option value="" selected disabled>Target group...</option>';
            
            groups.forEach(group => {
                moveSelect.innerHTML += `<option value="${group.id}">${group.name}</option>`;
            });
        } catch (error) {
            console.error(error);
        }
    }
}