export async function fetchMapData(bounds) {
    // Usamos o try/catch para lidar com erros de rede de forma limpa
    try {
        const response = await fetch(`/api/map-data?north=${bounds.north}&south=${bounds.south}&east=${bounds.east}&west=${bounds.west}`);
        if (!response.ok) throw new Error('Failed to fetch map data');
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
}