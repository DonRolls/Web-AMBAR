document.addEventListener("DOMContentLoaded", async () => {
    const nctrl = localStorage.getItem("N_ctrl");
    if (!nctrl) return;

    try {
        const res = await fetch(`http://localhost:3000/actividades/${nctrl}`);
        const data = await res.json();

        // Mapeo de los contenedores en el HTML
        renderSeccion(document.querySelectorAll('.seccion')[0], data.complementarias, "actividades complementarias");
        renderSeccion(document.querySelectorAll('.seccion')[1], data.extraescolares, "actividades extraescolares");
        renderSeccion(document.querySelectorAll('.seccion')[2], data.tutorias, "tutorías");

    } catch (err) {
        console.error("Error al cargar histórico de actividades:", err);
    }
});

function renderSeccion(contenedor, items, nombreSeccion) {
    // Si no hay datos, mantenemos el mensaje original
    if (!items || items.length === 0) return;

    // Si hay datos, generamos una tabla simple para mostrarlos
    let html = `
        <div class="seccion-titulo">${contenedor.querySelector('.seccion-titulo').innerHTML}</div>
        <table style="width:100%; border-collapse: collapse; font-size: 13px; margin-top: 10px;">
            <thead>
                <tr style="text-align: left; color: var(--text-2); border-bottom: 1px solid var(--border);">
                    <th style="padding: 8px;">Descripción / Observación</th>
                    <th style="padding: 8px;">Fecha</th>
                    <th style="padding: 8px;">${items[0].Horas ? 'Horas' : 'Docente'}</th>
                </tr>
            </thead>
            <tbody>
    `;

    items.forEach(item => {
        html += `
            <tr style="border-bottom: 1px solid #f1f5fb;">
                <td style="padding: 10px 8px;">${item.Descripcion || item.Observaciones}</td>
                <td style="padding: 10px 8px;">${new Date(item.Fecha).toLocaleDateString()}</td>
                <td style="padding: 10px 8px;">${item.Horas || item.Docente}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    contenedor.innerHTML = html;
}