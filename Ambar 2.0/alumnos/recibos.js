document.addEventListener("DOMContentLoaded", () => {
    cargarRecibos(); // Carga inicial (pendientes/cubiertos)

    // Evento para el botón de Histórico
    const btnHist = document.querySelector(".btn-hist");
    let viendoHistorico = false;

    btnHist.addEventListener("click", () => {
        viendoHistorico = !viendoHistorico;
        btnHist.textContent = viendoHistorico ? "🔙 Ver Actuales" : "⟳ Ver Histórico";
        document.querySelector(".tc-title").innerHTML = viendoHistorico 
            ? '<div class="tc-icon">📚</div> Historial de Recibos' 
            : '<div class="tc-icon">🧾</div> Recibos actuales';
        
        cargarRecibos(viendoHistorico);
    });
});

async function cargarRecibos(historico = false) {
    const nctrl = localStorage.getItem("N_ctrl");
    const tbody = document.querySelector("table tbody");
    
    // Limpiar tabla y mostrar cargando
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">Cargando recibos...</td></tr>';

    try {
        const url = `http://localhost:3000/recibos/${nctrl}${historico ? '?historico=1' : ''}`;
        const res = await fetch(url);
        const recibos = await res.json();

        if (recibos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">No se encontraron registros.</td></tr>';
            return;
        }

        tbody.innerHTML = ""; // Limpiar mensaje de carga
        recibos.forEach(r => {
            const trData = document.createElement("tr");
            trData.innerHTML = `
                <td>${r.Descripcion}</td>
                <td>${r.FechaEmision}</td>
                <td>${r.FechaVigencia}</td>
                <td style="font-family:'Outfit',sans-serif;font-weight:700;color:var(--navy)">
                    $${parseFloat(r.Importe).toLocaleString('es-MX', {minimumFractionDigits: 2})}
                </td>
            `;
            
            const trEstado = document.createElement("tr");
            trEstado.className = "estado-row";
            const badgeClass = r.Estatus === 'CUBIERTO' ? 'badge-cubierto' : 'badge-pendiente'; 
            // Nota: Puedes agregar .badge-pendiente a tu CSS con color naranja
            trEstado.innerHTML = `
                <td colspan="4">
                    <span class="${badgeClass}">${r.Estatus === 'CUBIERTO' ? '✓ CUBIERTO' : '● PENDIENTE'}</span>
                </td>
            `;

            tbody.appendChild(trData);
            tbody.appendChild(trEstado);
        });
    } catch (err) {
        console.error("Error:", err);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red">Error al conectar con el servidor</td></tr>';
    }
}