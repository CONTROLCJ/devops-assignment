// Health check polling
async function checkHealth() {
    const dot = document.getElementById('api-dot');
    const status = document.getElementById('api-status');
    const time = document.getElementById('api-time');

    try {
        const res = await fetch('/health');
        const data = await res.json();

        if (data.status === 'ok') {
            dot.className = 'status-dot status-healthy';
            status.textContent = 'Sağlıklı';
            status.className = 'metric-big healthy-text';
            time.textContent = 'Son kontrol: ' + new Date(data.timestamp).toLocaleTimeString('tr-TR');
        } else {
            throw new Error('unhealthy');
        }
    } catch (e) {
        dot.className = 'status-dot status-error';
        status.textContent = 'Erişilemez';
        status.className = 'metric-big';
        status.style.color = '#f87171';
        time.textContent = 'Bağlantı hatası';
    }
}

// Initial check + periodic polling
checkHealth();
setInterval(checkHealth, 10000);
