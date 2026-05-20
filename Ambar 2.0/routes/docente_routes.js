const express = require("express");
const router  = express.Router();
const sql     = require("mssql");

// Si usas getPool() de tu repositorio o poolPromise de db.js, asegúrate de importarlo adecuadamente:
// Ejemplo con getPool o poolPromise de tu arquitectura:
const { getPool } = require("../repositories/docente_repository"); 
// O bien: const { poolPromise } = require("../db");

// ── AUXILIAR: Formateador robusto de horas (evita desfases u objetos de mssql)
const formatTime = (time) => {
    if (!time) return "";
    // Si viene como string tipo "19:00:00" -> "19:00"
    if (typeof time === 'string') return time.substring(0, 5);
    // Si viene como objeto nativo de mssql { hours: 19, minutes: 0 }
    if (time.hours !== undefined && time.minutes !== undefined) {
        const hh = String(time.hours).padStart(2, '0');
        const mm = String(time.minutes).padStart(2, '0');
        return `${hh}:${mm}`;
    }
    // Si viene como tipo Date
    if (time instanceof Date) {
        return time.toTimeString().substring(0, 5);
    }
    return time.toString().substring(0, 5);
};

// ── 1. GET: OBTENER HORARIO MAPEADO PARA EL FRONTEND ──────────────────────────
router.get("/horario/:idDocente", async (req, res) => {
    const idDocente = req.params.idDocente;
    try {
        // Adaptar al gestor de conexiones que use tu proyecto (getPool() o poolPromise)
        const pool = await getPool(); 
        
        const result = await pool.request()
            .input("ID_Docente", sql.Int, idDocente)
            .query(`
                SELECT 
                    g.ID_Grupo, 
                    m.Nombre AS Materia, 
                    m.Clave AS ClaveMateria, 
                    c.nombre AS Carrera, 
                    g.Aula AS AulaOriginal, 
                    hg.DiaSemana, 
                    hg.HoraInicio, 
                    hg.HoraFin
                FROM Grupos g
                INNER JOIN Materias m ON g.ID_Materia = m.ID_Materia
                INNER JOIN carrera c ON m.id_carrera = c.id_carrera
                INNER JOIN PeriodosEscolares pe ON g.ID_Periodo = pe.ID_Periodo
                LEFT JOIN HorarioGrupo hg ON g.ID_Grupo = hg.ID_Grupo
                WHERE g.ID_Docente = @ID_Docente 
                  AND pe.Activo = 1 
                  AND g.Estatus = 'ABIERTO'
            `);

        const horarioMap = {};

        // Procesamos filas y las agrupamos en la estructura que Horario.html espera
        result.recordset.forEach(row => {
            const id = row.ID_Grupo;
            
            if (!horarioMap[id]) {
                horarioMap[id] = {
                    Materia: row.Materia,
                    Carrera: row.Carrera,
                    // El HTML renderiza h.ClaveGrupo. Usamos ID_Grupo o Clave de Materia como fallback seguro
                    ClaveGrupo: row.ClaveMateria || `GRP-${id}`, 
                    Lunes: "", AulaLunes: "",
                    Martes: "", AulaMartes: "",
                    Miercoles: "", AulaMiercoles: "",
                    Jueves: "", AulaJueves: "",
                    Viernes: "", AulaViernes: ""
                };
            }

            if (row.DiaSemana) {
                // Normalizamos el texto del día para evitar problemas de acentos o espacios
                let dia = row.DiaSemana.trim().toLowerCase()
                    .replace('é', 'e').replace('í', 'i').replace('á', 'a');
                
                let propDia = "";
                if (dia === "lunes") propDia = "Lunes";
                else if (dia === "martes") propDia = "Martes";
                else if (dia === "miercoles") propDia = "Miercoles";
                else if (dia === "jueves") propDia = "Jueves";
                else if (dia === "viernes") propDia = "Viernes";

                if (propDia && row.HoraInicio && row.HoraFin) {
                    const inicio = formatTime(row.HoraInicio);
                    const fin = formatTime(row.HoraFin);
                    
                    // Formato final requerido: "19:00 – 20:00"
                    horarioMap[id][propDia] = `${inicio} – ${fin}`;
                    horarioMap[id][`Aula${propDia}`] = row.AulaOriginal || "AULA";
                }
            }
        });

        // Convertimos el mapa acumulado en un arreglo plano listo para JSON
        const data = Object.values(horarioMap);
        res.json(data);

    } catch (err) {
        console.error("Error en /horario:", err.message);
        res.status(500).json({ error: "Error interno al procesar el horario" });
    }
});

// ── 2. GET: COMPLEMENTO DE INSTRUMENTACIÓN (Para evitar errores en consola) ──
router.get("/instrumentacion/:idDocente", async (req, res) => {
    const idDocente = req.params.idDocente;
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input("ID_Docente", sql.Int, idDocente)
            .query(`
                SELECT 
                    m.Nombre AS Materia,
                    m.Clave AS Grupo,
                    -- Mocks dinámicos o columnas reales si cuentas con ellas
                    1 AS InstrumentacionCompleta,
                    m.NumUnidades AS InstrumentacionActual,
                    m.NumUnidades AS InstrumentacionTotal,
                    1 AS PlaneacionCompleta,
                    m.NumUnidades AS PlaneacionActual,
                    m.NumUnidades AS PlaneacionTotal
                FROM Grupos g
                INNER JOIN Materias m ON g.ID_Materia = m.ID_Materia
                INNER JOIN PeriodosEscolares pe ON g.ID_Periodo = pe.ID_Periodo
                WHERE g.ID_Docente = @ID_Docente AND pe.Activo = 1
            `);
            
        res.json(result.recordset);
    } catch (err) {
        res.json([]);
    }
});

module.exports = router;