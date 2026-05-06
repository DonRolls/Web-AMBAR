document.addEventListener("DOMContentLoaded", () => {
    const nctrl = localStorage.getItem("N_ctrl");
    if (!nctrl) {
        window.location.href = "login.html";
        return;
    }

    // Inicialización
    cargarTickets("ABIERTO");

    // Cerrar sesión
    document.querySelector(".logout-btn")?.addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "login.html";
    });

    // Evento para el botón de Generar Ticket
    document.querySelector(".btn-generar").addEventListener("click", crearTicket);

    // Eventos para Tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            cargarTickets(this.dataset.estatus);
        });
    });
});

async function cargarTickets(estatus) {
    const nctrl = localStorage.getItem("N_ctrl");
    const tbody = document.getElementById("tabla-body");
    const countEl = document.getElementById("ticket-count");
    
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px;">Cargando tickets...</td></tr>';

    try {
        const res = await fetch(`http://localhost:3000/tickets/${nctrl}?estatus=${estatus}`);
        const tickets = await res.json();

        if (tickets.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="padding:40px;text-align:center;color:var(--text-2);font-style:italic">No hay tickets ${estatus.toLowerCase()}s en este momento</td></tr>`;
            countEl.textContent = "Mostrando 0 tickets";
            return;
        }

        tbody.innerHTML = "";
        countEl.textContent = `Mostrando ${tickets.length} ticket(s)`;

        tickets.forEach(t => {
            // Formatear fecha
            const fecha = new Date(t.Fecha).toLocaleDateString('es-MX', {
                day: '2-digit', month: '2-digit', year: 'numeric'
            });

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${fecha}</td>
                <td><code style="background:#f4f4f4; padding:2px 5px; border-radius:4px; font-weight:700">${t.Clave}</code></td>
                <td style="color:var(--navy); font-weight:500">${t.Descripcion}</td>
                <td><span class="badge-${t.Estatus.toLowerCase()}">${t.Estatus}</span></td>
                <td style="text-align:center">${t.Estatus === 'ABIERTO' ? '<button title="Editar" style="background:none; border:none; cursor:pointer; font-size:16px">📝</button>' : '-'}</td>
                <td style="font-size:12px; line-height:1.4">${t.Comentario || '<span style="opacity:0.5">Sin respuesta del administrador</span>'}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Error:", err);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red; padding:30px;">Error al conectar con el servidor</td></tr>';
    }
}

async function crearTicket() {
    const descripcion = prompt("Describa el problema o consulta técnica que desea reportar:");
    if (!descripcion || descripcion.trim() === "") return;

    const nctrl = localStorage.getItem("N_ctrl");

    try {
        const res = await fetch("http://localhost:3000/tickets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ N_ctrl: nctrl, descripcion: descripcion.trim() })
        });

        if (res.ok) {
            alert("Su ticket ha sido generado correctamente y será revisado pronto.");
            // Recargar la pestaña de abiertos
            document.querySelector('.tab[data-estatus="ABIERTO"]').click();
        } else {
            throw new Error();
        }
    } catch (err) {
        alert("Error al intentar generar el ticket. Por favor, intente más tarde.");
    }
}