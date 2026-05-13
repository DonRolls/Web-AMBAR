const express = require("express");
const router  = express.Router();
const repo    = require("../repositories/administrador_repository");

const multer = require("multer");
const Papa = require("papaparse");
const upload = multer({ storage: multer.memoryStorage() });

const sql = require("mssql");
const { getPool } = require("../config/database");
 
/* ─── Middleware auth básico ──────────────────────────────────────────────── */
function authAdmin(req, res, next) {
    const id = req.headers["x-admin-id"];
    if (id) return next();
    res.status(401).json({ error: "No autorizado" });
}
 
/* ─── Wrapper para errores async ──────────────────────────────────────────── */
const asyncH = fn => (req, res, next) => fn(req, res, next).catch(next);
 
/* ALUMNOS */
router.get("/alumnos", authAdmin, asyncH(async (req, res) => {
    res.json(await repo.getAlumnos());
}));
 
router.post("/alumnos", authAdmin, asyncH(async (req, res) => {
    const { N_ctrl, Nombre, Apellidos, Email, Pass, id_carrera, Semestre } = req.body;
    if (!N_ctrl || !Nombre || !Apellidos || !Email || !Pass || !id_carrera || !Semestre)
        return res.status(400).json({ error: "Faltan campos obligatorios" });
    await repo.crearAlumno(N_ctrl, Nombre, Apellidos, Email, Pass, id_carrera, Semestre);
    res.status(201).json({ ok: true });
}));
 
router.put("/alumnos/:nctrl", authAdmin, asyncH(async (req, res) => {
    await repo.actualizarAlumno(req.params.nctrl, req.body);
    res.json({ ok: true });
}));
 
router.delete("/alumnos/:nctrl", authAdmin, asyncH(async (req, res) => {
    await repo.eliminarAlumno(req.params.nctrl);
    res.json({ ok: true });
}));
 
/* DOCENTES*/
router.get("/docentes", authAdmin, asyncH(async (req, res) => {
    res.json(await repo.getDocentes());
}));
 
router.post("/docentes", authAdmin, asyncH(async (req, res) => {
    const { N_ctrl, Nombre, Apellidos, Email, Pass } = req.body;
    if (!N_ctrl || !Nombre || !Apellidos || !Email || !Pass)
        return res.status(400).json({ error: "Faltan campos obligatorios" });
    await repo.crearDocente(N_ctrl, Nombre, Apellidos, Email, Pass);
    res.status(201).json({ ok: true });
}));
 
router.put("/docentes/:id", authAdmin, asyncH(async (req, res) => {
    await repo.actualizarDocente(parseInt(req.params.id), req.body);
    res.json({ ok: true });
}));
 
router.delete("/docentes/:id", authAdmin, asyncH(async (req, res) => {
    await repo.eliminarDocente(parseInt(req.params.id));
    res.json({ ok: true });
}));
 
/* COORDINADORES*/
router.get("/coordinadores", authAdmin, asyncH(async (req, res) => {
    res.json(await repo.getCoordinadores());
}));
 
router.post("/coordinadores", authAdmin, asyncH(async (req, res) => {
    const { N_ctrl, Nombre, Apellidos, Email, Pass, ID_Departamento } = req.body;
    if (!N_ctrl || !Nombre || !Apellidos || !Email || !Pass || !ID_Departamento)
        return res.status(400).json({ error: "Faltan campos obligatorios" });
    await repo.crearCoordinador(N_ctrl, Nombre, Apellidos, Email, Pass, ID_Departamento);
    res.status(201).json({ ok: true });
}));
 
router.put("/coordinadores/:nctrl", authAdmin, asyncH(async (req, res) => {
    await repo.actualizarCoordinador(req.params.nctrl, req.body);
    res.json({ ok: true });
}));
 
router.delete("/coordinadores/:nctrl", authAdmin, asyncH(async (req, res) => {
    await repo.eliminarCoordinador(req.params.nctrl);
    res.json({ ok: true });
}));
 
/*MATERIAS*/
router.get("/materias", authAdmin, asyncH(async (req, res) => {
    res.json(await repo.getMaterias());
}));
 
