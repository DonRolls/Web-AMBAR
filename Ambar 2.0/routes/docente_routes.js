// routes/docente_routes.js
const express = require("express");
const router  = express.Router();
const repo    = require("../repositories/docente_repository");

// ── Perfil del docente ────────────────────────────────────────────────────────
router.get("/perfil/:id", async (req, res) => {
    try {
        const docente = await repo.getDocenteById(req.params.id);
        if (!docente) return res.status(404).json({ error: "Docente no encontrado" });
        res.json(docente);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Grupos del docente en periodo activo ─────────────────────────────────────
router.get("/grupos/:idDocente", async (req, res) => {
    try {
        const grupos = await repo.getGruposDocente(req.params.idDocente);
        res.json(grupos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Info de un grupo específico ───────────────────────────────────────────────
router.get("/grupo/:idGrupo/info", async (req, res) => {
    try {
        const info = await repo.getGrupoInfo(req.params.idGrupo);
        if (!info) return res.status(404).json({ error: "Grupo no encontrado" });
        res.json(info);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Alumnos de un grupo con calificaciones ────────────────────────────────────
router.get("/grupo/:idGrupo/calificaciones", async (req, res) => {
    try {
        const alumnos = await repo.getAlumnosGrupoConCalif(req.params.idGrupo);
        res.json(alumnos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Guardar / actualizar calificación de un alumno ────────────────────────────
// Body: { idInscripcion, u1, u2, u3, u4?, u5? }
router.post("/calificacion", async (req, res) => {
    try {
        const { idInscripcion, u1, u2, u3, u4, u5 } = req.body;
        if (!idInscripcion) return res.status(400).json({ error: "idInscripcion requerido" });

        const result = await repo.upsertCalificacion(idInscripcion, { u1, u2, u3, u4, u5 });
        res.json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Guardar calificaciones de todo el grupo (bulk) ────────────────────────────
// Body: [ { idInscripcion, parcial1, parcial2, parcial3 }, ... ]
router.post("/grupo/:idGrupo/calificaciones/bulk", async (req, res) => {
    try {
        const registros = req.body;
        if (!Array.isArray(registros) || registros.length === 0)
            return res.status(400).json({ error: "Se requiere un array de registros" });

        const results = [];
        for (const r of registros) {
            const out = await repo.upsertCalificacion(r.idInscripcion, { u1: r.u1, u2: r.u2, u3: r.u3, u4: r.u4, u5: r.u5 });
            results.push({ idInscripcion: r.idInscripcion, ...out });
        }
        res.json({ success: true, results });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
//zeus deja de romper todo por favor, ya casi acabamos :c
