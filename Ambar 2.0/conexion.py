"""
conexion.py
Módulo de conexión a MySQL para AMBAR 2.0
Reemplaza conexion.php — usa mysql-connector-python

Instalación:
    pip install mysql-connector-python flask flask-cors bcrypt
"""

import mysql.connector
from mysql.connector import Error
import os

# ── Configuración ──────────────────────────────────────────────────────────────
# Se recomienda usar variables de entorno en producción.
# Crea un archivo .env o exporta las variables antes de iniciar el servidor.

DB_CONFIG = {
    "host":     os.getenv("DB_HOST",     "localhost"),
    "port":     int(os.getenv("DB_PORT", 3306)),
    "user":     os.getenv("DB_USER",     "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME",     "ambar"),
    "charset":  "utf8mb4",
    "use_pure": True,
    "connection_timeout": 10,
}


def get_connection():
    """
    Devuelve una conexión activa a la base de datos.
    Lanza mysql.connector.Error si falla.
    """
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except Error as e:
        raise RuntimeError(f"Error al conectar con la BD: {e}") from e


def test_connection():
    """
    Prueba la conexión y devuelve True / False.
    Equivalente al echo 'conectado' del conexion.php original.
    """
    try:
        conn = get_connection()
        if conn.is_connected():
            info = conn.get_server_info()
            conn.close()
            return True, f"Conectado — MySQL Server {info}"
        return False, "No se pudo verificar la conexión"
    except RuntimeError as e:
        return False, str(e)
