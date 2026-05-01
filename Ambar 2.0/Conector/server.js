const express = require('express');
const sql = require('mssql');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware para parsear el JSON que envía el frontend
app.use(express.json());

// Servir archivos estáticos (tu HTML, CSS, e imágenes)
// Coloca tu index.html dentro de una carpeta llamada "public"
app.use(express.static(path.join(__dirname, 'Conector')));


const dbConfig = {
    user: 'sa',                  // Cambia por tu usuario de SQL Server
    password: 'anotencontraseña',  // Cambia por tu contraseña
    server: 'localhost',         // Si usas una instancia con nombre: 'localhost\\SQLEXPRESS'
    database: 'Ambar',         // El nombre de tu base de datos
    options: {
        encrypt: false,          // Falso para desarrollo local
        trustServerCertificate: true 
    }
};

// Comprobar conexión a la BD (Botón "Soporte AMBAR")
app.get('/soporte', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        pool.close();
        res.json({ conectado: true });
    } catch (err) {
        console.error("Error de conexión a BD:", err.message);
        res.json({ conectado: false });
    }
});

// Lógica de Login de Alumnos
app.post('/login', async (req, res) => {
    const { N_ctrl, pass } = req.body;

    try {
        const pool = await sql.connect(dbConfig);
        
        // Evitamos inyección SQL usando variables preparadas (input)
        const result = await pool.request()
            .input('n_ctrl', sql.VarChar, N_ctrl)
            .input('password', sql.VarChar, pass)
            .query(`
                SELECT N_ctrl, nombre, apellidos, email, carrera, semestre, foto 
                FROM Alumnos 
                WHERE N_ctrl = @n_ctrl AND password = @password
            `);

        // Si la consulta devuelve al menos un registro, el login es exitoso
        if (result.recordset.length > 0) {
            const alumno = result.recordset[0];
            res.json({
                success: true,
                N_ctrl: alumno.N_ctrl,
                nombre: alumno.nombre,
                apellidos: alumno.apellidos,
                email: alumno.email,
                carrera: alumno.carrera,
                semestre: alumno.semestre,
                foto: alumno.foto
            });
        } else {
            // Credenciales incorrectas
            res.json({ success: false });
        }
    } catch (err) {
        console.error("Error en consulta de login:", err.message);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// Levantar el servidor
app.listen(PORT, () => {
    console.log(`Servidor de Proyecto Ámbar corriendo en http://localhost:${PORT}`);
});