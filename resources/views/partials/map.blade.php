<div class="w-100 h-100 position-relative">
    <div id="map-view" class="w-100 h-100"></div>

    <div id="map-controls" class="position-absolute top-0 end-0 m-3 p-2 bg-dark border border-secondary rounded shadow" style="z-index: 1000; width: 220px;">
        <label for="heatmap-layer-select" class="form-label small text-secondary mb-1">Interpolation Layer</label>
        <select class="form-select form-select-sm bg-dark text-light border-secondary" id="heatmap-layer-select">
            <option value="none">Points Only (Beacons)</option>
            <option value="temperature" selected>🌡️ Temperature</option>
            <option value="humidity">💧 Humidity</option>
            <option value="wind">💨 Wind Speed</option>
            <option value="risk">🔥 Fire Risk Index</option>
        </select>
    </div>
</div>