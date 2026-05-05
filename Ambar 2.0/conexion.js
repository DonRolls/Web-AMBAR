const sql     = require("mssql");
const express = require("express");
const app     = express();
 
app.use(express.json());
app.use(express.static("."));
 

const config = {
    //user:     "emmanuel",          
    //password: "emmanuel3131",   
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
    try {
        // 1. Intentar validar como Alumno
        const resultAlumno = await pool.request()
            .input("N_ctrl", sql.NVarChar, String(N_ctrl))
            .input("pass",   sql.NVarChar, pass)
            .query(`
                SELECT a.N_ctrl, a.Nombre, a.Apellidos, a.Email,
                       c.Nombre AS Carrera, a.Semestre, a.Estatus, a.Foto
                FROM   Alumnos  a
                JOIN   carrera c ON a.ID_Carrera = c.ID_Carrera
                WHERE  a.N_ctrl = @N_ctrl 
                  AND  a.Pass = CAST(HASHBYTES('SHA2_256', @pass) AS NVARCHAR(255))
            `);

        if (resultAlumno.recordset.length > 0) {
            const u = resultAlumno.recordset[0];
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

        // 2. Si no es alumno, intentar validar como Coordinador
        // Nota: El Coordinador usa su Email en lugar del N_ctrl para logearse
        const resultCoord = await pool.request()
            .input("Email", sql.NVarChar, String(N_ctrl)) 
            .input("Pass",  sql.NVarChar, pass)
            .execute('sp_LoginCoordinador');

        if (resultCoord.recordset && resultCoord.recordset.length > 0) {
            const c = resultCoord.recordset[0];
            return res.json({
                success:        true,
                rol:            'Coordinador',
                idCoordinador:  c.ID_Coordinador,
                nombre:         c.Nombre,
                apellidos:      c.Apellidos,
                email:          c.Email,
                departamento:   c.Departamento,
                idDepto:        c.ID_Departamento
            });
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
 

//  SERVIDOR
app.listen(3000, () => {
    console.log("Servidor AMBAR en http://localhost:3000");
});