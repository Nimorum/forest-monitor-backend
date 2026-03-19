import L from 'leaflet';
import { eventBus } from './events';

export class MapController {
    constructor() {
        this.container = document.getElementById('map-view');
        this.navItem = document.getElementById('nav-map');
        this.mapInstance = null;

        // Listen for view changes
        eventBus.subscribe('view:changed', (viewName) => this.handleViewChange(viewName));
    }

    handleViewChange(viewName) {
        if (viewName === 'map') {
            this.container.classList.remove('d-none');
            this.navItem.classList.add('active');
            this.initMap();
        } else {
            this.container.classList.add('d-none');
            this.navItem.classList.remove('active');
        }
    }

    initMap() {
        if (!this.mapInstance) {
            this.mapInstance = L.map(this.container.id).setView([39.833333, -8.933333], 13);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap'
            }).addTo(this.mapInstance);
            
            console.log('Map initialized.');
        } else {
            // Leaflet requires this when a map container changes from display:none to block
            this.mapInstance.invalidateSize();
        }
    }
}