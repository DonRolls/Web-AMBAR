document.addEventListener("DOMContentLoaded", async () => {
    // 1. VERIFICACIÓN DE SESIÓN
    const sess = getSession();
    if (!sess) return;
    const nctrl = sess.N_ctrl;

    // 2. REFERENCIAS AL DOM
    const nombreEl = document.querySelector(".stu-nombre");
    const idEl = document.querySelector(".stu-id");
    const carreraEl = document.querySelector(".dept-value");
    const avisoEl = document.querySelector("#aviso-periodo");
    const avisoTexto = avisoEl.querySelector("span");
    const cargaContainer = document.getElementById("carga-container");
    const materiasBody = document.getElementById("materias-body");
    const btnLogout = document.querySelector(".logout-btn");
    const btnTicket = document.querySelector(".btn-ticket");
    const btnHorario = document.querySelector(".btn-horario");

    // 3. CARGAR DATOS DEL ALUMNO
    try {
        const resAlumno = await fetch(`/alumno/${nctrl}`);
        if (resAlumno.ok) {
            const alumno = await resAlumno.json();
            nombreEl.textContent = `${alumno.Nombre} ${alumno.Apellidos}`.toUpperCase();
            idEl.textContent = alumno.N_ctrl;
            carreraEl.textContent = alumno.Carrera.toUpperCase();
        }
    } catch (error) {
        console.error("Error al cargar datos del alumno:", error);
    }

    // 4. VERIFICAR PERIODO Y CARGAR MATERIAS
    try {
        const resPeriodo = await fetch("/periodo-carga");
        const { abierto } = await resPeriodo.json();
        
        if (abierto) {
            avisoEl.style.borderColor = "rgba(16, 185, 129, 0.5)"; 
            avisoEl.style.background = "#F0FDF4";
            avisoTexto.textContent = "✅ El periodo de carga está ABIERTO. Selecciona tus grupos abajo.";
            avisoTexto.style.color = "#15803D";
            
            cargarMateriasDisponibles();
        } else {
            avisoEl.style.borderColor = "rgba(245,158,11,.4)";
            avisoTexto.textContent = "ℹ️ Fuera de horario de carga de materias.";
            cargaContainer.style.display = "none";
        }
    } catch (error) {
        console.error("Error al verificar periodo:", error);
        avisoTexto.textContent = "❌ Error al verificar el periodo de carga.";
    }

    async function cargarMateriasDisponibles() {
        try {
            const res = await fetch(`/grupos-disponibles/${nctrl}`);
            const grupos = await res.json();
            
            if (!grupos.length) {
                materiasBody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-2)">No hay grupos disponibles para tu carrera en este momento.</td></tr>';
                cargaContainer.style.display = "block";
                return;
            }

            materiasBody.innerHTML = grupos.map(g => {
                const cupoFull = g.Inscritos >= g.MaxAlumnos;
                return `
                    <tr>
                        <td style="font-weight:700">${g.Clave}</td>
                        <td style="font-weight:600;color:var(--navy)">${g.Materia}</td>
                        <td>${g.Docente}</td>
                        <td style="font-size:11px">${g.Horario || '—'}</td>
                        <td>${g.Aula}</td>
                        <td>
                            <span class="badge-cupo ${cupoFull ? 'cupo-full' : 'cupo-ok'}">
                                ${g.Inscritos} / ${g.MaxAlumnos}
                            </span>
                        </td>
                        <td>
                            <button class="btn-ins" onclick="inscribir(${g.ID_Grupo}, '${g.Materia}')" ${cupoFull ? 'disabled' : ''}>
                                ${cupoFull ? 'Lleno' : 'Inscribir'}
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
            
            cargaContainer.style.display = "block";
        } catch (error) {
            console.error("Error al cargar materias:", error);
        }
    }

    // Función global para ser llamada desde el onclick
    window.inscribir = async (idGrupo, nombreMateria) => {
        if (!confirm(`¿Deseas inscribirte en la materia: ${nombreMateria}?`)) return;

        try {
            const res = await fetch("/inscribir", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ N_ctrl: nctrl, ID_Grupo: idGrupo })
            });
            const data = await res.json();
            
            if (data.success) {
                alert("¡Inscripción exitosa!");
                cargarMateriasDisponibles(); // Recargar lista
            } else {
                alert("Error: " + (data.mensaje || "No se pudo realizar la inscripción."));
            }
        } catch (error) {
            console.error("Error en inscripción:", error);
            alert("Error de conexión con el servidor.");
        }
    };

    // 5. EVENTOS
    btnLogout.addEventListener("click", () => {
        sessionStorage.clear();
        window.location.href = "../login.html";
    });

    btnTicket.addEventListener("click", () => {
        window.location.href = "tickets.html"; 
    });

    btnHorario.addEventListener("click", () => {
        window.location.href = "horario.html"; 
    });
});