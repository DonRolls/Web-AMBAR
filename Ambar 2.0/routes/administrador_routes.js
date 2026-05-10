const express = require("express");
const router  = express.Router();
const repo    = require("../repositories/administrador_repository");

const multer = require("multer");
const Papa = require("papaparse");
const upload = multer({ storage: multer.memoryStorage() });

const sql = require("mssql");
 
/* ─── Middleware auth básico ──────────────────────────────────────────────── */
function authAdmin(req, res, next) {
    const id = req.headers["x-admin-id"];
    if (id) return next();
    res.status(401).json({ error: "No autorizado" });
}
 
/* ─── Wrapper para errores async ──────────────────────────────────────────── */
const asyncH = fn => (req, res, next) => fn(req, res, next).catch(next);
 
/* ════════════════════════════════════════════════════
   ALUMNOS
════════════════════════════════════════════════════ */
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
 
/* ════════════════════════════════════════════════════
   DOCENTES
════════════════════════════════════════════════════ */
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
 
/* ════════════════════════════════════════════════════
   COORDINADORES
════════════════════════════════════════════════════ */
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
 
/* ════════════════════════════════════════════════════
   MATERIAS
════════════════════════════════════════════════════ */
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
 
/* ════════════════════════════════════════════════════
   KARDEX
════════════════════════════════════════════════════ */
router.get("/kardex/:nctrl", authAdmin, asyncH(async (req, res) => {
    res.json(await repo.getKardexByAlumno(req.params.nctrl));
}));
 
/* ─── Manejador de errores ─────────────────────────────────────────────────── */
router.use((err, req, res, next) => {
    console.error("[Admin Route Error]", err.message);
    res.status(500).json({ error: "Error interno del servidor", detail: err.message });
});

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

// ─── Endpoint: subir CSV y obtener previsualización ───
router.post("/materias/import/preview", authAdmin, upload.single("file"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No se envió ningún archivo." });
        const data = parseCSV(req.file.buffer);
        // Validación básica
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
                errors.push(`Fila ${i+2}: faltan campos obligatorios (clave, nombre, creditos, id_carrera).`);
            }

            return { clave, nombre, creditos, id_carrera, esOptativa, numUnidades, semestre };
        });

        res.json({ success: true, preview, errors });
    } catch (err) {
        console.error("Error en preview:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─── Endpoint: guardar los datos confirmados ───
router.post("/materias/import/save", authAdmin, async (req, res) => {
    try {
        const { materias } = req.body;
        if (!Array.isArray(materias) || materias.length === 0) {
            return res.status(400).json({ error: "No se recibieron datos." });
        }

        const pool = await require("../config/database").getPool();
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
        console.error("Error en import/save:", err.message);
        res.status(500).json({ error: err.message });
    }
});
 
module.exports = router;