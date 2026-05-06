document.addEventListener("DOMContentLoaded", () => {
    // Protección de sesión y logout
    const nctrl = sessionStorage.getItem("N_ctrl");
    if (!nctrl) {
        window.location.href = "/login.html";
        return;
    }
 
    document.querySelector(".logout-btn")?.addEventListener("click", () => {
        sessionStorage.clear();
        window.location.href = "/login.html";
    });
 
    cargarRecibos(); // Carga inicial
 
    const btnHist = document.querySelector(".btn-hist");
    let viendoHistorico = false;
 
    btnHist.addEventListener("click", () => {
        viendoHistorico = !viendoHistorico;
        btnHist.textContent = viendoHistorico ? "🔙 Ver Actuales" : "⟳ Ver Histórico";
        document.getElementById("table-title").innerHTML = viendoHistorico 
            ? '<div class="tc-icon">📚</div> Historial de Recibos' 
            : '<div class="tc-icon">🧾</div> Recibos actuales';
        
        cargarRecibos(viendoHistorico);
    });
});
 
async function cargarRecibos(historico = false) {
    const nctrl = sessionStorage.getItem("N_ctrl");
    const tbody = document.querySelector("#recibos-table tbody");
    
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:40px;">Cargando recibos...</td></tr>';
 
    try {
        const url = `http://localhost:3000/recibos/${nctrl}${historico ? '?historico=1' : ''}`;
        const res = await fetch(url);
        const recibos = await res.json();
 
        if (recibos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:40px;">No se encontraron registros.</td></tr>';
            return;
        }
 
        tbody.innerHTML = ""; 
 
        recibos.forEach(r => {
            // Formatear fechas de la DB (YYYY-MM-DD) a local (DD/MM/YYYY)
            const fEmision = new Date(r.FechaEmision).toLocaleDateString('es-MX');
            const fVigencia = new Date(r.FechaVigencia).toLocaleDateString('es-MX');
            
            const trData = document.createElement("tr");
            trData.innerHTML = `
                <td style="font-weight:500">${r.Descripcion}</td>
                <td>${fEmision}</td>
                <td>${fVigencia}</td>
                <td style="font-family:'Outfit',sans-serif;font-weight:700;color:var(--navy)">
                    $${parseFloat(r.Importe).toLocaleString('es-MX', {minimumFractionDigits: 2})}
                </td>
            `;
            
            const trEstado = document.createElement("tr");
            trEstado.className = "estado-row";
            
            // Determinar clase y texto del badge
            const isCubierto = r.Estatus.toUpperCase() === 'CUBIERTO';
            const badgeClass = isCubierto ? 'badge-cubierto' : 'badge-pendiente'; 
            const statusLabel = isCubierto ? '✓ CUBIERTO' : '● PENDIENTE';
 
            trEstado.innerHTML = `
                <td colspan="4">
                    <span class="${badgeClass}">${statusLabel}</span>
                </td>
            `;
 
            tbody.appendChild(trData);
            tbody.appendChild(trEstado);
        });
    } catch (err) {
        console.error("Error:", err);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:40px; color:red">Error al conectar con el servidor</td></tr>';
    }
}