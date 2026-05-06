// repositories/alumno.repository.js
const { getPool, sql } = require("../config/database");

const alumnoRepository = {
    
    // Buscar alumno por N_ctrl y contraseña (login)
    loginAlumno: async (nctrl, pass) => {
        const pool = await getPool();
        const result = await pool.request()
            .input("N_ctrl", sql.NVarChar, nctrl)
            .input("pass", sql.NVarChar, pass)
            .query(`
                SELECT a.N_ctrl, a.Nombre, a.Apellidos, a.Email,
                       c.Nombre AS Carrera, a.Semestre, a.Estatus, a.Foto
                FROM Alumnos a
                JOIN carrera c ON a.ID_Carrera = c.ID_Carrera
                WHERE a.N_ctrl = @N_ctrl AND a.Pass = @pass
            `);
        return result.recordset[0] || null;
    },

    // Obtener datos completos del alumno
    getAlumnoByNctrl: async (nctrl) => {
        const pool = await getPool();
        const result = await pool.request()
            .input("N_ctrl", sql.NVarChar, nctrl)
            .query(`
                SELECT a.N_ctrl, a.Nombre, a.Apellidos, a.Email, a.Semestre,
                       a.Estatus, a.Foto, a.FechaIngreso,
                       c.Nombre AS Carrera,
                       e.Nombre AS Especialidad,
                       (SELECT ROUND(AVG(k2.CalFinal), 2)
                        FROM Kardex k2
                        WHERE k2.N_ctrl = a.N_ctrl AND k2.Estatus = 'APROBADO') AS PromSinRep,
                       (SELECT ROUND(AVG(k3.CalFinal), 2)
                        FROM Kardex k3
                        WHERE k3.N_ctrl = a.N_ctrl) AS PromConRep,
                       (SELECT ROUND(AVG(c2.CalFinal), 2)
                        FROM Calificaciones c2
                        JOIN Inscripciones i2 ON c2.ID_Inscripcion = i2.ID_Inscripcion
                        JOIN Grupos g2 ON i2.ID_Grupo = g2.ID_Grupo
                        JOIN PeriodosEscolares pe2 ON g2.ID_Periodo = pe2.ID_Periodo
                        WHERE i2.N_ctrl = a.N_ctrl AND pe2.Activo = 1) AS PromUltimo
                FROM Alumnos a
                JOIN carrera c ON a.ID_Carrera = c.ID_Carrera
                LEFT JOIN especialidad e ON a.ID_Especialidad = e.id_especialidad
                WHERE a.N_ctrl = @N_ctrl
            `);
        return result.recordset[0] || null;
    },

    // Obtener horario del alumno
    getHorario: async (nctrl) => {
        const pool = await getPool();
        const result = await pool.request()
            .input("N_ctrl", sql.NVarChar, nctrl)
            .query(`
                SELECT m.Clave, m.Nombre AS Materia,
                       d.Nombre + ' ' + d.Apellidos AS Docente,
                       g.Aula, g.ID_Grupo,
                       hg.DiaSemana,
                       CONVERT(VARCHAR(5), hg.HoraInicio, 108) AS HoraInicio,
                       CONVERT(VARCHAR(5), hg.HoraFin, 108) AS HoraFin
                FROM Inscripciones i
                JOIN Grupos g ON i.ID_Grupo = g.ID_Grupo
                JOIN Materias m ON g.ID_Materia = m.ID_Materia
                JOIN Docentes d ON g.ID_Docente = d.ID_Docente
                JOIN HorarioGrupo hg ON hg.ID_Grupo = g.ID_Grupo
                JOIN PeriodosEscolares pe ON g.ID_Periodo = pe.ID_Periodo
                WHERE i.N_ctrl = @N_ctrl AND pe.Activo = 1
                ORDER BY hg.HoraInicio, hg.DiaSemana
            `);
        return result.recordset;
    },

    // Obtener calificaciones por periodo
    getCalificaciones: async (nctrl, idPeriodo) => {
        const pool = await getPool();
        const result = await pool.request()
            .input("N_ctrl", sql.NVarChar, nctrl)
            .input("IDPeriodo", sql.Int, parseInt(idPeriodo))
            .query(`
                SELECT m.Clave, m.Nombre AS Materia, m.Creditos,
                       d.Nombre + ' ' + d.Apellidos AS Docente,
                       g.Aula, g.ID_Grupo,
                       c.Parcial1, c.Parcial2, c.Parcial3, c.CalFinal, c.Estatus,
                       (SELECT STRING_AGG(
                           hg2.DiaSemana + ' ' +
                           CONVERT(VARCHAR(5), hg2.HoraInicio, 108) + '-' +
                           CONVERT(VARCHAR(5), hg2.HoraFin, 108), ', ')
                        FROM HorarioGrupo hg2
                        WHERE hg2.ID_Grupo = g.ID_Grupo) AS Horario
                FROM Inscripciones i
                JOIN Grupos g ON i.ID_Grupo = g.ID_Grupo
                JOIN Materias m ON g.ID_Materia = m.ID_Materia
                JOIN Docentes d ON g.ID_Docente = d.ID_Docente
                JOIN Calificaciones c ON c.ID_Inscripcion = i.ID_Inscripcion
                WHERE i.N_ctrl = @N_ctrl AND g.ID_Periodo = @IDPeriodo
                ORDER BY m.Nombre
            `);
        return result.recordset;
    },

    // Obtener kárdex
    getKardex: async (nctrl) => {
        const pool = await getPool();
        const result = await pool.request()
            .input("N_ctrl", sql.NVarChar, nctrl)
            .query(`
                SELECT pe.Nombre AS Periodo, k.Semestre,
                       m.Clave, m.Nombre AS Materia,
                       m.Creditos, m.EsOptativa,
                       k.CalFinal, k.Estatus
                FROM Kardex k
                JOIN Materias m ON k.ID_Materia = m.ID_Materia
                JOIN PeriodosEscolares pe ON k.ID_Periodo = pe.ID_Periodo
                WHERE k.N_ctrl = @N_ctrl
                ORDER BY k.Semestre, pe.FechaInicio, m.Nombre
            `);
        return result.recordset;
    },

    // Obtener actividades
    getActividades: async (nctrl) => {
        const pool = await getPool();
        const [comp, extra, tut] = await Promise.all([
            pool.request()
                .input("N_ctrl", sql.NVarChar, nctrl)
                .query("SELECT Descripcion, Fecha, Horas FROM ActividadesComplementarias WHERE N_ctrl = @N_ctrl ORDER BY Fecha DESC"),
            pool.request()
                .input("N_ctrl", sql.NVarChar, nctrl)
                .query("SELECT Descripcion, Fecha, Horas FROM ActividadesExtraescolares WHERE N_ctrl = @N_ctrl ORDER BY Fecha DESC"),
            pool.request()
                .input("N_ctrl", sql.NVarChar, nctrl)
                .query(`
                    SELECT t.Fecha, t.Observaciones,
                           d.Nombre + ' ' + d.Apellidos AS Docente
                    FROM Tutorias t
                    JOIN Docentes d ON t.ID_Docente = d.ID_Docente
                    WHERE t.N_ctrl = @N_ctrl ORDER BY t.Fecha DESC
                `),
        ]);
        return {
            complementarias: comp.recordset,
            extraescolares: extra.recordset,
            tutorias: tut.recordset,
        };
    },

    // Obtener recibos
    getRecibos: async (nctrl, historico = false) => {
        const pool = await getPool();
        let query = `
            SELECT ID_Recibo, Descripcion,
                   CONVERT(VARCHAR(10), FechaEmision, 103) AS FechaEmision,
                   CONVERT(VARCHAR(10), FechaVigencia, 103) AS FechaVigencia,
                   Importe, Estatus
            FROM Recibos
            WHERE N_ctrl = @N_ctrl
        `;
        if (!historico) query += " AND Estatus IN ('PENDIENTE','CUBIERTO')";
        query += " ORDER BY FechaEmision DESC";

        const result = await pool.request()
            .input("N_ctrl", sql.NVarChar, nctrl)
            .query(query);
        return result.recordset;
    },

    // Obtener tickets
    getTickets: async (nctrl, estatus = null) => {
        const pool = await getPool();
        let query = `
            SELECT ID_Ticket, Clave,
                   CONVERT(VARCHAR(16), Fecha, 120) AS Fecha,
                   Descripcion, Estatus, Comentario
            FROM Tickets
            WHERE N_ctrl = @N_ctrl
        `;
        const request = pool.request().input("N_ctrl", sql.NVarChar, nctrl);
        
        if (estatus) {
            query += " AND Estatus = @estatus";
            request.input("estatus", sql.NVarChar, estatus);
        }
        query += " ORDER BY Fecha DESC";

        const result = await request.query(query);
        return result.recordset;
    },

    // Crear ticket
    createTicket: async (nctrl, descripcion) => {
        const pool = await getPool();
        const fecha = new Date();
        const base = `TKT-${fecha.getFullYear()}${String(fecha.getMonth()+1).padStart(2,"0")}${String(fecha.getDate()).padStart(2,"0")}`;
        
        const cnt = await pool.request()
            .query(`SELECT COUNT(*) AS total FROM Tickets WHERE Clave LIKE '${base}%'`);
        const clave = `${base}-${String(cnt.recordset[0].total + 1).padStart(4,"0")}`;

        await pool.request()
            .input("N_ctrl", sql.NVarChar, nctrl)
            .input("Clave", sql.NVarChar, clave)
            .input("Descripcion", sql.NVarChar, descripcion)
            .query(`INSERT INTO Tickets (N_ctrl, Clave, Descripcion) VALUES (@N_ctrl, @Clave, @Descripcion)`);

        return clave;
    },

    // Obtener periodos
    getPeriodos: async () => {
        const pool = await getPool();
        const result = await pool.request()
            .query("SELECT ID_Periodo, Nombre, Activo FROM PeriodosEscolares ORDER BY FechaInicio DESC");
        return result.recordset;
    },

    // Verificar si el periodo de carga está abierto
    isPeriodoCargaAbierto: async () => {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT TOP 1 FechaInicio, FechaFin, Activo
            FROM PeriodoCargaMaterias
            WHERE Activo = 1 AND GETDATE() BETWEEN FechaInicio AND FechaFin
        `);
        return result.recordset.length > 0;
    }
};

module.exports = alumnoRepository;