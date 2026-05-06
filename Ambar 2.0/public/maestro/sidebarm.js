// sidebarm.js — Barra lateral del Portal Docente (sistema Ámbar)
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
        { icon: "🏆", label: "Calificaciones",         href: "home.html#grupos" },
    ];

    const bottomItems = [
        { icon: "❓", label: "Soporte",        href: "SoporteMa.html" },
        { icon: "⚙️", label: "Configuración",  href: "#" },
        { icon: "🚪", label: "Cerrar sesión",  href: "#", id: "btn-logout" },
    ];

    function isActive(href) {
        const current = window.location.pathname.split("/").pop() || "home.html";
        // también detectar calificaciones.html como active cuando viene del grupo
        const hrefBase = href.split("#")[0];
        return current === hrefBase;
    }

    function buildItem(item) {
        const active = isActive(item.href) ? " active" : "";
        const idAttr = item.id ? ` id="${item.id}"` : "";
        return `
            <a href="${item.href}" class="nav-item${active}"${idAttr}>
                <span class="nav-icon">${item.icon}</span>
                <span class="nav-label">${item.label}</span>
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
            #sidebar-container .nav-divider {
                height: 1px;
                background: rgba(255,255,255,.07);
                margin: 8px 0;
            }
            #sidebar-container .nav-bottom-wrap {
                border-top: 1px solid rgba(255,255,255,.07);
                padding: 8px 0;
            }
            #sidebar-container .nav-main { flex: 1; overflow-y: auto; }
            #sidebar-container .nav-main::-webkit-scrollbar { width: 3px; }
            #sidebar-container .nav-main::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); border-radius: 2px; }
        </style>

        <div class="nav-section-label">Menú principal</div>
        <div class="nav-main">
            ${navItems.map(buildItem).join("")}
        </div>
        <div class="nav-bottom-wrap">
            ${bottomItems.map(buildItem).join("")}
        </div>
    `;

    const container = document.getElementById("sidebar-container");
    if (container) {
        container.innerHTML = html;

        const btnLogout = document.getElementById("btn-logout");
        if (btnLogout) {
            btnLogout.addEventListener("click", function (e) {
                e.preventDefault();
                sessionStorage.clear();
                window.location.href = "../login.html";
            });
        }
    }
})();
