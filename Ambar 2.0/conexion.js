let mysql   = require("mysql");
let express = require("express");       
let app     = express();                

app.use(express.json());                
app.use(express.static("."));     

let conexion = mysql.createConnection({
    host:     "localhost",
    database: "ambar",
    user:     "root",
    password: ""
});

conexion.connect(function(err) {
    if (err) throw err;
    console.log("Conectado a la BD");
});

app.post("/login", function(req, res) {
    let N_ctrl = parseInt(req.body.N_ctrl);
    let pass   = req.body.pass;

    let sql = "SELECT * FROM alumnos WHERE N_ctrl = ? AND pass = ?";
    conexion.query(sql, [N_ctrl, pass], function(err, resultado) { 
        console.log("Longitud:", resultado.length);
    console.log("Error:", err);        // ← ¿Qué error sale?
    console.log("Resultado:", resultado); // ← ¿Qué devuelve?
        if (err) throw err;

        if (resultado.length > 0) {
            res.json({
                success:   true,
                nombre:    resultado[0].Nombre,
                apellidos: resultado[0].Apellidos
            });
        } else {
            res.json({ success: false });
        }
    });
});

app.get("/soporte", function(req, res) {
    conexion.query("SELECT 1", function(err) {
        if (err) {
            res.json({ conectado: false });
        } else {
            res.json({ conectado: true });
        }
    });
});

app.listen(3000, function() {          
    console.log("Servidor en http://localhost:3000");
});