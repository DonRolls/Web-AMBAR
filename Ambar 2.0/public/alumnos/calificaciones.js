document.addEventListener("DOMContentLoaded", async () => {
    const nctrl = sessionStorage.getItem("N_ctrl");
    if (!nctrl) { window.location.href = "/login.html"; return; }
 
    const selectPeriodo = document.querySelector(".periodo-wrap select");
    const mainContainer = document.querySelector(".main");
    const btnDescargar = document.querySelector(".btn-dl");
 
    // 1. CARGAR PERIODOS AL INICIAR
    try {
        const res = await fetch("http://localhost:3000/periodos");
        const periodos = await res.json();
        
        selectPeriodo.innerHTML = '<option value="">Seleccione periodo</option>';
        periodos.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.ID_Periodo;
            opt.textContent = p.Nombre + (p.Activo ? " (Actual)" : "");
            selectPeriodo.appendChild(opt);
        });
    } catch (err) { console.error("Error cargando periodos:", err); }
 
    // 2. ESCUCHAR CAMBIO DE PERIODO
    selectPeriodo.addEventListener("change", async () => {
        const idPeriodo = selectPeriodo.value;
        if (!idPeriodo) return;
 
        // Limpiar materias anteriores (manteniendo el encabezado y el selector)
        document.querySelectorAll(".acc-item").forEach(el => el.remove());
 
        try {
            const res = await fetch(`http://localhost:3000/calificaciones/${nctrl}/${idPeriodo}`);
            const materias = await res.json();
 
            if (materias.length === 0) {
                const aviso = document.createElement("p");
                aviso.className = "acc-item";
                aviso.style.padding = "20px";
                aviso.textContent = "No hay calificaciones registradas para este periodo.";
                mainContainer.appendChild(aviso);
                return;
            }
 
            materias.forEach(m => {
                const badgeClass = m.CalFinal >= 70 ? "cal-ok" : (m.CalFinal === 0 ? "cal-nc" : "cal-re");
                const estatusText = m.CalFinal >= 70 ? "AC" : (m.CalFinal === 0 ? "NC" : "RE");
 
                const htmlMateria = `
                    <div class="acc-item">
                        <div class="acc-header" onclick="toggleAcc(this)">
                            <span class="acc-header-title">${m.Materia}</span>
                            <span class="chevron">▾</span>
                        </div>
                        <div class="acc-body">
                            <div class="sub-title">📊 Datos Generales</div>
                            <div class="datos-grid">
                                <div>Materia: <span>${m.Materia}</span></div>
                                <div>Docente: <span>${m.Docente || 'POR ASIGNAR'}</span></div>
                                <div>Créditos: <span>${m.Creditos}</span></div>
                                <div>Grupo: <span>${m.ID_Grupo}</span></div>
                                <div>Clave: <span>${m.Clave}</span></div>
                            </div>
                            <hr class="divider">
                            <div class="sub-title">📈 Calificación Final</div>
                            <div class="cal-label">Promedio Final</div>
                            <span class="cal-badge ${badgeClass}">${m.CalFinal} — ${estatusText}</span>
                        </div>
                    </div>`;
                mainContainer.insertAdjacentHTML('beforeend', htmlMateria);
            });
 
        } catch (err) { console.error("Error al obtener calificaciones:", err); }
    });
 
    // 3. LOGOUT (Reutilizando lógica)
    document.querySelector(".logout-btn").addEventListener("click", () => {
        sessionStorage.clear();
        window.location.href = "/login.html";
    });
});
 
// Función global para los nuevos elementos creados dinámicamente
function toggleAcc(header) {
    const body = header.nextElementSibling;
    const chev = header.querySelector('.chevron');
    const isOpen = body.classList.contains('open');
    
    // Cerrar otros si quieres comportamiento de acordeón único (opcional)
    // document.querySelectorAll('.acc-body').forEach(b => b.classList.remove('open'));
 
    body.classList.toggle('open', !isOpen);
    header.classList.toggle('open', !isOpen);
    chev.classList.toggle('open', !isOpen);
}