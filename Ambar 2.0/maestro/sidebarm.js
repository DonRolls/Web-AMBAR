// sidebarm.js — Barra lateral del Portal Docente (carpeta maestro/)
// Incluir con: <script src="sidebarm.js"></script>

(function () {
    "use strict";

    const navItems = [
        { icon: "🏠", label: "Inicio",                href: "home.html" },
        { icon: "📅", label: "Horario",               href: "horario.html" },
        { icon: "📋", label: "Actividades",            href: "actividades.html" },
        { icon: "🎯", label: "Competencias",           href: "competencias.html" },
        { icon: "📝", label: "Evidencias",             href: "evidencias.html" },
        { icon: "📚", label: "Fuentes de Información", href: "fuentes.html" },
        { icon: "🎓", label: "Apoyo Didáctico",        href: "apoyo.html" },
    ];

    const bottomItems = [
        { icon: "⚙️", label: "Configuración", href: "#" },
        { icon: "🚪", label: "Cerrar sesión",  href: "#", id: "btn-logout" },
    ];

    // Detecta la página activa comparando el nombre de archivo
    function isActive(href) {
        const current = window.location.pathname.split("/").pop() || "home.html";
        return current === href;
    }

    function buildItem(item) {
        const active = isActive(item.href) ? " active" : "";
        const idAttr = item.id ? ` id="${item.id}"` : "";
        return `
            <a href="${item.href}" class="nav-item${active}"${idAttr} style="text-decoration:none;">
                <span class="nav-icon">${item.icon}</span>
                <span>${item.label}</span>
            </a>`;
    }

    const html = `
        <style>
            /* Estilos propios del sidebar, en caso de que la página no los incluya */
            #sidebar-container a.nav-item {
                display: flex;
                align-items: center;
                gap: 14px;
                padding: 14px 20px;
                cursor: pointer;
                font-size: 14px;
                color: #444;
                border-left: 3px solid transparent;
                transition: background 0.15s;
                text-decoration: none;
            }
            #sidebar-container a.nav-item:hover  { background: #f0f4ff; }
            #sidebar-container a.nav-item.active {
                background: #eef2ff;
                border-left: 3px solid #1a2a4a;
                color: #1a2a4a;
                font-weight: 500;
            }
            #sidebar-container .nav-icon {
                font-size: 18px;
                width: 22px;
                text-align: center;
            }
            #sidebar-container .sidebar-divider {
                border: none;
                border-top: 1px solid #e0e0e0;
                margin: 8px 0;
            }
            #sidebar-container .sidebar-section-label {
                font-size: 10px;
                color: #aaa;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                padding: 12px 20px 4px;
            }
        </style>

        <div style="display:flex; flex-direction:column; height:100%;">
            <div style="flex:1;">
                <div class="sidebar-section-label">Menú principal</div>
                ${navItems.map(buildItem).join("")}
            </div>
            <div>
                <hr class="sidebar-divider">
                ${bottomItems.map(buildItem).join("")}
            </div>
        </div>
    `;

    const container = document.getElementById("sidebar-container");
    if (container) {
        container.innerHTML = html;

        // Botón de cerrar sesión
        const btnLogout = document.getElementById("btn-logout");
        if (btnLogout) {
            btnLogout.addEventListener("click", function (e) {
                e.preventDefault();
                if (typeof logoutCoord === "function") {
                    logoutCoord();
                } else {
                    sessionStorage.clear();
                    // Sube un nivel para salir de la carpeta maestro/
                    window.location.href = "../login.html";
                }
            });
        }
    }
})();
