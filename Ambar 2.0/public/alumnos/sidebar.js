// sidebar.js — Barra lateral del Portal Estudiante (sistema Ámbar)
(function () {
    "use strict";

    const path = window.location.pathname;
    const paginaActual = path.split('/').pop().replace('.html', '') || 'inicio';

    const enlacesPrincipales = [
        { texto: 'Inicio',                  icono: '🏠', url: 'inicio.html',               id: 'inicio' },
        { texto: 'Horario',                 icono: '📅', url: 'horario.html',               id: 'horario' },
        { texto: 'Calificaciones',          icono: '📋', url: 'calificaciones.html',         id: 'calificaciones' },
        { texto: 'Kárdex',                  icono: '📊', url: 'kardex.html',                 id: 'kardex' },
        { texto: 'Histórico de Actividades',icono: '📝', url: 'historicodeactividades.html', id: 'historicodeactividades' },
        { texto: 'Credencial',              icono: '🪪', url: 'credencial.html',             id: 'credencial' },
        { texto: 'Recibos',                 icono: '🧾', url: 'recibos.html',                id: 'recibos' },
        { texto: 'Carga de Materias',       icono: '📚', url: 'cargadematerias.html',        id: 'cargadematerias' },
    ];

    const enlacesInferiores = [
        { texto: 'Soporte',     icono: '❓', url: 'SoporteAl.html', id: 'soporte' },
        { texto: 'Guía de uso', icono: '📖', url: 'guia.html',    id: 'guia' },
    ];

    function isActive(id) {
        return paginaActual === id;
    }

    function buildItem(item) {
        const active = isActive(item.id) ? ' active' : '';
        return `<a href="${item.url}" class="nav-item${active}">
            <span class="nav-icon">${item.icono}</span>
            <span class="nav-label">${item.texto}</span>
        </a>`;
    }

    const html = `
        <style>
            #sidebar-container {
                display: flex;
                flex-direction: column;
                height: 100%;
            }
            #sidebar-container .nav-section-label {
                padding: 20px 12px 8px;
                font-size: 10px;
                font-weight: 700;
                letter-spacing: 1.2px;
                text-transform: uppercase;
                color: rgba(255,255,255,.3);
                white-space: nowrap;
                font-family: 'DM Sans', sans-serif;
            }
            #sidebar-container a.nav-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 11px 16px;
                cursor: pointer;
                font-size: 13.5px;
                font-weight: 500;
                color: rgba(255,255,255,.65);
                border-left: 3px solid transparent;
                transition: all .18s;
                text-decoration: none;
                white-space: nowrap;
                overflow: hidden;
                font-family: 'DM Sans', sans-serif;
            }
            #sidebar-container a.nav-item:hover {
                background: rgba(255,255,255,.07);
                color: white;
            }
            #sidebar-container a.nav-item.active {
                background: rgba(232,161,0,.12);
                border-left: 3px solid #E8A100;
                color: #E8A100;
            }
            #sidebar-container .nav-icon {
                font-size: 18px;
                width: 22px;
                text-align: center;
                flex-shrink: 0;
            }
            #sidebar-container .nav-bottom-wrap {
                border-top: 1px solid rgba(255,255,255,.07);
                padding: 8px 0;
            }
            #sidebar-container .nav-main { flex: 1; }
        </style>

        <div class="nav-section-label">Menú principal</div>
        <div class="nav-main">
            ${enlacesPrincipales.map(buildItem).join('')}
        </div>
        <div class="nav-bottom-wrap">
            ${enlacesInferiores.map(buildItem).join('')}
        </div>
    `;

    const container = document.getElementById('sidebar-container');
    if (container) container.innerHTML = html;

    // Toggle sidebar
    window.toggleSidebar = function () {
        const sidebar = document.getElementById('main-sidebar');
        if (sidebar) sidebar.classList.toggle('collapsed');
    };

    // Sidebar collapse styles
    const style = document.createElement('style');
    style.textContent = `
        #main-sidebar { transition: width .28s cubic-bezier(.4,0,.2,1); overflow: hidden; }
        #main-sidebar.collapsed { width: 60px !important; }
        #main-sidebar.collapsed .nav-label { opacity: 0; pointer-events: none; }
        #main-sidebar.collapsed .nav-section-label { opacity: 0; }
    `;
    document.head.appendChild(style);
})();
