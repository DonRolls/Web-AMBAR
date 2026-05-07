// repositories/administrador_repository.js
const { getPool, sql } = require("../config/database");

const administradorRepository = {

    // ─── LOGIN ───────────────────────────────────────────────────────────────
    loginAdministrador: async (nctrl, pass) => {
        const pool = await getPool();
        const result = await pool.request()
            .input("N_ctrl", sql.NVarChar, nctrl)
            .input("Pass",   sql.NVarChar, pass)
            .query("SELECT * FROM Administradores WHERE N_ctrl = @N_ctrl AND Pass = @Pass");
        return result.recordset[0] || null;
    },

    // ─── ALUMNOS ─────────────────────────────────────────────────────────────
    getAlumnos: async () => {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT a.N_ctrl, a.Nombre, a.Apellidos, a.Email,
                   a.id_carrera, a.Semestre, a.Estatus,
                   c.nombre AS Carrera
            FROM   Alumnos a
            JOIN   carrera c ON a.id_carrera = c.id_carrera
            ORDER  BY a.Apellidos
        `);
        return result.recordset;
    },

    crearAlumno: async (nctrl, nombre, apellidos, email, pass, idCarrera, semestre) => {
        const pool = await getPool();
        await pool.request()
            .input("N_ctrl",     sql.NVarChar, nctrl)
            .input("Nombre",     sql.NVarChar, nombre)
            .input("Apellidos",  sql.NVarChar, apellidos)
            .input("Email",      sql.NVarChar, email)
            .input("Pass",       sql.NVarChar, pass)
            .input("id_carrera", sql.Int,      idCarrera)
            .input("Semestre",   sql.Int,      semestre)
            .query(`INSERT INTO Alumnos (N_ctrl, Nombre, Apellidos, Email, Pass, id_carrera, Semestre)
                    VALUES (@N_ctrl, @Nombre, @Apellidos, @Email, @Pass, @id_carrera, @Semestre)`);
    },

    actualizarAlumno: async (nctrl, campos) => {
        const pool = await getPool();
        const request = pool.request().input("N_ctrl", sql.NVarChar, nctrl);
        const updates = [];
        if (campos.Nombre    !== undefined) { updates.push("Nombre = @Nombre");       request.input("Nombre",     sql.NVarChar, campos.Nombre); }
        if (campos.Apellidos !== undefined) { updates.push("Apellidos = @Apellidos"); request.input("Apellidos",  sql.NVarChar, campos.Apellidos); }
        if (campos.Email     !== undefined) { updates.push("Email = @Email");         request.input("Email",      sql.NVarChar, campos.Email); }
        if (campos.Pass      !== undefined) { updates.push("Pass = @Pass");           request.input("Pass",       sql.NVarChar, campos.Pass); }
        if (campos.id_carrera!== undefined) { updates.push("id_carrera = @id_carrera"); request.input("id_carrera", sql.Int,   campos.id_carrera); }
        if (campos.Semestre  !== undefined) { updates.push("Semestre = @Semestre");   request.input("Semestre",   sql.Int,      campos.Semestre); }
        if (campos.Estatus   !== undefined) { updates.push("Estatus = @Estatus");     request.input("Estatus",    sql.NVarChar, campos.Estatus); }
        if (updates.length === 0) return;
        await request.query(`UPDATE Alumnos SET ${updates.join(', ')} WHERE N_ctrl = @N_ctrl`);
    },

    eliminarAlumno: async (nctrl) => {
        const pool = await getPool();
        await pool.request()
            .input("N_ctrl", sql.NVarChar, nctrl)
            .query("DELETE FROM Alumnos WHERE N_ctrl = @N_ctrl");
    },

    // ─── DOCENTES ────────────────────────────────────────────────────────────
    getDocentes: async () => {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT ID_Docente, N_ctrl, Nombre, Apellidos, Email
            FROM   Docentes
            ORDER  BY Apellidos
        `);
        return result.recordset;
    },

    crearDocente: async (nctrl, nombre, apellidos, email, pass) => {
        const pool = await getPool();
        await pool.request()
            .input("N_ctrl",    sql.NVarChar, nctrl)
            .input("Nombre",    sql.NVarChar, nombre)
            .input("Apellidos", sql.NVarChar, apellidos)
            .input("Email",     sql.NVarChar, email)
            .input("Pass",      sql.NVarChar, pass)
            .query(`INSERT INTO Docentes (N_ctrl, Nombre, Apellidos, Email, Pass)
                    VALUES (@N_ctrl, @Nombre, @Apellidos, @Email, @Pass)`);
    },

    actualizarDocente: async (id, campos) => {
        const pool = await getPool();
        const request = pool.request().input("ID_Docente", sql.Int, id);
        const updates = [];
        if (campos.Nombre    !== undefined) { updates.push("Nombre = @Nombre");       request.input("Nombre",     sql.NVarChar, campos.Nombre); }
        if (campos.Apellidos !== undefined) { updates.push("Apellidos = @Apellidos"); request.input("Apellidos",  sql.NVarChar, campos.Apellidos); }
        if (campos.Email     !== undefined) { updates.push("Email = @Email");         request.input("Email",      sql.NVarChar, campos.Email); }
        if (campos.Pass      !== undefined) { updates.push("Pass = @Pass");           request.input("Pass",       sql.NVarChar, campos.Pass); }
        if (campos.N_ctrl    !== undefined) { updates.push("N_ctrl = @N_ctrl");       request.input("N_ctrl",     sql.NVarChar, campos.N_ctrl); }
        if (updates.length === 0) return;
        await request.query(`UPDATE Docentes SET ${updates.join(', ')} WHERE ID_Docente = @ID_Docente`);
    },

    eliminarDocente: async (id) => {
        const pool = await getPool();
        await pool.request()
            .input("ID_Docente", sql.Int, id)
            .query("DELETE FROM Docentes WHERE ID_Docente = @ID_Docente");
    },

    // ─── COORDINADORES ───────────────────────────────────────────────────────
    getCoordinadores: async () => {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT c.ID_Coordinador, c.N_ctrl, c.Nombre, c.Apellidos,
                   c.Email, c.ID_Departamento,
                   d.Nombre AS Departamento
            FROM   Coordinadores c
            JOIN   Departamentos d ON c.ID_Departamento = d.ID_Departamento
            ORDER  BY c.Apellidos
        `);
        return result.recordset;
    },

    crearCoordinador: async (nctrl, nombre, apellidos, email, pass, idDepto) => {
        const pool = await getPool();
        await pool.request()
            .input("N_ctrl",          sql.NVarChar, nctrl)
            .input("Nombre",          sql.NVarChar, nombre)
            .input("Apellidos",       sql.NVarChar, apellidos)
            .input("Email",           sql.NVarChar, email)
            .input("Pass",            sql.NVarChar, pass)
            .input("ID_Departamento", sql.Int,      idDepto)
            .query(`INSERT INTO Coordinadores (N_ctrl, Nombre, Apellidos, Email, Pass, ID_Departamento)
                    VALUES (@N_ctrl, @Nombre, @Apellidos, @Email, @Pass, @ID_Departamento)`);
    },

    actualizarCoordinador: async (nctrl, campos) => {
        const pool = await getPool();
        const request = pool.request().input("N_ctrl", sql.NVarChar, nctrl);
        const updates = [];
        if (campos.Nombre          !== undefined) { updates.push("Nombre = @Nombre");                 request.input("Nombre",          sql.NVarChar, campos.Nombre); }
        if (campos.Apellidos       !== undefined) { updates.push("Apellidos = @Apellidos");           request.input("Apellidos",        sql.NVarChar, campos.Apellidos); }
        if (campos.Email           !== undefined) { updates.push("Email = @Email");                   request.input("Email",            sql.NVarChar, campos.Email); }
        if (campos.Pass            !== undefined) { updates.push("Pass = @Pass");                     request.input("Pass",             sql.NVarChar, campos.Pass); }
        if (campos.ID_Departamento !== undefined) { updates.push("ID_Departamento = @ID_Departamento"); request.input("ID_Departamento", sql.Int,      campos.ID_Departamento); }
        if (updates.length === 0) return;
        await request.query(`UPDATE Coordinadores SET ${updates.join(', ')} WHERE N_ctrl = @N_ctrl`);
    },

    eliminarCoordinador: async (nctrl) => {
        const pool = await getPool();
        await pool.request()
            .input("N_ctrl", sql.NVarChar, nctrl)
            .query("DELETE FROM Coordinadores WHERE N_ctrl = @N_ctrl");
    },

    // ─── MATERIAS ────────────────────────────────────────────────────────────
    getMaterias: async () => {
        const pool = await getPool();
        const result = await pool.request().query(
            "SELECT * FROM Materias ORDER BY Nombre"
        );
        return result.recordset;
    },

    crearMateria: async (clave, nombre, creditos, idCarrera, esOptativa = 0) => {
        const pool = await getPool();
        await pool.request()
            .input("Clave",      sql.NVarChar, clave)
            .input("Nombre",     sql.NVarChar, nombre)
            .input("Creditos",   sql.Int,      creditos)
            .input("id_carrera", sql.Int,      idCarrera)
            .input("EsOptativa", sql.Bit,      esOptativa)
            .query(`INSERT INTO Materias (Clave, Nombre, Creditos, id_carrera, EsOptativa)
                    VALUES (@Clave, @Nombre, @Creditos, @id_carrera, @EsOptativa)`);
    },

    actualizarMateria: async (id, campos) => {
        const pool = await getPool();
        const request = pool.request().input("ID_Materia", sql.Int, id);
        const updates = [];
        if (campos.Nombre     !== undefined) { updates.push("Nombre = @Nombre");         request.input("Nombre",     sql.NVarChar, campos.Nombre); }
        if (campos.Creditos   !== undefined) { updates.push("Creditos = @Creditos");     request.input("Creditos",   sql.Int,      campos.Creditos); }
        if (campos.id_carrera !== undefined) { updates.push("id_carrera = @id_carrera"); request.input("id_carrera", sql.Int,      campos.id_carrera); }
        if (campos.EsOptativa !== undefined) { updates.push("EsOptativa = @EsOptativa"); request.input("EsOptativa", sql.Bit,      campos.EsOptativa); }
        if (updates.length === 0) return;
        await request.query(`UPDATE Materias SET ${updates.join(', ')} WHERE ID_Materia = @ID_Materia`);
    },

    eliminarMateria: async (id) => {
        const pool = await getPool();
        await pool.request()
            .input("ID_Materia", sql.Int, id)
            .query("DELETE FROM Materias WHERE ID_Materia = @ID_Materia");
    },

    // ─── KARDEX ──────────────────────────────────────────────────────────────
    getKardexByAlumno: async (nctrl) => {
        const pool = await getPool();
        const result = await pool.request()
            .input("N_ctrl", sql.NVarChar, nctrl)
            .query(`
                SELECT k.ID_Kardex, pe.Nombre AS Periodo,
                       m.Clave, m.Nombre AS Materia, m.Creditos,
                       k.CalFinal, k.Estatus AS Estado, k.Semestre
                FROM   Kardex k
                JOIN   Materias m           ON k.ID_Materia = m.ID_Materia
                JOIN   PeriodosEscolares pe ON k.ID_Periodo = pe.ID_Periodo
                WHERE  k.N_ctrl = @N_ctrl
                ORDER  BY pe.FechaInicio
            `);
        return result.recordset;
    },
};

module.exports = administradorRepository;