const sql     = require("mssql");
const express = require("express");
const crypto  = require("crypto");
const app     = express();
 
app.use(express.json());
app.use(express.static("."));
 
 
const config = {
    user:     "emmanuel",          
    password: "emmanuel3131",   
    server:   "localhost",
    database: "ambar",
    options: {
        encrypt:                false,
        trustServerCertificate: true,
        trustedConnection: true
    },
};
 
let pool;
 
async function conectar() {
    pool = await sql.connect(config);
    console.log("Conectado a SQL Server - BD: ambar");
}
 
conectar().catch(err => {
    console.error("Error al conectar a la BD:", err.message);
    process.exit(1);
});
 

// LOGIN UNIFICADO (Alumnos y Coordinadores)
app.post("/login", async (req, res) => {
    const { N_ctrl, pass } = req.body;

    if (!N_ctrl || !pass) {
        return res.status(400).json({ success: false, error: "Faltan credenciales" });
    }

    const hashPass = crypto.createHash("sha256").update(pass, "utf8").digest();

    try {
        // 1. Intentar validar como Alumno
        const resultAlumno = await pool.request()
            .input("N_ctrl", sql.NVarChar, String(N_ctrl))
            .query(`
                SELECT a.N_ctrl, a.Nombre, a.Apellidos, a.Email,
                       c.Nombre AS Carrera, a.Semestre, a.Estatus, a.Foto,
                       CONVERT(VARBINARY(64), a.Pass) AS PassRaw,
                       a.Pass AS PassPlain
                FROM   Alumnos  a
                JOIN   carrera c ON a.ID_Carrera = c.ID_Carrera
                WHERE  a.N_ctrl = @N_ctrl
            `);

        if (resultAlumno.recordset.length > 0) {
            const u = resultAlumno.recordset[0];
            const storedHash = u.PassRaw;
            const storedPlain = u.PassPlain;
            const plainMatch = storedPlain === pass;
            const hashMatch = Buffer.isBuffer(storedHash) && Buffer.compare(storedHash, hashPass) === 0;

            if (plainMatch || hashMatch) {
                return res.json({
                    success:   true,
                    rol:       'Alumno',
                    N_ctrl:    u.N_ctrl,
                    nombre:    u.Nombre,
                    apellidos: u.Apellidos,
                    email:     u.Email,
                    carrera:   u.Carrera,
                    semestre:  u.Semestre,
                    foto:      u.Foto
                });
            }
        }

        // 2. Si no es alumno, intentar validar como Coordinador
        const resultCoord = await pool.request()
            .input("N_ctrl", sql.NVarChar, String(N_ctrl))
            .query(`
                SELECT c.ID_Coordinador, c.Nombre, c.Apellidos, c.Email,
                       d.Nombre AS Departamento, c.ID_Departamento,
                       CONVERT(VARBINARY(64), c.Pass) AS PassRaw,
                       c.Pass AS PassPlain
                FROM   Coordinadores c
                JOIN   Departamentos d ON c.ID_Departamento = d.ID_Departamento
                WHERE  c.N_ctrl = @N_ctrl OR c.Email = @N_ctrl
            `);

        if (resultCoord.recordset && resultCoord.recordset.length > 0) {
            const c = resultCoord.recordset[0];
            const storedHash = c.PassRaw;
            const storedPlain = c.PassPlain;
            const plainMatch = storedPlain === pass;
            const hashMatch = Buffer.isBuffer(storedHash) && Buffer.compare(storedHash, hashPass) === 0;

            if (plainMatch || hashMatch) {
                return res.json({
                    success:        true,
                    rol:            'Coordinador',
                    ID_Coordinador: c.ID_Coordinador,
                    nombre:         c.Nombre,
                    apellidos:      c.Apellidos,
                    email:          c.Email,
                    departamento:   c.Departamento,
                    idDepto:        c.ID_Departamento
                });
            }
        }

        // 3. Si no se encuentra en ninguna de las dos tablas
        res.json({ success: false, error: "Credenciales incorrectas" });

    } catch (err) {
        console.error("Error /login:", err.message);
        res.status(500).json({ success: false, error: "Error interno del servidor" });
    }
});
 
