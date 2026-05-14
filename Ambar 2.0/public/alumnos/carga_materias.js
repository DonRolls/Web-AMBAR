document.addEventListener("DOMContentLoaded", async () => {
<<<<<<< HEAD
    // 1. VERIFICACIÓN DE SESIÓN
    const sess = getSession();
    if (!sess) return;
    const nctrl = sess.N_ctrl;

    // 2. REFERENCIAS AL DOM
=======
    const nctrl = sessionStorage.getItem("N_ctrl");
    if (!nctrl) return;

    // Elementos del DOM
>>>>>>> e5b595306e64134749175c59d9d4a9db60e7c6d3
    const nombreEl = document.querySelector(".stu-nombre");
    const idEl = document.querySelector(".stu-id");
    const carreraEl = document.querySelector(".dept-value");
    const avisoEl = document.querySelector("#aviso-periodo");
<<<<<<< HEAD
    const avisoTexto = avisoEl.querySelector("span");
    const cargaContainer = document.getElementById("carga-container");
    const materiasBody = document.getElementById("materias-body");
    const btnLogout = document.querySelector(".logout-btn");
    const btnTicket = document.querySelector(".btn-ticket");
    const btnHorario = document.querySelector(".btn-horario");
=======
    const gruposDiv = document.getElementById("lista-grupos");
    const resumenDiv = document.getElementById("resumen-seleccion");
    const contadorSpan = document.getElementById("contador-materias");
    const creditosSpan = document.getElementById("creditos-totales");
    const btnInscribir = document.getElementById("btn-inscribir");
>>>>>>> e5b595306e64134749175c59d9d4a9db60e7c6d3

    // Estado
    let gruposDisponibles = [];
    let seleccionados = new Map(); // idGrupo -> {creditos, horario}
    let periodoAbierto = false;

    // Cargar datos del alumno
    try {
        const resAlumno = await fetch(`/alumno/${nctrl}`);
        if (resAlumno.ok) {
            const alumno = await resAlumno.json();
            nombreEl.textContent = `${alumno.Nombre} ${alumno.Apellidos}`.toUpperCase();
            idEl.textContent = alumno.N_ctrl;
            carreraEl.textContent = alumno.Carrera.toUpperCase();
        }
<<<<<<< HEAD
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
=======
    } catch (err) { console.error(err); }

    // Verificar período de carga
    try {
        const resPeriodo = await fetch("/periodo-carga");
        const data = await resPeriodo.json();
        periodoAbierto = data.abierto;
        if (periodoAbierto) {
            avisoEl.style.borderColor = "rgba(16,185,129,.5)";
            avisoEl.querySelector("span:first-child").textContent = "✅";
            avisoEl.querySelector("span:last-child").textContent = "Período de carga ABIERTO. Puedes seleccionar tus materias.";
        } else {
            avisoEl.querySelector("span:last-child").textContent = "Período de carga CERRADO. No es posible inscribirse.";
            gruposDiv.innerHTML = "<p>No hay período activo.</p>";
            return;
        }
    } catch (err) { console.error(err); }

    if (!periodoAbierto) return;

    // Cargar grupos disponibles
    async function cargarGrupos() {
        gruposDiv.innerHTML = "<p>Cargando grupos...</p>";
        try {
            const res = await fetch(`/grupos-disponibles/${nctrl}`);
            const data = await res.json();
            if (!data.abierto) {
                gruposDiv.innerHTML = "<p>El período de inscripciones se cerró.</p>";
                return;
            }
            gruposDisponibles = data.grupos;
            if (!gruposDisponibles.length) {
                gruposDiv.innerHTML = "<p>No hay grupos disponibles para tu carrera o ya cursaste todas las materias.</p>";
                return;
            }
            renderGrupos(gruposDisponibles);
        } catch (err) {
            gruposDiv.innerHTML = `<p style="color:var(--danger)">Error: ${err.message}</p>`;
        }
    }

    function renderGrupos(grupos) {
        gruposDiv.innerHTML = grupos.map(grupo => `
            <div class="grupo-card" data-id="${grupo.ID_Grupo}" data-creditos="${grupo.Creditos}" data-horario="${escapeHtml(grupo.Horario || '')}">
                <div style="font-weight:800;">${grupo.Clave} - ${grupo.Nombre}</div>
                <div style="font-size:12px; margin:5px 0;">👨‍🏫 ${grupo.Docente} | Aula ${grupo.Aula}</div>
                <div style="font-size:11px; color:var(--text-2);">📅 ${grupo.Horario || 'Sin horario'}</div>
                <div style="font-size:11px;">Créditos: ${grupo.Creditos} | Cupo: ${grupo.Inscritos}/${grupo.MaxAlumnos}</div>
            </div>
        `).join('');

        document.querySelectorAll('.grupo-card').forEach(card => {
            card.addEventListener('click', () => toggleSeleccion(card));
            if (seleccionados.has(parseInt(card.dataset.id))) {
                card.classList.add('selected');
            }
        });
    }

    function escapeHtml(str) {
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    function hayConflictoHorario(horario1, horario2) {
        if (!horario1 || !horario2) return false;
        function parseHorario(horarioStr) {
            const bloques = horarioStr.split(',').map(b => b.trim());
            const parsed = [];
            for (const bloque of bloques) {
                const match = bloque.match(/^(\w+)\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/);
                if (match) {
                    const dia = match[1];
                    const inicioMin = timeToMinutes(match[2]);
                    const finMin = timeToMinutes(match[3]);
                    parsed.push({ dia, inicioMin, finMin });
                }
            }
            return parsed;
        }
        function timeToMinutes(timeStr) {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
        }
        const horarios1 = parseHorario(horario1);
        const horarios2 = parseHorario(horario2);
        for (const h1 of horarios1) {
            for (const h2 of horarios2) {
                if (h1.dia === h2.dia && h1.inicioMin < h2.finMin && h1.finMin > h2.inicioMin) {
                    return true;
                }
            }
        }
        return false;
    }

    function toggleSeleccion(card) {
        const id = parseInt(card.dataset.id);
        const creditos = parseInt(card.dataset.creditos);
        const horario = card.dataset.horario;

        if (seleccionados.has(id)) {
            seleccionados.delete(id);
            card.classList.remove('selected');
        } else {
            // Validar límite de materias
            if (seleccionados.size >= 8) {
                alert("Máximo 8 materias permitidas.");
                return;
            }
            // Validar créditos
            let sumaCreditos = Array.from(seleccionados.values()).reduce((sum, g) => sum + g.creditos, 0) + creditos;
            if (sumaCreditos > 36) {
                alert("No puedes exceder 36 créditos totales.");
                return;
            }
            // Validar conflicto de horario con las ya seleccionadas
            for (let [idSel, gSel] of seleccionados.entries()) {
                if (hayConflictoHorario(horario, gSel.horario)) {
                    alert("Conflicto de horario con otra materia seleccionada.");
                    return;
                }
            }
            seleccionados.set(id, { creditos, horario });
            card.classList.add('selected');
        }
        actualizarResumen();
    }

    function actualizarResumen() {
        const totalMaterias = seleccionados.size;
        const totalCreditos = Array.from(seleccionados.values()).reduce((sum, g) => sum + g.creditos, 0);
        contadorSpan.textContent = totalMaterias;
        creditosSpan.textContent = totalCreditos;
        resumenDiv.style.display = totalMaterias > 0 ? "flex" : "none";
    }

    btnInscribir.addEventListener('click', async () => {
        if (seleccionados.size === 0) return;
        const ids = Array.from(seleccionados.keys());
        if (!confirm(`¿Inscribirte en ${ids.length} materia(s) (${creditosSpan.textContent} créditos)?`)) return;
        try {
            const res = await fetch('/inscribir-masiva', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ N_ctrl: nctrl, idsGrupos: ids })
            });
            const data = await res.json();
            if (data.success) {
                alert("Inscripción exitosa. Serás redirigido a tu horario.");
                window.location.href = "horario.html";
            } else {
                alert("Error: " + data.error);
            }
        } catch (err) {
            alert("Error de red: " + err.message);
        }
    });

    cargarGrupos();
>>>>>>> e5b595306e64134749175c59d9d4a9db60e7c6d3
});