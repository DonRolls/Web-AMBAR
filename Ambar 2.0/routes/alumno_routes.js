
const express = require("express");
const { getPool, sql } = require("../config/database");
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

// Obtener carreras del alumno
router.get("/alumno/:nctrl/carreras", async (req, res) => {
    try {
        const carreras = await alumnoRepository.getAlumnoCarreras(req.params.nctrl);
        res.json(carreras);
    } catch (err) {
        console.error("Error /alumno/:nctrl/carreras:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Cambiar carrera activa del alumno
router.post("/alumno/:nctrl/carrera", async (req, res) => {
    try {
        const { id_carrera } = req.body;
        if (!id_carrera) {
            return res.status(400).json({ error: "Falta id_carrera" });
        }
        const result = await alumnoRepository.updateActiveCarrera(req.params.nctrl, parseInt(id_carrera));
        res.json(result);
    } catch (err) {
        console.error("Error POST /alumno/:nctrl/carrera:", err.message);
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

// Actividades Disponibles
router.get("/actividades-disponibles/:nctrl", async (req, res) => {
    try {
        const actividades = await alumnoRepository.getActividadesDisponibles(req.params.nctrl);
        res.json(actividades);
    } catch (err) {
        console.error("Error /actividades-disponibles:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Tomar actividad
router.post("/tomar-actividad", async (req, res) => {
    try {
        const { N_ctrl, ID_Catalogo } = req.body;
        if (!N_ctrl || !ID_Catalogo) return res.status(400).json({ success: false, error: "Datos incompletos" });
        const result = await alumnoRepository.tomarActividad(N_ctrl, parseInt(ID_Catalogo));
        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json({ success: false, error: result.mensaje });
        }
    } catch (err) {
        console.error("Error /tomar-actividad:", err.message);
        res.status(500).json({ success: false, error: err.message });
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



// Obtener grupos disponibles para inscripción del alumno
router.get("/grupos-disponibles/:nctrl", async (req, res) => {
    try {
        const nctrl = req.params.nctrl;
        const pool = await getPool();

        const periodo = await alumnoRepository.isPeriodoCargaAbierto();
        if (!periodo) {
            return res.json({ abierto: false, grupos: [] });
        }

        const materiasCursadas = await pool.request()
            .input("N_ctrl", sql.NVarChar, nctrl)
            .query(`SELECT DISTINCT ID_Materia FROM Kardex WHERE N_ctrl = @N_ctrl AND Estatus = 'APROBADO'`);

        const idsCursadas = materiasCursadas.recordset.map(r => r.ID_Materia);
        const excluir = idsCursadas.length ? idsCursadas.join(',') : '0';

        const grupos = await pool.request()
            .input("N_ctrl", sql.NVarChar, nctrl)
            .query(`
                SELECT 
                    g.ID_Grupo, 
                    m.ID_Materia, 
                    m.Clave, 
                    m.Nombre, 
                    m.Creditos,
                    m.Semestre,
                    g.Aula, 
                    g.MaxAlumnos, 
                    d.Nombre + ' ' + d.Apellidos AS Docente,
                    (SELECT COUNT(*) FROM Inscripciones WHERE ID_Grupo = g.ID_Grupo) AS Inscritos,
                    STUFF((
                        SELECT ', ' + CONCAT(DiaSemana, ' ', FORMAT(HoraInicio, 'HH:mm'), '-', FORMAT(HoraFin, 'HH:mm'))
                        FROM HorarioGrupo hg
                        WHERE hg.ID_Grupo = g.ID_Grupo
                        FOR XML PATH('')
                    ), 1, 2, '') AS Horario
                FROM Grupos g
                JOIN Materias m ON g.ID_Materia = m.ID_Materia
                JOIN Docentes d ON g.ID_Docente = d.ID_Docente
                JOIN PeriodosEscolares pe ON g.ID_Periodo = pe.ID_Periodo
                JOIN Alumnos a ON a.id_carrera = m.id_carrera
                WHERE a.N_ctrl = @N_ctrl
                  AND pe.Activo = 1
                  AND g.Estatus = 'ABIERTO'
                  AND m.ID_Materia NOT IN (${excluir})
                ORDER BY m.Semestre, m.Nombre
            `);
        res.json({ abierto: true, grupos: grupos.recordset });
    } catch (err) {
        console.error("Error en /grupos-disponibles:", err);
        res.status(500).json({ error: err.message });
    }
});


// Inscribir alumno con validaciones (créditos, cantidad, horario)
router.post("/inscribir-masiva", async (req, res) => {
    try {
        const { N_ctrl, idsGrupos } = req.body; // idsGrupos: array de ID_Grupo
        if (!N_ctrl || !idsGrupos || !idsGrupos.length)
            return res.status(400).json({ success: false, error: "Datos incompletos" });

        const pool = await getPool();
        // Validar período abierto
        const abierto = await alumnoRepository.isPeriodoCargaAbierto();
        if (!abierto) return res.status(403).json({ success: false, error: "Período de carga cerrado" });

        // Obtener información de los grupos seleccionados (materia, créditos, horario)
        const gruposData = await pool.request()
            .query(`SELECT ID_Grupo, ID_Materia, (SELECT Creditos FROM Materias WHERE ID_Materia = g.ID_Materia) AS Creditos
                    FROM Grupos g WHERE ID_Grupo IN (${idsGrupos.join(',')})`);
        if (gruposData.recordset.length !== idsGrupos.length)
            return res.status(400).json({ success: false, error: "Algún grupo no existe" });

        // Obtener materias ya cursadas/aprobadas
        const cursadas = await pool.request()
            .input("N_ctrl", sql.NVarChar, N_ctrl)
            .query(`SELECT ID_Materia FROM Kardex WHERE N_ctrl = @N_ctrl AND Estatus = 'APROBADO'`);
        const idsCursadas = cursadas.recordset.map(r => r.ID_Materia);
        for (let g of gruposData.recordset) {
            if (idsCursadas.includes(g.ID_Materia))
                return res.status(400).json({ success: false, error: `Ya aprobaste la materia con ID ${g.ID_Materia}` });
        }

        // Validar cupo individual
        for (let idGrupo of idsGrupos) {
            const cupoRes = await pool.request()
                .input("ID_Grupo", sql.Int, idGrupo)
                .input("EsCoord", sql.Bit, 0)
                .execute("sp_ValidarCupoGrupo");
            if (!cupoRes.recordset[0].PuedeInscribir)
                return res.status(400).json({ success: false, error: `El grupo ${idGrupo} está lleno` });
        }

        // Validar conflictos de horario entre los grupos seleccionados
        const horarios = await pool.request()
            .query(`SELECT ID_Grupo, DiaSemana, HoraInicio, HoraFin
                    FROM HorarioGrupo WHERE ID_Grupo IN (${idsGrupos.join(',')})`);
        // Detectar solapamiento
        for (let i = 0; i < horarios.recordset.length; i++) {
            for (let j = i + 1; j < horarios.recordset.length; j++) {
                const h1 = horarios.recordset[i], h2 = horarios.recordset[j];
                if (h1.DiaSemana === h2.DiaSemana &&
                    ((h1.HoraInicio < h2.HoraFin && h1.HoraFin > h2.HoraInicio))) {
                    return res.status(400).json({ success: false, error: `Conflicto de horario entre los grupos ${h1.ID_Grupo} y ${h2.ID_Grupo}` });
                }
            }
        }

        // Validar límite de materias (máx 8)
        if (idsGrupos.length > 8)
            return res.status(400).json({ success: false, error: "Máximo 8 materias por periodo" });

        // Validar suma de créditos (máx 36)
        const creditosTotales = gruposData.recordset.reduce((sum, g) => sum + g.Creditos, 0);
        if (creditosTotales > 36)
            return res.status(400).json({ success: false, error: "La suma de créditos no puede superar 36" });

        // Realizar inscripciones
        const inscritos = [];
        for (let idGrupo of idsGrupos) {
            await alumnoRepository.inscribirAlumno(N_ctrl, idGrupo);
            inscritos.push(idGrupo);
        }
        res.json({ success: true, inscritos });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post("/inscribir-masiva", async (req, res) => {
    try {
        const { N_ctrl, idsGrupos } = req.body;
        if (!N_ctrl || !idsGrupos || !idsGrupos.length)
            return res.status(400).json({ success: false, error: "Datos incompletos" });

        const pool = await getPool();

        // Verificar período abierto
        const abierto = await alumnoRepository.isPeriodoCargaAbierto();
        if (!abierto)
            return res.status(403).json({ success: false, error: "Período de carga cerrado" });

        // Obtener datos de los grupos (incluyendo créditos y horarios)
        const gruposData = await pool.request()
            .query(`
                SELECT g.ID_Grupo, m.ID_Materia, m.Creditos,
                       (SELECT STRING_AGG(CONCAT(DiaSemana, ' ', FORMAT(HoraInicio, 'HH:mm'), '-', FORMAT(HoraFin, 'HH:mm')), ', ')
                        FROM HorarioGrupo WHERE ID_Grupo = g.ID_Grupo) AS Horario
                FROM Grupos g
                JOIN Materias m ON g.ID_Materia = m.ID_Materia
                WHERE g.ID_Grupo IN (${idsGrupos.join(',')})
            `);

        if (gruposData.recordset.length !== idsGrupos.length)
            return res.status(400).json({ success: false, error: "Algún grupo no existe" });

        // Verificar materias ya aprobadas
        const cursadas = await pool.request()
            .input("N_ctrl", sql.NVarChar, N_ctrl)
            .query(`SELECT ID_Materia FROM Kardex WHERE N_ctrl = @N_ctrl AND Estatus = 'APROBADO'`);
        const idsCursadas = cursadas.recordset.map(r => r.ID_Materia);
        for (let g of gruposData.recordset) {
            if (idsCursadas.includes(g.ID_Materia))
                return res.status(400).json({ success: false, error: `Ya aprobaste la materia con ID ${g.ID_Materia}` });
        }

        // Validar cupo individual
        for (let idGrupo of idsGrupos) {
            const cupoRes = await pool.request()
                .input("ID_Grupo", sql.Int, idGrupo)
                .input("EsCoord", sql.Bit, 0)
                .execute("sp_ValidarCupoGrupo");
            if (!cupoRes.recordset[0].PuedeInscribir)
                return res.status(400).json({ success: false, error: `El grupo ${idGrupo} está lleno` });
        }

        // Validar conflictos de horario entre los grupos seleccionados
        for (let i = 0; i < gruposData.recordset.length; i++) {
            for (let j = i + 1; j < gruposData.recordset.length; j++) {
                const horario1 = gruposData.recordset[i].Horario || '';
                const horario2 = gruposData.recordset[j].Horario || '';
                if (hayConflictoHorario(horario1, horario2)) {
                    return res.status(400).json({ success: false, error: `Conflicto de horario entre los grupos ${gruposData.recordset[i].ID_Grupo} y ${gruposData.recordset[j].ID_Grupo}` });
                }
            }
        }

        // Validar límite de materias (máx 8)
        if (idsGrupos.length > 8)
            return res.status(400).json({ success: false, error: "Máximo 8 materias por periodo" });

        // Validar suma de créditos (máx 36)
        const creditosTotales = gruposData.recordset.reduce((sum, g) => sum + g.Creditos, 0);
        if (creditosTotales > 36)
            return res.status(400).json({ success: false, error: "La suma de créditos no puede superar 36" });

        // Realizar inscripciones
        for (let idGrupo of idsGrupos) {
            await alumnoRepository.inscribirAlumno(N_ctrl, idGrupo);
        }
        res.json({ success: true, inscritos: idsGrupos });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Función auxiliar (debe estar definida antes o importada)
function hayConflictoHorario(horario1, horario2) {
    if (!horario1 || !horario2) return false;
    function parseHorario(horarioStr) {
        const bloques = horarioStr.split(',').map(b => b.trim());
        const parsed = [];
        for (const bloque of bloques) {
            const match = bloque.match(/^(\w+)\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/);
            if (match) {
                const dia = match[1];
                const inicioMin = timeToMinutes(match[2]);
                const finMin = timeToMinutes(match[3]);
                parsed.push({ dia, inicioMin, finMin });
            }
        }
        return parsed;
    }
    function timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }
    const horarios1 = parseHorario(horario1);
    const horarios2 = parseHorario(horario2);
    for (const h1 of horarios1) {
        for (const h2 of horarios2) {
            if (h1.dia === h2.dia && h1.inicioMin < h2.finMin && h1.finMin > h2.inicioMin)
                return true;
        }
    }
    return false;
}
module.exports = router;
//zeus deja de romper todo por favor, ya casi acabamos :c