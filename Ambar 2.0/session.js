// alumnos/session.js
// Incluir con: <script src="session.js"></script>  en cada página interior
// Provee: getNctrl(), getSession(), logoutSession()

(function () {
    "use strict";

    const KEYS = ["N_ctrl", "nombre", "apellidos", "email", "carrera", "semestre", "foto"];

    //Verifica que exista sesión; si no, redirige al login. Retorna el objeto de sesión si existe.
    function getSession() {
        const N_ctrl = sessionStorage.getItem("N_ctrl");
        if (!N_ctrl) {
            window.location.href = "../login.html";
            return null;
        }
        const sess = {};
        KEYS.forEach(k => sess[k] = sessionStorage.getItem(k) || "");
        return sess;
    }

    // Devuelve solo el número de control 
    function getNctrl() {
        const n = sessionStorage.getItem("N_ctrl");
        if (!n) { window.location.href = "../login.html"; return null; }
        return n;
    }

    // Cierra la sesión y redirige al login.
    function logoutSession() {
        sessionStorage.clear();
        window.location.href = "../login.html";
    }

    // Exponer globalmente
    window.getSession   = getSession;
    window.getNctrl     = getNctrl;
    window.logoutSession = logoutSession;
})();
