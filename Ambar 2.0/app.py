"""
app.py
Servidor Flask — Backend AMBAR 2.0
Reemplaza el uso directo de PHP en los HTML

Instalación:
    pip install flask flask-cors mysql-connector-python bcrypt

Uso:
    python app.py
    El servidor corre en http://localhost:5000
"""

from flask import Flask, jsonify, request, session
from flask_cors import CORS
from mysql.connector import Error
import bcrypt

from conexion import get_connection

app = Flask(__name__)
app.secret_key = "ambar_secret_key_cambiar_en_produccion"  # cambiar en prod
CORS(app, supports_credentials=True, origins=["http://localhost", "http://127.0.0.1"])


# ── Helpers ────────────────────────────────────────────────────────────────────

def query(sql: str, params: tuple = (), fetchone: bool = False):
    """Ejecuta un SELECT y devuelve filas como lista de dicts."""
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(sql, params)
    result = cursor.fetchone() if fetchone else cursor.fetchall()
    cursor.close()
    conn.close()
    return result


def execute(sql: str, params: tuple = ()):
    """Ejecuta INSERT / UPDATE / DELETE. Devuelve lastrowid."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(sql, params)
    conn.commit()
    last_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return last_id


def login_required(f):
    """Decorador básico de sesión."""
    from functools import wraps
    @wraps(f)
    def wrapper(*args, **kwargs):
        if "id_estudiante" not in session:
            return jsonify({"error": "No autorizado"}), 401
        return f(*args, **kwargs)
    return wrapper


# ── Test de conexión (equivalente a conexion.php) ──────────────────────────────

@app.route("/api/test", methods=["GET"])
def test():
    from conexion import test_connection
    ok, msg = test_connection()
    status = 200 if ok else 500
    return jsonify({"ok": ok, "mensaje": msg}), status


# ── AUTH ───────────────────────────────────────────────────────────────────────

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    numero_control = (data.get("numero_control") or "").strip()
    contrasena     = (data.get("contrasena")     or "").strip()

    if not numero_control or not contrasena:
        return jsonify({"error": "Número de control y contraseña son requeridos"}), 400

    estudiante = query(
        "SELECT id_estudiante, nombre, apellido_paterno, contrasena, estatus "
        "FROM estudiantes WHERE numero_control = %s",
        (numero_control,),
        fetchone=True,
    )

    if not estudiante:
        return jsonify({"error": "Credenciales incorrectas"}), 401

    if not bcrypt.checkpw(contrasena.encode(), estudiante["contrasena"].encode()):
        return jsonify({"error": "Credenciales incorrectas"}), 401

    if estudiante["estatus"] not in ("VIGENTE", "IRREGULAR"):
        return jsonify({"error": f"Cuenta con estatus: {estudiante['estatus']}"}), 403

    session["id_estudiante"]   = estudiante["id_estudiante"]
    session["numero_control"]  = numero_control
    session["nombre"]          = f"{estudiante['nombre']} {estudiante['apellido_paterno']}"

    return jsonify({"ok": True, "nombre": session["nombre"]}), 200


@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"ok": True}), 200


# ── INICIO ─────────────────────────────────────────────────────────────────────

@app.route("/api/inicio", methods=["GET"])
@login_required
def inicio():
    eid = session["id_estudiante"]

    estudiante = query(
        """
        SELECT e.numero_control,
               CONCAT(e.nombre,' ',e.apellido_paterno,' ',IFNULL(e.apellido_materno,'')) AS nombre_completo,
               e.email, e.semestre_actual, e.estatus, e.foto,
               c.nombre  AS carrera,
               ep.nombre AS especialidad,
               v.promedio_general,
               v.promedio_sin_reprobadas,
               v.materias_reprobadas
        FROM   estudiantes e
        JOIN   carreras     c  ON c.id_carrera      = e.id_carrera
        LEFT JOIN especialidades ep ON ep.id_especialidad = e.id_especialidad
        LEFT JOIN v_promedios    v  ON v.id_estudiante   = e.id_estudiante
        WHERE  e.id_estudiante = %s
        """,
        (eid,),
        fetchone=True,
    )
    return jsonify(estudiante), 200


# ── HORARIO ────────────────────────────────────────────────────────────────────

@app.route("/api/horario", methods=["GET"])
@login_required
def horario():
    ctrl = session["numero_control"]
    rows = query(
        "SELECT * FROM v_horario_activo WHERE numero_control = %s",
        (ctrl,),
    )
    return jsonify(rows), 200


# ── CALIFICACIONES ─────────────────────────────────────────────────────────────

@app.route("/api/calificaciones", methods=["GET"])
@login_required
def calificaciones():
    eid = session["id_estudiante"]
    id_periodo = request.args.get("id_periodo")

    sql = """
        SELECT m.nombre AS materia, m.nombre_corto,
               g.clave_grupo, g.aula,
               CONCAT(d.nombre,' ',d.apellido_paterno) AS docente,
               c.parcial1, c.parcial2, c.parcial3, c.calificacion_final, c.estatus,
               p.nombre AS periodo
        FROM   inscripciones i
        JOIN   grupos      g  ON g.id_grupo      = i.id_grupo
        JOIN   materias    m  ON m.id_materia    = g.id_materia
        JOIN   docentes    d  ON d.id_docente    = g.id_docente
        JOIN   periodos    p  ON p.id_periodo    = i.id_periodo
        LEFT JOIN calificaciones c ON c.id_inscripcion = i.id_inscripcion
        WHERE  i.id_estudiante = %s
    """
    params = [eid]
    if id_periodo:
        sql += " AND i.id_periodo = %s"
        params.append(id_periodo)
    else:
        sql += " AND p.activo = 1"

    rows = query(sql, tuple(params))
    return jsonify(rows), 200


# ── KARDEX ─────────────────────────────────────────────────────────────────────

@app.route("/api/kardex", methods=["GET"])
@login_required
def kardex():
    ctrl = session["numero_control"]
    rows = query(
        "SELECT * FROM v_kardex WHERE numero_control = %s",
        (ctrl,),
    )
    return jsonify(rows), 200


# ── HISTÍRICO DE ACTIVIDADES ───────────────────────────────────────────────────

@app.route("/api/actividades", methods=["GET"])
@login_required
def actividades():
    eid = session["id_estudiante"]
    comp  = query("SELECT * FROM actividades_complementarias WHERE id_estudiante=%s", (eid,))
    extra = query("SELECT * FROM actividades_extraescolares   WHERE id_estudiante=%s", (eid,))
    tuto  = query(
        """SELECT t.*, CONCAT(d.nombre,' ',d.apellido_paterno) AS tutor
           FROM tutorias t JOIN docentes d ON d.id_docente=t.id_docente
           WHERE t.id_estudiante=%s""",
        (eid,),
    )
    return jsonify({
        "complementarias": comp,
        "extraescolares":  extra,
        "tutorias":        tuto,
    }), 200


# ── RECIBOS ────────────────────────────────────────────────────────────────────

@app.route("/api/recibos", methods=["GET"])
@login_required
def recibos():
    eid = session["id_estudiante"]
    historico = request.args.get("historico", "0") == "1"
    sql = """
        SELECT r.*, p.nombre AS periodo
        FROM recibos r
        LEFT JOIN periodos p ON p.id_periodo = r.id_periodo
        WHERE r.id_estudiante = %s
    """
    params = [eid]
    if not historico:
        sql += " AND p.activo = 1"
    sql += " ORDER BY r.fecha_emision DESC"
    rows = query(sql, tuple(params))
    return jsonify(rows), 200


# ── CARGA DE MATERIAS ──────────────────────────────────────────────────────────

@app.route("/api/carga/estado", methods=["GET"])
@login_required
def carga_estado():
    """Devuelve si hay periodo de carga activo para la carrera del estudiante."""
    eid = session["id_estudiante"]
    est = query("SELECT id_carrera FROM estudiantes WHERE id_estudiante=%s", (eid,), fetchone=True)
    from datetime import datetime
    now = datetime.now()
    pc = query(
        """SELECT pc.* FROM periodos_carga pc
           JOIN periodos p ON p.id_periodo = pc.id_periodo
           WHERE pc.id_carrera = %s AND p.activo = 1
             AND %s BETWEEN pc.fecha_inicio AND pc.fecha_fin""",
        (est["id_carrera"], now),
        fetchone=True,
    )
    return jsonify({"en_periodo_carga": bool(pc)}), 200


@app.route("/api/carga/grupos", methods=["GET"])
@login_required
def carga_grupos():
    """Grupos disponibles del semestre actual del estudiante."""
    eid = session["id_estudiante"]
    est = query(
        "SELECT id_carrera, semestre_actual FROM estudiantes WHERE id_estudiante=%s",
        (eid,), fetchone=True,
    )
    rows = query(
        """SELECT g.id_grupo, g.clave_grupo, g.aula,
                  m.nombre AS materia, m.creditos, m.semestre,
                  CONCAT(d.nombre,' ',d.apellido_paterno) AS docente,
                  (g.cupo_maximo - COUNT(i.id_inscripcion)) AS lugares_disponibles
           FROM grupos g
           JOIN materias m ON m.id_materia = g.id_materia
           JOIN docentes d ON d.id_docente = g.id_docente
           JOIN periodos p ON p.id_periodo = g.id_periodo
           LEFT JOIN inscripciones i ON i.id_grupo = g.id_grupo
           WHERE p.activo = 1
             AND m.id_carrera = %s
             AND m.semestre   = %s
           GROUP BY g.id_grupo
           HAVING lugares_disponibles > 0""",
        (est["id_carrera"], est["semestre_actual"]),
    )
    return jsonify(rows), 200


@app.route("/api/carga/inscribir", methods=["POST"])
@login_required
def carga_inscribir():
    eid  = session["id_estudiante"]
    data = request.get_json(silent=True) or {}
    id_grupo = data.get("id_grupo")
    if not id_grupo:
        return jsonify({"error": "id_grupo requerido"}), 400

    periodo = query("SELECT id_periodo FROM periodos WHERE activo=1", fetchone=True)
    if not periodo:
        return jsonify({"error": "Sin periodo activo"}), 400

    try:
        iid = execute(
            "INSERT INTO inscripciones (id_estudiante,id_grupo,id_periodo) VALUES (%s,%s,%s)",
            (eid, id_grupo, periodo["id_periodo"]),
        )
        execute(
            "INSERT INTO calificaciones (id_inscripcion) VALUES (%s)",
            (iid,),
        )
        return jsonify({"ok": True, "id_inscripcion": iid}), 201
    except Error as e:
        if e.errno == 1062:
            return jsonify({"error": "Ya estás inscrito en ese grupo"}), 409
        return jsonify({"error": str(e)}), 500


# ── TICKETS ────────────────────────────────────────────────────────────────────

@app.route("/api/tickets", methods=["GET"])
@login_required
def tickets_get():
    eid    = session["id_estudiante"]
    estatus = request.args.get("estatus")  # ABIERTO | FINALIZADO
    sql    = "SELECT * FROM tickets WHERE id_estudiante=%s"
    params = [eid]
    if estatus == "ABIERTO":
        sql += " AND estatus IN ('ABIERTO','EN_PROCESO')"
    elif estatus == "FINALIZADO":
        sql += " AND estatus IN ('FINALIZADO','CANCELADO')"
    sql += " ORDER BY fecha_creacion DESC"
    rows = query(sql, tuple(params))
    return jsonify(rows), 200


@app.route("/api/tickets", methods=["POST"])
@login_required
def tickets_crear():
    eid  = session["id_estudiante"]
    data = request.get_json(silent=True) or {}
    desc = (data.get("descripcion") or "").strip()
    if not desc:
        return jsonify({"error": "Descripción requerida"}), 400

    # Generar clave TK-XXXX
    ultimo = query("SELECT MAX(id_ticket) AS max_id FROM tickets", fetchone=True)
    nuevo_id = (ultimo["max_id"] or 0) + 1
    clave = f"TK-{nuevo_id:04d}"

    execute(
        "INSERT INTO tickets (id_estudiante, clave, descripcion) VALUES (%s,%s,%s)",
        (eid, clave, desc),
    )
    return jsonify({"ok": True, "clave": clave}), 201


@app.route("/api/tickets/<int:id_ticket>", methods=["PUT"])
@login_required
def tickets_editar(id_ticket):
    eid  = session["id_estudiante"]
    data = request.get_json(silent=True) or {}
    desc = (data.get("descripcion") or "").strip()
    if not desc:
        return jsonify({"error": "Descripción requerida"}), 400

    execute(
        "UPDATE tickets SET descripcion=%s WHERE id_ticket=%s AND id_estudiante=%s AND estatus='ABIERTO'",
        (desc, id_ticket, eid),
    )
    return jsonify({"ok": True}), 200


# ── PERIODOS (para selectores) ─────────────────────────────────────────────────

@app.route("/api/periodos", methods=["GET"])
@login_required
def periodos():
    rows = query("SELECT id_periodo, clave, nombre, activo FROM periodos ORDER BY id_periodo DESC")
    return jsonify(rows), 200


# ── Main ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
