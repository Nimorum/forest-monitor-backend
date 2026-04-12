import { eventBus } from './events';

export class NavbarController {
    constructor() {
        this.initDOM();
        this.initListeners();
    }

    initDOM() {
        this.elements = {
            navMap: document.getElementById('nav-map'),
            navItemDashboard: document.getElementById('nav-item-dashboard'),
            navAlarms: document.getElementById('nav-alarms'),
            navNodes: document.getElementById('nav-nodes'),
            btnLogin: document.getElementById('btn-show-login'),
            btnRegister: document.getElementById('btn-show-register'),
            btnLogout: document.getElementById('btn-logout'),
            navLinks: document.querySelectorAll('.nav-link'),
            menuCollapse: document.getElementById('topNavbar'),
            navbarToggler: document.querySelector('.navbar-toggler')
        };

        this.navViews = [
            { el: this.elements.navMap, view: 'map' },
            { el: this.elements.navItemDashboard, view: 'dashboard' },
            { el: this.elements.navNodes, view: 'nodes' },
            { el: this.elements.navAlarms, view: 'alarms' }
        ];
    }

    initListeners() {
        this.navViews.forEach(({ el, view }) => {
            el?.addEventListener('click', (e) => {
                e.preventDefault();
                eventBus.publish('view:changed', view);
            });
        });

        this.elements.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                const { navbarToggler, menuCollapse } = this.elements;
                if (!navbarToggler || !menuCollapse) return;

                const isMobileView = window.getComputedStyle(navbarToggler).display !== 'none';
                
                if (isMobileView && menuCollapse.classList.contains('show')) {
                    const bsCollapse = bootstrap.Collapse.getInstance(menuCollapse);
                    bsCollapse?.hide();
                }
            });
        });

        eventBus.subscribe('auth:success', () => this.updateAuthState(true));
        eventBus.subscribe('auth:logout', () => this.updateAuthState(false));
    }

    updateAuthState(isAuthenticated) {
        const { btnLogin, btnRegister, btnLogout, navItemDashboard, navAlarms, navNodes } = this.elements;

        btnLogin?.classList.toggle('d-none', isAuthenticated);
        btnRegister?.classList.toggle('d-none', isAuthenticated);
        
        btnLogout?.classList.toggle('d-none', !isAuthenticated);
        navItemDashboard?.classList.toggle('d-none', !isAuthenticated);
        navAlarms?.classList.toggle('d-none', !isAuthenticated);
        navNodes?.classList.toggle('d-none', !isAuthenticated);
    }
}