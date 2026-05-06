document.addEventListener("DOMContentLoaded", () => {
    cargarTickets("ABIERTO"); // Carga inicial

    // Evento para el botón de Generar Ticket
    document.querySelector(".btn-generar").addEventListener("click", crearTicket);
});

async function cargarTickets(estatus) {
    const nctrl = localStorage.getItem("N_ctrl");
    const tbody = document.getElementById("tabla-body");
    
    tbody.innerHTML = '<tr><td colspan="6">Cargando tickets...</td></tr>';

    try {
        const res = await fetch(`http://localhost:3000/tickets/${nctrl}?estatus=${estatus}`);
        const tickets = await res.json();

        if (tickets.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="padding:28px;font-style:italic">No hay tickets ${estatus.toLowerCase()}s</td></tr>`;
            return;
        }

        tbody.innerHTML = "";
        tickets.forEach(t => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td style="text-align:left">${t.Fecha}</td>
                <td><strong>${t.Clave}</strong></td>
                <td style="text-align:left">${t.Descripcion}</td>
                <td><span class="badge-${t.Estatus.toLowerCase()}">${t.Estatus}</span></td>
                <td>${t.Estatus === 'ABIERTO' ? '📝' : '-'}</td>
                <td style="text-align:left">${t.Comentario || 'Sin comentarios aún'}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Error:", err);
    }
}

// Función para cambiar de pestaña
function switchTab(el) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    const estatus = el.innerText.toUpperCase() === "ABIERTOS" ? "ABIERTO" : "FINALIZADO";
    cargarTickets(estatus);
}

async function crearTicket() {
    const descripcion = prompt("Describe el problema o duda técnica:");
    if (!descripcion) return;

    const nctrl = localStorage.getItem("N_ctrl");

    try {
        const res = await fetch("http://localhost:3000/tickets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ N_ctrl: nctrl, descripcion })
        });

        if (res.ok) {
            alert("Ticket generado con éxito");
            cargarTickets("ABIERTO");
        }
    } catch (err) {
        alert("Error al crear ticket");
    }
}