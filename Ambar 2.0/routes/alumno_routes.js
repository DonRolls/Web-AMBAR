
const express = require("express");
const router = express.Router();
const alumnoRepository = require("../repositories/alumno_repository");

// Datos del alumno
router.get("/alumno/:nctrl", async (req, res) => {
    try {
        const alumno = await alumnoRepository.getAlumnoByNctrl(req.params.nctrl);
        if (!alumno) return res.status(404).json({ error: "Alumno no encontrado" });
        res.json(alumno);
    } catch (err) {
        console.error("Error /alumno:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Horario
router.get("/horario/:nctrl", async (req, res) => {
    try {
        const horario = await alumnoRepository.getHorario(req.params.nctrl);
        res.json(horario);
    } catch (err) {
        console.error("Error /horario:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Calificaciones
router.get("/calificaciones/:nctrl/:idPeriodo", async (req, res) => {
    try {
        const calificaciones = await alumnoRepository.getCalificaciones(
            req.params.nctrl,
            req.params.idPeriodo
        );
        res.json(calificaciones);
    } catch (err) {
        console.error("Error /calificaciones:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Kárdex
router.get("/kardex/:nctrl", async (req, res) => {
    try {
        const kardex = await alumnoRepository.getKardex(req.params.nctrl);
        res.json(kardex);
    } catch (err) {
        console.error("Error /kardex:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Actividades
router.get("/actividades/:nctrl", async (req, res) => {
    try {
        const actividades = await alumnoRepository.getActividades(req.params.nctrl);
        res.json(actividades);
    } catch (err) {
        console.error("Error /actividades:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Recibos
router.get("/recibos/:nctrl", async (req, res) => {
    try {
        const recibos = await alumnoRepository.getRecibos(
            req.params.nctrl,
            req.query.historico === "1"
        );
        res.json(recibos);
    } catch (err) {
        console.error("Error /recibos:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Tickets
router.get("/tickets/:nctrl", async (req, res) => {
    try {
        const tickets = await alumnoRepository.getTickets(
            req.params.nctrl,
            req.query.estatus
        );
        res.json(tickets);
    } catch (err) {
        console.error("Error /tickets:", err.message);
        res.status(500).json({ error: err.message });
    }
});

router.post("/tickets", async (req, res) => {
    try {
        const { N_ctrl, descripcion } = req.body;
        const clave = await alumnoRepository.createTicket(N_ctrl, descripcion);
        res.json({ success: true, clave });
    } catch (err) {
        console.error("Error POST /tickets:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Periodos
router.get("/periodos", async (req, res) => {
    try {
        const periodos = await alumnoRepository.getPeriodos();
        res.json(periodos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Inscribir alumno a un grupo (con validación de cupo)
router.post("/inscribir", async (req, res) => {
    try {
        const { N_ctrl, ID_Grupo } = req.body;
        if (!N_ctrl || !ID_Grupo)
            return res.status(400).json({ success: false, error: "Datos incompletos" });
        const result = await alumnoRepository.inscribirAlumno(N_ctrl, parseInt(ID_Grupo));
        res.json(result);
    } catch (err) {
        console.error("Error POST /inscribir:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Periodo de carga
router.get("/periodo-carga", async (req, res) => {
    try {
        const abierto = await alumnoRepository.isPeriodoCargaAbierto();
        res.json({ abierto });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Grupos disponibles
router.get("/grupos-disponibles/:nctrl", async (req, res) => {
    try {
        const grupos = await alumnoRepository.getGruposDisponibles(req.params.nctrl);
        res.json(grupos);
    } catch (err) {
        console.error("Error /grupos-disponibles:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Soporte
router.get("/soporte", async (req, res) => {
    try {
        const pool = await require("../config/database").getPool();
        await pool.request().query("SELECT 1");
        res.json({ conectado: true });
    } catch {
        res.json({ conectado: false });
    }
});

module.exports = router;
//zeus deja de romper todo por favor, ya casi acabamos :c