const express = require("express");
const router  = express.Router();
const sql     = require("mssql");


const { getPool } = require("../config/database"); 

// ── AUXILIAR: Formateador robusto de horas 
const formatTime = (time) => {
    if (!time) return "";
    // Si viene como string tipo "19:00:00" -> "19:00"
    if (typeof time === 'string') return time.substring(0, 5);
    // Si viene como objeto nativo de mssql { hours: 19, minutes: 0 }
    if (time.hours !== undefined && time.minutes !== undefined) {
        const hh = String(time.hours).padStart(2, '0');
        const mm = String(time.minutes).padStart(2, '0');
        return `${hh}:${mm}`;
    }
    // Si viene como tipo Date
    if (time instanceof Date) {
        return time.toTimeString().substring(0, 5);
    }
    return time.toString().substring(0, 5);
};

// ── 1. GET: OBTENER HORARIO MAPEADO PARA EL FRONTEND ──────────────────────────
router.get("/horario/:idDocente", async (req, res) => {
    const idDocente = req.params.idDocente;
    try {
        // Adaptar al gestor de conexiones que use tu proyecto (getPool() o poolPromise)
        const pool = await getPool(); 
        
        const result = await pool.request()
            .input("ID_Docente", sql.Int, idDocente)
            .query(`
                SELECT 
                    g.ID_Grupo, 
                    m.Nombre AS Materia, 
                    m.Clave AS ClaveMateria, 
                    c.nombre AS Carrera, 
                    g.Aula AS AulaOriginal, 
                    hg.DiaSemana, 
                    hg.HoraInicio, 
                    hg.HoraFin
                FROM Grupos g
                INNER JOIN Materias m ON g.ID_Materia = m.ID_Materia
                INNER JOIN carrera c ON m.id_carrera = c.id_carrera
                INNER JOIN PeriodosEscolares pe ON g.ID_Periodo = pe.ID_Periodo
                LEFT JOIN HorarioGrupo hg ON g.ID_Grupo = hg.ID_Grupo
                WHERE g.ID_Docente = @ID_Docente 
                  AND pe.Activo = 1 
                  AND g.Estatus = 'ABIERTO'
            `);

        const horarioMap = {};

        // Procesamos filas y las agrupamos en la estructura que Horario.html espera
        result.recordset.forEach(row => {
            const id = row.ID_Grupo;
            
            if (!horarioMap[id]) {
                horarioMap[id] = {
                    Materia: row.Materia,
                    Carrera: row.Carrera,
                    // El HTML renderiza h.ClaveGrupo. Usamos ID_Grupo o Clave de Materia como fallback seguro
                    ClaveGrupo: row.ClaveMateria || `GRP-${id}`, 
                    Lunes: "", AulaLunes: "",
                    Martes: "", AulaMartes: "",
                    Miercoles: "", AulaMiercoles: "",
                    Jueves: "", AulaJueves: "",
                    Viernes: "", AulaViernes: ""
                };
            }

            if (row.DiaSemana) {
                // Normalizamos el texto del día para evitar problemas de acentos o espacios
                let dia = row.DiaSemana.trim().toLowerCase()
                    .replace('é', 'e').replace('í', 'i').replace('á', 'a');
                
                let propDia = "";
                if (dia === "lunes") propDia = "Lunes";
                else if (dia === "martes") propDia = "Martes";
                else if (dia === "miercoles") propDia = "Miercoles";
                else if (dia === "jueves") propDia = "Jueves";
                else if (dia === "viernes") propDia = "Viernes";

                if (propDia && row.HoraInicio && row.HoraFin) {
                    const inicio = formatTime(row.HoraInicio);
                    const fin = formatTime(row.HoraFin);
                    
                    // Formato final requerido: "19:00 – 20:00"
                    horarioMap[id][propDia] = `${inicio} – ${fin}`;
                    horarioMap[id][`Aula${propDia}`] = row.AulaOriginal || "AULA";
                }
            }
        });

        // Convertimos el mapa acumulado en un arreglo plano listo para JSON
        const data = Object.values(horarioMap);
        res.json(data);

    } catch (err) {
        console.error("Error en /horario:", err.message);
        res.status(500).json({ error: "Error interno al procesar el horario" });
    }
});

