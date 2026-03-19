import { eventBus } from './events';

export class NavbarController {
    constructor() {
        this.navMap = document.getElementById('nav-map');
        this.navDashboard = document.getElementById('nav-dashboard');
        this.navItemDashboard = document.getElementById('nav-item-dashboard');
        
        this.btnLogin = document.getElementById('btn-show-login');
        this.btnRegister = document.getElementById('btn-show-register');
        this.btnLogout = document.getElementById('btn-logout');

        this.initListeners();
    }

    initListeners() {
        if (this.navMap) {
            this.navMap.addEventListener('click', (e) => {
                e.preventDefault();
                eventBus.publish('view:changed', 'map');
            });
        }

        if (this.navDashboard) {
            this.navDashboard.addEventListener('click', (e) => {
                e.preventDefault();
                eventBus.publish('view:changed', 'dashboard');
            });
        }

        eventBus.subscribe('auth:success', () => this.setAuthenticatedState());
        eventBus.subscribe('auth:logout', () => this.setUnauthenticatedState());
        console.log('NavbarController initialized and listeners set up.');
    }

    setAuthenticatedState() {
        console.log('Navbar: User authenticated, updating UI.');
        if (this.btnLogin) this.btnLogin.classList.add('d-none');
        if (this.btnRegister) this.btnRegister.classList.add('d-none');
        if (this.btnLogout) this.btnLogout.classList.remove('d-none');
        if (this.navItemDashboard) this.navItemDashboard.classList.remove('d-none');
    }

    setUnauthenticatedState() {
        console.log('User logged out, updating navbar.');
        if (this.btnLogin) this.btnLogin.classList.remove('d-none');
        if (this.btnRegister) this.btnRegister.classList.remove('d-none');
        if (this.btnLogout) this.btnLogout.classList.add('d-none');
        if (this.navItemDashboard) this.navItemDashboard.classList.add('d-none');
        console.log('navitemdashboard should now be hidden:', this.navItemDashboard);
    }
}