router.post("/materias", authAdmin, asyncH(async (req, res) => {
    const { Clave, Nombre, Creditos, id_carrera, EsOptativa, NumUnidades, Semestre } = req.body;
    if (!Clave || !Nombre || !Creditos || !id_carrera)
        return res.status(400).json({ error: "Faltan campos obligatorios" });
    await repo.crearMateria(
        Clave, Nombre, Creditos, id_carrera,
        EsOptativa ?? 0,
        NumUnidades ?? 3,
        Semestre ?? 1
    );
    res.status(201).json({ ok: true });
}));
 
router.put("/materias/:id", authAdmin, asyncH(async (req, res) => {
    await repo.actualizarMateria(parseInt(req.params.id), req.body);
    res.json({ ok: true });
}));
 
router.delete("/materias/:id", authAdmin, asyncH(async (req, res) => {
    await repo.eliminarMateria(parseInt(req.params.id));
    res.json({ ok: true });
}));
 
/* KARDEX */
router.get("/kardex/:nctrl", authAdmin, asyncH(async (req, res) => {
    res.json(await repo.getKardexByAlumno(req.params.nctrl));
}));

/* ─── Funciones de parseo de CSV ──────────────────────────────────────────── */
function parseCSV(buffer) {
    const csvString = buffer.toString("utf-8");
    const result = Papa.parse(csvString, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim().toLowerCase(),
    });
    if (result.errors.length) {
        throw new Error("Error al parsear CSV: " + result.errors[0].message);
    }
    return result.data;
}

function parseCSVUsuarios(buffer, tipo) {
    const csvString = buffer.toString("utf-8");
    const result = Papa.parse(csvString, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim().toLowerCase(),
    });
    if (result.errors.length) {
        throw new Error("Error al parsear CSV: " + result.errors[0].message);
    }

    const columnasRequeridas = {
        alumnos:      ['n_ctrl','nombre','apellidos','email','pass','id_carrera','semestre'],
        docentes:     ['n_ctrl','nombre','apellidos','email','pass'],
        coordinadores:['n_ctrl','nombre','apellidos','email','pass','id_departamento']
    };

    const cols = columnasRequeridas[tipo];
    if (!cols) throw new Error("Tipo de usuario no válido");

    const errors = [];
    const preview = result.data.map((row, i) => {
        const obj = {};
        cols.forEach(col => {
            obj[col] = (row[col] || '').toString().trim();
        });
        if (!obj['n_ctrl'] || !obj['nombre'] || !obj['apellidos'] || !obj['email'] || !obj['pass']) {
            errors.push(`Fila ${i+2}: faltan campos obligatorios.`);
        }
        return obj;
    });

    return { preview, errors, columns: cols };
}

