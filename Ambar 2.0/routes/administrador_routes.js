// routes/administrador_routes.js
const express = require("express");
const router  = express.Router();
const repo    = require("../repositories/administrador_repository");

/* ─── Middleware auth básico ──────────────────────────────────────────────── */
function authAdmin(req, res, next) {
    const id = req.headers["x-admin-id"];
    if (id) return next();
    res.status(401).json({ error: "No autorizado" });
}

/* ─── Wrapper para errores async ──────────────────────────────────────────── */
const asyncH = fn => (req, res, next) => fn(req, res, next).catch(next);

/* ════════════════════════════════════════════════════
   ALUMNOS
════════════════════════════════════════════════════ */
router.get("/alumnos", authAdmin, asyncH(async (req, res) => {
    res.json(await repo.getAlumnos());
}));

router.post("/alumnos", authAdmin, asyncH(async (req, res) => {
    const { N_ctrl, Nombre, Apellidos, Email, Pass, id_carrera, Semestre } = req.body;
    if (!N_ctrl || !Nombre || !Apellidos || !Email || !Pass || !id_carrera || !Semestre)
        return res.status(400).json({ error: "Faltan campos obligatorios" });
    await repo.crearAlumno(N_ctrl, Nombre, Apellidos, Email, Pass, id_carrera, Semestre);
    res.status(201).json({ ok: true });
}));

router.put("/alumnos/:nctrl", authAdmin, asyncH(async (req, res) => {
    await repo.actualizarAlumno(req.params.nctrl, req.body);
    res.json({ ok: true });
}));

router.delete("/alumnos/:nctrl", authAdmin, asyncH(async (req, res) => {
    await repo.eliminarAlumno(req.params.nctrl);
    res.json({ ok: true });
}));

/* ════════════════════════════════════════════════════
   DOCENTES
════════════════════════════════════════════════════ */
router.get("/docentes", authAdmin, asyncH(async (req, res) => {
    res.json(await repo.getDocentes());
}));

router.post("/docentes", authAdmin, asyncH(async (req, res) => {
    const { N_ctrl, Nombre, Apellidos, Email, Pass } = req.body;
    if (!N_ctrl || !Nombre || !Apellidos || !Email || !Pass)
        return res.status(400).json({ error: "Faltan campos obligatorios" });
    await repo.crearDocente(N_ctrl, Nombre, Apellidos, Email, Pass);
    res.status(201).json({ ok: true });
}));

router.put("/docentes/:id", authAdmin, asyncH(async (req, res) => {
    await repo.actualizarDocente(parseInt(req.params.id), req.body);
    res.json({ ok: true });
}));

router.delete("/docentes/:id", authAdmin, asyncH(async (req, res) => {
    await repo.eliminarDocente(parseInt(req.params.id));
    res.json({ ok: true });
}));

/* ════════════════════════════════════════════════════
   COORDINADORES
════════════════════════════════════════════════════ */
router.get("/coordinadores", authAdmin, asyncH(async (req, res) => {
    res.json(await repo.getCoordinadores());
}));

router.post("/coordinadores", authAdmin, asyncH(async (req, res) => {
    const { N_ctrl, Nombre, Apellidos, Email, Pass, ID_Departamento } = req.body;
    if (!N_ctrl || !Nombre || !Apellidos || !Email || !Pass || !ID_Departamento)
        return res.status(400).json({ error: "Faltan campos obligatorios" });
    await repo.crearCoordinador(N_ctrl, Nombre, Apellidos, Email, Pass, ID_Departamento);
    res.status(201).json({ ok: true });
}));

router.put("/coordinadores/:nctrl", authAdmin, asyncH(async (req, res) => {
    await repo.actualizarCoordinador(req.params.nctrl, req.body);
    res.json({ ok: true });
}));

router.delete("/coordinadores/:nctrl", authAdmin, asyncH(async (req, res) => {
    await repo.eliminarCoordinador(req.params.nctrl);
    res.json({ ok: true });
}));

/* ════════════════════════════════════════════════════
   MATERIAS
════════════════════════════════════════════════════ */
router.get("/materias", authAdmin, asyncH(async (req, res) => {
    res.json(await repo.getMaterias());
}));

router.post("/materias", authAdmin, asyncH(async (req, res) => {
    const { Clave, Nombre, Creditos, id_carrera, EsOptativa } = req.body;
    if (!Clave || !Nombre || !Creditos || !id_carrera)
        return res.status(400).json({ error: "Faltan campos obligatorios" });
    await repo.crearMateria(Clave, Nombre, Creditos, id_carrera, EsOptativa ?? 0);
    res.status(201).json({ ok: true });
}));

router.put("/materias/:id", authAdmin, asyncH(async (req, res) => {
    await repo.actualizarMateria(parseInt(req.params.id), req.body);
    res.json({ ok: true });
}));

router.delete("/materias/:id", authAdmin, asyncH(async (req, res) => {
    await repo.eliminarMateria(parseInt(req.params.id));
    res.json({ ok: true });
}));

/* ════════════════════════════════════════════════════
   KARDEX
════════════════════════════════════════════════════ */
router.get("/kardex/:nctrl", authAdmin, asyncH(async (req, res) => {
    res.json(await repo.getKardexByAlumno(req.params.nctrl));
}));

/* ─── Manejador de errores ─────────────────────────────────────────────────── */
router.use((err, req, res, next) => {
    console.error("[Admin Route Error]", err.message);
    res.status(500).json({ error: "Error interno del servidor", detail: err.message });
});

module.exports = router;