// ── 2. GET: COMPLEMENTO DE INSTRUMENTACIÓN (Para evitar errores en consola) ──
router.get("/instrumentacion/:idDocente", async (req, res) => {
    const idDocente = req.params.idDocente;
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input("ID_Docente", sql.Int, idDocente)
            .query(`
                SELECT 
                    m.Nombre AS Materia,
                    m.Clave AS Grupo,
                    -- Mocks dinámicos o columnas reales si cuentas con ellas
                    1 AS InstrumentacionCompleta,
                    m.NumUnidades AS InstrumentacionActual,
                    m.NumUnidades AS InstrumentacionTotal,
                    1 AS PlaneacionCompleta,
                    m.NumUnidades AS PlaneacionActual,
                    m.NumUnidades AS PlaneacionTotal
                FROM Grupos g
                INNER JOIN Materias m ON g.ID_Materia = m.ID_Materia
                INNER JOIN PeriodosEscolares pe ON g.ID_Periodo = pe.ID_Periodo
                WHERE g.ID_Docente = @ID_Docente AND pe.Activo = 1
            `);
            
        res.json(result.recordset);
    } catch (err) {
        res.json([]);
    }
});

// ── 3. GET: PERFIL DEL DOCENTE ────────────────────────────────────────────────
router.get("/perfil/:idDocente", async (req, res) => {
    const idDocente = parseInt(req.params.idDocente);
    if (!idDocente) return res.status(400).json({ error: "ID inválido" });
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input("ID_Docente", sql.Int, idDocente)
            .query(`
                SELECT ID_Docente, N_ctrl, Nombre, Apellidos, Email
                FROM Docentes
                WHERE ID_Docente = @ID_Docente
            `);
        const docente = result.recordset[0];
        if (!docente) return res.status(404).json({ error: "Docente no encontrado" });
        res.json(docente);
    } catch (err) {
        console.error("Error en /perfil:", err.message);
        res.status(500).json({ error: "Error interno al cargar perfil" });
    }
});
 
// ── 4. GET: GRUPOS ASIGNADOS AL DOCENTE EN EL PERIODO ACTIVO ─────────────────
router.get("/grupos/:idDocente", async (req, res) => {
    const idDocente = parseInt(req.params.idDocente);
    if (!idDocente) return res.status(400).json({ error: "ID inválido" });
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input("ID_Docente", sql.Int, idDocente)
            .query(`
                SELECT
                    g.ID_Grupo,
                    m.Clave      AS ClaveMat,
                    m.Nombre     AS Materia,
                    g.Aula,
                    g.Semestre,
                    c.nombre     AS Carrera,
                    (SELECT STRING_AGG(
                        hg.DiaSemana + ' ' +
                        CONVERT(VARCHAR(5), hg.HoraInicio, 108) + '-' +
                        CONVERT(VARCHAR(5), hg.HoraFin,    108), ', ')
                     FROM HorarioGrupo hg
                     WHERE hg.ID_Grupo = g.ID_Grupo) AS Horario,
                    (SELECT COUNT(*)
                     FROM Inscripciones i
                     WHERE i.ID_Grupo = g.ID_Grupo) AS TotalAlumnos
                FROM Grupos g
                JOIN Materias          m  ON g.ID_Materia = m.ID_Materia
                JOIN carrera           c  ON m.id_carrera = c.id_carrera
                JOIN PeriodosEscolares pe ON g.ID_Periodo = pe.ID_Periodo
                WHERE g.ID_Docente = @ID_Docente AND pe.Activo = 1
                ORDER BY m.Nombre
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error("Error en /grupos:", err.message);
        res.status(500).json({ error: "Error interno al cargar grupos" });
    }
});
 
// ── 5. GET: INFO DEL GRUPO (materia, clave, aula, periodo, carrera) ───────────
router.get("/grupo/:idGrupo/info", async (req, res) => {
    const idGrupo = parseInt(req.params.idGrupo);
    if (!idGrupo) return res.status(400).json({ error: "ID de grupo inválido" });
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input("ID_Grupo", sql.Int, idGrupo)
            .query(`
                SELECT
                    g.ID_Grupo,
                    m.Nombre     AS Materia,
                    m.Clave      AS ClaveMat,
                    g.Aula,
                    g.Semestre,
                    c.nombre     AS Carrera,
                    pe.Nombre    AS Periodo
                FROM Grupos g
                JOIN Materias          m  ON g.ID_Materia = m.ID_Materia
                JOIN carrera           c  ON m.id_carrera = c.id_carrera
                JOIN PeriodosEscolares pe ON g.ID_Periodo = pe.ID_Periodo
                WHERE g.ID_Grupo = @ID_Grupo
            `);
        const info = result.recordset[0];
        if (!info) return res.status(404).json({ error: "Grupo no encontrado" });
        res.json(info);
    } catch (err) {
        console.error("Error en /grupo/info:", err.message);
        res.status(500).json({ error: "Error interno al cargar info del grupo" });
    }
});
 
// ── 6. GET: ALUMNOS CON CALIFICACIONES DE UN GRUPO ───────────────────────────
router.get("/grupo/:idGrupo/calificaciones", async (req, res) => {
    const idGrupo = parseInt(req.params.idGrupo);
    if (!idGrupo) return res.status(400).json({ error: "ID de grupo inválido" });
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input("ID_Grupo", sql.Int, idGrupo)
            .query(`
                SELECT
                    a.N_ctrl,
                    a.Nombre,
                    a.Apellidos,
                    a.Email,
                    i.ID_Inscripcion,
                    m.NumUnidades,
                    cal.Unidad1,
                    cal.Unidad2,
                    cal.Unidad3,
                    cal.Unidad4,
                    cal.Unidad5,
                    cal.CalFinal,
                    COALESCE(cal.Estatus, 'EN CURSO') AS Estatus
                FROM Inscripciones i
                JOIN Alumnos a          ON i.N_ctrl         = a.N_ctrl
                LEFT JOIN Calificaciones cal ON cal.ID_Inscripcion = i.ID_Inscripcion
                JOIN Grupos g           ON g.ID_Grupo       = i.ID_Grupo
                JOIN Materias m         ON m.ID_Materia     = g.ID_Materia
                WHERE i.ID_Grupo = @ID_Grupo
                ORDER BY a.Apellidos, a.Nombre
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error("Error en /grupo/calificaciones:", err.message);
        res.status(500).json({ error: "Error interno al cargar calificaciones" });
    }
});
 
