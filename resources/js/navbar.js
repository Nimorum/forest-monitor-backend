import { eventBus } from './events';

export class NavbarController {
    constructor() {
        this.navMap = document.getElementById('nav-map');
        this.navItemDashboard = document.getElementById('nav-item-dashboard');

        this.navAlarms = document.getElementById('nav-alarms');
        
        this.btnLogin = document.getElementById('btn-show-login');
        this.btnRegister = document.getElementById('btn-show-register');
        this.btnLogout = document.getElementById('btn-logout');

        this.navNodes = document.getElementById('nav-nodes');

        this.initListeners();
    }

    initListeners() {
        if (this.navMap) {
            this.navMap.addEventListener('click', (e) => {
                e.preventDefault();
                eventBus.publish('view:changed', 'map');
            });
        }

        if (this.navItemDashboard) {
            this.navItemDashboard.addEventListener('click', (e) => {
                e.preventDefault();
                eventBus.publish('view:changed', 'dashboard');
            });
        }

        if (this.navNodes) {
            this.navNodes.addEventListener('click', (e) => {
                e.preventDefault();
                eventBus.publish('view:changed', 'nodes');
            });
        }

        if (this.navAlarms) {
            this.navAlarms.addEventListener('click', (e) => {
                e.preventDefault();
                eventBus.publish('view:changed', 'alarms');
            });
        }


        eventBus.subscribe('auth:success', () => this.setAuthenticatedState());
        eventBus.subscribe('auth:logout', () => this.setUnauthenticatedState());
        console.log('NavbarController initialized and listeners set up.');
    }

    setAuthenticatedState() {
        if (this.btnLogin) this.btnLogin.classList.add('d-none');
        if (this.btnRegister) this.btnRegister.classList.add('d-none');
        if (this.btnLogout) this.btnLogout.classList.remove('d-none');
        if (this.navItemDashboard) this.navItemDashboard.classList.remove('d-none');
        if (this.navAlarms) this.navAlarms.classList.remove('d-none');
        if (this.navNodes) this.navNodes.classList.remove('d-none');
    }

    setUnauthenticatedState() {
        if (this.btnLogin) this.btnLogin.classList.remove('d-none');
        if (this.btnRegister) this.btnRegister.classList.remove('d-none');
        if (this.btnLogout) this.btnLogout.classList.add('d-none');
        if (this.navItemDashboard) this.navItemDashboard.classList.add('d-none');
        if (this.navAlarms) this.navAlarms.classList.add('d-none');
        if (this.navNodes) this.navNodes.classList.add('d-none');
    }
}