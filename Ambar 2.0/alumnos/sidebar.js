// sidebar.js - Barra lateral con sección inferior y toggle

(function() {
    // Obtener el nombre de la página actual automáticamente
    const path = window.location.pathname;
    const paginaActual = path.split('/').pop().replace('.html', '') || 'inicio';
    
    // Enlaces principales
    const enlacesPrincipales = [
        { texto: 'Inicio', icono: '🏠', url: 'inicio.html', id: 'inicio' },
        { texto: 'Horario', icono: '📅', url: 'horario.html', id: 'horario' },
        { texto: 'Calificaciones', icono: '📋', url: 'calificaciones.html', id: 'calificaciones' },
        { texto: 'Kárdex', icono: '📊', url: 'kardex.html', id: 'kardex' },
        { texto: 'Histórico de actividades', icono: '📝', url: 'historicodeactividades.html', id: 'historico' },
        { texto: 'Credencial', icono: '🪪', url: 'credencial.html', id: 'credencial' },
        { texto: 'Recibos', icono: '🧾', url: 'recibos.html', id: 'recibos' },
        { texto: 'Carga de Materias', icono: '📚', url: 'cargadematerias.html', id: 'cargamaterias' },
        { texto: 'Tickets', icono: '🎫', url: 'tickets.html', id: 'tickets' }
    ];
    
    // Enlaces inferiores
    const enlacesInferiores = [
        { texto: 'Soporte', icono: '❓', url: 'soporte.html', id: 'soporte' },
        { texto: 'Guia de uso', icono: '📖', url: 'guia.html', id: 'guia' }
    ];
    
    function generarSidebar() {
        let enlacesHTML = '';
        
        // Generar enlaces principales
        for (const enlace of enlacesPrincipales) {
            const claseActivo = (paginaActual === enlace.id) ? 'active' : '';
            enlacesHTML += `
                <a href="${enlace.url}" style="text-decoration: none; color: inherit;">
                    <div class="nav-item ${claseActivo}">
                        <span class="nav-icon">${enlace.icono}</span>
                        <span class="nav-text">${enlace.texto}</span>
                    </div>
                </a>
            `;
        }
        
        // Generar enlaces inferiores
        let enlacesInferioresHTML = '';
        for (const enlace of enlacesInferiores) {
            const claseActivo = (paginaActual === enlace.id) ? 'active' : '';
            enlacesInferioresHTML += `
                <a href="${enlace.url}" style="text-decoration: none; color: inherit;">
                    <div class="nav-item ${claseActivo}">
                        <span class="nav-icon">${enlace.icono}</span>
                        <span class="nav-text">${enlace.texto}</span>
                    </div>
                </a>
            `;
        }
        
        return `
            <div class="sidebar" id="main-sidebar">
                <div class="sidebar-wrapper">
                    <div class="nav-list">
                        ${enlacesHTML}
                    </div>
                    <div class="nav-bottom">
                        ${enlacesInferioresHTML}
                    </div>
                </div>
            </div>
        `;
    }
    
    // Insertar la sidebar
    const contenedor = document.getElementById('sidebar-container');
    if (contenedor) {
        contenedor.innerHTML = generarSidebar();
    }
    
    // Función para toggle (ocultar/mostrar) la sidebar
    window.toggleSidebar = function() {
        const sidebar = document.getElementById('main-sidebar');
        const mainContent = document.querySelector('.main');
        const hamburger = document.querySelector('.hamburger');
        
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
            if (mainContent) {
                mainContent.classList.toggle('expanded');
            }
            if (hamburger) {
                hamburger.classList.toggle('active');
            }
        }
    };
    
    // Agregar estilos para la animación de ocultar/mostrar
    const style = document.createElement('style');
    style.textContent = `
        .sidebar {
            transition: width 0.3s ease, transform 0.3s ease;
            overflow-x: hidden;
        }
        
        .sidebar.collapsed {
            width: 0px;
            min-width: 0px;
            padding: 0;
            overflow: hidden;
        }
        
        .main {
            transition: margin-left 0.3s ease, flex 0.3s ease;
            flex: 1;
        }
        
        .main.expanded {
            margin-left: 0;
        }
        
        /* Cuando la sidebar está oculta, el main ocupa todo */
        .layout {
            display: flex;
        }
        
        /* Ocultar texto cuando está colapsada */
        .sidebar.collapsed .nav-text {
            display: none;
        }
        
        .sidebar.collapsed .nav-icon {
            font-size: 20px;
        }
        
        /* Animación del hamburguesa */
        .hamburger {
            transition: transform 0.3s ease;
            display: inline-block;
        }
        
        .hamburger.active {
            transform: rotate(90deg);
        }
    `;
    document.head.appendChild(style);
})();