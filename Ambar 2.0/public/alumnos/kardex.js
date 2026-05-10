document.addEventListener("DOMContentLoaded", async () => {

    // ERROR 2 y 7 CORREGIDOS: usar getSession() que valida N_ctrl + rol === 'Alumno'
    const sess = getSession();
    if (!sess) return;
    const nctrl = sess.N_ctrl;

    // ERROR 3 CORREGIDO: iniciales reales en avatar
    const iniciales = ((sess.nombre || '').charAt(0) + (sess.apellidos || '').charAt(0)).toUpperCase();
    document.getElementById('avatar-initials').textContent = iniciales || '?';

    // Logout
    document.getElementById('btn-logout').addEventListener('click', logoutSession);

    // ERROR 5 CORREGIDO: usar los IDs definidos en el HTML, no selectores frágiles
    const nombreEl      = document.getElementById('nombre-el');
    const idEl          = document.getElementById('id-el');
    const carreraEl     = document.getElementById('carrera-el');
    const espEl         = document.getElementById('esp-el');
    const semEl         = document.getElementById('sem-el');
    const estatusEl     = document.getElementById('estatus-el');
    const credAcumEl    = document.getElementById('cred-acum-el');
    const progresoFill  = document.getElementById('progreso-fill');
    const progresoTexto = document.getElementById('progreso-texto');
    const kardexGrid    = document.getElementById('kardex-grid');

    const CREDITOS_TOTALES = 260;

    // 1. INFORMACIÓN GENERAL DEL ALUMNO
    try {
        // ERROR 4 CORREGIDO: ruta relativa, sin localhost:3000
        const res = await fetch(`/alumno/${nctrl}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const a = await res.json();

        nombreEl.textContent  = `${a.Nombre} ${a.Apellidos}`.toUpperCase();
        idEl.textContent      = a.N_ctrl;
        carreraEl.textContent = a.Carrera  || '—';
        espEl.textContent     = a.Especialidad || 'TRONCO COMÚN';
        semEl.textContent     = a.Semestre ?? '—';
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

        let creditosAprobados = 0;

        materias.forEach(m => {
            // ERROR 6 CORREGIDO: lógica de clases sin concatenación
            // Una materia optativa tiene su propia clase; si además está aprobada/reprobada
            // la clase base define el color principal y 'op' solo añade el ícono de estrella
            let claseBase;
            const esOptativa = m.EsOptativa === true || m.EsOptativa === 1;

            switch ((m.Estatus || '').toUpperCase()) {
                case 'APROBADO':
                    claseBase = esOptativa ? 'op' : 'ap';
                    // ERROR 7 CORREGIDO: verificar que Creditos sea número antes de sumar
                    creditosAprobados += Number(m.Creditos) || 0;
                    break;
                case 'REPROBADO':
                    claseBase = 're';
                    break;
                case 'CURSANDO':
                case 'EN CURSO':
                    claseBase = 'ac';
                    break;
                default:
                    claseBase = 'pc'; // Por cursar
            }

            const calDisplay = m.CalFinal != null
                ? `Cal: ${Number(m.CalFinal).toFixed(2)} · `
                : '';

            const card = document.createElement('div');
            card.className = `mc ${claseBase}`;
            card.innerHTML = `
                <div class="clave">${m.Clave}</div>
                <div class="nombre">${m.Materia}</div>
                <div class="detalle">${calDisplay}Cr: ${m.Creditos ?? '—'}</div>
                ${esOptativa ? '<div class="icon">★ Optativa</div>' : ''}
            `;
            kardexGrid.appendChild(card);
        });

        // 3. BARRA DE PROGRESO
        credAcumEl.textContent = creditosAprobados;
        const porcentaje = Math.min((creditosAprobados / CREDITOS_TOTALES) * 100, 100).toFixed(2);
        progresoFill.style.width  = `${porcentaje}%`;
        progresoTexto.textContent = `${porcentaje}%`;

    } catch (err) {
        console.error('Error al cargar kárdex:', err);
        kardexGrid.innerHTML = '<p class="empty-msg" style="color:var(--danger)">Error al cargar el kárdex. Intenta recargar la página.</p>';
    }
});