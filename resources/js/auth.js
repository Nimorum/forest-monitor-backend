import { eventBus } from './events';
import { ApiClient } from './api';

export class AuthController {
    constructor() {
        this.loginForm = document.getElementById('login-form');
        this.registerForm = document.getElementById('register-form');
        this.btnLogout = document.getElementById('btn-logout');
        this.forgotForm = document.getElementById('forgot-password-form');
        this.forgotLink = document.getElementById('link-forgot-password');
        
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

        if (this.forgotForm) {
            this.forgotForm.addEventListener('submit', (e) => this.handleForgotPassword(e));
        }
        if (this.forgotLink) {
            this.forgotLink.addEventListener('click', (e) => this.handleForgotLinkClick(e));
        }
    }

    handleForgotLinkClick(e) {
        e.preventDefault();
        const loginModalElement = document.getElementById('loginModal');
        const loginModalInstance = bootstrap.Modal.getInstance(loginModalElement);
        if (loginModalInstance) {
            loginModalInstance.hide();
        }
        const forgotModalElement = document.getElementById('forgotPasswordModal');
        const forgotModal = new bootstrap.Modal(forgotModalElement);
        forgotModal.show();
    }

    checkInitialState() {
        const token = localStorage.getItem('auth_token');
        
        if (token) {
            window.isAuthenticated = true;
            eventBus.publish('auth:success', {});
        } else {
            window.isAuthenticated = false;
            eventBus.publish('auth:logout', {});
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        this.hideAlert(this.loginAlert);

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        ApiClient.post('/login', { email, password })
            .then(response => response.json())
            .then(data => {
                if (data.token) {
                    this.processSuccessfulAuth(data.token, 'loginModal');
                } else {
                    throw new Error(data.message || 'Invalid credentials.');
                }
            })
            .catch(error => {
                this.showAlert(this.loginAlert, error.message);
            });
    }

    async handleRegister(e) {
        e.preventDefault();
        this.hideAlert(this.registerAlert);

        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        ApiClient.post('/register', { name, email, password })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    // open login modal after successful registration
                    const loginModalElement = document.getElementById('loginModal');
                    const loginModal = new bootstrap.Modal(loginModalElement);
                    loginModal.show();

                    this.registerForm.reset();
                    const registerModalElement = document.getElementById('registerModal');
                    const registerModalInstance = bootstrap.Modal.getInstance(registerModalElement);
                    if (registerModalInstance) {
                        registerModalInstance.hide();
                    }
                } else {
                    throw new Error(data.message || 'Registration failed.');
                }
            })
            .catch(error => {
                this.showAlert(this.registerAlert, error.message);
            });
    }

    handleLogout() {

        ApiClient.post('/logout')
            .then(() => {
                this.clearAuthState();
            })
            .catch(() => {
                // Even if logout request fails, clear local auth state
                this.clearAuthState();
            });
    }

    async handleForgotPassword(e) {
        e.preventDefault();
        const email = document.getElementById('forgot-email').value;
        const alert = document.getElementById('forgot-alert');

        ApiClient.post('/forgot-password', { email })
            .then(response => response.json())
            .then(data => {
                this.showAlert(alert, data.message);
                alert.classList.replace('alert-danger', 'alert-success');
            })
            .catch(error => {
                this.showAlert(alert, 'Erro ao processar pedido.');
                alert.classList.replace('alert-success', 'alert-danger');
            });
    }

    clearAuthState() {
        localStorage.removeItem('auth_token');
        window.isAuthenticated = false;
        eventBus.publish('auth:logout', {});
        eventBus.publish('view:changed', 'map');
    }

    processSuccessfulAuth(token, modalId) {
        localStorage.setItem('auth_token', token);
        window.isAuthenticated = true;
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