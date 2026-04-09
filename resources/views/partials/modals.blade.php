<div class="modal fade" id="loginModal" tabindex="-1" aria-labelledby="loginModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content bg-dark text-light border-secondary">
            <div class="modal-header border-secondary">
                <h5 class="modal-title" id="loginModalLabel">Login</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div id="login-alert" class="alert alert-danger d-none" role="alert"></div>

                <form id="login-form">
                    <div class="mb-3">
                        <label for="login-email" class="form-label">Email address</label>
                        <input type="email" class="form-control bg-dark text-light border-secondary" id="login-email" required>
                    </div>
                    <div class="mb-3">
                        <label for="login-password" class="form-label">Password</label>
                        <input type="password" class="form-control bg-dark text-light border-secondary" id="login-password" required>
                    </div>
                    <button type="submit" class="btn btn-primary w-100">Login</button>
                </form>
                <div class="mt-2 text-end">
                    <a href="#" id="link-forgot-password" class="text-info small">Forgot Password?</a>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="modal fade" id="registerModal" tabindex="-1" aria-labelledby="registerModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content bg-dark text-light border-secondary">
            <div class="modal-header border-secondary">
                <h5 class="modal-title" id="registerModalLabel">Create Account</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div id="register-alert" class="alert alert-danger d-none" role="alert"></div>

                <form id="register-form">
                    <div class="mb-3">
                        <label for="register-name" class="form-label">Name</label>
                        <input type="text" class="form-control bg-dark text-light border-secondary" id="register-name" required>
                    </div>
                    <div class="mb-3">
                        <label for="register-email" class="form-label">Email address</label>
                        <input type="email" class="form-control bg-dark text-light border-secondary" id="register-email" required>
                    </div>
                    <div class="mb-3">
                        <label for="register-password" class="form-label">Password</label>
                        <input type="password" class="form-control bg-dark text-light border-secondary" id="register-password" required minlength="8">
                    </div>
                    <button type="submit" class="btn btn-success w-100">Register</button>
                </form>
            </div>
        </div>
    </div>
</div>

<div class="modal fade" id="forgotPasswordModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content bg-dark text-light border-secondary">
            <div class="modal-body">
                <div id="forgot-alert" class="alert d-none"></div>
                <form id="forgot-password-form">
                    <div class="mb-3">
                        <label class="form-label">Recovery Email</label>
                        <input type="email" id="forgot-email" class="form-control bg-dark text-light border-secondary" required>
                    </div>
                    <button type="submit" class="btn btn-primary w-100">Send Link</button>
                </form>
            </div>
        </div>
    </div>
</div>

<div class="modal fade" id="resetPasswordModal" tabindex="-1" aria-labelledby="resetPasswordModalLabel" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
    <div class="modal-dialog">
        <div class="modal-content bg-dark text-light border-secondary">
            <div class="modal-header border-secondary">
                <h5 class="modal-title" id="resetPasswordModalLabel">Definir Nova Password</h5>
            </div>
            <div class="modal-body">
                <div id="reset-alert" class="alert d-none" role="alert"></div>

                <form id="reset-password-form">
                    <input type="hidden" id="reset-token">
                    <input type="hidden" id="reset-email">

                    <div class="mb-3">
                        <label for="reset-password" class="form-label">Nova Password</label>
                        <input type="password" class="form-control bg-dark text-light border-secondary" id="reset-password" required minlength="8">
                    </div>
                    <div class="mb-3">
                        <label for="reset-password-confirmation" class="form-label">Confirmar Password</label>
                        <input type="password" class="form-control bg-dark text-light border-secondary" id="reset-password-confirmation" required minlength="8">
                    </div>
                    <button type="submit" class="btn btn-primary w-100">Guardar Nova Password</button>
                </form>
            </div>
        </div>
    </div>
</div>
