// conexion.js
const express = require("express");
const app = express();

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Importar servicios
const authService = require("./services/auth_service");

// Importar rutas
const alumnoRoutes = require("./routes/alumno_routes");
const coordinadorRoutes = require("./routes/coordinador_routes");
const docenteRoutes = require("./routes/docente_routes");

// RUTA DE LOGIN (única ruta en el principal)
app.post("/login", async (req, res) => {
    try {
        const { N_ctrl, pass } = req.body;
        const result = await authService.login(N_ctrl, pass);
        res.json(result);
    } catch (err) {
        console.error("Error /login:", err.message);
        res.status(500).json({ success: false, error: "Error interno" });
    }
});

// Montar rutas
app.use(alumnoRoutes);                     // /horario, /calificaciones, etc.
app.use("/coord", coordinadorRoutes);      // /coord/grupos, /coord/alumnos, etc.
app.use("/docente", docenteRoutes);

// INICIAR SERVIDOR
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor AMBAR en http://localhost:${PORT}`);
});