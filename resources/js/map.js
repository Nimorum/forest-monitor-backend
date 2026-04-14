import L from 'leaflet';
import { eventBus } from './events';
import { ApiClient } from './api';

// --- Constants & Configurations ---
const COLOR_STOPS = {
    temperature: [{v: 0, c: [13,110,253]}, {v: 15, c: [32,201,151]}, {v: 25, c: [255,193,7]}, {v: 35, c: [220,53,69]}],
    humidity: [{v: 0, c: [166,97,26]}, {v: 40, c: [223,194,125]}, {v: 70, c: [128,205,193]}, {v: 100, c: [1,133,113]}],
    risk: [{v: 0, c: [25,135,84]}, {v: 0.3, c: [255,193,7]}, {v: 0.7, c: [253,126,20]}, {v: 1.0, c: [220,53,69]}],
    wind: [{v: 0, c: [255,255,255]}, {v: 10, c: [153,102,255]}, {v: 20, c: [102,0,204]}]
};

// --- Pure Helper Functions ---
const calculateFireRisk = (temp, hum, windKmH, soilMoisture) => {
    // Retorna 0 se faltarem os sensores críticos
    if (temp == null || hum == null || soilMoisture == null) return 0;

    // 1. Calcular o VPD (Vapor Pressure Deficit) em kPa
    // Fórmula de Tetens para Pressão de Vapor de Saturação
    const svp = 0.6108 * Math.exp((17.27 * temp) / (temp + 237.3));
    const vpd = svp * (1 - (hum / 100));

    // Normalizar o VPD (Valores acima de 4.0 kPa são condições extremas de seca atmosférica)
    let vpdFactor = Math.min(vpd / 4.0, 1.0);

    // 2. Fator de Combustível Pesado (Humidade do Solo)
    // Solo a 100% = fator 0. Solo a 0% = fator 1.
    const soilFactor = Math.max(0, (100 - soilMoisture) / 100);

    // 3. Risco Base de Ignição
    // Damos 60% de peso ao ar (seca imediata a combustíveis finos)
    // e 40% ao solo (seca a longo prazo/combustíveis pesados)
    const baseRisk = (0.6 * vpdFactor) + (0.4 * soilFactor);

    // 4. Multiplicador de Propagação (Vento)
    // Vento acelera o fogo de forma não-linear.
    // Vento a 0 km/h = x1. Vento a ~35 km/h = duplica o risco (x2).
    const windMultiplier = 1 + Math.pow(Math.max(0, windKmH) / 35, 1.2);

    // 5. Aplicar o multiplicador e garantir que não passa de 1.0 (100%)
    const finalRisk = baseRisk * windMultiplier;

    return Math.min(finalRisk, 1.0);
};

const interpolateColor = (val, mode) => {
    const stops = COLOR_STOPS[mode];
    if (!stops) return [255, 255, 255];

    if (val <= stops[0].v) return stops[0].c;

    const lastStop = stops[stops.length - 1];
    if (val >= lastStop.v) return lastStop.c;

    for (let i = 0; i < stops.length - 1; i++) {
        if (val >= stops[i].v && val <= stops[i+1].v) {
            const range = stops[i+1].v - stops[i].v;
            const percent = (val - stops[i].v) / range;
            const c1 = stops[i].c;
            const c2 = stops[i+1].c;

            return c1.map((c, idx) => Math.round(c + (c2[idx] - c) * percent));
        }
    }
    return [0, 0, 0];
};

