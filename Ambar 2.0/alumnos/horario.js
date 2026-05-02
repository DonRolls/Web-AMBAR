document.addEventListener("DOMContentLoaded", async () => {
    const nctrl = localStorage.getItem("N_ctrl");
    const tableBody = document.querySelector(".horario-table tbody");

    // Definimos el rango de horas que queremos mostrar
    const horas = ["14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];
    // Mapeo de días para iterar la tabla
    const dias = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
    // Colores disponibles para las materias
    const colores = ["pink", "purple", "green", "salmon", "yellow"];

    try {
        // Asumiendo que crearás este endpoint o usarás uno existente
        const res = await fetch(`http://localhost:3000/horario/${nctrl}`);
        const data = await res.json(); 
        
        // Limpiar tabla
        tableBody.innerHTML = "";

        // Generar filas dinámicamente
        horas.forEach(hora => {
            const tr = document.createElement("tr");
            
            // Celda de la hora
            tr.innerHTML = `<td class="hora-cell">${hora}</td>`;

            // Celdas para cada día
            dias.forEach(dia => {
                const td = document.createElement("td");
                
                // Buscamos si hay una materia en esta hora y día
                const clase = data.find(c => c.Hora === hora && c.Dia === dia);

                if (clase) {
                    // Asignar un color basado en el nombre de la materia (consistencia)
                    const colorIndex = clase.Materia.length % colores.length;
                    const color = colores[colorIndex];

                    td.innerHTML = `
                        <div class="materia ${color}">
                            <strong>${clase.Materia}</strong>
                            Paquete: ${clase.Paquete || 'N/A'}
                            <span class="room">${clase.Aula}</span>
                        </div>
                    `;
                } else {
                    td.className = "empty-cell";
                }
                tr.appendChild(td);
            });

            tableBody.appendChild(tr);
        });

    } catch (err) {
        console.error("Error al cargar horario:", err);
    }
});