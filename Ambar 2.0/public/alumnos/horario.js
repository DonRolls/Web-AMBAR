document.addEventListener("DOMContentLoaded", async () => {
    const nctrl = sessionStorage.getItem("N_ctrl");
    const tableBody = document.getElementById("horario-tbody");
    const periodoText = document.getElementById("periodo-text");
 
    const dias = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
    const colores = ["pink", "purple", "green", "salmon", "yellow"];
 
    // Color consistente por materia
    const colorMap = {};
    let colorIdx = 0;
    function getColor(materia) {
        if (!colorMap[materia]) {
            colorMap[materia] = colores[colorIdx % colores.length];
            colorIdx++;
        }
        return colorMap[materia];
    }
 
    const toMinutes = h => { const [hh, mm] = h.split(":").map(Number); return hh * 60 + mm; };
    const toHHMM = m => `${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`;
 
    try {
        // 1. Periodo activo para el encabezado
        const resPeriodos = await fetch("/periodos");
        const periodos = await resPeriodos.json();
        const periodoActivo = periodos.find(p => p.Activo);
        periodoText.textContent = periodoActivo ? `Periodo: ${periodoActivo.Nombre}` : "Sin periodo activo";
 
        // 2. Horario del alumno
        const res = await fetch(`/horario/${nctrl}`);
        const data = await res.json();
 
        if (!data || data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-2)">No tienes materias inscritas en el periodo actual.</td></tr>`;
            return;
        }
 
        // 3. Rango de horas dinámico desde datos reales
        const horaMin = Math.floor(Math.min(...data.map(c => toMinutes(c.HoraInicio))) / 60) * 60;
        const horaMax = Math.ceil( Math.max(...data.map(c => toMinutes(c.HoraFin)))    / 60) * 60;
        const horas = [];
        for (let m = horaMin; m < horaMax; m += 60) horas.push(toHHMM(m));
 
        // 4. Construir tabla
        tableBody.innerHTML = "";
        horas.forEach(hora => {
            const tr = document.createElement("tr");
            tr.innerHTML = `<td class="hora-cell">${hora}</td>`;
 
            dias.forEach(dia => {
                const td = document.createElement("td");
                // DiaSemana y HoraInicio/HoraFin vienen del backend como strings "HH:MM"
                const clase = data.find(c => {
                    const diaOk   = c.DiaSemana.trim() === dia;
                    const slotMin = toMinutes(hora);
                    return diaOk && slotMin >= toMinutes(c.HoraInicio) && slotMin < toMinutes(c.HoraFin);
                });
 
                if (clase) {
                    const color = getColor(clase.Materia);
                    td.innerHTML = `
                        <div class="materia ${color}">
                            <strong>${clase.Materia}</strong>
                            ${clase.Docente ? `<span style="font-size:10.5px;opacity:.85">${clase.Docente}</span>` : ""}
                            <span class="room">${clase.Aula || "—"}</span>
                            <span style="font-size:10px;opacity:.7;display:block">${clase.HoraInicio}–${clase.HoraFin}</span>
                        </div>`;
                } else {
                    td.className = "empty-cell";
                }
                tr.appendChild(td);
            });
 
            tableBody.appendChild(tr);
        });
 
    } catch (err) {
        console.error("Error al cargar horario:", err);
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:red">Error al conectar con el servidor.</td></tr>`;
    }
});