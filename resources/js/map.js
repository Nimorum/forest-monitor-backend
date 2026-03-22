import L from 'leaflet';
import { eventBus } from './events';
import { ApiClient } from './api';

const IDWCanvasLayer = L.Layer.extend({
    initialize: function (options) {
        L.setOptions(this, options);
    },
    onAdd: function (map) {
        this._map = map;
        this._canvas = L.DomUtil.create('canvas', 'leaflet-idw-layer');
        this._canvas.style.position = 'absolute';
        this._canvas.style.pointerEvents = 'none';
        this._canvas.style.opacity = 0.7;
        this._canvas.style.filter = 'blur(8px)';
        
        map.getPanes().overlayPane.appendChild(this._canvas);
        map.on('moveend zoomend resize', this._redraw, this);
        this._redraw();
    },
    onRemove: function (map) {
        L.DomUtil.remove(this._canvas);
        map.off('moveend zoomend resize', this._redraw, this);
    },
    _redraw: function () {
        if (!this._map) return;
        const size = this._map.getSize();
        this._canvas.width = size.x;
        this._canvas.height = size.y;
        
        const topLeft = this._map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this._canvas, topLeft);

        if (this.options.onDraw) {
            this.options.onDraw(this._canvas.getContext('2d'), size.x, size.y);
        }
    },
    redraw: function() {
        if (this._map) this._redraw();
    }
});

export class MapController {
    constructor() {
        this.container = document.getElementById('map-view');
        this.navItem = document.getElementById('nav-map');
        this.layerSelect = document.getElementById('heatmap-layer-select');
        
        this.mapInstance = null;
        this.markerLayer = null;
        this.customCanvasLayer = null; 
        
        this.currentFeatures = [];
        
        eventBus.subscribe('view:changed', (viewName) => this.handleViewChange(viewName));
    }

    handleViewChange(viewName) {
        if (viewName === 'map') {
            this.container.parentElement.classList.remove('d-none');
            this.navItem.classList.add('active');
            this.initMap();
        } else {
            this.container.parentElement.classList.add('d-none');
            this.navItem.classList.remove('active');
        }
    }

    initMap() {
        if (!this.mapInstance) {
            this.mapInstance = L.map(this.container.id).setView([39.833333, -8.933333], 13);
            
            L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
                maxZoom: 20,
                attribution: '&copy; Stadia Maps, &copy; OpenMapTiles &copy; OpenStreetMap contributors'
            }).addTo(this.mapInstance);

            this.customCanvasLayer = new IDWCanvasLayer({
                onDraw: (ctx, width, height) => this.drawPixelsOnCanvas(ctx, width, height)
            }).addTo(this.mapInstance);

            this.markerLayer = L.layerGroup().addTo(this.mapInstance);
            
            this.mapInstance.on('moveend', () => this.fetchNodesInView());

            if (this.layerSelect) {
                this.layerSelect.addEventListener('change', () => this.customCanvasLayer.redraw());
            }

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
            
