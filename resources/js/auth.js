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

        this.resetForm = document.getElementById('reset-password-form');
        this.resetAlert = document.getElementById('reset-alert');

        this.initListeners();
        this.checkInitialState();
        this.checkPasswordResetUrl();
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

        if (this.resetForm) {
            this.resetForm.addEventListener('submit', (e) => this.handlePasswordResetSubmit(e));
        }
    }

    checkPasswordResetUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const email = urlParams.get('email');
        const path = window.location.pathname;

        if (path === '/reset-password' && token && email) {
            document.getElementById('reset-token').value = token;
            document.getElementById('reset-email').value = email;

            const resetModalElement = document.getElementById('resetPasswordModal');
            if (resetModalElement) {
                const resetModal = new bootstrap.Modal(resetModalElement);
                resetModal.show();
                window.history.replaceState({}, document.title, '/');
            }
        }
    }

    async handlePasswordResetSubmit(e) {
        e.preventDefault();
        this.hideAlert(this.resetAlert);

        const token = document.getElementById('reset-token').value;
        const email = document.getElementById('reset-email').value;
        const password = document.getElementById('reset-password').value;
        const password_confirmation = document.getElementById('reset-password-confirmation').value;

        if (password !== password_confirmation) {
            this.showAlert(this.resetAlert, 'As passwords não coincidem.');
            return;
        }

        try {
            ApiClient.post('/reset-password', {
                token, email, password, password_confirmation
            })
            .then(response => response.json().then(data => ({ status: response.status, body: data })))
            .then(({ status, body }) => {
                if (status >= 200 && status < 300) {
                    this.showAlert(this.resetAlert, 'Password alterada com sucesso!');
                    this.resetAlert.classList.replace('alert-danger', 'alert-success');

                    setTimeout(() => {
                        const resetModal = bootstrap.Modal.getInstance(document.getElementById('resetPasswordModal'));
                        if (resetModal) resetModal.hide();

                        const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
                        loginModal.show();
                    }, 2000);
                } else {
                    throw new Error(body.message || 'Erro ao alterar a password.');
                }
            })
            .catch(error => {
                this.showAlert(this.resetAlert, error.message);
                this.resetAlert.classList.replace('alert-success', 'alert-danger');
            });
        } catch (error) {
            this.showAlert(this.resetAlert, 'Ocorreu um erro inesperado.');
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
        window.location.reload();
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
        window.location.reload();
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
