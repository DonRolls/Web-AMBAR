// routes/coordinador.routes.js
const express = require("express");
const router = express.Router();
const repo = require("../repositories/coordinador_repository");

// Helper para registrar historial
async function registrar(idCoord, tipo, desc) {
    await repo.registrarHistorial(idCoord, tipo, desc);
}

// Stats
router.get("/stats/:idDepto", async (req, res) => {
    try {
        const stats = await repo.getStats(req.params.idDepto);
        res.json(stats);
    } catch (err) {
        console.error("Error /coord/stats:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Historial
router.get("/historial/:idCoord", async (req, res) => {
    try {
        const historial = await repo.getHistorial(req.params.idCoord);
        res.json(historial);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Docentes
router.get("/docentes", async (req, res) => {
    try {
        const docentes = await repo.getDocentes();
        res.json(docentes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Grupos
router.get("/grupos/:idDepto", async (req, res) => {
    try {
        const grupos = await repo.getGrupos(req.params.idDepto);
        res.json(grupos);
    } catch (err) {
        console.error("Error /coord/grupos:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Cambiar estatus de grupo
router.put("/grupos/:id/estatus", async (req, res) => {
    try {
        const gid = parseInt(req.params.id);
        const { Estatus, idCoord, descripcion } = req.body;
        if (!['ABIERTO','CERRADO'].includes(Estatus))
            return res.status(400).json({ success: false, error: "Estatus inválido" });
        await repo.updateGrupoEstatus(gid, Estatus);
        await registrar(idCoord, "GRUPO_ESTATUS", descripcion);
        res.json({ success: true });
    } catch (err) {
        console.error("Error PUT estatus:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Editar grupo (docente/aula)
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

// Editar horario
router.put("/grupos/:id/horario", async (req, res) => {
    try {
        const gid = parseInt(req.params.id);
        const { horarios, idCoord } = req.body;
        if (!Array.isArray(horarios) || !horarios.length)
            return res.status(400).json({ success: false, error: "Horarios vacíos" });
        await repo.updateHorario(gid, horarios);
        await registrar(idCoord, "GRUPO_EDIT", `Horario del grupo actualizado`);
        res.json({ success: true });
    } catch (err) {
        console.error("Error PUT horario:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Alumnos
router.get("/alumnos/:idDepto", async (req, res) => {
    try {
        const alumnos = await repo.getAlumnos(req.params.idDepto);
        res.json(alumnos);
    } catch (err) {
        console.error("Error /coord/alumnos:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Grupos disponibles para un alumno
router.get("/grupos-disponibles/:nctrl", async (req, res) => {
    try {
        const grupos = await repo.getGruposDisponibles(req.params.nctrl);
        res.json(grupos);
    } catch (err) {
        console.error("Error /coord/grupos-disponibles:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Cambiar grupo de alumno
router.post("/alumnos/cambiar-grupo", async (req, res) => {
    try {
        const { N_ctrl, ID_Grupo_Nuevo, idCoord } = req.body;
        if (!N_ctrl || !ID_Grupo_Nuevo)
            return res.status(400).json({ success: false, error: "Datos incompletos" });
        const result = await repo.cambiarGrupoAlumno(N_ctrl, parseInt(ID_Grupo_Nuevo));
        if (result.success) {
            await registrar(idCoord, "ALU_GRUPO", `Alumno ${N_ctrl} inscrito en grupo ${ID_Grupo_Nuevo}`);
        }
        res.json(result);
    } catch (err) {
        console.error("Error cambiar grupo:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Cambiar especialidad
router.put("/alumnos/:nctrl/especialidad", async (req, res) => {
    try {
        const { ID_Especialidad, idCoord } = req.body;
        await repo.cambiarEspecialidad(req.params.nctrl, ID_Especialidad);
        await registrar(idCoord, "ALU_ESPECIALIDAD", `Alumno ${req.params.nctrl} especialidad actualizada`);
        res.json({ success: true });
    } catch (err) {
        console.error("Error cambiar especialidad:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Cambiar carrera
router.put("/alumnos/:nctrl/carrera", async (req, res) => {
    try {
        const { id_carrera_nueva, idCoord, idDepto } = req.body;
        // Validar que la carrera pertenezca al depto
        const carreras = await repo.getCarreras(idDepto);
        if (!carreras.find(c => c.id_carrera == id_carrera_nueva))
            return res.json({ success: false, mensaje: "La carrera no pertenece a tu departamento" });
        await repo.cambiarCarrera(req.params.nctrl, id_carrera_nueva);
        await registrar(idCoord, "ALU_CARRERA", `Alumno ${req.params.nctrl} transferido a carrera ${id_carrera_nueva}`);
        res.json({ success: true });
    } catch (err) {
        console.error("Error cambiar carrera:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Carreras del depto
router.get("/carreras/:idDepto", async (req, res) => {
    try {
        const carreras = await repo.getCarreras(req.params.idDepto);
        res.json(carreras);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Especialidades de una carrera (o depto)
router.get("/especialidades/:idDepto", async (req, res) => {
    try {
        const especialidades = await repo.getEspecialidades(req.params.idDepto);
        res.json(especialidades);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;