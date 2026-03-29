<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Forest Monitor</title>
    
    <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="bg-dark text-light">

    @include('partials.navbar')

    <main class="w-100 position-relative" style="height: calc(100vh - 56px);">
        
        @include('partials.map')
        @include('partials.dashboard')
        @include('partials.modals')
        @include('partials.manage-modal')
        @include('partials.nodes')
        @include('partials.alarms')

    </main>
    

     <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>