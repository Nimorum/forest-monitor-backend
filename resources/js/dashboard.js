import { eventBus } from './events';

export class DashboardController {
    constructor() {
        this.container = document.getElementById('dashboard-view');
        this.navItem = document.getElementById('nav-item-dashboard');

        // Listen for view changes
        eventBus.subscribe('view:changed', (viewName) => this.handleViewChange(viewName));
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
        // Future logic to fetch API Tokens from backend goes here
        console.log('Dashboard data loaded.');
    }
}