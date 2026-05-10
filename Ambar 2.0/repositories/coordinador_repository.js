// repositories/coordinador_repository.js
const { getPool, sql } = require("../config/database");
 
function normalizarHora(hora) {
    if (!hora) return '00:00:00';
    const partes = hora.split(':');
    const hh = (partes[0] || '00').padStart(2, '0');
    const mm = (partes[1] || '00').padStart(2, '0');
    const ss = (partes[2] || '00').padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
}
 
const coordinadorRepository = {
 
    // ── Login ─────────────────────────────────────────────────────────────────
    loginCoordinador: async (nctrl, pass) => {
        const pool = await getPool();
        const result = await pool.request()
            .input("N_ctrl", sql.NVarChar, nctrl)
            .input("Pass",   sql.NVarChar, pass)
            .execute("sp_LoginCoordinador");
        return result.recordset[0] || null;
    },
 
    // ── Stats del departamento ────────────────────────────────────────────────
    getStats: async (idDepto) => {
        const pool = await getPool();
        const result = await pool.request()
            .input("ID_Departamento", sql.Int, parseInt(idDepto))
            .execute("sp_CoordStats");
        return result.recordset[0] || {};
    },
 
    // ── Historial de cambios ──────────────────────────────────────────────────
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
 
    // ── Docentes (lista para selects) ─────────────────────────────────────────
    getDocentes: async () => {
        const pool = await getPool();
        const result = await pool.request()
            .query(`SELECT ID_Docente,
                           Nombre + ' ' + Apellidos AS NombreCompleto
                    FROM Docentes
                    ORDER BY Nombre`);
        return result.recordset;
    },
 
    // ── Grupos del departamento en periodo activo ──────────────────────────────
    // FIX: se agrega MaxAlumnos al SELECT
    getGrupos: async (idDepto) => {
        const pool = await getPool();
        const result = await pool.request()
            .input("ID_Departamento", sql.Int, parseInt(idDepto))
            .query(`
                SELECT
                    g.ID_Grupo,
                    g.Aula,
                    g.Semestre,
                    g.Estatus,
                    g.ID_Docente,
                    g.MaxAlumnos,
                    m.Clave    AS ClaveMat,
                    m.Nombre   AS Materia,
                    m.Creditos,
                    d.Nombre + ' ' + d.Apellidos AS Docente,
                    (SELECT COUNT(*)
                     FROM Inscripciones
                     WHERE ID_Grupo = g.ID_Grupo)                              AS Inscritos,
                    (SELECT STRING_AGG(
                        hg.DiaSemana + ' ' +
                        CONVERT(VARCHAR(5), hg.HoraInicio, 108) + '-' +
                        CONVERT(VARCHAR(5), hg.HoraFin,    108), ' | ')
                     FROM HorarioGrupo hg
                     WHERE hg.ID_Grupo = g.ID_Grupo)                           AS Horario
                FROM Grupos g
                JOIN Materias          m  ON g.ID_Materia = m.ID_Materia
                JOIN Docentes          d  ON g.ID_Docente = d.ID_Docente
                JOIN carrera           c  ON m.id_carrera = c.id_carrera
                JOIN PeriodosEscolares pe ON g.ID_Periodo = pe.ID_Periodo
                WHERE pe.Activo = 1
                  AND c.ID_Departamento = @ID_Departamento
                ORDER BY m.Nombre
            `);
        return result.recordset;
    },
 
    // ── Cambiar estatus de un grupo ───────────────────────────────────────────
    updateGrupoEstatus: async (gid, estatus) => {
        const pool = await getPool();
        await pool.request()
            .input("ID_Grupo", sql.Int,      gid)
            .input("Estatus",  sql.NVarChar, estatus)
            .query("UPDATE Grupos SET Estatus = @Estatus WHERE ID_Grupo = @ID_Grupo");
    },
 
    // ── Editar docente/aula de un grupo ──────────────────────────────────────
    updateGrupo: async (gid, idDocente, aula) => {
        const pool = await getPool();
        await pool.request()
            .input("ID_Grupo",  sql.Int,      gid)
            .input("ID_Docente",sql.Int,      idDocente)
            .input("Aula",      sql.NVarChar, aula.trim())
            .query("UPDATE Grupos SET ID_Docente = @ID_Docente, Aula = @Aula WHERE ID_Grupo = @ID_Grupo");
    },
 
    // ── Reemplazar horario completo de un grupo ───────────────────────────────
    updateHorario: async (gid, horarios) => {
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        try {
            await new sql.Request(transaction)
                .input("ID_Grupo", sql.Int, gid)
                .query("DELETE FROM HorarioGrupo WHERE ID_Grupo = @ID_Grupo");
 
            for (const h of horarios) {
                const horaInicio = normalizarHora(h.HoraInicio);
                const horaFin    = normalizarHora(h.HoraFin);
                await new sql.Request(transaction)
                    .input("ID_Grupo",   sql.Int,        gid)
                    .input("DiaSemana",  sql.NVarChar,   h.DiaSemana)
                    .input("HoraInicio", sql.VarChar(8), horaInicio)
                    .input("HoraFin",    sql.VarChar(8), horaFin)
                    .query(`INSERT INTO HorarioGrupo (ID_Grupo, DiaSemana, HoraInicio, HoraFin)
                            VALUES (@ID_Grupo, @DiaSemana,
                                    CAST(@HoraInicio AS TIME),
                                    CAST(@HoraFin    AS TIME))`);
            }
            await transaction.commit();
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    },
 
    // ── Materias del departamento (FIX: método que faltaba) ───────────────────
    getMateriasPorDepto: async (idDepto) => {
        const pool = await getPool();
        const result = await pool.request()
            .input("ID_Departamento", sql.Int, parseInt(idDepto))
            .query(`
                SELECT
                    m.ID_Materia,
                    m.Clave,
                    m.Nombre,
                    m.Creditos,
                    m.NumUnidades,
                    m.Semestre,
                    m.EsOptativa
                FROM Materias m
                JOIN carrera c ON m.id_carrera = c.id_carrera
                WHERE c.ID_Departamento = @ID_Departamento
                ORDER BY m.Semestre, m.Nombre
            `);
        return result.recordset;
    },
 
    // ── Periodo escolar activo (FIX: método que faltaba) ─────────────────────
    getPeriodoActivo: async () => {
        const pool = await getPool();
        const result = await pool.request()
            .query(`SELECT TOP 1 ID_Periodo, Nombre, FechaInicio, FechaFin
                    FROM PeriodosEscolares
                    WHERE Activo = 1`);
        return result.recordset[0] || null;
    },
 
    // ── Crear grupo usando el stored procedure ────────────────────────────────
    crearGrupo: async (idMateria, idDocente, idPeriodo, aula, maxAlumnos) => {
        const pool = await getPool();
        const result = await pool.request()
            .input("ID_Materia",  sql.Int,      idMateria)
            .input("ID_Docente",  sql.Int,      idDocente)
            .input("ID_Periodo",  sql.Int,      idPeriodo)
            .input("Aula",        sql.NVarChar, aula)
            .input("MaxAlumnos",  sql.Int,      maxAlumnos || 40)
            .execute("sp_CrearGrupo");
        return result.recordset[0]?.ID_Grupo || null;
    },
 
    // ── Validar cupo de un grupo (FIX: usa el SP correcto) ───────────────────
    validarCupoGrupo: async (idGrupo, esCoord = false) => {
        const pool = await getPool();
        const result = await pool.request()
            .input("ID_Grupo", sql.Int, idGrupo)
            .input("EsCoord",  sql.Bit, esCoord ? 1 : 0)
            .execute("sp_ValidarCupoGrupo");
        return result.recordset[0] || { PuedeInscribir: 0 };
    },
 
    // ── Alumnos del departamento ──────────────────────────────────────────────
    getAlumnos: async (idDepto) => {
        const pool = await getPool();
        const result = await pool.request()
            .input("ID_Departamento", sql.Int, parseInt(idDepto))
            .query(`
                SELECT
                    a.N_ctrl, a.Nombre, a.Apellidos, a.Email,
                    a.Semestre, a.Estatus, a.id_carrera,
                    c.Nombre  AS Carrera,
                    e.Nombre  AS Especialidad,
                    e.id_especialidad AS ID_Especialidad,
                    (SELECT COUNT(*)
                     FROM Inscripciones i
                     JOIN Grupos g ON i.ID_Grupo = g.ID_Grupo
                     JOIN PeriodosEscolares pe ON g.ID_Periodo = pe.ID_Periodo
                     WHERE i.N_ctrl = a.N_ctrl AND pe.Activo = 1) AS MateriasActuales
                FROM Alumnos a
                JOIN carrera c ON a.id_carrera = c.id_carrera
                LEFT JOIN especialidad e ON a.ID_Especialidad = e.id_especialidad
                WHERE c.ID_Departamento = @ID_Departamento
                ORDER BY a.Apellidos, a.Nombre
            `);
        return result.recordset;
    },
 
    // ── Grupos disponibles para inscribir a un alumno ─────────────────────────
    // FIX: incluye MaxAlumnos e Inscritos para mostrar cupo en el modal
    getGruposDisponibles: async (nctrl) => {
        const pool = await getPool();
        const result = await pool.request()
            .input("N_ctrl", sql.NVarChar, nctrl)
            .query(`
                SELECT
                    g.ID_Grupo,
                    g.MaxAlumnos,
                    m.Clave,
                    m.Nombre   AS Materia,
                    d.Nombre + ' ' + d.Apellidos AS Docente,
                    g.Aula,
                    (SELECT COUNT(*)
                     FROM Inscripciones
                     WHERE ID_Grupo = g.ID_Grupo) AS Inscritos,
                    (SELECT STRING_AGG(
                        hg.DiaSemana + ' ' +
                        CONVERT(VARCHAR(5), hg.HoraInicio, 108) + '-' +
                        CONVERT(VARCHAR(5), hg.HoraFin,    108), ', ')
                     FROM HorarioGrupo hg
                     WHERE hg.ID_Grupo = g.ID_Grupo) AS Horario
                FROM Grupos g
                JOIN Materias          m  ON g.ID_Materia = m.ID_Materia
                JOIN Docentes          d  ON g.ID_Docente = d.ID_Docente
                JOIN PeriodosEscolares pe ON g.ID_Periodo = pe.ID_Periodo
                WHERE pe.Activo = 1
                  AND g.Estatus = 'ABIERTO'
                  AND g.ID_Grupo NOT IN (
                      SELECT i.ID_Grupo
                      FROM Inscripciones i
                      WHERE i.N_ctrl = @N_ctrl
                  )
                ORDER BY m.Nombre
            `);
        return result.recordset;
    },
 
    // ── Inscribir alumno en un grupo (FIX: valida cupo + columna Unidad1) ────
    cambiarGrupoAlumno: async (nctrl, idGrupoNuevo, esCoord = false) => {
        const pool = await getPool();
 
        // 1. Grupo existe y está abierto
        const check = await pool.request()
            .input("ID_Grupo", sql.Int, idGrupoNuevo)
            .query("SELECT Estatus, MaxAlumnos FROM Grupos WHERE ID_Grupo = @ID_Grupo");
        if (!check.recordset.length)
            return { success: false, mensaje: "El grupo no existe" };
        if (check.recordset[0].Estatus === 'CERRADO')
            return { success: false, mensaje: "El grupo está cerrado" };
 
        // 2. Validar cupo mediante el SP
        const cupo = await pool.request()
            .input("ID_Grupo", sql.Int, idGrupoNuevo)
            .input("EsCoord",  sql.Bit, esCoord ? 1 : 0)
            .execute("sp_ValidarCupoGrupo");
        const cupoInfo = cupo.recordset[0];
        if (cupoInfo && !cupoInfo.PuedeInscribir)
            return {
                success: false,
                mensaje: `Grupo lleno (${cupoInfo.Inscritos}/${cupoInfo.MaxAlumnos} alumnos)`
            };
 
        // 3. Evitar inscripción duplicada
        const dup = await pool.request()
            .input("N_ctrl",   sql.NVarChar, nctrl)
            .input("ID_Grupo", sql.Int,      idGrupoNuevo)
            .query("SELECT 1 FROM Inscripciones WHERE N_ctrl = @N_ctrl AND ID_Grupo = @ID_Grupo");
        if (dup.recordset.length)
            return { success: false, mensaje: "El alumno ya está inscrito en ese grupo" };
 
        // 4. Inscribir
        await pool.request()
            .input("N_ctrl",   sql.NVarChar, nctrl)
            .input("ID_Grupo", sql.Int,      idGrupoNuevo)
            .query("INSERT INTO Inscripciones (N_ctrl, ID_Grupo) VALUES (@N_ctrl, @ID_Grupo)");
 
        // 5. Crear registro de calificaciones con columnas Unidad1-5 (BD_Alter2)
        const ins = await pool.request()
            .input("N_ctrl",   sql.NVarChar, nctrl)
            .input("ID_Grupo", sql.Int,      idGrupoNuevo)
            .query("SELECT ID_Inscripcion FROM Inscripciones WHERE N_ctrl = @N_ctrl AND ID_Grupo = @ID_Grupo");
 
        if (ins.recordset.length) {
            await pool.request()
                .input("ID_Inscripcion", sql.Int, ins.recordset[0].ID_Inscripcion)
                .query(`INSERT INTO Calificaciones (ID_Inscripcion, Unidad1, Unidad2, Unidad3, Unidad4, Unidad5, CalFinal, Estatus)
                        VALUES (@ID_Inscripcion, NULL, NULL, NULL, NULL, NULL, NULL, 'EN CURSO')`);
        }
 
        return { success: true };
    },
 
    // ── Cambiar especialidad ──────────────────────────────────────────────────
    cambiarEspecialidad: async (nctrl, idEspecialidad) => {
        const pool = await getPool();
        await pool.request()
            .input("N_ctrl",          sql.NVarChar, nctrl)
            .input("ID_Especialidad", sql.Int,      parseInt(idEspecialidad))
            .query("UPDATE Alumnos SET ID_Especialidad = @ID_Especialidad WHERE N_ctrl = @N_ctrl");
    },
 
    // ── Cambiar carrera (borra especialidad para forzar reasignación) ─────────
    cambiarCarrera: async (nctrl, idCarrera) => {
        const pool = await getPool();
        await pool.request()
            .input("N_ctrl",    sql.NVarChar, nctrl)
            .input("id_carrera",sql.Int,      parseInt(idCarrera))
            .query("UPDATE Alumnos SET id_carrera = @id_carrera, ID_Especialidad = NULL WHERE N_ctrl = @N_ctrl");
    },
 
    // ── Carreras del departamento ─────────────────────────────────────────────
    getCarreras: async (idDepto) => {
        const pool = await getPool();
        const result = await pool.request()
            .input("ID_Departamento", sql.Int, parseInt(idDepto))
            .query(`SELECT id_carrera, Nombre
                    FROM carrera
                    WHERE ID_Departamento = @ID_Departamento
                    ORDER BY Nombre`);
        return result.recordset;
    },
 
    // ── Especialidades del departamento ───────────────────────────────────────
    getEspecialidades: async (idDepto) => {
        const pool = await getPool();
        const result = await pool.request()
            .input("ID_Departamento", sql.Int, parseInt(idDepto))
            .query(`
                SELECT e.id_especialidad AS ID_Especialidad,
                       e.Nombre,
                       c.Nombre AS Carrera
                FROM especialidad e
                JOIN carrera c ON e.id_carrera = c.id_carrera
                WHERE c.ID_Departamento = @ID_Departamento
                ORDER BY e.Nombre
            `);
        return result.recordset;
    },
 
    // ── Registrar acción en historial ─────────────────────────────────────────
    registrarHistorial: async (idCoord, tipoCambio, descripcion) => {
        const pool = await getPool();
        await pool.request()
            .input("ID_Coordinador", sql.Int,      parseInt(idCoord))
            .input("TipoCambio",     sql.NVarChar, tipoCambio)
            .input("Descripcion",    sql.NVarChar, descripcion)
            .query(`INSERT INTO HistorialCambios (ID_Coordinador, TipoCambio, Descripcion)
                    VALUES (@ID_Coordinador, @TipoCambio, @Descripcion)`);
    }
};
 
module.exports = coordinadorRepository;