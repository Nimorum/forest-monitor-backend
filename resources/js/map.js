import L from 'leaflet';
import { eventBus } from './events';
import { ApiClient } from './api';

export class MapController {
    constructor() {
        this.container = document.getElementById('map-view');
        this.navItem = document.getElementById('nav-map');
        this.mapInstance = null;
        this.markerLayer = null;
        
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
            
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap © CARTO'
            }).addTo(this.mapInstance);

            this.markerLayer = L.layerGroup().addTo(this.mapInstance);

            this.mapInstance.on('moveend', () => this.fetchNodesInView());

            this.fetchNodesInView();
        } else {
            this.mapInstance.invalidateSize();
        }
    }

async fetchNodesInView() {
        const bounds = this.mapInstance.getBounds();
        
        const params = new URLSearchParams({
            north: bounds.getNorthEast().lat,
            south: bounds.getSouthWest().lat,
            east: bounds.getNorthEast().lng,
            west: bounds.getSouthWest().lng,
        });

        try {
            const response = await ApiClient.get(`/map-data?${params.toString()}`);
            const result = await response.json();
            
            // Alterado para detetar o formato GeoJSON do teu backend
            if (result.type === 'FeatureCollection' && result.features) {
                this.renderMarkers(result.features);
            }
        } catch (error) {
            console.error('Map data fetch failed:', error.message);
        }
    }

    renderMarkers(features) {
        this.markerLayer.clearLayers();

        features.forEach(feature => {
            const props = feature.properties;
            
            // GeoJSON usa [Longitude, Latitude]. O Leaflet precisa do inverso.
            const lng = feature.geometry.coordinates[0];
            const lat = feature.geometry.coordinates[1];

            let statusClass = 'bg-success pulse-success';
            let statusText = 'Online';

            // Os dados de telemetria vêm diretamente das properties agora
            if (props.temperature !== null && props.temperature !== undefined) {
                if (props.temperature >= 35.0 && props.humidity <= 30.0) {
                    statusClass = 'bg-danger pulse-danger';
                    statusText = 'Fire Risk';
                } else if (props.vbat <= 3.3) {
                    statusClass = 'bg-warning pulse-warning';
                    statusText = 'Low Battery';
                }
            } else {
                statusClass = 'bg-secondary';
                statusText = 'No Data';
            }

            const icon = L.divIcon({
                className: 'custom-beacon',
                html: `<div class="beacon ${statusClass}"></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });

            const popupContent = `
                <div class="text-dark p-1" style="min-width: 150px;">
                    <h6 class="mb-1 fw-bold border-bottom pb-1">${props.mac_address}</h6>
                    <span class="badge ${statusClass.split(' ')[0]} mb-2 w-100">${statusText}</span>
                    
                    ${props.temperature !== null ? `
                        <div class="small d-flex justify-content-between mb-1">
                            <span>🌡️ Temp:</span> <strong>${props.temperature}°C</strong>
                        </div>
                        <div class="small d-flex justify-content-between mb-1">
                            <span>💧 Hum:</span> <strong>${props.humidity}%</strong>
                        </div>
                        <div class="small d-flex justify-content-between mb-2">
                            <span>🔋 Bat:</span> <strong>${props.vbat}V</strong>
                        </div>
                        <div class="small text-muted text-end" style="font-size: 0.7rem;">
                            ${new Date(props.last_update).toLocaleString()}
                        </div>
                    ` : '<div class="small text-muted text-center py-2">Awaiting first payload</div>'}
                    
                    <button class="btn btn-sm btn-outline-primary w-100 mt-2 btn-history" data-id="${props.node_id}">View History</button>
                </div>
            `;

            // Usa as variáveis lat e lng invertidas
            const marker = L.marker([lat, lng], { icon })
                .bindPopup(popupContent)
                .addTo(this.markerLayer);
                
            marker.on('popupopen', () => {
                const btn = document.querySelector(`.btn-history[data-id="${props.node_id}"]`);
                if (btn) {
                    btn.addEventListener('click', () => {
                        eventBus.publish('node:history:requested', props.node_id);
                    });
                }
            });
        });
    }
}