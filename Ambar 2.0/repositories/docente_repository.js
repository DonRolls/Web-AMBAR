// repositories/docente.repository.js
const { getPool, sql } = require("../config/database");

const docenteRepository = {
    // Login con N_ctrl y Pass
    loginDocente: async (nctrl, pass) => {
        const pool = await getPool();
        const result = await pool.request()
            .input("N_ctrl", sql.NVarChar, nctrl)
            .input("Pass", sql.NVarChar, pass)
            .query("SELECT ID_Docente, N_ctrl, Nombre, Apellidos, Email FROM Docentes WHERE N_ctrl = @N_ctrl AND Pass = @Pass");
        return result.recordset[0] || null;
    },

    // Obtener datos completos del docente por ID
    getDocenteById: async (idDocente) => {
        const pool = await getPool();
        const result = await pool.request()
            .input("ID_Docente", sql.Int, idDocente)
            .query("SELECT ID_Docente, Nombre, Apellidos, Email FROM Docentes WHERE ID_Docente = @ID_Docente");
        return result.recordset[0] || null;
    },

    // Grupos asignados al docente en el periodo activo
    getGruposDocente: async (idDocente) => {
        const pool = await getPool();
        const result = await pool.request()
            .input("ID_Docente", sql.Int, idDocente)
            .query(`
                SELECT g.ID_Grupo, m.Clave AS ClaveMat, m.Nombre AS Materia, g.Aula, g.Semestre,
                       c.Nombre AS Carrera,
                       (SELECT STRING_AGG(
                           hg.DiaSemana + ' ' +
                           CONVERT(VARCHAR(5), hg.HoraInicio, 108) + '-' +
                           CONVERT(VARCHAR(5), hg.HoraFin, 108), ', ')
                        FROM HorarioGrupo hg WHERE hg.ID_Grupo = g.ID_Grupo) AS Horario
                FROM Grupos g
                JOIN Materias m ON g.ID_Materia = m.ID_Materia
                JOIN carrera c ON m.id_carrera = c.id_carrera
                JOIN PeriodosEscolares pe ON g.ID_Periodo = pe.ID_Periodo
                WHERE g.ID_Docente = @ID_Docente AND pe.Activo = 1
                ORDER BY m.Nombre
            `);
        return result.recordset;
    },

    // Alumnos de un grupo específico (para futuras funcionalidades)
    getAlumnosGrupo: async (idGrupo) => {
        const pool = await getPool();
        const result = await pool.request()
            .input("ID_Grupo", sql.Int, idGrupo)
            .query(`
                SELECT a.N_ctrl, a.Nombre, a.Apellidos, a.Email
                FROM Inscripciones i
                JOIN Alumnos a ON i.N_ctrl = a.N_ctrl
                WHERE i.ID_Grupo = @ID_Grupo
                ORDER BY a.Apellidos, a.Nombre
            `);
        return result.recordset;
    }
};

module.exports = docenteRepository;