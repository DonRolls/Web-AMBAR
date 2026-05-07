// repositories/administrador_repository.js
const { getPool, sql } = require("../config/database");

const administradorRepository = {
    loginAdministrador: async (nctrl, pass) => {
        const pool = await getPool();
        const result = await pool.request()
            .input("N_ctrl", sql.NVarChar, nctrl)
            .input("Pass", sql.NVarChar, pass)
            .query("SELECT * FROM Administradores WHERE N_ctrl = @N_ctrl AND Pass = @Pass");
        return result.recordset[0] || null;
    },

    // ───────────────────── USUARIOS ─────────────────────
    // Alumnos
    getAlumnos: async () => {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT a.N_ctrl, a.Nombre, a.Apellidos, a.Email, a.id_carrera, a.Semestre, a.Estatus,
                   c.Nombre AS Carrera
            FROM Alumnos a
            JOIN carrera c ON a.id_carrera = c.id_carrera
            ORDER BY a.Apellidos
        `);
        return result.recordset;
    },
    crearAlumno: async (nctrl, nombre, apellidos, email, pass, idCarrera, semestre) => {
        const pool = await getPool();
        await pool.request()
            .input("N_ctrl", sql.NVarChar, nctrl)
            .input("Nombre", sql.NVarChar, nombre)
            .input("Apellidos", sql.NVarChar, apellidos)
            .input("Email", sql.NVarChar, email)
            .input("Pass", sql.NVarChar, pass)
            .input("id_carrera", sql.Int, idCarrera)
            .input("Semestre", sql.Int, semestre)
            .query(`INSERT INTO Alumnos (N_ctrl, Nombre, Apellidos, Email, Pass, id_carrera, Semestre)
                    VALUES (@N_ctrl, @Nombre, @Apellidos, @Email, @Pass, @id_carrera, @Semestre)`);
    },
    actualizarAlumno: async (nctrl, campos) => {
        const pool = await getPool();
        const request = pool.request().input("N_ctrl", sql.NVarChar, nctrl);
        let updates = [];
        if (campos.Nombre) { updates.push("Nombre = @Nombre"); request.input("Nombre", sql.NVarChar, campos.Nombre); }
        if (campos.Apellidos) { updates.push("Apellidos = @Apellidos"); request.input("Apellidos", sql.NVarChar, campos.Apellidos); }
        if (campos.Email) { updates.push("Email = @Email"); request.input("Email", sql.NVarChar, campos.Email); }
        if (campos.Pass) { updates.push("Pass = @Pass"); request.input("Pass", sql.NVarChar, campos.Pass); }
        if (campos.id_carrera) { updates.push("id_carrera = @id_carrera"); request.input("id_carrera", sql.Int, campos.id_carrera); }
        if (campos.Semestre) { updates.push("Semestre = @Semestre"); request.input("Semestre", sql.Int, campos.Semestre); }
        if (campos.Estatus) { updates.push("Estatus = @Estatus"); request.input("Estatus", sql.NVarChar, campos.Estatus); }
        if (updates.length > 0) {
            await request.query(`UPDATE Alumnos SET ${updates.join(', ')} WHERE N_ctrl = @N_ctrl`);
        }
    },
    eliminarAlumno: async (nctrl) => {
        const pool = await getPool();
        await pool.request()
            .input("N_ctrl", sql.NVarChar, nctrl)
            .query("DELETE FROM Alumnos WHERE N_ctrl = @N_ctrl");
    },

    // Docentes
    getDocentes: async () => {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT ID_Docente, N_ctrl, Nombre, Apellidos, Email FROM Docentes ORDER BY Apellidos
        `);
        return result.recordset;
    },
    crearDocente: async (nctrl, nombre, apellidos, email, pass) => {
        const pool = await getPool();
        await pool.request()
            .input("N_ctrl", sql.NVarChar, nctrl)
            .input("Nombre", sql.NVarChar, nombre)
            .input("Apellidos", sql.NVarChar, apellidos)
            .input("Email", sql.NVarChar, email)
            .input("Pass", sql.NVarChar, pass)
            .query(`INSERT INTO Docentes (N_ctrl, Nombre, Apellidos, Email, Pass)
                    VALUES (@N_ctrl, @Nombre, @Apellidos, @Email, @Pass)`);
    },
    actualizarDocente: async (nctrl, campos) => { /* similar a alumno */ },
    eliminarDocente: async (nctrl) => { /* similar a alumno */ },

    // Coordinadores
    getCoordinadores: async () => {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT ID_Coordinador, N_ctrl, Nombre, Apellidos, Email, ID_Departamento,
                   (SELECT Nombre FROM Departamentos WHERE ID_Departamento = c.ID_Departamento) AS Departamento
            FROM Coordinadores c ORDER BY Apellidos
        `);
        return result.recordset;
    },
    crearCoordinador: async (nctrl, nombre, apellidos, email, pass, idDepto) => {
        const pool = await getPool();
        await pool.request()
            .input("N_ctrl", sql.NVarChar, nctrl)
            .input("Nombre", sql.NVarChar, nombre)
            .input("Apellidos", sql.NVarChar, apellidos)
            .input("Email", sql.NVarChar, email)
            .input("Pass", sql.NVarChar, pass)
            .input("ID_Departamento", sql.Int, idDepto)
            .query(`INSERT INTO Coordinadores (N_ctrl, Nombre, Apellidos, Email, Pass, ID_Departamento)
                    VALUES (@N_ctrl, @Nombre, @Apellidos, @Email, @Pass, @ID_Departamento)`);
    },
    // actualizar, eliminar similares...

    // Materias (catálogo)
    getMaterias: async () => {
        const pool = await getPool();
        const result = await pool.request().query("SELECT * FROM Materias ORDER BY Nombre");
        return result.recordset;
    },
    crearMateria: async (clave, nombre, creditos, idCarrera, esOptativa = 0) => {
        const pool = await getPool();
        await pool.request()
            .input("Clave", sql.NVarChar, clave)
            .input("Nombre", sql.NVarChar, nombre)
            .input("Creditos", sql.Int, creditos)
            .input("id_carrera", sql.Int, idCarrera)
            .input("EsOptativa", sql.Bit, esOptativa)
            .query(`INSERT INTO Materias (Clave, Nombre, Creditos, id_carrera, EsOptativa)
                    VALUES (@Clave, @Nombre, @Creditos, @id_carrera, @EsOptativa)`);
    },
    actualizarMateria: async (id, campos) => { /* ... */ },
    eliminarMateria: async (id) => { /* ... */ },

    // Kardex / calificaciones (para la vista usuarios.html)
    getKardexByAlumno: async (nctrl) => {
        const pool = await getPool();
        const result = await pool.request()
            .input("N_ctrl", sql.NVarChar, nctrl)
            .query(`
                SELECT k.ID_Kardex, pe.Nombre AS Periodo, m.Clave, m.Nombre AS Materia,
                       m.Creditos, k.CalFinal, k.Estatus AS Estado, '' AS Tipo
                FROM Kardex k
                JOIN Materias m ON k.ID_Materia = m.ID_Materia
                JOIN PeriodosEscolares pe ON k.ID_Periodo = pe.ID_Periodo
                WHERE k.N_ctrl = @N_ctrl
                ORDER BY pe.FechaInicio
            `);
        return result.recordset;
    },
    // ... crear calificación, etc.
};

module.exports = administradorRepository;