// routes/docente.routes.js
const express = require("express");
const router = express.Router();
const repo = require("../repositories/docente_repository");

// Perfil del docente
router.get("/perfil/:id", async (req, res) => {
    try {
        const docente = await repo.getDocenteById(req.params.id);
        if (!docente) return res.status(404).json({ error: "Docente no encontrado" });
        res.json(docente);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Grupos del docente en periodo activo
router.get("/grupos/:idDocente", async (req, res) => {
    try {
        const grupos = await repo.getGruposDocente(req.params.idDocente);
        res.json(grupos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Alumnos de un grupo (para futuras pantallas)
router.get("/grupo/:idGrupo/alumnos", async (req, res) => {
    try {
        const alumnos = await repo.getAlumnosGrupo(req.params.idGrupo);
        res.json(alumnos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;