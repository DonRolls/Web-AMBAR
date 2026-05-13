document.addEventListener("DOMContentLoaded", async () => {

    // ERROR 2 y 7 CORREGIDOS: usar getSession() que valida N_ctrl + rol === 'Alumno'
    const sess = getSession();
    if (!sess) return;
    const nctrl = sess.N_ctrl;

    // ERROR 3 CORREGIDO: iniciales reales en avatar
    const iniciales = ((sess.nombre || '').charAt(0) + (sess.apellidos || '').charAt(0)).toUpperCase();
    document.getElementById('avatar-initials').textContent = iniciales || '?';

    // Logout
    const btnLogout = document.getElementById('btn-logout') || document.querySelector('.logout-btn');
    btnLogout?.addEventListener('click', logoutSession);

    // ERROR 5 CORREGIDO: usar los IDs definidos en el HTML, no selectores frágiles
    const nombreEl = document.getElementById('nombre-el');
    const idEl = document.getElementById('id-el');
    const carreraEl = document.getElementById('carrera-el');
    const espEl = document.getElementById('esp-el');
    const semEl = document.getElementById('sem-el');
    const estatusEl = document.getElementById('estatus-el');
    const credAcumEl = document.getElementById('cred-acum-el');
    const progresoFill = document.getElementById('progreso-fill');
    const progresoTexto = document.getElementById('progreso-texto');
    const kardexGrid = document.getElementById('kardex-grid');

    const CREDITOS_TOTALES = 260;

    // 1. INFORMACIÓN GENERAL DEL ALUMNO
    try {
        // ERROR 4 CORREGIDO: ruta relativa, sin localhost:3000
        const res = await fetch(`/alumno/${nctrl}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const a = await res.json();

        nombreEl.textContent = `${a.Nombre} ${a.Apellidos}`.toUpperCase();
        idEl.textContent = a.N_ctrl;
        carreraEl.textContent = a.Carrera || '—';
        espEl.textContent = a.Especialidad || 'TRONCO COMÚN';
        semEl.textContent = a.Semestre ?? '—';
        estatusEl.textContent = (a.Estatus || '—').toUpperCase();

    } catch (err) {
        console.error('Error cargando info del alumno:', err);
        nombreEl.textContent = 'Error al cargar datos';
    }

    // 2. KÁRDEX
    try {
        // ERROR 4 CORREGIDO: ruta relativa
        const res = await fetch(`/kardex/${nctrl}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const materias = await res.json();

        kardexGrid.innerHTML = '';

        if (!materias.length) {
            kardexGrid.innerHTML = '<p class="empty-msg">No hay materias registradas en el kárdex.</p>';
            return;
        }

        // 2.1 AGRUPAR POR SEMESTRE Y DETERMINAR EL MÁXIMO
        const semestres = {};
        let maxSemestre = 9; // Por defecto al menos 9

        materias.forEach(m => {
            const s = parseInt(m.Semestre) || 1;
            if (s > maxSemestre) maxSemestre = s;
            if (!semestres[s]) semestres[s] = [];
            semestres[s].push(m);
        });

        // Ajustar el grid CSS dinámicamente si hay más de 9 semestres
        kardexGrid.style.gridTemplateColumns = `repeat(${maxSemestre}, 1fr)`;

        let creditosAprobados = 0;

        // 2.2 CREAR COLUMNAS (Dinámico hasta maxSemestre)
        for (let s = 1; s <= maxSemestre; s++) {
            const col = document.createElement('div');
            col.className = 'semestre-col';
            col.innerHTML = `<div class="sem-header">Semestre ${s}</div>`;

            const listaMaterias = semestres[s] || [];
            listaMaterias.forEach(m => {
                let claseBase;
                const esOptativa = m.EsOptativa === true || m.EsOptativa === 1;

                switch ((m.Estatus || '').toUpperCase()) {
                    case 'APROBADO':
                        claseBase = esOptativa ? 'op' : 'ap';
                        creditosAprobados += Number(m.Creditos) || 0;
                        break;
                    case 'REPROBADO_CRITICO':
                        claseBase = 're-critico';
                        break;
                    case 'REPROBADO':
                        claseBase = 're';
                        break;
                    default:
                        claseBase = 'pc';
                }

                const calDisplay = m.CalFinal != null
                    ? `Cal: ${Number(m.CalFinal).toFixed(1)} · `
                    : '';

                const card = document.createElement('div');
                card.className = `mc ${claseBase}`;
                card.innerHTML = `
                    <div class="clave">${m.Clave}</div>
                    <div class="nombre" title="${m.Materia}">${m.Materia}</div>
                    <div class="detalle">${calDisplay}Cr: ${m.Creditos ?? '—'}</div>
                    ${esOptativa ? '<div class="icon">★ ESPECIALIDAD</div>' : ''}
                `;
                col.appendChild(card);
            });
            kardexGrid.appendChild(col);
        }

        // 3. BARRA DE PROGRESO
        credAcumEl.textContent = creditosAprobados;
        const porcentaje = Math.min((creditosAprobados / CREDITOS_TOTALES) * 100, 100).toFixed(2);
        progresoFill.style.width = `${porcentaje}%`;
        progresoTexto.textContent = `${porcentaje}%`;

    } catch (err) {
        console.error('Error al cargar kárdex:', err);
        kardexGrid.innerHTML = '<p class="empty-msg" style="color:var(--danger)">Error al cargar el kárdex. Intenta recargar la página.</p>';
    }
});