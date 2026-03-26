<nav class="navbar navbar-expand-lg navbar-dark border-bottom border-secondary">
    <div class="container-fluid px-4">
        <a class="navbar-brand d-flex align-items-center" href="#">
            <img src="{{ asset('favicon.ico') }}" width="30" class="me-2">
            Forest Monitor
        </a>

        <button class="navbar-toggler shadow-none border-0" type="button" data-bs-toggle="collapse" data-bs-target="#topNavbar">
            <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="topNavbar">
            <ul class="navbar-nav me-auto ms-lg-3 gap-1 gap-lg-3">
                <li class="nav-item">
                    <a class="nav-link active px-2 rounded" href="#" id="nav-map">Map</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link px-2 rounded" href="#" id="nav-item-dashboard">Dashboard</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link px-2 rounded" id="nav-nodes" href="#">
                        <i class="bi bi-cpu"></i> Nodes
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link px-2 rounded d-flex align-items-center gap-2" id="nav-alarms" href="#">
                        Alarms <span id="alarm-badge" class="badge bg-danger rounded-pill d-none">0</span>
                    </a>
                </li>
            </ul>

            <div class="d-flex flex-column flex-lg-row gap-2" id="auth-controls">
                <button class="btn btn-outline-light btn-sm" id="btn-show-login" data-bs-toggle="modal" data-bs-target="#loginModal">Login</button>
                <button class="btn btn-success btn-sm" id="btn-show-register" data-bs-toggle="modal" data-bs-target="#registerModal">Register</button>
                <button class="btn btn-outline-danger btn-sm d-none" id="btn-logout">Logout</button>
            </div>
        </div>
    </div>
</nav>