// ── 7. POST: GUARDAR CALIFICACIONES EN BULK ──────────────────────────────────
router.post("/grupo/:idGrupo/calificaciones/bulk", async (req, res) => {
    const idGrupo = parseInt(req.params.idGrupo);
    if (!idGrupo) return res.status(400).json({ success: false, error: "ID de grupo inválido" });
 
    const registros = req.body; // [{ idInscripcion, u1, u2, u3, u4, u5 }, ...]
    if (!Array.isArray(registros) || !registros.length)
        return res.status(400).json({ success: false, error: "Sin datos para guardar" });
 
    try {
        const pool = await getPool();
        const toNum = v => (v === null || v === undefined || v === '') ? null : parseFloat(v);
 
        for (const reg of registros) {
            const u1 = toNum(reg.u1), u2 = toNum(reg.u2), u3 = toNum(reg.u3);
            const u4 = toNum(reg.u4), u5 = toNum(reg.u5);
 
            const vals = [u1, u2, u3, u4, u5].filter(v => v !== null);
            const calFinal = vals.length
                ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2))
                : null;
            const estatus = calFinal !== null
                ? (calFinal >= 70 ? 'APROBADO' : 'REPROBADO')
                : 'EN CURSO';
 
            await pool.request()
                .input("ID_Inscripcion", sql.Int,          reg.idInscripcion)
                .input("Unidad1",        sql.Decimal(5, 2), u1)
                .input("Unidad2",        sql.Decimal(5, 2), u2)
                .input("Unidad3",        sql.Decimal(5, 2), u3)
                .input("Unidad4",        sql.Decimal(5, 2), u4)
                .input("Unidad5",        sql.Decimal(5, 2), u5)
                .input("CalFinal",       sql.Decimal(5, 2), calFinal)
                .input("Estatus",        sql.NVarChar,      estatus)
                .query(`
                    MERGE Calificaciones AS target
                    USING (SELECT @ID_Inscripcion AS ID_Inscripcion) AS source
                    ON target.ID_Inscripcion = source.ID_Inscripcion
                    WHEN MATCHED THEN
                        UPDATE SET
                            Unidad1  = @Unidad1,  Unidad2  = @Unidad2,  Unidad3 = @Unidad3,
                            Unidad4  = @Unidad4,  Unidad5  = @Unidad5,
                            CalFinal = @CalFinal, Estatus  = @Estatus
                    WHEN NOT MATCHED THEN
                        INSERT (ID_Inscripcion, Unidad1, Unidad2, Unidad3, Unidad4, Unidad5, CalFinal, Estatus)
                        VALUES (@ID_Inscripcion, @Unidad1, @Unidad2, @Unidad3, @Unidad4, @Unidad5, @CalFinal, @Estatus);
                `);
        }
 
        res.json({ success: true, saved: registros.length });
    } catch (err) {
        console.error("Error en /calificaciones/bulk:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});
 
module.exports = router;