// --- Custom Leaflet Layer ---
const IDWCanvasLayer = L.Layer.extend({
    initialize: function (options) {
        L.setOptions(this, options);
    },
    onAdd: function (map) {
        this._map = map;
        this._canvas = L.DomUtil.create('canvas', 'leaflet-idw-layer');
        Object.assign(this._canvas.style, {
            position: 'absolute',
            pointerEvents: 'none',
            opacity: '0.7',
            filter: 'blur(8px)'
        });

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
        this.initDOM();
        this.state = {
            mapInstance: null,
            markerLayer: null,
            customCanvasLayer: null,
            currentFeatures: []
        };
        this.initListeners();
    }

    initDOM() {
        this.elements = {
            container: document.getElementById('map-view'),
            navItem: document.getElementById('nav-map'),
            layerSelect: document.getElementById('heatmap-layer-select')
        };
    }

    initListeners() {
        eventBus.subscribe('view:changed', (viewName) => this.handleViewChange(viewName));

        eventBus.subscribe('map:center-on', (data) => {
            if (this.state.mapInstance) {
                this.elements.container.parentElement.classList.remove('d-none');
                this.elements.navItem.classList.add('active');
                this.state.mapInstance.setView([data.latitude, data.longitude], data.zoom || 15);
            }
        });

        this.elements.layerSelect?.addEventListener('change', () => {
            this.state.customCanvasLayer?.redraw();
        });
    }

    handleViewChange(viewName) {
        const isMapView = viewName === 'map';
        this.elements.container.parentElement.classList.toggle('d-none', !isMapView);
        this.elements.navItem.classList.toggle('active', isMapView);

        if (isMapView) {
            this.initMap();
        }
    }

    initMap() {
        if (this.state.mapInstance) {
            this.state.mapInstance.invalidateSize();
            return;
        }

        this.state.mapInstance = L.map(this.elements.container.id).setView([39.833333, -8.933333], 13);

        L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
            maxZoom: 20,
            attribution: '&copy; Stadia Maps, &copy; OpenMapTiles &copy; OpenStreetMap contributors'
        }).addTo(this.state.mapInstance);

        this.state.customCanvasLayer = new IDWCanvasLayer({
            onDraw: (ctx, width, height) => this.drawPixelsOnCanvas(ctx, width, height)
        }).addTo(this.state.mapInstance);

        this.state.markerLayer = L.layerGroup().addTo(this.state.mapInstance);

        this.state.mapInstance.on('moveend', () => this.fetchNodesInView());

        this.fetchNodesInView();
    }

    async fetchNodesInView() {
        const bounds = this.state.mapInstance.getBounds();
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
                this.state.currentFeatures = result.features;
                this.renderMarkers();
                this.state.customCanvasLayer.redraw();
            }
        } catch (error) {
            console.error('Map data fetch failed:', error.message);
        }
    }

    drawPixelsOnCanvas(ctx, width, height) {
        ctx.clearRect(0, 0, width, height);

        const mode = this.elements.layerSelect?.value;
        if (!mode || mode === 'none' || this.state.currentFeatures.length === 0) return;

        const cutoffMeters = 2500; // Raio Real (Ex: 2500 metros = 2.5km)
        const map = this.state.mapInstance;

        const center = map.getCenter();
        const centerPt = map.latLngToContainerPoint(center);
        const testPt = L.point(centerPt.x + 100, centerPt.y);
        const testLatLng = map.containerPointToLatLng(testPt);

        const metersPer100Px = center.distanceTo(testLatLng);
        const pixelsPerMeter = 100 / metersPer100Px;

        const cellSize = 4; // Tamanho da célula em pixels
        const maxDist = Math.max(cutoffMeters * pixelsPerMeter, cellSize * 1.5);
        const fadeZone = maxDist * 0.45;

        const screenPoints = this.state.currentFeatures.map(f => {
            const { coordinates } = f.geometry;
            const props = f.properties;
            const pt = map.latLngToContainerPoint([coordinates[1], coordinates[0]]);

            const values = {
                temperature: props.temperature || 0,
                humidity: props.humidity || 0,
                wind: props.wind_speed || 0,
                risk: calculateFireRisk(props.temperature, props.humidity, props.wind_speed, props.soil_moisture)
            };

            return { x: pt.x, y: pt.y, value: values[mode] || 0 };
        });

        for (let x = 0; x < width; x += cellSize) {
            for (let y = 0; y < height; y += cellSize) {
                let num = 0, den = 0;
                let minDist = Infinity;

                for (let p of screenPoints) {
                    const dist = Math.hypot(p.x - x, p.y - y);
                    if (dist < minDist) minDist = dist;

                    if (dist < 1) {
                        num = p.value;
                        den = 1;
                        break;
                    }

                    const weight = 1 / (dist * dist);
                    num += p.value * weight;
                    den += weight;
                }

                if (minDist > maxDist) continue;

                const finalValue = num / den;
                const rgb = interpolateColor(finalValue, mode);

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
        this.state.markerLayer.clearLayers();

        this.state.currentFeatures.forEach(feature => {
            const props = feature.properties;
            const [lng, lat] = feature.geometry.coordinates;

            let statusClass = 'bg-secondary';
            let statusText = 'No Data';

            if (props.temperature != null) {
                if (props.temperature >= 35.0 && props.humidity <= 30.0) {
                    statusClass = 'bg-danger pulse-danger';
                    statusText = 'Fire Risk';
                } else if (props.vbat <= 3.3) {
                    statusClass = 'bg-warning pulse-warning';
                    statusText = 'Low Battery';
                } else {
                    statusClass = 'bg-success pulse-success';
                    statusText = 'Online';
                }
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

                    ${props.temperature != null ? `
                        <div class="small d-flex justify-content-between mb-1">
                            <span>🌡️ Temp:</span> <strong>${props.temperature}°C</strong>
                        </div>
                        <div class="small d-flex justify-content-between mb-1">
                            <span>💧 Hum:</span> <strong>${props.humidity}%</strong>
                        </div>
                        <div class="small d-flex justify-content-between mb-1">
                            <span>💨 Wind:</span> <strong>${props.wind_speed}m/s</strong>
                        </div>
                        <div class="small d-flex justify-content-between mb-2">
                            <span>🔋 Bat:</span> <strong>${props.vbat}V</strong>
                        </div>
                        <div class="small text-muted text-end" style="font-size: 0.7rem;">
                            ${new Date(props.last_update).toLocaleString()}
                        </div>
                    ` : '<div class="small text-muted text-center py-2">Awaiting first payload</div>'}

                    ${window.isAuthenticated ? `
                        <button class="btn btn-sm btn-outline-primary w-100 mt-2 btn-history" data-id="${props.node_id}">
                            Manage
                        </button>
                    ` : ''}
                </div>
            `;

            const marker = L.marker([lat, lng], { icon })
                .bindPopup(popupContent)
                .addTo(this.state.markerLayer);

            marker.on('popupopen', (e) => {
                const btn = e.popup._contentNode.querySelector('.btn-history');
                if (btn) {
                    btn.addEventListener('click', () => {
                        eventBus.publish('node:history:requested', props.node_id);
                    });
                }
            });
        });
    }
}
