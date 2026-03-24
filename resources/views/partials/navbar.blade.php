<nav class="navbar navbar-expand-lg navbar-dark">
    <div class="container-fluid px-4">
        <a class="navbar-brand d-flex align-items-center" href="#">
            <img src="{{ asset('favicon.ico') }}" width="30" class="me-2">
            Forest Monitor
        </a>

        <div class="d-flex w-100 align-items-center" id="topNavbar">
            <ul class="navbar-nav me-auto ms-3 flex-row gap-3">
                <li class="nav-item">
                    <a class="nav-link active" href="#" id="nav-map">Map</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" id="nav-item-dashboard">Dashboard</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" id="nav-nodes" href="#">
                        <i class="bi bi-cpu"></i> Nodes
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link d-flex align-items-center gap-2" id="nav-alarms" href="#">
                        Alarms <span id="alarm-badge" class="badge bg-danger rounded-pill d-none">0</span>
                    </a>
                </li>
            </ul>

            <div class="d-flex gap-2" id="auth-controls">
                <button class="btn btn-outline-light" id="btn-show-login" data-bs-toggle="modal" data-bs-target="#loginModal">Login</button>
                <button class="btn btn-success" id="btn-show-register" data-bs-toggle="modal" data-bs-target="#registerModal">Register</button>
                <button class="btn btn-outline-danger d-none" id="btn-logout">Logout</button>
            </div>
        </div>
    </div>
</nav>