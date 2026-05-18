document.addEventListener("DOMContentLoaded", async () => {
    const nctrl = sessionStorage.getItem("N_ctrl");
    if (!nctrl) {
        window.location.href = "/login.html";
        return;
    }

    // Botón cerrar sesión
    document.querySelector(".logout-btn")?.addEventListener("click", () => {
        sessionStorage.clear();
        window.location.href = "/login.html";
    });

    await cargarCatalogoDisponibles(nctrl);
    await cargarHistorico(nctrl);
});

async function cargarHistorico(nctrl) {
    try {
        const res = await fetch(`/actividades/${nctrl}`);
        if (!res.ok) throw new Error("Error al obtener actividades");
        
        const data = await res.json();

        renderSeccion(document.getElementById('sec-complementarias'), data.complementarias, "No cuenta con actividades complementarias registradas.");
        renderSeccion(document.getElementById('sec-extraescolares'), data.extraescolares, "No cuenta con actividades extraescolares registradas.");
        renderSeccion(document.getElementById('sec-tutorias'), data.tutorias, "No cuenta con tutorías registradas.");

    } catch (err) {
        console.error("Error al cargar histórico de actividades:", err);
        const mensajes = document.querySelectorAll('.seccion-mensaje:not(#msg-disponibles)');
        mensajes.forEach(m => m.textContent = "Error al conectar con el servidor.");
    }
}

async function cargarCatalogoDisponibles(nctrl) {
    const grid = document.getElementById("grid-disponibles");
    const msg = document.getElementById("msg-disponibles");
    if(!grid || !msg) return;
    
    try {
        const res = await fetch(`/actividades-disponibles/${nctrl}`);
        if (!res.ok) throw new Error("Error al obtener catálogo");
        const data = await res.json();
        
        if (data.length === 0) {
            msg.textContent = "No hay actividades disponibles o los periodos de inscripción están cerrados.";
            msg.style.display = "block";
            grid.innerHTML = "";
            return;
        }

        msg.style.display = "none";
        grid.innerHTML = "";
        
        data.forEach(act => {
            let badgeClass = "badge-comp";
            if (act.Tipo === "EXTRAESCOLAR") badgeClass = "badge-extra";
            else if (act.Tipo === "TUTORIA") badgeClass = "badge-tut";

            const fInicio = act.FechaInicio ? new Date(act.FechaInicio).toLocaleDateString('es-MX', { timeZone: 'UTC' }) : '';
            const fFin = act.FechaFin ? new Date(act.FechaFin).toLocaleDateString('es-MX', { timeZone: 'UTC' }) : '';

            const div = document.createElement("div");
            div.className = "act-card";
            div.innerHTML = `
                <div style="flex:1;">
                    <div class="act-title">${act.Titulo} <span class="badge-tipo ${badgeClass}" style="margin-left:6px;">${act.Tipo}</span></div>
                    <div class="act-desc">${act.Descripcion}</div>
                    <div class="act-meta">
                        <span>🗓️ ${fInicio} al ${fFin}</span>
                        <span>⭐️ ${act.Horas} Créditos</span>
                        <span>👥 Doc. ${act.DocenteNombre}</span>
                        <span>📊 Cupo: ${act.Inscritos}/${act.Cupo}</span>
                    </div>
                </div>
                <div style="margin-left:16px;">
                    <button class="btn-tomar" onclick="tomarActividad('${nctrl}', ${act.ID_Catalogo})">Tomar Actividad</button>
                </div>
            `;
            grid.appendChild(div);
        });

    } catch (err) {
        msg.textContent = "Error al conectar con el servidor para cargar las actividades disponibles.";
        msg.style.display = "block";
    }
}

async function tomarActividad(nctrl, idCatalogo) {
    if (!confirm("¿Seguro que deseas inscribirte en esta actividad?")) return;
    try {
        const res = await fetch("/tomar-actividad", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ N_ctrl: nctrl, ID_Catalogo: idCatalogo })
        });
        const result = await res.json();
        if (result.success) {
            alert("Inscripción exitosa");
            await cargarCatalogoDisponibles(nctrl);
            await cargarHistorico(nctrl);
        } else {
            alert("Error: " + result.error);
        }
    } catch(err) {
        alert("Ocurrió un error de conexión");
    }
}

function renderSeccion(contenedor, items, mensajeVacio) {
    if (!contenedor) return;

    if (!items || items.length === 0) {
        const tituloOriginal = contenedor.querySelector('.seccion-titulo').outerHTML;
        contenedor.innerHTML = `${tituloOriginal} <div class="seccion-mensaje">${mensajeVacio}</div>`;
        return;
    }

    const tituloHTML = contenedor.querySelector('.seccion-titulo').outerHTML;

    const esTutoria = !items[0].hasOwnProperty('Horas');
    const headerCol3 = esTutoria ? 'Docente' : 'Créditos';

    let html = `
        ${tituloHTML}
        <table class="tabla-actividades" style="width:100%; text-align:left; border-collapse:collapse; margin-top:10px;">
            <thead>
                <tr style="border-bottom:1px solid var(--border);">
                    <th style="padding:8px 0; font-size:12px; color:var(--text-2);">Descripción / Observación</th>
                    <th style="padding:8px 0; font-size:12px; color:var(--text-2);">Fecha</th>
                    <th style="padding:8px 0; font-size:12px; color:var(--text-2);">${headerCol3}</th>
                    <th style="padding:8px 0; font-size:12px; color:var(--text-2);">Estatus</th>
                </tr>
            </thead>
            <tbody>
    `;

    items.forEach(item => {
        const fechaFormateada = item.Fecha ? new Date(item.Fecha).toLocaleDateString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            timeZone: 'UTC'
        }) : '--/--/----';

        let estatusBadge = '';
        const est = (item.Estatus || 'PENDIENTE').toUpperCase();
        if (est === 'APROBADA') {
            estatusBadge = '<span style="background:#DCFCE7; color:#166534; padding:3px 9px; border-radius:12px; font-weight:700; font-size:11px; letter-spacing:0.5px;">APROBADA</span>';
        } else if (est === 'NO APROBADA' || est === 'REPROBADA') {
            estatusBadge = '<span style="background:#FEE2E2; color:#991B1B; padding:3px 9px; border-radius:12px; font-weight:700; font-size:11px; letter-spacing:0.5px;">NO APROBADA</span>';
        } else {
            estatusBadge = '<span style="background:#FEF3C7; color:#D97706; padding:3px 9px; border-radius:12px; font-weight:700; font-size:11px; letter-spacing:0.5px;">PENDIENTE</span>';
        }

        html += `
            <tr style="border-bottom:1px solid var(--border);">
                <td style="padding:10px 0; font-size:13px; font-weight:600; color:var(--navy);">${item.Descripcion || item.Observaciones || 'Sin descripción'}</td>
                <td style="padding:10px 0; font-size:13px; color:var(--text-2);">${fechaFormateada}</td>
                <td style="padding:10px 0; font-size:13px; color:var(--text-2);">${esTutoria ? (item.Docente || 'N/A') : (item.Horas || '0')}</td>
                <td style="padding:10px 0; font-size:13px;">${estatusBadge}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    contenedor.innerHTML = html;
}