/* IMPORTAR MATERIAS*/
router.post("/materias/import/preview", authAdmin, upload.single("file"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No se envió ningún archivo." });
        const data = parseCSV(req.file.buffer);
        const errors = [];
        const preview = data.map((row, i) => {
            const clave = row["clave"] || row["clave_materia"] || "";
            const nombre = row["nombre"] || row["materia"] || "";
            const creditos = parseInt(row["creditos"] || 0);
            const id_carrera = parseInt(row["id_carrera"] || 0);
            const esOptativa = row["optativa"]?.toLowerCase() === "si" ? 1 : 0;
            const numUnidades = parseInt(row["num_unidades"] || 3);
            const semestre = parseInt(row["semestre"] || 1);

            if (!clave || !nombre || !creditos || !id_carrera) {
                errors.push(`Fila ${i+2}: faltan campos obligatorios.`);
            }

            return { clave, nombre, creditos, id_carrera, esOptativa, numUnidades, semestre };
        });

        res.json({ success: true, preview, errors });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post("/materias/import/save", authAdmin, async (req, res) => {
    try {
        const { materias } = req.body;
        if (!Array.isArray(materias) || materias.length === 0)
            return res.status(400).json({ error: "No se recibieron datos." });

        const pool = await getPool();
        let inserted = 0;
        const errores = [];

        for (const m of materias) {
            try {
                await pool.request()
                    .input("Clave", sql.NVarChar, m.clave)
                    .input("Nombre", sql.NVarChar, m.nombre)
                    .input("Creditos", sql.Int, m.creditos)
                    .input("id_carrera", sql.Int, m.id_carrera)
                    .input("EsOptativa", sql.Bit, m.esOptativa)
                    .input("NumUnidades", sql.Int, m.numUnidades)
                    .input("Semestre", sql.Int, m.semestre)
                    .query(`INSERT INTO Materias (Clave, Nombre, Creditos, id_carrera, EsOptativa, NumUnidades, Semestre)
                            VALUES (@Clave, @Nombre, @Creditos, @id_carrera, @EsOptativa, @NumUnidades, @Semestre)`);
                inserted++;
            } catch (err) {
                errores.push(`Error en materia ${m.clave}: ${err.message}`);
            }
        }

        res.json({ success: true, inserted, errores });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* IMPORTAR ALUMNOS*/
router.post("/alumnos/import/preview", authAdmin, upload.single("file"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No se envió ningún archivo." });
        const { preview, errors, columns } = parseCSVUsuarios(req.file.buffer, 'alumnos');
        res.json({ success: true, preview, errors, columns });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post("/alumnos/import/save", authAdmin, async (req, res) => {
    try {
        const { usuarios } = req.body;
        if (!Array.isArray(usuarios) || usuarios.length === 0)
            return res.status(400).json({ error: "No se recibieron datos." });

        const pool = await getPool();
        let inserted = 0;
        const errores = [];

        for (const u of usuarios) {
            try {
                await pool.request()
                    .input("N_ctrl", sql.NVarChar, u.n_ctrl)
                    .input("Nombre", sql.NVarChar, u.nombre)
                    .input("Apellidos", sql.NVarChar, u.apellidos)
                    .input("Email", sql.NVarChar, u.email)
                    .input("Pass", sql.NVarChar, u.pass)
                    .input("id_carrera", sql.Int, parseInt(u.id_carrera) || 1)
                    .input("Semestre", sql.Int, parseInt(u.semestre) || 1)
                    .query(`INSERT INTO Alumnos (N_ctrl, Nombre, Apellidos, Email, Pass, id_carrera, Semestre)
                            VALUES (@N_ctrl, @Nombre, @Apellidos, @Email, @Pass, @id_carrera, @Semestre)`);
                inserted++;
            } catch (err) {
                errores.push(`Error en alumno ${u.n_ctrl}: ${err.message}`);
            }
        }
        res.json({ success: true, inserted, errores });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* IMPORTAR DOCENTES */
router.post("/docentes/import/preview", authAdmin, upload.single("file"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No se envió ningún archivo." });
        const { preview, errors, columns } = parseCSVUsuarios(req.file.buffer, 'docentes');
        res.json({ success: true, preview, errors, columns });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post("/docentes/import/save", authAdmin, async (req, res) => {
    try {
        const { usuarios } = req.body;
        if (!Array.isArray(usuarios) || usuarios.length === 0)
            return res.status(400).json({ error: "No se recibieron datos." });

        const pool = await getPool();
        let inserted = 0;
        const errores = [];

        for (const u of usuarios) {
            try {
                await pool.request()
                    .input("N_ctrl", sql.NVarChar, u.n_ctrl)
                    .input("Nombre", sql.NVarChar, u.nombre)
                    .input("Apellidos", sql.NVarChar, u.apellidos)
                    .input("Email", sql.NVarChar, u.email)
                    .input("Pass", sql.NVarChar, u.pass)
                    .query(`INSERT INTO Docentes (N_ctrl, Nombre, Apellidos, Email, Pass)
                            VALUES (@N_ctrl, @Nombre, @Apellidos, @Email, @Pass)`);
                inserted++;
            } catch (err) {
                errores.push(`Error en docente ${u.n_ctrl}: ${err.message}`);
            }
        }
        res.json({ success: true, inserted, errores });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* IMPORTAR COORDINADORES*/
router.post("/coordinadores/import/preview", authAdmin, upload.single("file"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No se envió ningún archivo." });
        const { preview, errors, columns } = parseCSVUsuarios(req.file.buffer, 'coordinadores');
        res.json({ success: true, preview, errors, columns });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post("/coordinadores/import/save", authAdmin, async (req, res) => {
    try {
        const { usuarios } = req.body;
        if (!Array.isArray(usuarios) || usuarios.length === 0)
            return res.status(400).json({ error: "No se recibieron datos." });

        const pool = await getPool();
        let inserted = 0;
        const errores = [];

        for (const u of usuarios) {
            try {
                await pool.request()
                    .input("N_ctrl", sql.NVarChar, u.n_ctrl)
                    .input("Nombre", sql.NVarChar, u.nombre)
                    .input("Apellidos", sql.NVarChar, u.apellidos)
                    .input("Email", sql.NVarChar, u.email)
                    .input("Pass", sql.NVarChar, u.pass)
                    .input("ID_Departamento", sql.Int, parseInt(u.id_departamento) || 1)
                    .query(`INSERT INTO Coordinadores (N_ctrl, Nombre, Apellidos, Email, Pass, ID_Departamento)
                            VALUES (@N_ctrl, @Nombre, @Apellidos, @Email, @Pass, @ID_Departamento)`);
                inserted++;
            } catch (err) {
                errores.push(`Error en coordinador ${u.n_ctrl}: ${err.message}`);
            }
        }
        res.json({ success: true, inserted, errores });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* 
   KARDEX DE CARRERA
   GET /admin/kardex-carrera/:idCarrera
   Devuelve todas las materias de una carrera,
   ordenadas por Semestre y luego por Nombre.
*/
router.get("/kardex-carrera/:idCarrera", authAdmin, asyncH(async (req, res) => {
    const pool = await getPool();
    const result = await pool.request()
        .input("id_carrera", sql.Int, parseInt(req.params.idCarrera))
        .query(`
            SELECT
                ID_Materia,
                Clave,
                Nombre,
                Creditos,
                EsOptativa,
                NumUnidades,
                Semestre
            FROM Materias
            WHERE id_carrera = @id_carrera
            ORDER BY Semestre ASC, Nombre ASC
        `);
    res.json(result.recordset);
}));

/* CARRERAS  (para el select del kardex)
   GET /admin/carreras */
router.get("/carreras", authAdmin, asyncH(async (req, res) => {
    const pool = await getPool();
    const result = await pool.request()
        .query(`SELECT id_carrera, clave, nombre FROM carrera ORDER BY nombre`);
    res.json(result.recordset);
}));

/* ─── Manejador de errores ─────────────────────────────────────────────────── */
router.use((err, req, res, next) => {
    console.error("[Admin Route Error]", err.message);
    res.status(500).json({ error: "Error interno del servidor", detail: err.message });
});
 



// Iniciar período de inscripciones
router.post("/periodo-carga/iniciar", authAdmin, asyncH(async (req, res) => {
    const pool = await getPool();
    await pool.request()
        .input("Activar", sql.Bit, 1)
        .execute("sp_ControlPeriodoCarga");
    res.json({ success: true, message: "Período de inscripciones iniciado" });
}));

// Finalizar período de inscripciones
router.post("/periodo-carga/finalizar", authAdmin, asyncH(async (req, res) => {
    const pool = await getPool();
    await pool.request()
        .input("Activar", sql.Bit, 0)
        .execute("sp_ControlPeriodoCarga");
    res.json({ success: true, message: "Período de inscripciones finalizado" });
}));

// Obtener estado actual del período
router.get("/periodo-carga/estado", authAdmin, asyncH(async (req, res) => {
    const pool = await getPool();
    const result = await pool.request().query(`
        SELECT TOP 1 Activo, FechaInicio, FechaFin
        FROM PeriodoCargaMaterias
        WHERE Activo = 1
    `);
    res.json({ abierto: result.recordset.length > 0, ...result.recordset[0] });
}));
module.exports = router;