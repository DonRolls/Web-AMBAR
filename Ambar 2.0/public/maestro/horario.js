// horario.js
const express = require("express");
const router = express.Router();
const sql = require("mssql");

// Importa aquí tu configuración o pool de conexión de SQL Server.
const { poolPromise } = require("./db"); 

router.get("/horario/:id", async (req, res) => {
    const idDocente = req.params.id;

    try {
        const pool = await poolPromise;
        
        // CORRECCIÓN 1: Seleccionamos hg.Aula para permitir diferentes aulas por día.
        // CORRECCIÓN 2: Seleccionamos g.Clave (o g.Nombre) para obtener el código completo del grupo (ej: SCD-2502-IF8A).
        const result = await pool.request()
            .input("ID_Docente", sql.Int, idDocente)
            .query(`
                SELECT 
                    g.ID_Grupo,
                    g.Clave AS ClaveGrupo, 
                    m.Nombre AS Materia,
                    m.Clave AS ClaveMateria,
                    c.nombre AS Carrera,
                    hg.Aula AS AulaDia,
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

        // Procesamos los renglones de la BD para agruparlos por Materia/Grupo
        result.recordset.forEach(row => {
            if (!horarioMap[row.ID_Grupo]) {
                horarioMap[row.ID_Grupo] = {
                    Materia: row.Materia,
                    Carrera: row.Carrera,
                    ClaveGrupo: row.ClaveGrupo || row.ClaveMateria, // Si g.Clave está vacío, usa la de la materia
                    Lunes: "", AulaLunes: "",
                    Martes: "", AulaMartes: "",
                    Miercoles: "", AulaMiercoles: "",
                    Jueves: "", AulaJueves: "",
                    Viernes: "", AulaViernes: ""
                };
            }

            // Si la fila actual contiene datos de un día de la semana específico
            if (row.DiaSemana) {
                // Quitamos espacios y acentos (ej: "Miércoles" -> "Miercoles")
                let diaNormalizado = row.DiaSemana.trim()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "");
                
                // Formateamos la primera letra en mayúscula (Lunes, Martes, Miercoles...)
                diaNormalizado = diaNormalizado.charAt(0).toUpperCase() + diaNormalizado.slice(1).toLowerCase();

                // CORRECCIÓN 3: Formateo seguro sin 'substr' y previniendo desfases horarios
                const formatTime = (time) => {
                    if (!time) return "";
                    if (time instanceof Date) {
                        // El driver mssql almacena el tipo TIME en los atributos UTC del objeto Date
                        const hrs = String(time.getUTCHours()).padStart(2, '0');
                        const mins = String(time.getUTCMinutes()).padStart(2, '0');
                        return `${hrs}:${mins}`;
                    }
                    return time.toString().substring(0, 5);
                };

                const horaIn = formatTime(row.HoraInicio);
                const horaFi = formatTime(row.HoraFin);

                if (horaIn && horaFi) {
                    horarioMap[row.ID_Grupo][diaNormalizado] = `${horaIn} – ${horaFi}`;
                    // Asigna el aula específica que corresponde a este día
                    horarioMap[row.ID_Grupo][`Aula${diaNormalizado}`] = row.AulaDia || "";
                }
            }
        });

        // Convertimos el mapa de objetos a una lista limpia (Array) para responder al frontend
        res.json(Object.values(horarioMap));

    } catch (error) {
        console.error("Error en la ruta /docente/horario:", error);
        res.status(500).json({ error: "Error interno al cargar el horario" });
    }
});

module.exports = router;