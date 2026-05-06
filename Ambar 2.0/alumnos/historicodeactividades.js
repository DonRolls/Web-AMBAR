document.addEventListener("DOMContentLoaded", async () => {
    const nctrl = localStorage.getItem("N_ctrl");
    if (!nctrl) {
        window.location.href = "login.html";
        return;
    }

    // Botón cerrar sesión
    document.querySelector(".logout-btn")?.addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "login.html";
    });

    try {
        const res = await fetch(`http://localhost:3000/actividades/${nctrl}`);
        if (!res.ok) throw new Error("Error al obtener actividades");
        
        const data = await res.json();

        // Mapeo por ID de contenedor (más seguro que usar índices)
        renderSeccion(document.getElementById('sec-complementarias'), data.complementarias, "No cuenta con actividades complementarias registradas.");
        renderSeccion(document.getElementById('sec-extraescolares'), data.extraescolares, "No cuenta con actividades extraescolares registradas.");
        renderSeccion(document.getElementById('sec-tutorias'), data.tutorias, "No cuenta con tutorías registradas.");

    } catch (err) {
        console.error("Error al cargar histórico de actividades:", err);
        // En caso de error, mostrar mensaje en todas las secciones
        const mensajes = document.querySelectorAll('.seccion-mensaje');
        mensajes.forEach(m => m.textContent = "Error al conectar con el servidor.");
    }
});

function renderSeccion(contenedor, items, mensajeVacio) {
    if (!contenedor) return;

    // Si no hay datos, mostramos el mensaje de "vacío"
    if (!items || items.length === 0) {
        const tituloOriginal = contenedor.querySelector('.seccion-titulo').outerHTML;
        contenedor.innerHTML = `${tituloOriginal} <div class="seccion-mensaje">${mensajeVacio}</div>`;
        return;
    }

    // Guardamos el título (icono + texto) para no perderlo al reescribir el innerHTML
    const tituloHTML = contenedor.querySelector('.seccion-titulo').outerHTML;

    // Detectar si la columna 3 debe ser "Horas" (Complementarias/Extra) o "Docente" (Tutorías)
    const esTutoria = !items[0].hasOwnProperty('Horas');
    const headerCol3 = esTutoria ? 'Docente' : 'Horas';

    let html = `
        ${tituloHTML}
        <table class="tabla-actividades">
            <thead>
                <tr>
                    <th>Descripción / Observación</th>
                    <th>Fecha</th>
                    <th>${headerCol3}</th>
                </tr>
            </thead>
            <tbody>
    `;

    items.forEach(item => {
        const fechaFormateada = item.Fecha ? new Date(item.Fecha).toLocaleDateString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }) : '--/--/----';

        html += `
            <tr>
                <td><strong>${item.Descripcion || item.Observaciones || 'Sin descripción'}</strong></td>
                <td>${fechaFormateada}</td>
                <td>${esTutoria ? (item.Docente || 'N/A') : (item.Horas || '0')}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    contenedor.innerHTML = html;
}