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
                    COALESCE(cal.Parcial1,  NULL) AS Parcial1,
                    COALESCE(cal.Parcial2,  NULL) AS Parcial2,
                    COALESCE(cal.Parcial3,  NULL) AS Parcial3,
                    COALESCE(cal.CalFinal,  NULL) AS CalFinal,
                    COALESCE(cal.Estatus, 'EN CURSO') AS Estatus
                FROM Inscripciones i
                JOIN Alumnos a ON i.N_ctrl = a.N_ctrl
                LEFT JOIN Calificaciones cal ON cal.ID_Inscripcion = i.ID_Inscripcion
                WHERE i.ID_Grupo = @ID_Grupo
                ORDER BY a.Apellidos, a.Nombre
            `);
        return result.recordset;
    },

    // Guardar / actualizar calificaciones de un alumno
    // Crea el registro en Calificaciones si no existe
    upsertCalificacion: async (idInscripcion, parcial1, parcial2, parcial3) => {
        const pool = await getPool();

        // Calcular final como promedio de los parciales que ya tengan valor
        const vals   = [parcial1, parcial2, parcial3].filter(v => v !== null && v !== undefined && v !== '');
        const calFinal = vals.length > 0
            ? (vals.reduce((a, b) => a + parseFloat(b), 0) / 3).toFixed(2)
            : null;

        const estatus = calFinal !== null
            ? (parseFloat(calFinal) >= 70 ? 'APROBADO' : 'REPROBADO')
            : 'EN CURSO';

        const toNum = v => (v === null || v === undefined || v === '') ? null : parseFloat(v);

        await pool.request()
            .input("ID_Inscripcion", sql.Int,          idInscripcion)
            .input("Parcial1",       sql.Decimal(5,2),  toNum(parcial1))
            .input("Parcial2",       sql.Decimal(5,2),  toNum(parcial2))
            .input("Parcial3",       sql.Decimal(5,2),  toNum(parcial3))
            .input("CalFinal",       sql.Decimal(5,2),  toNum(calFinal))
            .input("Estatus",        sql.NVarChar,       estatus)
            .query(`
                MERGE Calificaciones AS target
                USING (SELECT @ID_Inscripcion AS ID_Inscripcion) AS source
                ON target.ID_Inscripcion = source.ID_Inscripcion
                WHEN MATCHED THEN
                    UPDATE SET
                        Parcial1 = @Parcial1,
                        Parcial2 = @Parcial2,
                        Parcial3 = @Parcial3,
                        CalFinal = @CalFinal,
                        Estatus  = @Estatus
                WHEN NOT MATCHED THEN
                    INSERT (ID_Inscripcion, Parcial1, Parcial2, Parcial3, CalFinal, Estatus)
                    VALUES (@ID_Inscripcion, @Parcial1, @Parcial2, @Parcial3, @CalFinal, @Estatus);
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
    }
};

module.exports = docenteRepository;