//  SOPORTE (Revisa conexion con la BD)
app.get("/soporte", async (req, res) => {
    try {
        await pool.request().query("SELECT 1");
        res.json({ conectado: true });
    } catch {
        res.json({ conectado: false });
    }
});
 

//  DATOS DEL ALUMNO 
app.get("/alumno/:nctrl", async (req, res) => {
    const { nctrl } = req.params;
    try {
        const result = await pool.request()
            .input("N_ctrl", sql.NVarChar, nctrl)
            .query(`
                SELECT a.N_ctrl, a.Nombre, a.Apellidos, a.Email, a.Semestre,
                       a.Estatus, a.Foto, a.FechaIngreso,
                       c.Nombre  AS Carrera,
                       e.Nombre  AS Especialidad,
                       -- Promedio sin reprobadas
                       (SELECT ROUND(AVG(k2.CalFinal), 2)
                        FROM   Kardex k2
                        WHERE  k2.N_ctrl = a.N_ctrl
                          AND  k2.Estatus = 'APROBADO') AS PromSinRep,
                       -- Promedio con reprobadas
                       (SELECT ROUND(AVG(k3.CalFinal), 2)
                        FROM   Kardex k3
                        WHERE  k3.N_ctrl = a.N_ctrl) AS PromConRep,
                       -- Promedio último semestre (periodo activo)
                       (SELECT ROUND(AVG(c2.CalFinal), 2)
                        FROM   Calificaciones c2
                        JOIN   Inscripciones  i2 ON c2.ID_Inscripcion = i2.ID_Inscripcion
                        JOIN   Grupos         g2 ON i2.ID_Grupo = g2.ID_Grupo
                        JOIN   PeriodosEscolares pe2 ON g2.ID_Periodo = pe2.ID_Periodo
                        WHERE  i2.N_ctrl = a.N_ctrl AND pe2.Activo = 1) AS PromUltimo
                FROM   Alumnos       a
                JOIN   carrera      c ON a.ID_Carrera      = c.ID_Carrera
                LEFT JOIN Especialidades e ON a.ID_Especialidad = e.ID_Especialidad
                WHERE  a.N_ctrl = @N_ctrl
            `);
 
        if (result.recordset.length === 0)
            return res.status(404).json({ error: "Alumno no encontrado" });
 
        res.json(result.recordset[0]);
    } catch (err) {
        console.error("Error /alumno:", err.message);
        res.status(500).json({ error: err.message });
    }
});
 

//  HORARIO 
app.get("/horario/:nctrl", async (req, res) => {
    const { nctrl } = req.params;
    try {
        const result = await pool.request()
            .input("N_ctrl", sql.NVarChar, nctrl)
            .query(`
                SELECT m.Clave, m.Nombre AS Materia,
                       d.Nombre + ' ' + d.Apellidos AS Docente,
                       g.Aula, g.ID_Grupo,
                       hg.DiaSemana,
                       CONVERT(VARCHAR(5), hg.HoraInicio, 108) AS HoraInicio,
                       CONVERT(VARCHAR(5), hg.HoraFin,    108) AS HoraFin
                FROM   Inscripciones    i
                JOIN   Grupos           g  ON i.ID_Grupo   = g.ID_Grupo
                JOIN   Materias         m  ON g.ID_Materia = m.ID_Materia
                JOIN   Docentes         d  ON g.ID_Docente = d.ID_Docente
                JOIN   HorarioGrupo     hg ON hg.ID_Grupo  = g.ID_Grupo
                JOIN   PeriodosEscolares pe ON g.ID_Periodo = pe.ID_Periodo
                WHERE  i.N_ctrl = @N_ctrl AND pe.Activo = 1
                ORDER  BY hg.HoraInicio, hg.DiaSemana
            `);
 
        res.json(result.recordset);
    } catch (err) {
        console.error("Error /horario:", err.message);
        res.status(500).json({ error: err.message });
    }
});
 

