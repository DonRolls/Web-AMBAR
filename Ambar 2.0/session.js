// alumnos/session.js
// Incluir con: <script src="session.js"></script>  en cada página interior
// Provee: getNctrl(), getSession(), logoutSession()
(function () {
    "use strict";
 
    const KEYS_ALUMNO = ["N_ctrl","nombre","apellidos","email","carrera","semestre","foto"];
    const KEYS_COORD  = ["ID_Coordinador","nombre","apellidos","N_ctrl","departamento","idDepto","rol"];
 
    // ─── ALUMNOS ─────────────────────────────────────────────────────
 
    /** Verifica sesión de alumno; redirige al login si no existe. */
    function getSession() {
        const N_ctrl = sessionStorage.getItem("N_ctrl");
        if (!N_ctrl) { window.location.href = _loginPath(); return null; }
        const sess = {};
        KEYS_ALUMNO.forEach(k => sess[k] = sessionStorage.getItem(k) || "");
        return sess;
    }
 
    /** Devuelve solo el número de control del alumno. */
    function getNctrl() {
        const n = sessionStorage.getItem("N_ctrl");
        if (!n) { window.location.href = _loginPath(); return null; }
        return n;
    }
 
    /** Cierra sesión de alumno. */
    function logoutSession() {
        sessionStorage.clear();
        window.location.href = _loginPath();
    }
 
    // ─── COORDINADOR / DOCENTE / ADMIN ───────────────────────────────
 
    /** Verifica sesión de coordinador; redirige al login si no existe. */
    function getCoordSession() {
        const id = sessionStorage.getItem("ID_Coordinador");
        if (!id) { window.location.href = _loginPath(); return null; }
        const sess = {};
        KEYS_COORD.forEach(k => sess[k] = sessionStorage.getItem(k) || "");
        return sess;
    }
 
    /** Devuelve solo el ID del coordinador. */
    function getCoordId() {
        const id = sessionStorage.getItem("ID_Coordinador");
        if (!id) { window.location.href = _loginPath(); return null; }
        return id;
    }
 
    /** Devuelve el ID de departamento del coordinador. */
    function getDepartoId() {
        return sessionStorage.getItem("idDepto") || "";
    }
 
    /** Cierra sesión de coordinador. */
    function logoutCoord() {
        sessionStorage.clear();
        window.location.href = _loginPath();
    }
 
    // ─── UTILIDAD ─────────────────────────────────────────────────────
 
    /**
     * Detecta automáticamente la profundidad de carpeta para construir
     * la ruta correcta hacia login.html en la raíz.
     * - Raíz (/)              → "login.html"
     * - Un nivel (/Alumno/)   → "../login.html"
     * - Dos niveles           → "../../login.html"
     */
    function _loginPath() {
        const depth = (window.location.pathname.match(/\//g) || []).length - 1;
        return depth <= 1 ? "login.html" : "../".repeat(depth - 1) + "login.html";
    }
 
    // Exponer globalmente
    window.getSession      = getSession;
    window.getNctrl        = getNctrl;
    window.logoutSession   = logoutSession;
    window.getCoordSession = getCoordSession;
    window.getCoordId      = getCoordId;
    window.getDepartoId    = getDepartoId;
    window.logoutCoord     = logoutCoord;
 
})();
