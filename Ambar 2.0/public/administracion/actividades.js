let actividadesData = [];
let docentesData = [];

document.addEventListener("DOMContentLoaded", async () => {
    await cargarControles();
    await cargarDocentes();
    await cargarActividades();
});

const headers = {
    "Content-Type": "application/json",
    "x-admin-id": sessionStorage.getItem("ID_Administrador") || "1"
};

async function cargarControles() {
    try {
        const res = await fetch("/admin/control-actividades", { headers });
        const controles = await res.json();
        
        const grid = document.getElementById("control-grid");
        grid.innerHTML = "";
        
        if (controles.error) throw new Error(controles.error);

        controles.forEach(c => {
            const isAbierto = c.Activo === true;
            
            let badgeHtml = isAbierto 
                ? '<span class="status-badge status-open">ABIERTO</span>'
                : '<span class="status-badge status-closed">CERRADO</span>';
                
            let btnHtml = isAbierto
                ? `<button class="btn-danger" onclick="toggleControl('${c.Tipo}', false)">Cerrar Inscripciones</button>`
                : `<button class="btn-success" onclick="toggleControl('${c.Tipo}', true)">Abrir Inscripciones</button>`;

            const card = document.createElement("div");
            card.className = "control-card";
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                    <h3>${c.Tipo}</h3>
                    ${badgeHtml}
                </div>
                ${btnHtml}
            `;
            grid.appendChild(card);
        });
    } catch (err) {
        mostrarToast("Error al cargar controles", "error");
    }
}

async function toggleControl(tipo, activar) {
    try {
        const res = await fetch("/admin/control-actividades", {
            method: "POST",
            headers,
            body: JSON.stringify({ Tipo: tipo, Activo: activar })
        });
        const data = await res.json();
        if (data.ok) {
            mostrarToast("Estado actualizado correctamente", "success");
            cargarControles();
        } else {
            throw new Error(data.error);
        }
    } catch(err) {
        mostrarToast(err.message, "error");
    }
}

async function cargarDocentes() {
    try {
        const res = await fetch("/admin/docentes", { headers });
        docentesData = await res.json();
        const select = document.getElementById("id_docente");
        docentesData.forEach(d => {
            const opt = document.createElement("option");
            opt.value = d.ID_Docente;
            opt.textContent = `${d.Nombre} ${d.Apellidos}`;
            select.appendChild(opt);
        });
    } catch(err) {
        console.error("Error al cargar docentes", err);
    }
}

async function cargarActividades() {
    try {
        const res = await fetch("/admin/actividades", { headers });
        actividadesData = await res.json();
        renderActividades(actividadesData);
    } catch (err) {
        document.getElementById("tabla-body").innerHTML = `<tr><td colspan="7" class="loader">Error al cargar actividades</td></tr>`;
    }
}

function renderActividades(lista) {
    const tbody = document.getElementById("tabla-body");
    tbody.innerHTML = "";
    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:40px; color:var(--text-2);">No hay actividades registradas</td></tr>`;
        return;
    }

    lista.forEach(a => {
        let badgeClass = "badge-comp";
        if (a.Tipo === "EXTRAESCOLAR") badgeClass = "badge-extra";
        else if (a.Tipo === "TUTORIA") badgeClass = "badge-tut";

        const inicio = a.FechaInicio ? a.FechaInicio.split('T')[0] : '';
        const fin = a.FechaFin ? a.FechaFin.split('T')[0] : '';

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="font-weight:600;">#${a.ID_Catalogo}</td>
            <td>
                <div style="font-weight:600; color:var(--navy);">${a.Titulo}</div>
                <div style="font-size:11px; color:var(--text-2); margin-top:2px; max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${a.Descripcion}">${a.Descripcion}</div>
            </td>
            <td><span class="badge ${badgeClass}">${a.Tipo}</span></td>
            <td><div style="font-size:12px;">${inicio}<br><span style="color:var(--text-2)">al</span> ${fin}</div></td>
            <td>${a.Horas} Cred. / Cap: ${a.Cupo}</td>
            <td style="font-size:12px;">${a.DocenteNombre}</td>
            <td>
                <button class="btn-success" style="padding:5px 10px; font-size:12px; margin-right:4px;" onclick="verInscritos(${a.ID_Catalogo}, '${a.Titulo.replace(/'/g, "\\'")}', '${a.Tipo}')">Alumnos</button>
                <button class="btn-edit" onclick='abrirModalEditar(${JSON.stringify(a)})'>Editar</button>
                <button class="btn-delete" onclick="eliminarActividad(${a.ID_Catalogo})">Eliminar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarActividades() {
    const q = document.getElementById("busqueda").value.toLowerCase();
    const filtrado = actividadesData.filter(a => 
        (a.Titulo || '').toLowerCase().includes(q) ||
        (a.Tipo || '').toLowerCase().includes(q) ||
        (a.DocenteNombre || '').toLowerCase().includes(q)
    );
    renderActividades(filtrado);
}

function toggleDocente() {
    const tipo = document.getElementById("tipo").value;
    const group = document.getElementById("group-docente");
    const input = document.getElementById("id_docente");
    if (tipo === "TUTORIA") {
        group.style.display = "block";
        input.required = true;
    } else {
        group.style.display = "none";
        input.required = false;
        input.value = "";
    }
}

function abrirModalNuevo() {
    document.getElementById("form-actividad").reset();
    document.getElementById("id_catalogo").value = "";
    document.getElementById("modal-title").textContent = "Nueva Actividad";
    toggleDocente();
    document.getElementById("modal-actividad").classList.add("open");
}

function abrirModalEditar(a) {
    document.getElementById("form-actividad").reset();
    document.getElementById("id_catalogo").value = a.ID_Catalogo;
    document.getElementById("titulo").value = a.Titulo;
    document.getElementById("descripcion").value = a.Descripcion;
    document.getElementById("tipo").value = a.Tipo;
    document.getElementById("fecha_inicio").value = a.FechaInicio ? a.FechaInicio.split('T')[0] : '';
    document.getElementById("fecha_fin").value = a.FechaFin ? a.FechaFin.split('T')[0] : '';
    document.getElementById("horas").value = a.Horas;
    document.getElementById("cupo").value = a.Cupo;
    
    toggleDocente();
    if (a.Tipo === "TUTORIA" && a.ID_Docente) {
        document.getElementById("id_docente").value = a.ID_Docente;
    }

    document.getElementById("modal-title").textContent = "Editar Actividad";
    document.getElementById("modal-actividad").classList.add("open");
}

function cerrarModal() {
    document.getElementById("modal-actividad").classList.remove("open");
}

async function guardarActividad(e) {
    e.preventDefault();
    const id = document.getElementById("id_catalogo").value;
    
    const body = {
        Titulo: document.getElementById("titulo").value,
        Descripcion: document.getElementById("descripcion").value,
        Tipo: document.getElementById("tipo").value,
        FechaInicio: document.getElementById("fecha_inicio").value,
        FechaFin: document.getElementById("fecha_fin").value,
        Horas: parseInt(document.getElementById("horas").value) || 0,
        Cupo: parseInt(document.getElementById("cupo").value) || 30
    };

    if (body.Tipo === "TUTORIA") {
        body.ID_Docente = parseInt(document.getElementById("id_docente").value);
    }

    const method = id ? "PUT" : "POST";
    const url = id ? `/admin/actividades/${id}` : `/admin/actividades`;

    try {
        const res = await fetch(url, {
            method,
            headers,
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (data.ok) {
            mostrarToast("Actividad guardada exitosamente", "success");
            cerrarModal();
            cargarActividades();
        } else {
            throw new Error(data.error || "Error al guardar");
        }
    } catch(err) {
        mostrarToast(err.message, "error");
    }
}

async function eliminarActividad(id) {
    if (!confirm("¿Eliminar esta actividad?")) return;
    try {
        const res = await fetch(`/admin/actividades/${id}`, { method: "DELETE", headers });
        const data = await res.json();
        if (data.ok) {
            mostrarToast("Actividad eliminada", "success");
            cargarActividades();
        } else {
            throw new Error(data.error);
        }
    } catch(err) {
        mostrarToast(err.message, "error");
    }
}

let toastTimeout;
function mostrarToast(msg, tipo="success") {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.className = "toast show " + tipo;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        t.className = "toast " + tipo;
    }, 3000);
}

// ─── GESTIÓN DE ALUMNOS INSCRITOS Y APROBACIÓN ────────────────────────────────
async function verInscritos(idCatalogo, titulo, tipo) {
    const modal = document.getElementById("modal-inscritos");
    const title = document.getElementById("modal-inscritos-title");
    const desc = document.getElementById("modal-inscritos-desc");
    const tbody = document.getElementById("tabla-inscritos-body");

    title.textContent = `Alumnos Inscritos: ${titulo}`;
    desc.textContent = `Lista de alumnos inscritos en esta actividad (${tipo}). Selecciona su estatus de aprobación para guardarlo automáticamente.`;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:15px; color:var(--text-2);">Cargando alumnos...</td></tr>';

    modal.classList.add("open");

    try {
        const aid = sessionStorage.getItem("ID_Administrador");
        const res = await fetch(`/admin/actividades/${idCatalogo}/inscritos`, {
            headers: { "x-admin-id": aid }
        });
        if (!res.ok) throw new Error("Error al cargar los inscritos");
        const alumnos = await res.json();

        if (alumnos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:var(--text-2);">No hay alumnos inscritos en esta actividad.</td></tr>';
            return;
        }

        tbody.innerHTML = "";
        alumnos.forEach(al => {
            const tr = document.createElement("tr");
            const est = (al.Estatus || "PENDIENTE").toUpperCase();
            const classVal = est.replace(" ", "_");

            tr.innerHTML = `
                <td style="font-weight:600;">${al.N_ctrl}</td>
                <td>${al.NombreCompleto}</td>
                <td>${al.Carrera}</td>
                <td>${al.Semestre}° Sem.</td>
                <td>
                    <select onchange="guardarEstatusAlumno('${tipo}', ${al.ID_Registro}, this.value, this)" class="estatus-select ${classVal}">
                        <option value="PENDIENTE" ${est === "PENDIENTE" ? "selected" : ""}>Pendiente</option>
                        <option value="APROBADA" ${est === "APROBADA" ? "selected" : ""}>Aprobada</option>
                        <option value="NO APROBADA" ${est === "NO APROBADA" ? "selected" : ""}>No Aprobada</option>
                    </select>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch(err) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:var(--danger);">${err.message}</td></tr>`;
    }
}

function cerrarModalInscritos() {
    document.getElementById("modal-inscritos").classList.remove("open");
}

async function guardarEstatusAlumno(tipo, idRegistro, estatus, selectElement) {
    try {
        // Actualizar clase del select inmediatamente para feedback visual
        const classVal = estatus.replace(" ", "_");
        selectElement.className = `estatus-select ${classVal}`;

        const aid = sessionStorage.getItem("ID_Administrador");
        const res = await fetch("/admin/actividades/alumno-status", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-admin-id": aid
            },
            body: JSON.stringify({ Tipo: tipo, ID_Registro: idRegistro, Estatus: estatus })
        });
        if (!res.ok) throw new Error("No se pudo guardar el estatus");
        mostrarToast("Estatus de actividad actualizado con éxito");
    } catch(err) {
        mostrarToast(err.message, "error");
    }
}