            if (result.type === 'FeatureCollection' && result.features) {
                this.currentFeatures = result.features;
                this.renderMarkers();
                this.customCanvasLayer.redraw();
            }
        } catch (error) {
            console.error('Map data fetch failed:', error.message);
        }
    }

    calculateFireRisk(temp, hum, wind) {
        if (temp === null || hum === null) return 0;
        let risk = 0;
        if (temp > 30) risk += 0.5; else if (temp > 25) risk += 0.3;
        if (hum < 30) risk += 0.4; else if (hum < 50) risk += 0.2;
        if (wind > 10) risk += 0.1;
        return Math.min(risk, 1.0);
    }

    interpolateColor(val, mode) {
        let stops = [];
        if (mode === 'temperature') {
            stops = [{v: 0, c: [13,110,253]}, {v: 15, c: [32,201,151]}, {v: 25, c: [255,193,7]}, {v: 35, c: [220,53,69]}];
        } else if (mode === 'humidity') {
            stops = [{v: 0, c: [166,97,26]}, {v: 40, c: [223,194,125]}, {v: 70, c: [128,205,193]}, {v: 100, c: [1,133,113]}];
        } else if (mode === 'risk') {
            stops = [{v: 0, c: [25,135,84]}, {v: 0.3, c: [255,193,7]}, {v: 0.7, c: [253,126,20]}, {v: 1.0, c: [220,53,69]}];
        } else if (mode === 'wind') {
            stops = [{v: 0, c: [255,255,255]}, {v: 10, c: [153,102,255]}, {v: 20, c: [102,0,204]}];
        } else {
            return [255, 255, 255]; 
        }

        if (val <= stops[0].v) return stops[0].c;
        if (val >= stops[stops.length - 1].v) return stops[stops.length - 1].c;

        for (let i = 0; i < stops.length - 1; i++) {
            if (val >= stops[i].v && val <= stops[i+1].v) {
                const range = stops[i+1].v - stops[i].v;
                const percent = (val - stops[i].v) / range;
                const c1 = stops[i].c;
                const c2 = stops[i+1].c;
                return [
                    Math.round(c1[0] + (c2[0] - c1[0]) * percent),
                    Math.round(c1[1] + (c2[1] - c1[1]) * percent),
                    Math.round(c1[2] + (c2[2] - c1[2]) * percent)
                ];
            }
        }
        return [0,0,0];
    }

   drawPixelsOnCanvas(ctx, width, height) {
        ctx.clearRect(0, 0, width, height);
        const mode = this.layerSelect.value;
        if (mode === 'none' || this.currentFeatures.length === 0) return;

        const cutoffMeters = 2500; // Raio Real (Ex: 2500 metros = 2.5km)
        
        const center = this.mapInstance.getCenter();
        const centerPt = this.mapInstance.latLngToContainerPoint(center);
        const testPt = L.point(centerPt.x + 100, centerPt.y);
        const testLatLng = this.mapInstance.containerPointToLatLng(testPt);
        const metersPer100Px = center.distanceTo(testLatLng); 
        const pixelsPerMeter = 100 / metersPer100Px;

        const cellSize = 4; // Tamanho da célula em pixels (ajustável para performance/qualidade)
        let maxDist = cutoffMeters * pixelsPerMeter;
        maxDist = Math.max(maxDist, cellSize * 1.5);
        
        const fadeZone = maxDist * 0.45;

        const screenPoints = this.currentFeatures.map(f => {
            const props = f.properties;
            const pt = this.mapInstance.latLngToContainerPoint([f.geometry.coordinates[1], f.geometry.coordinates[0]]);
            
            let val = 0;
            if (mode === 'temperature') val = props.temperature || 0;
            if (mode === 'humidity') val = props.humidity || 0;
            if (mode === 'wind') val = props.wind_speed || 0;
            if (mode === 'risk') val = this.calculateFireRisk(props.temperature, props.humidity, props.wind_speed);

            return { x: pt.x, y: pt.y, value: val };
        });

        for (let x = 0; x < width; x += cellSize) {
            for (let y = 0; y < height; y += cellSize) {
                let num = 0, den = 0;
                let minDist = Infinity;

                for (let p of screenPoints) {
                    const dist = Math.hypot(p.x - x, p.y - y);
                    if (dist < minDist) minDist = dist;
                    
                    if (dist < 1) { num = p.value; den = 1; break; } 
                    
                    const weight = 1 / (dist * dist);
                    num += p.value * weight;
                    den += weight;
                }

                if (minDist > maxDist) continue; 

                const finalValue = num / den;
                const rgb = this.interpolateColor(finalValue, mode);
                
                let alpha = 1;
                if (minDist > (maxDist - fadeZone)) {
                    alpha = 1 - ((minDist - (maxDist - fadeZone)) / fadeZone);
                }

                ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
                ctx.fillRect(x, y, cellSize, cellSize);
            }
        }
    }

    renderMarkers() {
        this.markerLayer.clearLayers();
        this.currentFeatures.forEach(feature => {
            const props = feature.properties;
            const lng = feature.geometry.coordinates[0];
            const lat = feature.geometry.coordinates[1];

            let statusClass = 'bg-success pulse-success';
            let statusText = 'Online';

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