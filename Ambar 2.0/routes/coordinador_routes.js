// routes/coordinador_routes.js
const express = require("express");
const router  = express.Router();
const repo    = require("../repositories/coordinador_repository");

// Helper historial
async function registrar(idCoord, tipo, desc) {
    try { await repo.registrarHistorial(idCoord, tipo, desc); }
    catch (e) { console.error("Historial error:", e.message); }
}

// ── Stats ─────────────────────────────────────────────────────────────────────
router.get("/stats/:idDepto", async (req, res) => {
    try {
        const stats = await repo.getStats(req.params.idDepto);
        res.json(stats);
    } catch (err) {
        console.error("Error /coord/stats:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── Historial ─────────────────────────────────────────────────────────────────
router.get("/historial/:idCoord", async (req, res) => {
    try {
        const historial = await repo.getHistorial(req.params.idCoord);
        res.json(historial);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Docentes ──────────────────────────────────────────────────────────────────
router.get("/docentes", async (req, res) => {
    try {
        const docentes = await repo.getDocentes();
        res.json(docentes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Periodo activo ────────────────────────────────────────────────────────────
router.get("/periodo-activo", async (req, res) => {
    try {
        const periodo = await repo.getPeriodoActivo();
        res.json(periodo || {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Materias del departamento ─────────────────────────────────────────────────
router.get("/materias/:idDepto", async (req, res) => {
    try {
        const materias = await repo.getMateriasPorDepto(req.params.idDepto);
        res.json(materias);
    } catch (err) {
        console.error("Error /coord/materias:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── Grupos del departamento ───────────────────────────────────────────────────
router.get("/grupos/:idDepto", async (req, res) => {
    try {
        const grupos = await repo.getGrupos(req.params.idDepto);
        res.json(grupos);
    } catch (err) {
        console.error("Error /coord/grupos:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── Crear grupo ───────────────────────────────────────────────────────────────
router.post("/grupos", async (req, res) => {
    try {
        const { ID_Materia, ID_Docente, ID_Periodo, Aula, MaxAlumnos, idCoord } = req.body;
        if (!ID_Materia || !ID_Docente || !ID_Periodo || !Aula)
            return res.status(400).json({ success: false, error: "Datos incompletos" });

        const idGrupo = await repo.crearGrupo(
            parseInt(ID_Materia),
            parseInt(ID_Docente),
            parseInt(ID_Periodo),
            Aula,
            parseInt(MaxAlumnos) || 40
        );
        await registrar(idCoord, "GRUPO_EDIT",
            `Grupo creado: materia ${ID_Materia}, docente ${ID_Docente}, aula ${Aula}`);
        res.json({ success: true, ID_Grupo: idGrupo });
    } catch (err) {
        console.error("Error POST /coord/grupos:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── Cambiar estatus de grupo ──────────────────────────────────────────────────
router.put("/grupos/:id/estatus", async (req, res) => {
    try {
        const gid = parseInt(req.params.id);
        const { Estatus, idCoord, descripcion } = req.body;
        if (!['ABIERTO', 'CERRADO'].includes(Estatus))
            return res.status(400).json({ success: false, error: "Estatus inválido" });
        await repo.updateGrupoEstatus(gid, Estatus);
        await registrar(idCoord, "GRUPO_ESTATUS", descripcion);
        res.json({ success: true });
    } catch (err) {
        console.error("Error PUT estatus:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── Editar grupo (docente/aula) ───────────────────────────────────────────────
router.put("/grupos/:id", async (req, res) => {
    try {
        const gid = parseInt(req.params.id);
        const { ID_Docente, Aula, idCoord, descripcion } = req.body;
        if (!ID_Docente || !Aula)
            return res.status(400).json({ success: false, error: "Datos incompletos" });
        await repo.updateGrupo(gid, parseInt(ID_Docente), Aula);
        await registrar(idCoord, "GRUPO_EDIT", descripcion);
        res.json({ success: true });
    } catch (err) {
        console.error("Error PUT grupo:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── Editar horario de grupo ───────────────────────────────────────────────────
router.put("/grupos/:id/horario", async (req, res) => {
    try {
        const gid = parseInt(req.params.id);
        const { horarios, idCoord } = req.body;
        if (!Array.isArray(horarios) || !horarios.length)
            return res.status(400).json({ success: false, error: "Horarios vacíos" });
        await repo.updateHorario(gid, horarios);
        await registrar(idCoord, "GRUPO_EDIT", `Horario del grupo ${gid} actualizado`);
        res.json({ success: true });
    } catch (err) {
        console.error("Error PUT horario:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── Validar cupo de grupo ─────────────────────────────────────────────────────
router.get("/grupos/:id/cupo", async (req, res) => {
    try {
        const esCoord = req.query.coord === '1';
        const cupo = await repo.validarCupoGrupo(parseInt(req.params.id), esCoord);
        res.json(cupo);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Alumnos del departamento ──────────────────────────────────────────────────
router.get("/alumnos/:idDepto", async (req, res) => {
    try {
        const alumnos = await repo.getAlumnos(req.params.idDepto);
        res.json(alumnos);
    } catch (err) {
        console.error("Error /coord/alumnos:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── Grupos disponibles para un alumno ────────────────────────────────────────
router.get("/grupos-disponibles/:nctrl", async (req, res) => {
    try {
        const grupos = await repo.getGruposDisponibles(req.params.nctrl);
        res.json(grupos);
    } catch (err) {
        console.error("Error /coord/grupos-disponibles:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── Inscribir alumno a un grupo (alumno elige, sin sobrecupo) ─────────────────
router.post("/alumnos/cambiar-grupo", async (req, res) => {
    try {
        const { N_ctrl, ID_Grupo_Nuevo, idCoord } = req.body;
        if (!N_ctrl || !ID_Grupo_Nuevo)
            return res.status(400).json({ success: false, error: "Datos incompletos" });
        const result = await repo.cambiarGrupoAlumno(N_ctrl, parseInt(ID_Grupo_Nuevo), false);
        if (result.success)
            await registrar(idCoord, "ALU_GRUPO",
                `Alumno ${N_ctrl} inscrito en grupo ${ID_Grupo_Nuevo}`);
        res.json(result);
    } catch (err) {
        console.error("Error cambiar-grupo:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── Inscribir alumno como coordinador (+5 de sobrecupo permitido) ─────────────
router.post("/alumnos/inscribir-coord", async (req, res) => {
    try {
        const { N_ctrl, ID_Grupo_Nuevo, idCoord } = req.body;
        if (!N_ctrl || !ID_Grupo_Nuevo)
            return res.status(400).json({ success: false, error: "Datos incompletos" });
        const result = await repo.cambiarGrupoAlumno(N_ctrl, parseInt(ID_Grupo_Nuevo), true);
        if (result.success)
            await registrar(idCoord, "ALU_GRUPO",
                `Coordinador inscribió alumno ${N_ctrl} en grupo ${ID_Grupo_Nuevo} (sobrecupo)`);
        res.json(result);
    } catch (err) {
        console.error("Error inscribir-coord:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── Cambiar especialidad ──────────────────────────────────────────────────────
router.put("/alumnos/:nctrl/especialidad", async (req, res) => {
    try {
        const { ID_Especialidad, idCoord } = req.body;
        if (!ID_Especialidad)
            return res.status(400).json({ success: false, error: "ID_Especialidad requerido" });
        await repo.cambiarEspecialidad(req.params.nctrl, ID_Especialidad);
        await registrar(idCoord, "ALU_ESPECIALIDAD",
            `Alumno ${req.params.nctrl}: especialidad actualizada a ${ID_Especialidad}`);
        res.json({ success: true });
    } catch (err) {
        console.error("Error cambiar especialidad:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── Cambiar carrera ───────────────────────────────────────────────────────────
router.put("/alumnos/:nctrl/carrera", async (req, res) => {
    try {
        const { id_carrera_nueva, idCoord, idDepto } = req.body;
        if (!id_carrera_nueva)
            return res.status(400).json({ success: false, error: "id_carrera_nueva requerido" });

        // Solo carreras del mismo departamento
        const carreras = await repo.getCarreras(idDepto);
        if (!carreras.find(c => c.id_carrera == id_carrera_nueva))
            return res.json({ success: false, mensaje: "La carrera no pertenece a tu departamento" });

        await repo.cambiarCarrera(req.params.nctrl, id_carrera_nueva);
        await registrar(idCoord, "ALU_CARRERA",
            `Alumno ${req.params.nctrl} transferido a carrera ${id_carrera_nueva}`);
        res.json({ success: true });
    } catch (err) {
        console.error("Error cambiar carrera:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── Carreras del departamento ─────────────────────────────────────────────────
router.get("/carreras/:idDepto", async (req, res) => {
    try {
        const carreras = await repo.getCarreras(req.params.idDepto);
        res.json(carreras);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Especialidades del departamento ──────────────────────────────────────────
router.get("/especialidades/:idDepto", async (req, res) => {
    try {
        const especialidades = await repo.getEspecialidades(req.params.idDepto);
        res.json(especialidades);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;