//  PERIODOS  
app.get("/periodos", async (req, res) => {
    try {
        const result = await pool.request()
            .query("SELECT ID_Periodo, Nombre, Activo FROM PeriodosEscolares ORDER BY FechaInicio DESC");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
 

//  CALIFICACIONES  
app.get("/calificaciones/:nctrl/:idPeriodo", async (req, res) => {
    const { nctrl, idPeriodo } = req.params;
    try {
        const result = await pool.request()
            .input("N_ctrl",    sql.NVarChar, nctrl)
            .input("IDPeriodo", sql.Int,      parseInt(idPeriodo))
            .query(`
                SELECT m.Clave, m.Nombre AS Materia, m.Creditos,
                       d.Nombre + ' ' + d.Apellidos AS Docente,
                       g.Aula, g.ID_Grupo,
                       c.Parcial1, c.Parcial2, c.Parcial3, c.CalFinal, c.Estatus,
                       (
                           SELECT STRING_AGG(
                               hg2.DiaSemana + ' ' +
                               CONVERT(VARCHAR(5), hg2.HoraInicio, 108) + '-' +
                               CONVERT(VARCHAR(5), hg2.HoraFin, 108), ', ')
                           FROM HorarioGrupo hg2
                           WHERE hg2.ID_Grupo = g.ID_Grupo
                       ) AS Horario
                FROM   Inscripciones    i
                JOIN   Grupos           g  ON i.ID_Grupo       = g.ID_Grupo
                JOIN   Materias         m  ON g.ID_Materia     = m.ID_Materia
                JOIN   Docentes         d  ON g.ID_Docente     = d.ID_Docente
                JOIN   Calificaciones   c  ON c.ID_Inscripcion = i.ID_Inscripcion
                WHERE  i.N_ctrl   = @N_ctrl
                  AND  g.ID_Periodo = @IDPeriodo
                ORDER  BY m.Nombre
            `);
 
        res.json(result.recordset);
    } catch (err) {
        console.error("Error /calificaciones:", err.message);
        res.status(500).json({ error: err.message });
    }
});
 

//  KÁRDEX  
app.get("/kardex/:nctrl", async (req, res) => {
    const { nctrl } = req.params;
    try {
        const result = await pool.request()
            .input("N_ctrl", sql.NVarChar, nctrl)
            .query(`
                SELECT pe.Nombre AS Periodo, k.Semestre,
                       m.Clave, m.Nombre AS Materia,
                       m.Creditos, m.EsOptativa,
                       k.CalFinal, k.Estatus
                FROM   Kardex            k
                JOIN   Materias          m  ON k.ID_Materia = m.ID_Materia
                JOIN   PeriodosEscolares pe ON k.ID_Periodo = pe.ID_Periodo
                WHERE  k.N_ctrl = @N_ctrl
                ORDER  BY k.Semestre, pe.FechaInicio, m.Nombre
            `);
 
        res.json(result.recordset);
    } catch (err) {
        console.error("Error /kardex:", err.message);
        res.status(500).json({ error: err.message });
    }
});
 
// HISTORIAL DE ACTIVIDADES  
app.get("/actividades/:nctrl", async (req, res) => {
    const { nctrl } = req.params;
    try {
        const [comp, extra, tut] = await Promise.all([
            pool.request().input("N_ctrl", sql.NVarChar, nctrl)
                .query("SELECT Descripcion, Fecha, Horas FROM ActividadesComplementarias WHERE N_ctrl = @N_ctrl ORDER BY Fecha DESC"),
            pool.request().input("N_ctrl", sql.NVarChar, nctrl)
                .query("SELECT Descripcion, Fecha, Horas FROM ActividadesExtraescolares WHERE N_ctrl = @N_ctrl ORDER BY Fecha DESC"),
            pool.request().input("N_ctrl", sql.NVarChar, nctrl)
                .query(`SELECT t.Fecha, t.Observaciones,
                               d.Nombre + ' ' + d.Apellidos AS Docente
                        FROM   Tutorias t
                        JOIN   Docentes d ON t.ID_Docente = d.ID_Docente
                        WHERE  t.N_ctrl = @N_ctrl ORDER BY t.Fecha DESC`),
        ]);
 
        res.json({
            complementarias: comp.recordset,
            extraescolares:  extra.recordset,
            tutorias:        tut.recordset,
        });
    } catch (err) {
        console.error("Error /actividades:", err.message);
        res.status(500).json({ error: err.message });
    }
});
 
//  RECIBOS  (recibos.html)
app.get("/recibos/:nctrl", async (req, res) => {
    const { nctrl } = req.params;
    const { historico } = req.query;   // ?historico=1 → todos, sin parámetro → solo vigentes/pendientes
    try {
        let query = `
            SELECT ID_Recibo, Descripcion,
                   CONVERT(VARCHAR(10), FechaEmision,  103) AS FechaEmision,
                   CONVERT(VARCHAR(10), FechaVigencia, 103) AS FechaVigencia,
                   Importe, Estatus
            FROM   Recibos
            WHERE  N_ctrl = @N_ctrl
        `;
        if (!historico) query += " AND Estatus IN ('PENDIENTE','CUBIERTO')";
        query += " ORDER BY FechaEmision DESC";
 
        const result = await pool.request()
            .input("N_ctrl", sql.NVarChar, nctrl)
            .query(query);
 
        res.json(result.recordset);
    } catch (err) {
        console.error("Error /recibos:", err.message);
        res.status(500).json({ error: err.message });
    }
});
 
//  TICKETS  (tickets.html)
app.get("/tickets/:nctrl", async (req, res) => {
    const { nctrl } = req.params;
    const { estatus } = req.query;   // ?estatus=ABIERTO  o  ?estatus=FINALIZADO
    try {
        let query = `
            SELECT ID_Ticket, Clave,
                   CONVERT(VARCHAR(16), Fecha, 120) AS Fecha,
                   Descripcion, Estatus, Comentario
            FROM   Tickets
            WHERE  N_ctrl = @N_ctrl
        `;
        if (estatus) query += " AND Estatus = @estatus";
        query += " ORDER BY Fecha DESC";
 
        const req2 = pool.request().input("N_ctrl", sql.NVarChar, nctrl);
        if (estatus) req2.input("estatus", sql.NVarChar, estatus);
 
        const result = await req2.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error("Error /tickets:", err.message);
        res.status(500).json({ error: err.message });
    }
});
 
// Crear ticket
app.post("/tickets", async (req, res) => {
    const { N_ctrl, descripcion } = req.body;
    try {
        // Generar clave única: TKT-YYYYMMDD-NNNN
        const fecha = new Date();
        const base  = `TKT-${fecha.getFullYear()}${String(fecha.getMonth()+1).padStart(2,"0")}${String(fecha.getDate()).padStart(2,"0")}`;
        const cnt   = await pool.request()
            .query(`SELECT COUNT(*) AS total FROM Tickets WHERE Clave LIKE '${base}%'`);
        const clave = `${base}-${String(cnt.recordset[0].total + 1).padStart(4,"0")}`;
 
        await pool.request()
            .input("N_ctrl",      sql.NVarChar, N_ctrl)
            .input("Clave",       sql.NVarChar, clave)
            .input("Descripcion", sql.NVarChar, descripcion)
            .query(`INSERT INTO Tickets (N_ctrl, Clave, Descripcion) VALUES (@N_ctrl, @Clave, @Descripcion)`);
 
        res.json({ success: true, clave });
    } catch (err) {
        console.error("Error POST /tickets:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});
 

//  CARGA DE MATERIAS  (cargadematerias.html)
app.get("/periodo-carga", async (req, res) => {
    try {
        const result = await pool.request().query(`
            SELECT TOP 1 FechaInicio, FechaFin, Activo
            FROM   PeriodoCargaMaterias
            WHERE  Activo = 1
              AND  GETDATE() BETWEEN FechaInicio AND FechaFin
        `);
        res.json({ abierto: result.recordset.length > 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
 

//  ─────────────────────────────────────────────────────────────────
//  ENDPOINTS — COORDINADOR  (/coord/...)
//  ─────────────────────────────────────────────────────────────────

// Helper: registrar historial
async function registrarHistorial(idCoord, tipoCambio, descripcion) {
    await pool.request()
        .input("ID_Coordinador", sql.Int,      parseInt(idCoord))
        .input("TipoCambio",     sql.NVarChar, tipoCambio)
        .input("Descripcion",    sql.NVarChar, descripcion)
        .query("INSERT INTO HistorialCambios (ID_Coordinador,TipoCambio,Descripcion) VALUES (@ID_Coordinador,@TipoCambio,@Descripcion)");
}

app.get("/coord/stats/:idDepto", async (req, res) => {
    try {
        const result = await pool.request()
            .input("ID_Departamento", sql.Int, parseInt(req.params.idDepto))
            .execute("sp_CoordStats");
        res.json(result.recordset[0] || {});
    } catch (err) {
        console.error("Error /coord/stats:", err.message);
        res.status(500).json({ error: err.message });
    }
});

app.get("/coord/historial/:idCoord", async (req, res) => {
    try {
        const result = await pool.request()
            .input("ID_Coordinador", sql.Int, parseInt(req.params.idCoord))
            .query(`
                SELECT TOP 20
                       TipoCambio, Descripcion,
                       CONVERT(VARCHAR(16), Fecha, 120) AS Fecha
                FROM HistorialCambios
                WHERE ID_Coordinador = @ID_Coordinador
                ORDER BY Fecha DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/coord/docentes", async (req, res) => {
    try {
        const result = await pool.request()
            .query("SELECT ID_Docente, Nombre+' '+Apellidos AS NombreCompleto FROM Docentes ORDER BY Nombre");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/coord/grupos/:idDepto", async (req, res) => {
    try {
        const result = await pool.request()
            .input("ID_Departamento", sql.Int, parseInt(req.params.idDepto))
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
        res.json(result.recordset);
    } catch (err) {
        console.error("Error /coord/grupos:", err.message);
        res.status(500).json({ error: err.message });
    }
});

app.put("/coord/grupos/:id/estatus", async (req, res) => {
    const { Estatus, idCoord, descripcion } = req.body;
    const gid = parseInt(req.params.id);

    if (!['ABIERTO','CERRADO'].includes(Estatus))
        return res.status(400).json({ success: false, error: "Estatus inválido" });

    try {
        await pool.request()
            .input("ID_Grupo", sql.Int,      gid)
            .input("Estatus",  sql.NVarChar, Estatus)
            .query("UPDATE Grupos SET Estatus=@Estatus WHERE ID_Grupo=@ID_Grupo");

        await registrarHistorial(idCoord, "GRUPO_ESTATUS", descripcion);
        res.json({ success: true });
    } catch (err) {
        console.error("Error PUT /coord/grupos/estatus:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.put("/coord/grupos/:id", async (req, res) => {
    const { ID_Docente, Aula, idCoord, descripcion } = req.body;
    const gid = parseInt(req.params.id);

    if (!ID_Docente || !Aula)
        return res.status(400).json({ success: false, error: "Datos incompletos" });

    try {
        await pool.request()
            .input("ID_Grupo",  sql.Int,      gid)
            .input("ID_Docente",sql.Int,      parseInt(ID_Docente))
            .input("Aula",      sql.NVarChar, Aula.trim())
            .query("UPDATE Grupos SET ID_Docente=@ID_Docente, Aula=@Aula WHERE ID_Grupo=@ID_Grupo");

        await registrarHistorial(idCoord, "GRUPO_EDIT", descripcion);
        res.json({ success: true });
    } catch (err) {
        console.error("Error PUT /coord/grupos:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.put("/coord/grupos/:id/horario", async (req, res) => {
    const { horarios, idCoord } = req.body;
    const gid = parseInt(req.params.id);

    if (!Array.isArray(horarios) || !horarios.length)
        return res.status(400).json({ success: false, error: "Horarios vacíos" });

    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();

        await new sql.Request(transaction)
            .input("ID_Grupo", sql.Int, gid)
            .query("DELETE FROM HorarioGrupo WHERE ID_Grupo=@ID_Grupo");

        for (const h of horarios) {
            await new sql.Request(transaction)
                .input("ID_Grupo",   sql.Int,      gid)
                .input("DiaSemana",  sql.NVarChar, h.DiaSemana)
                .input("HoraInicio", sql.Time,     h.HoraInicio)
                .input("HoraFin",    sql.Time,     h.HoraFin)
                .query(`INSERT INTO HorarioGrupo (ID_Grupo,DiaSemana,HoraInicio,HoraFin)
                        VALUES (@ID_Grupo,@DiaSemana,@HoraInicio,@HoraFin)`);
        }

        await transaction.commit();

        const info = await pool.request()
            .input("ID_Grupo", sql.Int, gid)
            .query("SELECT m.Clave FROM Grupos g JOIN Materias m ON g.ID_Materia=m.ID_Materia WHERE g.ID_Grupo=@ID_Grupo");
        const clave = info.recordset[0]?.Clave || gid;

        await registrarHistorial(idCoord, "GRUPO_EDIT", `Horario del grupo ${clave} actualizado`);
        res.json({ success: true });
    } catch (err) {
        await transaction.rollback().catch(() => {});
        console.error("Error PUT /coord/grupos/horario:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get("/coord/alumnos/:idDepto", async (req, res) => {
    try {
        const result = await pool.request()
            .input("ID_Departamento", sql.Int, parseInt(req.params.idDepto))
            .query(`
                SELECT a.N_ctrl, a.Nombre, a.Apellidos, a.Email,
                       a.Semestre, a.Estatus, a.id_carrera,
                       c.Nombre AS Carrera,
                       e.Nombre AS Especialidad,
                       e.id_especialidad AS ID_Especialidad,
                       (SELECT COUNT(*) FROM Inscripciones i
                        JOIN Grupos g ON i.ID_Grupo=g.ID_Grupo
                        JOIN PeriodosEscolares pe ON g.ID_Periodo=pe.ID_Periodo
                        WHERE i.N_ctrl=a.N_ctrl AND pe.Activo=1) AS GruposActivos
                FROM Alumnos a
                JOIN carrera c         ON a.id_carrera      = c.id_carrera
                LEFT JOIN especialidad e ON a.ID_Especialidad = e.id_especialidad
                WHERE c.ID_Departamento = @ID_Departamento
                ORDER BY a.Apellidos, a.Nombre
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error("Error /coord/alumnos:", err.message);
        res.status(500).json({ error: err.message });
    }
});

app.get("/coord/grupos-disponibles/:nctrl", async (req, res) => {
    try {
        const result = await pool.request()
            .input("N_ctrl", sql.NVarChar, req.params.nctrl)
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
        res.json(result.recordset);
    } catch (err) {
        console.error("Error /coord/grupos-disponibles:", err.message);
        res.status(500).json({ error: err.message });
    }
});

app.post("/coord/alumnos/cambiar-grupo", async (req, res) => {
    const { N_ctrl, ID_Grupo_Nuevo, idCoord } = req.body;

    if (!N_ctrl || !ID_Grupo_Nuevo)
        return res.status(400).json({ success: false, error: "Datos incompletos" });

    try {
        const check = await pool.request()
            .input("ID_Grupo", sql.Int, parseInt(ID_Grupo_Nuevo))
            .query("SELECT Estatus FROM Grupos WHERE ID_Grupo=@ID_Grupo");

        if (!check.recordset.length || check.recordset[0].Estatus === 'CERRADO')
            return res.json({ success: false, mensaje: "El grupo está cerrado o no existe" });

        const dup = await pool.request()
            .input("N_ctrl",   sql.NVarChar, N_ctrl)
            .input("ID_Grupo", sql.Int,      parseInt(ID_Grupo_Nuevo))
            .query("SELECT 1 FROM Inscripciones WHERE N_ctrl=@N_ctrl AND ID_Grupo=@ID_Grupo");

        if (dup.recordset.length)
            return res.json({ success: false, mensaje: "El alumno ya está inscrito en ese grupo" });

        await pool.request()
            .input("N_ctrl",   sql.NVarChar, N_ctrl)
            .input("ID_Grupo", sql.Int,      parseInt(ID_Grupo_Nuevo))
            .query("INSERT INTO Inscripciones (N_ctrl,ID_Grupo) VALUES (@N_ctrl,@ID_Grupo)");

        const ins = await pool.request()
            .input("N_ctrl",   sql.NVarChar, N_ctrl)
            .input("ID_Grupo", sql.Int,      parseInt(ID_Grupo_Nuevo))
            .query("SELECT ID_Inscripcion FROM Inscripciones WHERE N_ctrl=@N_ctrl AND ID_Grupo=@ID_Grupo");

        if (ins.recordset.length) {
            await pool.request()
                .input("ID_Inscripcion", sql.Int, ins.recordset[0].ID_Inscripcion)
                .query("INSERT INTO Calificaciones (ID_Inscripcion) VALUES (@ID_Inscripcion)");
        }

        const info = await pool.request()
            .input("ID_Grupo", sql.Int, parseInt(ID_Grupo_Nuevo))
            .query("SELECT m.Nombre AS Materia FROM Grupos g JOIN Materias m ON g.ID_Materia=m.ID_Materia WHERE g.ID_Grupo=@ID_Grupo");

        const materia = info.recordset[0]?.Materia || ID_Grupo_Nuevo;
        await registrarHistorial(idCoord, "ALU_GRUPO", `Alumno ${N_ctrl} inscrito en ${materia}`);

        res.json({ success: true });
    } catch (err) {
        console.error("Error POST /coord/alumnos/cambiar-grupo:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.put("/coord/alumnos/:nctrl/especialidad", async (req, res) => {
    const { ID_Especialidad, idCoord } = req.body;
    const nctrl = req.params.nctrl;

    try {
        await pool.request()
            .input("N_ctrl",         sql.NVarChar, nctrl)
            .input("ID_Especialidad",sql.Int,      parseInt(ID_Especialidad))
            .query("UPDATE Alumnos SET ID_Especialidad=@ID_Especialidad WHERE N_ctrl=@N_ctrl");

        const info = await pool.request()
            .input("ID_Especialidad", sql.Int, parseInt(ID_Especialidad))
            .query("SELECT Nombre FROM especialidad WHERE id_especialidad=@ID_Especialidad");

        const esp = info.recordset[0]?.Nombre || ID_Especialidad;
        await registrarHistorial(idCoord, "ALU_ESPECIALIDAD", `Alumno ${nctrl} → especialidad: ${esp}`);
        res.json({ success: true });
    } catch (err) {
        console.error("Error PUT /especialidad:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.put("/coord/alumnos/:nctrl/carrera", async (req, res) => {
    const { id_carrera_nueva, idCoord, idDepto } = req.body;
    const nctrl = req.params.nctrl;

    try {
        const check = await pool.request()
            .input("id_carrera",       sql.Int, parseInt(id_carrera_nueva))
            .input("ID_Departamento",  sql.Int, parseInt(idDepto))
            .query("SELECT 1 FROM carrera WHERE id_carrera=@id_carrera AND ID_Departamento=@ID_Departamento");

        if (!check.recordset.length)
            return res.json({ success: false, mensaje: "La carrera no pertenece a tu departamento" });

        await pool.request()
            .input("N_ctrl",      sql.NVarChar, nctrl)
            .input("id_carrera",  sql.Int,      parseInt(id_carrera_nueva))
            .query("UPDATE Alumnos SET id_carrera=@id_carrera, ID_Especialidad=NULL WHERE N_ctrl=@N_ctrl");

        const info = await pool.request()
            .input("id_carrera", sql.Int, parseInt(id_carrera_nueva))
            .query("SELECT Nombre FROM carrera WHERE id_carrera=@id_carrera");

        const carr = info.recordset[0]?.Nombre || id_carrera_nueva;
        await registrarHistorial(idCoord, "ALU_CARRERA", `Alumno ${nctrl} transferido a carrera: ${carr}`);
        res.json({ success: true });
    } catch (err) {
        console.error("Error PUT /carrera:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get("/coord/carreras/:idDepto", async (req, res) => {
    try {
        const result = await pool.request()
            .input("ID_Departamento", sql.Int, parseInt(req.params.idDepto))
            .query("SELECT id_carrera, Nombre FROM carrera WHERE ID_Departamento=@ID_Departamento ORDER BY Nombre");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/coord/especialidades/:idCarrera", async (req, res) => {
    try {
        const result = await pool.request()
            .input("id_carrera", sql.Int, parseInt(req.params.idCarrera))
            .query("SELECT id_especialidad, Nombre FROM especialidad WHERE id_carrera=@id_carrera ORDER BY Nombre");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


//  SERVIDOR
app.listen(3000, () => {
    console.log("Servidor AMBAR en http://localhost:3000");
});