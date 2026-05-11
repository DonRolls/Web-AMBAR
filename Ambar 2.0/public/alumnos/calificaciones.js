document.addEventListener("DOMContentLoaded", async () => {
    const nctrl = sessionStorage.getItem("N_ctrl");
    if (!nctrl) { window.location.href = "../login.html"; return; }

    const selectPeriodo = document.getElementById("selectPeriodo");
    const materiasContainer = document.getElementById("materias-container");

    // 1. CARGAR PERIODOS
    try {
        const res = await fetch("/periodos");
        const periodos = await res.json();
        selectPeriodo.innerHTML = '<option value="">Seleccione periodo</option>';
        periodos.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.ID_Periodo;
            opt.textContent = p.Nombre + (p.Activo ? " (Actual)" : "");
            if (p.Activo) opt.selected = true; // auto-seleccionar el periodo activo
            selectPeriodo.appendChild(opt);
        });
        // Si hay periodo activo, cargar sus calificaciones automáticamente
        if (selectPeriodo.value) cargarCalificaciones(selectPeriodo.value);
    } catch (err) { console.error("Error cargando periodos:", err); }

    // 2. CAMBIO DE PERIODO
    selectPeriodo.addEventListener("change", () => {
        if (selectPeriodo.value) cargarCalificaciones(selectPeriodo.value);
    });

    // 3. LOGOUT
    document.querySelector(".logout-btn")?.addEventListener("click", () => {
        sessionStorage.clear();
        window.location.href = "../login.html";
    });

    async function cargarCalificaciones(idPeriodo) {
        materiasContainer.innerHTML = `
            <div style="padding:30px;text-align:center;color:var(--text-2)">Cargando calificaciones…</div>`;
        try {
            const res = await fetch(`/calificaciones/${nctrl}/${idPeriodo}`);
            const materias = await res.json();

            if (!materias.length) {
                materiasContainer.innerHTML = `
                    <div class="acc-item" style="padding:20px;text-align:center;color:var(--text-2);font-style:italic">
                        No hay calificaciones registradas para este periodo.
                    </div>`;
                return;
            }

            materiasContainer.innerHTML = materias.map((m, idx) => {
                // Determinar badge del promedio final
                const calFinal = m.CalFinal;
                const hasCal = calFinal !== null && calFinal !== undefined;
                
                const badgeClass = !hasCal ? "cal-nc"
                    : calFinal >= 70 ? "cal-ok" : "cal-re";
                const estatusText = !hasCal ? "EN CURSO"
                    : calFinal >= 70 ? "ACREDITADA" : "REPROBADA";
                const calTexto = hasCal ? parseFloat(calFinal).toFixed(2) : "—";

                // Unidades dinámicas según NumUnidades de la materia
                const numUnidades = m.NumUnidades || 3;
                const unidades = [m.Unidad1, m.Unidad2, m.Unidad3, m.Unidad4, m.Unidad5];

                const unidadesHTML = Array.from({ length: numUnidades }, (_, i) => {
                    const val = unidades[i];
                    const color = val === null || val === undefined ? "var(--text-2)"
                        : val >= 70 ? "#15803D" : "#B91C1C";
                    const bg = val === null || val === undefined ? "#F1F5FB"
                        : val >= 70 ? "#DCFCE7" : "#FEE2E2";
                    return `
                        <div style="display:flex;flex-direction:column;align-items:center;
                                    background:${bg};border-radius:10px;padding:10px 14px;
                                    min-width:72px;border:1px solid ${bg === '#F1F5FB' ? 'var(--border)' : 'transparent'}">
                            <span style="font-size:10px;font-weight:700;color:var(--text-2);
                                         text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">
                                Unidad ${i + 1}
                            </span>
                            <span style="font-size:18px;font-weight:800;color:${color};font-family:'Outfit',sans-serif">
                                ${val !== null && val !== undefined ? parseFloat(val).toFixed(1) : "—"}
                            </span>
                        </div>`;
                }).join('');

                // Horario de la materia
                const horarioHTML = m.Horario
                    ? `<hr class="divider">
                       <div class="sub-title">🕐 Horario</div>
                       <div style="font-size:13px;color:var(--text-2)">${m.Horario}</div>`
                    : '';

                return `
                <div class="acc-item" style="animation-delay:${idx * 0.06}s">
                    <div class="acc-header" onclick="toggleAcc(this)">
                        <div style="display:flex;align-items:center;gap:12px">
                            <span class="acc-header-title">${m.Materia}</span>
                            <span class="cal-badge ${badgeClass}" style="font-size:11px;padding:3px 10px">
                                ${calTexto} — ${estatusText}
                            </span>
                        </div>
                        <span class="chevron">▾</span>
                    </div>
                    <div class="acc-body">
                        <div class="sub-title">📊 Datos Generales</div>
                        <div class="datos-grid">
                            <div>Materia: <span>${m.Materia}</span></div>
                            <div>Docente: <span>${m.Docente || 'POR ASIGNAR'}</span></div>
                            <div>Créditos: <span>${m.Creditos}</span></div>
                            <div>Clave: <span>${m.Clave}</span></div>
                        </div>
                        <hr class="divider">
                        <div class="sub-title">📈 Evaluaciones por Unidad</div>
                        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px">
                            ${unidadesHTML}
                            <div style="display:flex;flex-direction:column;align-items:center;
                                        background:var(--navy);border-radius:10px;padding:10px 14px;
                                        min-width:72px;margin-left:8px">
                                <span style="font-size:10px;font-weight:700;color:rgba(255,255,255,.6);
                                             text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">
                                    Promedio
                                </span>
                                <span style="font-size:18px;font-weight:800;color:var(--gold);font-family:'Outfit',sans-serif">
                                    ${calTexto}
                                </span>
                            </div>
                        </div>
                        ${horarioHTML}
                    </div>
                </div>`;
            }).join('');

        } catch (err) {
            console.error("Error al obtener calificaciones:", err);
            materiasContainer.innerHTML = `
                <div class="acc-item" style="padding:20px;text-align:center;color:var(--danger)">
                    Error al conectar con el servidor.
                </div>`;
        }
    }
});

function toggleAcc(header) {
    const body = header.nextElementSibling;
    const chev = header.querySelector('.chevron');
    const isOpen = body.classList.contains('open');
    body.classList.toggle('open', !isOpen);
    header.classList.toggle('open', !isOpen);
    chev.classList.toggle('open', !isOpen);
}