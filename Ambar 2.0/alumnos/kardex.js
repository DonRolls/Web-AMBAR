document.addEventListener("DOMContentLoaded", async () => {
    const nctrl = localStorage.getItem("N_ctrl");
    if (!nctrl) { window.location.href = "login.html"; return; }

    // Referencias al DOM
    const nombreEl = document.querySelector(".stu-nombre");
    const idEl = document.querySelector(".stu-id");
    const especialidadEl = document.querySelector(".info-bar span:nth-child(1) strong");
    const semestreEl = document.querySelector(".info-bar span:nth-child(2) strong");
    const estatusEl = document.querySelector(".info-bar span:nth-child(3) strong");
    const creditosAcumEl = document.querySelector(".stats-bar span:nth-child(1) strong");
    const progresoFill = document.querySelector(".progress-fill");
    const progresoTexto = document.querySelector(".progress-label span:nth-child(2)");
    const kardexGrid = document.querySelector(".kardex-grid");

    const CREDITOS_TOTALES = 260; // Valor base del plan de estudios

    // 1. CARGAR INFORMACIÓN GENERAL Y ESTADÍSTICAS
    try {
        const res = await fetch(`http://localhost:3000/alumno/${nctrl}`);
        if (res.ok) {
            const a = await res.json();
            nombreEl.textContent = `${a.Nombre} ${a.Apellidos}`.toUpperCase();
            idEl.textContent = a.N_ctrl;
            especialidadEl.textContent = a.Especialidad || "TRONCO COMÚN";
            semestreEl.textContent = a.Semestre;
            estatusEl.textContent = a.Estatus.toUpperCase();
            
            // Cálculo de créditos y progreso
            // (Asumiendo que tu API devuelve los créditos acumulados o los calculamos del kardex)
            // Para este ejemplo, usaremos un valor dinámico si lo agregas a tu SP de alumno
        }
    } catch (err) { console.error("Error en info general:", err); }

    // 2. CARGAR MATERIAS DEL KÁRDEX
    try {
        const resKardex = await fetch(`http://localhost:3000/kardex/${nctrl}`);
        const materias = await resKardex.json();

        // Limpiamos el grid estático
        kardexGrid.innerHTML = "";

        let creditosAprobados = 0;

        materias.forEach(m => {
            // Determinar clase de color según estatus
            let statusClass = "pc"; // Por cursar (default)
            if (m.Estatus === "APROBADO") {
                statusClass = "ap";
                creditosAprobados += m.Creditos;
            } else if (m.Estatus === "REPROBADO") {
                statusClass = "re";
            } else if (m.Estatus === "CURSANDO") {
                statusClass = "ac"; // Carga actual
            }

            if (m.EsOptativa) statusClass += " op";

            const card = document.createElement("div");
            card.className = `mc ${statusClass}`;
            card.innerHTML = `
                <div class="clave">${m.Clave}</div>
                <div class="nombre">${m.Materia}</div>
                <div class="detalle">
                    ${m.CalFinal !== null ? `Cal: ${m.CalFinal} · ` : ""}Cr: ${m.Creditos}
                </div>
                ${m.EsOptativa ? '<div class="icon">★</div>' : ""}
            `;
            kardexGrid.appendChild(card);
        });

        // 3. ACTUALIZAR BARRA DE PROGRESO REAL
        creditosAcumEl.textContent = creditosAprobados;
        const porcentaje = ((creditosAprobados / CREDITOS_TOTALES) * 100).toFixed(2);
        progresoFill.style.width = `${porcentaje}%`;
        progresoTexto.textContent = `${porcentaje}%`;

    } catch (err) { console.error("Error al cargar kárdex:", err); }

    // Logout
    document.querySelector(".logout-btn").addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "login.html";
    });
});