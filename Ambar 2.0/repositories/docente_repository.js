// repositories/docente_repository.js
const { getPool, sql } = require("../config/database");

const docenteRepository = {

    // Login con N_ctrl y Pass
    loginDocente: async (nctrl, pass) => {
        const pool = await getPool();
        const result = await pool.request()
            .input("N_ctrl", sql.NVarChar, nctrl)
            .input("Pass",   sql.NVarChar, pass)
            .query(`SELECT ID_Docente, N_ctrl, Nombre, Apellidos, Email
                    FROM Docentes
                    WHERE N_ctrl = @N_ctrl AND Pass = @Pass`);
        return result.recordset[0] || null;
    },

    // Obtener datos completos del docente por ID
    getDocenteById: async (idDocente) => {
        const pool = await getPool();
        const result = await pool.request()
            .input("ID_Docente", sql.Int, idDocente)
            .query(`SELECT ID_Docente, N_ctrl, Nombre, Apellidos, Email
                    FROM Docentes
                    WHERE ID_Docente = @ID_Docente`);
        return result.recordset[0] || null;
    },

    // Grupos asignados al docente en el periodo activo
    getGruposDocente: async (idDocente) => {
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
                    c.Nombre     AS Carrera,
                    (SELECT STRING_AGG(
                        hg.DiaSemana + ' ' +
                        CONVERT(VARCHAR(5), hg.HoraInicio, 108) + '-' +
                        CONVERT(VARCHAR(5), hg.HoraFin,    108), ', ')
                     FROM HorarioGrupo hg
                     WHERE hg.ID_Grupo = g.ID_Grupo) AS Horario,
                    (SELECT COUNT(*) FROM Inscripciones i WHERE i.ID_Grupo = g.ID_Grupo) AS TotalAlumnos
                FROM Grupos g
                JOIN Materias          m  ON g.ID_Materia  = m.ID_Materia
                JOIN carrera           c  ON m.id_carrera  = c.id_carrera
                JOIN PeriodosEscolares pe ON g.ID_Periodo  = pe.ID_Periodo
                WHERE g.ID_Docente = @ID_Docente AND pe.Activo = 1
                ORDER BY m.Nombre
            `);
        return result.recordset;
    },

    // Alumnos de un grupo con sus calificaciones actuales
    getAlumnosGrupoConCalif: async (idGrupo) => {
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
                    COALESCE(cal.Unidad1,  NULL) AS Unidad1,
                    COALESCE(cal.Unidad2,  NULL) AS Unidad2,
                    COALESCE(cal.Unidad3,  NULL) AS Unidad3,
                    COALESCE(cal.Unidad4,  NULL) AS Unidad4,
                    COALESCE(cal.Unidad5,  NULL) AS Unidad5,
                    COALESCE(cal.CalFinal, NULL) AS CalFinal,
                    COALESCE(cal.Estatus, 'EN CURSO') AS Estatus
                FROM Inscripciones i
                JOIN Alumnos a ON i.N_ctrl = a.N_ctrl
                LEFT JOIN Calificaciones cal ON cal.ID_Inscripcion = i.ID_Inscripcion
                JOIN Grupos g ON g.ID_Grupo = i.ID_Grupo
                JOIN Materias m ON m.ID_Materia = g.ID_Materia
                WHERE i.ID_Grupo = @ID_Grupo
                ORDER BY a.Apellidos, a.Nombre
            `);
        return result.recordset;
    },

    // Guardar / actualizar calificaciones — soporta 3, 4 o 5 unidades dinámicamente
    upsertCalificacion: async (idInscripcion, unidades) => {
        // unidades = { u1, u2, u3, u4?, u5? }
        const pool = await getPool();
        const toNum = v => (v === null || v === undefined || v === '') ? null : parseFloat(v);

        const u1 = toNum(unidades.u1);
        const u2 = toNum(unidades.u2);
        const u3 = toNum(unidades.u3);
        const u4 = toNum(unidades.u4 ?? null);
        const u5 = toNum(unidades.u5 ?? null);

        // Promedio sobre las unidades con valor
        const vals = [u1, u2, u3, u4, u5].filter(v => v !== null);
        const calFinal = vals.length > 0
            ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2))
            : null;

        const estatus = calFinal !== null
            ? (calFinal >= 70 ? 'APROBADO' : 'REPROBADO')
            : 'EN CURSO';

        const req = pool.request()
            .input("ID_Inscripcion", sql.Int,         idInscripcion)
            .input("Unidad1",        sql.Decimal(5,2), u1)
            .input("Unidad2",        sql.Decimal(5,2), u2)
            .input("Unidad3",        sql.Decimal(5,2), u3)
            .input("Unidad4",        sql.Decimal(5,2), u4)
            .input("Unidad5",        sql.Decimal(5,2), u5)
            .input("CalFinal",       sql.Decimal(5,2), calFinal)
            .input("Estatus",        sql.NVarChar,     estatus);

        await req.query(`
            MERGE Calificaciones AS target
            USING (SELECT @ID_Inscripcion AS ID_Inscripcion) AS source
            ON target.ID_Inscripcion = source.ID_Inscripcion
            WHEN MATCHED THEN
                UPDATE SET
                    Unidad1  = @Unidad1,
                    Unidad2  = @Unidad2,
                    Unidad3  = @Unidad3,
                    Unidad4  = @Unidad4,
                    Unidad5  = @Unidad5,
                    CalFinal = @CalFinal,
                    Estatus  = @Estatus
            WHEN NOT MATCHED THEN
                INSERT (ID_Inscripcion, Unidad1, Unidad2, Unidad3, Unidad4, Unidad5, CalFinal, Estatus)
                VALUES (@ID_Inscripcion, @Unidad1, @Unidad2, @Unidad3, @Unidad4, @Unidad5, @CalFinal, @Estatus);
        `);

        return { calFinal, estatus };
    },

    // Info del grupo (para la cabecera de la pantalla de calificaciones)
    getGrupoInfo: async (idGrupo) => {
        const pool = await getPool();
        const result = await pool.request()
            .input("ID_Grupo", sql.Int, idGrupo)
            .query(`
                SELECT
                    g.ID_Grupo,
                    m.Nombre  AS Materia,
                    m.Clave   AS ClaveMat,
                    g.Aula,
                    g.Semestre,
                    c.Nombre  AS Carrera,
                    pe.Nombre AS Periodo
                FROM Grupos g
                JOIN Materias          m  ON g.ID_Materia = m.ID_Materia
                JOIN carrera           c  ON m.id_carrera = c.id_carrera
                JOIN PeriodosEscolares pe ON g.ID_Periodo = pe.ID_Periodo
                WHERE g.ID_Grupo = @ID_Grupo
            `);
        return result.recordset[0] || null;
    },

    getHorarioDocente: async (idDocente) => {
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
    return result.recordset;
},

getInstrumentacionDocente: async (idDocente) => {
    const pool = await getPool();
    const result = await pool.request()
        .input("ID_Docente", sql.Int, idDocente)
        .query(`
            SELECT 
                m.Nombre AS Materia,
                m.Clave AS Grupo,
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
    return result.recordset;
}
};

module.exports = docenteRepository;
