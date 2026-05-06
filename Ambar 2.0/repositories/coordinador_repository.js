// repositories/coordinador.repository.js
const { getPool, sql } = require("../config/database");

const coordinadorRepository = {
    loginCoordinador: async (nctrl, pass) => {
        const pool = await getPool();
        const result = await pool.request()
            .input("N_ctrl", sql.NVarChar, nctrl)
            .input("Pass", sql.NVarChar, pass)
            .execute("sp_LoginCoordinador");
        return result.recordset[0] || null;
    },

    getStats: async (idDepto) => {
        const pool = await getPool();
        const result = await pool.request()
            .input("ID_Departamento", sql.Int, parseInt(idDepto))
            .execute("sp_CoordStats");
        return result.recordset[0] || {};
    },

    getHistorial: async (idCoord) => {
        const pool = await getPool();
        const result = await pool.request()
            .input("ID_Coordinador", sql.Int, parseInt(idCoord))
            .query(`
                SELECT TOP 20
                       TipoCambio, Descripcion,
                       CONVERT(VARCHAR(16), Fecha, 120) AS Fecha
                FROM HistorialCambios
                WHERE ID_Coordinador = @ID_Coordinador
                ORDER BY Fecha DESC
            `);
        return result.recordset;
    },

    getDocentes: async () => {
        const pool = await getPool();
        const result = await pool.request()
            .query("SELECT ID_Docente, Nombre+' '+Apellidos AS NombreCompleto FROM Docentes ORDER BY Nombre");
        return result.recordset;
    },

    getGrupos: async (idDepto) => {
        const pool = await getPool();
        const result = await pool.request()
            .input("ID_Departamento", sql.Int, parseInt(idDepto))
            .query(`
                SELECT g.ID_Grupo, g.Aula, g.Semestre, g.Estatus, g.ID_Docente,
                       m.Clave AS ClaveMat, m.Nombre AS Materia, m.Creditos,
                       d.Nombre+' '+d.Apellidos AS Docente,
                       (SELECT COUNT(*) FROM Inscripciones WHERE ID_Grupo = g.ID_Grupo) AS Inscritos,
                       (SELECT STRING_AGG(
                           hg.DiaSemana+' '+
                           CONVERT(VARCHAR(5),hg.HoraInicio,108)+'-'+
                           CONVERT(VARCHAR(5),hg.HoraFin,   108), ' | ')
                        FROM HorarioGrupo hg WHERE hg.ID_Grupo = g.ID_Grupo) AS Horario
                FROM Grupos g
                JOIN Materias m ON g.ID_Materia = m.ID_Materia
                JOIN Docentes d ON g.ID_Docente = d.ID_Docente
                JOIN carrera c  ON m.id_carrera = c.id_carrera
                JOIN PeriodosEscolares pe ON g.ID_Periodo = pe.ID_Periodo
                WHERE pe.Activo = 1
                  AND c.ID_Departamento = @ID_Departamento
                ORDER BY m.Nombre
            `);
        return result.recordset;
    },

    updateGrupoEstatus: async (gid, estatus) => {
        const pool = await getPool();
        await pool.request()
            .input("ID_Grupo", sql.Int, gid)
            .input("Estatus", sql.NVarChar, estatus)
            .query("UPDATE Grupos SET Estatus=@Estatus WHERE ID_Grupo=@ID_Grupo");
    },

    updateGrupo: async (gid, idDocente, aula) => {
        const pool = await getPool();
        await pool.request()
            .input("ID_Grupo", sql.Int, gid)
            .input("ID_Docente", sql.Int, idDocente)
            .input("Aula", sql.NVarChar, aula.trim())
            .query("UPDATE Grupos SET ID_Docente=@ID_Docente, Aula=@Aula WHERE ID_Grupo=@ID_Grupo");
    },

    updateHorario: async (gid, horarios) => {
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        try {
            await new sql.Request(transaction)
                .input("ID_Grupo", sql.Int, gid)
                .query("DELETE FROM HorarioGrupo WHERE ID_Grupo=@ID_Grupo");
            for (const h of horarios) {
                await new sql.Request(transaction)
                    .input("ID_Grupo", sql.Int, gid)
                    .input("DiaSemana", sql.NVarChar, h.DiaSemana)
                    .input("HoraInicio", sql.Time, h.HoraInicio)
                    .input("HoraFin", sql.Time, h.HoraFin)
                    .query(`INSERT INTO HorarioGrupo (ID_Grupo,DiaSemana,HoraInicio,HoraFin)
                            VALUES (@ID_Grupo,@DiaSemana,@HoraInicio,@HoraFin)`);
            }
            await transaction.commit();
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    },

    getAlumnos: async (idDepto) => {
        const pool = await getPool();
        const result = await pool.request()
            .input("ID_Departamento", sql.Int, parseInt(idDepto))
            .query(`
                SELECT a.N_ctrl, a.Nombre, a.Apellidos, a.Email,
                       a.Semestre, a.Estatus, a.id_carrera,
                       c.Nombre AS Carrera,
                       e.Nombre AS Especialidad,
                       e.id_especialidad AS ID_Especialidad,
                       (SELECT COUNT(*) FROM Inscripciones i
                        JOIN Grupos g ON i.ID_Grupo=g.ID_Grupo
                        JOIN PeriodosEscolares pe ON g.ID_Periodo=pe.ID_Periodo
                        WHERE i.N_ctrl=a.N_ctrl AND pe.Activo=1) AS MateriasActuales
                FROM Alumnos a
                JOIN carrera c ON a.id_carrera = c.id_carrera
                LEFT JOIN especialidad e ON a.ID_Especialidad = e.id_especialidad
                WHERE c.ID_Departamento = @ID_Departamento
                ORDER BY a.Apellidos, a.Nombre
            `);
        return result.recordset;
    },

    getGruposDisponibles: async (nctrl) => {
        const pool = await getPool();
        const result = await pool.request()
            .input("N_ctrl", sql.NVarChar, nctrl)
            .query(`
                SELECT g.ID_Grupo, m.Clave, m.Nombre AS Materia,
                       d.Nombre+' '+d.Apellidos AS Docente,
                       g.Aula,
                       (SELECT COUNT(*) FROM Inscripciones WHERE ID_Grupo=g.ID_Grupo) AS Inscritos,
                       (SELECT STRING_AGG(
                           hg.DiaSemana+' '+
                           CONVERT(VARCHAR(5),hg.HoraInicio,108)+'-'+
                           CONVERT(VARCHAR(5),hg.HoraFin,   108), ', ')
                        FROM HorarioGrupo hg WHERE hg.ID_Grupo=g.ID_Grupo) AS Horario
                FROM Grupos g
                JOIN Materias m ON g.ID_Materia = m.ID_Materia
                JOIN Docentes d ON g.ID_Docente = d.ID_Docente
                JOIN PeriodosEscolares pe ON g.ID_Periodo = pe.ID_Periodo
                WHERE pe.Activo = 1
                  AND g.Estatus = 'ABIERTO'
                  AND g.ID_Grupo NOT IN (
                      SELECT i.ID_Grupo FROM Inscripciones i WHERE i.N_ctrl = @N_ctrl
                  )
                ORDER BY m.Nombre
            `);
        return result.recordset;
    },

    cambiarGrupoAlumno: async (nctrl, idGrupoNuevo) => {
        const pool = await getPool();
        const check = await pool.request()
            .input("ID_Grupo", sql.Int, idGrupoNuevo)
            .query("SELECT Estatus FROM Grupos WHERE ID_Grupo=@ID_Grupo");
        if (!check.recordset.length || check.recordset[0].Estatus === 'CERRADO')
            return { success: false, mensaje: "El grupo está cerrado o no existe" };

        const dup = await pool.request()
            .input("N_ctrl", sql.NVarChar, nctrl)
            .input("ID_Grupo", sql.Int, idGrupoNuevo)
            .query("SELECT 1 FROM Inscripciones WHERE N_ctrl=@N_ctrl AND ID_Grupo=@ID_Grupo");
        if (dup.recordset.length)
            return { success: false, mensaje: "El alumno ya está inscrito en ese grupo" };

        await pool.request()
            .input("N_ctrl", sql.NVarChar, nctrl)
            .input("ID_Grupo", sql.Int, idGrupoNuevo)
            .query("INSERT INTO Inscripciones (N_ctrl,ID_Grupo) VALUES (@N_ctrl,@ID_Grupo)");

        const ins = await pool.request()
            .input("N_ctrl", sql.NVarChar, nctrl)
            .input("ID_Grupo", sql.Int, idGrupoNuevo)
            .query("SELECT ID_Inscripcion FROM Inscripciones WHERE N_ctrl=@N_ctrl AND ID_Grupo=@ID_Grupo");
        if (ins.recordset.length) {
            await pool.request()
                .input("ID_Inscripcion", sql.Int, ins.recordset[0].ID_Inscripcion)
                .query("INSERT INTO Calificaciones (ID_Inscripcion) VALUES (@ID_Inscripcion)");
        }
        return { success: true };
    },

    cambiarEspecialidad: async (nctrl, idEspecialidad) => {
        const pool = await getPool();
        await pool.request()
            .input("N_ctrl", sql.NVarChar, nctrl)
            .input("ID_Especialidad", sql.Int, parseInt(idEspecialidad))
            .query("UPDATE Alumnos SET ID_Especialidad=@ID_Especialidad WHERE N_ctrl=@N_ctrl");
    },

    cambiarCarrera: async (nctrl, idCarrera) => {
        const pool = await getPool();
        await pool.request()
            .input("N_ctrl", sql.NVarChar, nctrl)
            .input("id_carrera", sql.Int, parseInt(idCarrera))
            .query("UPDATE Alumnos SET id_carrera=@id_carrera, ID_Especialidad=NULL WHERE N_ctrl=@N_ctrl");
    },

    getCarreras: async (idDepto) => {
        const pool = await getPool();
        const result = await pool.request()
            .input("ID_Departamento", sql.Int, parseInt(idDepto))
            .query("SELECT id_carrera, Nombre FROM carrera WHERE ID_Departamento=@ID_Departamento ORDER BY Nombre");
        return result.recordset;
    },

    getEspecialidades: async (idDepto) => {
        const pool = await getPool();
        const result = await pool.request()
            .input("ID_Departamento", sql.Int, parseInt(idDepto))
            .query(`SELECT e.id_especialidad AS ID_Especialidad, e.Nombre, c.Nombre AS Carrera
                    FROM especialidad e
                    JOIN carrera c ON e.id_carrera = c.id_carrera
                    WHERE c.ID_Departamento = @ID_Departamento
                    ORDER BY e.Nombre`);
        return result.recordset;
    },

    registrarHistorial: async (idCoord, tipoCambio, descripcion) => {
        const pool = await getPool();
        await pool.request()
            .input("ID_Coordinador", sql.Int, parseInt(idCoord))
            .input("TipoCambio", sql.NVarChar, tipoCambio)
            .input("Descripcion", sql.NVarChar, descripcion)
            .query("INSERT INTO HistorialCambios (ID_Coordinador,TipoCambio,Descripcion) VALUES (@ID_Coordinador,@TipoCambio,@Descripcion)");
    }
};

module.exports = coordinadorRepository;