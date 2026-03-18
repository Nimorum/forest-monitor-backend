import './bootstrap';
document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');
    
    if (app) {
        app.innerHTML = '<h1>Frontend System Initialized</h1><p>Ready to load the map...</p>';
    }
});