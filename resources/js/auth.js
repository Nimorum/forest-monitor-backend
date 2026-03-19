import { eventBus } from './events';

export class AuthController {
    constructor() {
        this.loginForm = document.getElementById('login-form');
        this.registerForm = document.getElementById('register-form');
        this.btnLogout = document.getElementById('btn-logout');
        
        this.loginAlert = document.getElementById('login-alert');
        this.registerAlert = document.getElementById('register-alert');

        this.initListeners();
        this.checkInitialState();
    }

    initListeners() {
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (this.registerForm) {
            this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        if (this.btnLogout) {
            this.btnLogout.addEventListener('click', () => this.handleLogout());
        }
    }

    checkInitialState() {
        const token = localStorage.getItem('auth_token');
        console.log('Checking initial auth state. Token found:', !!token);
        if (token) {
            eventBus.publish('auth:success', {});
            console.log('Initial auth state: User is authenticated.');
        } else {
            eventBus.publish('auth:logout', {});
            console.log('Initial auth state: User is not authenticated.');
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        this.hideAlert(this.loginAlert);

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Invalid credentials.');
            }

            this.processSuccessfulAuth(data.token, 'loginModal');

        } catch (error) {
            this.showAlert(this.loginAlert, error.message);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        this.hideAlert(this.registerAlert);

        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed.');
            }

            this.processSuccessfulAuth(data.token, 'registerModal');

        } catch (error) {
            this.showAlert(this.registerAlert, error.message);
        }
    }

    async handleLogout() {
        const token = localStorage.getItem('auth_token');
        
        if (token) {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
        }

        localStorage.removeItem('auth_token');
        eventBus.publish('auth:logout', {});
        eventBus.publish('view:changed', 'map');
    }

    processSuccessfulAuth(token, modalId) {
        localStorage.setItem('auth_token', token);
        
        const modalElement = document.getElementById(modalId);
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) {
            modalInstance.hide();
        }

        eventBus.publish('auth:success', {});
        
        this.loginForm.reset();
        this.registerForm.reset();
    }

    showAlert(element, message) {
        element.textContent = message;
        element.classList.remove('d-none');
    }

    hideAlert(element) {
        element.classList.add('d-none');
        element.textContent = '';
    }
}