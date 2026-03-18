-- ============================================================
--  BASE DE DATOS: ambar
--  Sistema AMBAR Estudiantes - TecNM Tijuana
--  Generado para proyecto AMBAR 2.0
-- ============================================================

CREATE DATABASE IF NOT EXISTS ambar
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE ambar;

-- ============================================================
--  1. CARRERAS
-- ============================================================
CREATE TABLE carreras (
    id_carrera   INT AUTO_INCREMENT PRIMARY KEY,
    clave        VARCHAR(20)  NOT NULL UNIQUE,
    nombre       VARCHAR(120) NOT NULL,
    activa       TINYINT(1)   NOT NULL DEFAULT 1
) ENGINE=InnoDB;

INSERT INTO carreras (clave, nombre) VALUES
    ('II',   'INGENIERIA INFORMATICA'),
    ('ISC',  'INGENIERIA EN SISTEMAS COMPUTACIONALES'),
    ('IEM',  'INGENIERIA ELECTROMECANICA'),
    ('IA',   'INGENIERIA AMBIENTAL'),
    ('IC',   'INGENIERIA CIVIL'),
    ('IGE',  'INGENIERIA EN GESTION EMPRESARIAL');


-- ============================================================
--  2. ESPECIALIDADES
-- ============================================================
CREATE TABLE especialidades (
    id_especialidad INT AUTO_INCREMENT PRIMARY KEY,
    id_carrera      INT         NOT NULL,
    nombre          VARCHAR(160) NOT NULL,
    FOREIGN KEY (id_carrera) REFERENCES carreras(id_carrera) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO especialidades (id_carrera, nombre) VALUES
    (1, 'DESARROLLO DE SOFTWARE USANDO COMPUTO EN LA NUBE'),
    (1, 'INTELIGENCIA ARTIFICIAL APLICADA'),
    (2, 'REDES Y TELECOMUNICACIONES'),
    (2, 'SEGURIDAD INFORMATICA');


-- ============================================================
--  3. PERIODOS ESCOLARES
-- ============================================================
CREATE TABLE periodos (
    id_periodo   INT AUTO_INCREMENT PRIMARY KEY,
    clave        VARCHAR(20)  NOT NULL UNIQUE,  -- ej. 'ENE-JUN-2026'
    nombre       VARCHAR(60)  NOT NULL,
    fecha_inicio DATE         NOT NULL,
    fecha_fin    DATE         NOT NULL,
    activo       TINYINT(1)   NOT NULL DEFAULT 0
) ENGINE=InnoDB;

INSERT INTO periodos (clave, nombre, fecha_inicio, fecha_fin, activo) VALUES
    ('ENE-JUN-2023', 'ENERO - JUNIO 2023',     '2023-01-09', '2023-06-23', 0),
    ('AGO-DIC-2023', 'AGOSTO - DICIEMBRE 2023','2023-08-14', '2023-12-15', 0),
    ('ENE-JUN-2024', 'ENERO - JUNIO 2024',     '2024-01-08', '2024-06-21', 0),
    ('AGO-DIC-2024', 'AGOSTO - DICIEMBRE 2024','2024-08-12', '2024-12-13', 0),
    ('ENE-JUN-2025', 'ENERO - JUNIO 2025',     '2025-01-13', '2025-06-20', 0),
    ('AGO-DIC-2025', 'AGOSTO - DICIEMBRE 2025','2025-08-11', '2025-12-12', 0),
    ('ENE-JUN-2026', 'ENERO - JUNIO 2026',     '2026-01-12', '2026-06-19', 1);


-- ============================================================
--  4. PERIODOS DE CARGA (ventana de inscripcion por carrera)
-- ============================================================
CREATE TABLE periodos_carga (
    id_periodo_carga INT AUTO_INCREMENT PRIMARY KEY,
    id_periodo       INT      NOT NULL,
    id_carrera       INT      NOT NULL,
    fecha_inicio     DATETIME NOT NULL,
    fecha_fin        DATETIME NOT NULL,
    FOREIGN KEY (id_periodo) REFERENCES periodos(id_periodo),
    FOREIGN KEY (id_carrera) REFERENCES carreras(id_carrera)
) ENGINE=InnoDB;

-- Ejemplo: carga para II cerrada
INSERT INTO periodos_carga (id_periodo, id_carrera, fecha_inicio, fecha_fin) VALUES
    (7, 1, '2026-01-05 08:00:00', '2026-01-10 23:59:59');


-- ============================================================
--  5. DOCENTES
-- ============================================================
CREATE TABLE docentes (
    id_docente       INT AUTO_INCREMENT PRIMARY KEY,
    numero_empleado  VARCHAR(15)  NOT NULL UNIQUE,
    nombre           VARCHAR(60)  NOT NULL,
    apellido_paterno VARCHAR(60)  NOT NULL,
    apellido_materno VARCHAR(60)  DEFAULT NULL,
    email            VARCHAR(100) NOT NULL,
    activo           TINYINT(1)   NOT NULL DEFAULT 1
) ENGINE=InnoDB;

INSERT INTO docentes (numero_empleado, nombre, apellido_paterno, apellido_materno, email) VALUES
    ('D001', 'JUAN',    'MARTINEZ', 'LOPEZ',    'j.martinez@tectijuana.edu.mx'),
    ('D002', 'CARLOS',  'GARCIA',   'RUIZ',     'c.garcia@tectijuana.edu.mx'),
    ('D003', 'PEDRO',   'HERNANDEZ','DIAZ',     'p.hernandez@tectijuana.edu.mx'),
    ('D004', 'ANA',     'LOPEZ',    'SANCHEZ',  'a.lopez@tectijuana.edu.mx'),
    ('D005', 'MARIA',   'TORRES',   'VEGA',     'm.torres@tectijuana.edu.mx');


-- ============================================================
--  6. MATERIAS
-- ============================================================
CREATE TABLE materias (
    id_materia       INT AUTO_INCREMENT PRIMARY KEY,
    clave            VARCHAR(20)  NOT NULL UNIQUE,
    nombre           VARCHAR(120) NOT NULL,
    nombre_corto     VARCHAR(30)  DEFAULT NULL,   -- para horario
    creditos         TINYINT      NOT NULL DEFAULT 5,
    horas_teoricas   TINYINT      NOT NULL DEFAULT 2,
    horas_practicas  TINYINT      NOT NULL DEFAULT 3,
    semestre         TINYINT      NOT NULL,
    id_carrera       INT          NOT NULL,
    FOREIGN KEY (id_carrera) REFERENCES carreras(id_carrera)
) ENGINE=InnoDB;

INSERT INTO materias (clave, nombre, nombre_corto, creditos, horas_teoricas, horas_practicas, semestre, id_carrera) VALUES
-- Semestre 1
('II-101', 'FUNDAMENTOS DE PROGRAMACION',         'FUNDAM D PROGRAM',    5, 2, 3, 1, 1),
('II-102', 'FUNDAMENTOS DE SISTEMAS DE INFORMACION', 'FUNDAM D SIST D INF',5, 2, 3, 1, 1),
('II-103', 'MATEMATICAS DISCRETAS',               'MAT. DISCRETAS',      5, 3, 2, 1, 1),
('II-104', 'TALLER DE ETICA',                     'TALL DE ETICA',       4, 2, 2, 1, 1),
('II-105', 'FUNDAMENTOS DE INVESTIGACION',        'FUNDAM D INVESTIG.',  4, 2, 2, 1, 1),
-- Semestre 2
('II-201', 'ESTRUCTURA DE DATOS',                 'ESTRUCTURA DE DATOS', 5, 2, 3, 2, 1),
('II-202', 'FISICA PARA INFORMATICA',             'FISICA PARA INFORMAT',5, 3, 2, 2, 1),
('II-203', 'FUNDAMENTOS DE BASES DE DATOS',       'FUNDAM D BASES D DAT',5, 2, 3, 2, 1),
('II-204', 'ADMINISTRACION PARA INFORMATICA',     'ADMON PARA INFORMAT', 5, 2, 3, 2, 1),
-- Semestre 3
('II-301', 'PROGRAMACION ORIENTADA A OBJETOS',    'PROG ORIENTADA A OBJ',5, 2, 3, 3, 1),
('II-302', 'ARQUITECTURA DE COMPUTADORAS',        'ARQ DE COMPUTADORAS', 5, 3, 2, 3, 1),
('II-303', 'SISTEMAS ELECTRONICOS PARA INFORMATICA','SIST ELECTRON P INF',5, 2, 3, 3, 1),
('II-304', 'TALLER DE INVESTIGACION I',           'TALL DE INVESTIG I',  4, 1, 3, 3, 1),
-- Semestre 4
('II-401', 'ANALISIS Y MODELADO DE SISTEMAS',     'AN Y MOD DE SIST INF',5, 2, 3, 4, 1),
('II-402', 'FUNDAMENTOS DE TELECOMUNICACIONES',   'FUNDAM D TELECOMUNIC',5, 3, 2, 4, 1),
('II-403', 'ADMINISTRACION Y ORG. DE DATOS',      'ADMON Y ORG DE DATOS',5, 2, 3, 4, 1),
-- Semestre 5
('II-501', 'REDES DE COMPUTADORAS',               'REDES D COMPUTADORAS',5, 2, 3, 5, 1),
('II-502', 'TALLER DE BASE DE DATOS',             'TALL DE BASE D DATOS', 4, 1, 3, 5, 1),
('II-503', 'TECNOLOGIA DE INTERFAZ DE COMPUTO',   'TECNOL INTERF D COMP', 5, 2, 3, 5, 1),
('II-504', 'CONTABILIDAD FINANCIERA',             'CONTAB FINANCIERA',   4, 2, 2, 5, 1),
-- Semestre 6
('II-601', 'INTERCONEXION DE REDES',              'INTERCON. REDES',     5, 2, 3, 6, 1),
('II-602', 'ADMINISTRACION DE SERVIDORES',        'ADMIN. SERVIDORES',   5, 2, 3, 6, 1),
('II-603', 'COSTOS EMPRESARIALES',                'COSTOS EMPRESARIALES',4, 2, 2, 6, 1),
-- Semestre 7
('II-701', 'INTELIGENCIA DE NEGOCIOS',            'INTELIG. NEGOCIOS',   5, 2, 3, 7, 1),
('II-702', 'CALIDAD DE SISTEMAS DE INFORMACION',  'CALID. SIST. INFORMA',5, 2, 3, 7, 1),
('II-703', 'TALLER EMPRENDEDOR',                  'TALLER EMPRENDED.',   4, 1, 3, 7, 1),
-- Semestre 8
('II-801', 'FUNDAMENTOS DE GESTION DE SERVICIOS', 'FUND. GEST. SERV.',   5, 2, 3, 8, 1),
('II-802', 'ADMINISTRACION DE RECURSOS Y FU. IN.','ADMON DE REC Y FU IN',5, 2, 3, 8, 1),
-- Semestre 9
('II-901', 'ESTRATEGIA DE GESTION DE SERVICIOS DE TI','ESTRATEG. GEST SERV.',5, 2, 3, 9, 1),
('II-902', 'AUDITORIA INFORMATICA',               'AUDITORIA INFORM.',   5, 2, 3, 9, 1),
('II-903', 'TEMAS AVANZADOS DE DESAR. EN LA NUBE','TEMAS AVAN DE DESAR DE SOFTW EN LA NUBE', 5, 2, 3, 9, 1),
-- Semestre 10
('II-1001','DESARROLLO E IMPLEMENTACION DE SISTEMAS DE INFORMACION','DES. IMP. SIST. INF.',5, 2, 3, 10, 1),
('II-1002','DESARROLLO DE APLICACIONES WEB',      'DES. APLIC. WEB',     5, 2, 3, 10, 1),
('II-1003','DESARROLLO DE SOFTWARE CON APLIC. EN LA NUBE','DESARROLLO DE SOFT CON APLIC EN LA NUBE',5, 2, 3, 10, 1),
('II-SS',  'RESIDENCIA PROFESIONAL / SERVICIO SOCIAL','RESIDENCIA PROFESION',10,0,10, 10, 1);


-- ============================================================
--  7. ESTUDIANTES
-- ============================================================
CREATE TABLE estudiantes (
    id_estudiante    INT AUTO_INCREMENT PRIMARY KEY,
    numero_control   VARCHAR(15)  NOT NULL UNIQUE,
    nombre           VARCHAR(60)  NOT NULL,
    apellido_paterno VARCHAR(60)  NOT NULL,
    apellido_materno VARCHAR(60)  DEFAULT NULL,
    email            VARCHAR(100) NOT NULL UNIQUE,
    contrasena       VARCHAR(255) NOT NULL,          -- bcrypt hash
    id_carrera       INT          NOT NULL,
    id_especialidad  INT          DEFAULT NULL,
    semestre_actual  TINYINT      NOT NULL DEFAULT 1,
    estatus          ENUM('VIGENTE','BAJA_TEMPORAL','BAJA_DEFINITIVA','EGRESADO','IRREGULAR')
                                  NOT NULL DEFAULT 'VIGENTE',
    foto             VARCHAR(255) DEFAULT NULL,       -- ruta relativa img/fotos/<ctrl>.jpg
    fecha_ingreso    DATE         DEFAULT NULL,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_carrera)      REFERENCES carreras(id_carrera),
    FOREIGN KEY (id_especialidad) REFERENCES especialidades(id_especialidad)
) ENGINE=InnoDB;

-- Contrasena: 'ambar2026' hasheada con bcrypt (solo demo, cambiar en produccion)
INSERT INTO estudiantes
    (numero_control, nombre, apellido_paterno, apellido_materno,
     email, contrasena, id_carrera, id_especialidad, semestre_actual, estatus, fecha_ingreso)
VALUES
    ('21212680', 'JESUS ARMANDO', 'VILLA', 'BARRAZA',
     '21212680@tectijuana.edu.mx',
     '$2y$10$GfQZ8qGxMq.K6bYVFqYfkOdXe.w7PlWAQcyZ8g9Z2vYDabcdefghi',  -- placeholder
     1, 1, 10, 'VIGENTE', '2021-08-09');


-- ============================================================
--  8. GRUPOS  (materia + docente + periodo + aula)
-- ============================================================
CREATE TABLE grupos (
    id_grupo         INT AUTO_INCREMENT PRIMARY KEY,
    clave_grupo      VARCHAR(20)  NOT NULL,
    id_materia       INT          NOT NULL,
    id_docente       INT          NOT NULL,
    id_periodo       INT          NOT NULL,
    aula             VARCHAR(20)  DEFAULT NULL,
    cupo_maximo      TINYINT      NOT NULL DEFAULT 35,
    UNIQUE KEY uq_grupo (clave_grupo, id_materia, id_periodo),
    FOREIGN KEY (id_materia) REFERENCES materias(id_materia),
    FOREIGN KEY (id_docente) REFERENCES docentes(id_docente),
    FOREIGN KEY (id_periodo) REFERENCES periodos(id_periodo)
) ENGINE=InnoDB;

-- Grupos del periodo activo (ENE-JUN-2026, id=7) para semestre 10
INSERT INTO grupos (clave_grupo, id_materia, id_docente, id_periodo, aula) VALUES
    ('TI9A', 31, 1, 7, 'A-201'),   -- DES. IMP. SIST. INF.
    ('DAW01',32, 2, 7, 'A-105'),   -- DESARROLLO DE APLIC. WEB
    ('DSAC1',33, 3, 7, 'A-203'),   -- DESAR. SOFT CON APLIC. EN LA NUBE
    ('EGS03',29, 4, 7, 'A-202');   -- ESTRATEG. GEST SERV.


-- ============================================================
--  9. HORARIO (dias y horas de cada grupo)
-- ============================================================
CREATE TABLE horario (
    id_horario   INT AUTO_INCREMENT PRIMARY KEY,
    id_grupo     INT NOT NULL,
    dia          ENUM('LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO') NOT NULL,
    hora_inicio  TIME NOT NULL,
    hora_fin     TIME NOT NULL,
    FOREIGN KEY (id_grupo) REFERENCES grupos(id_grupo) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Horario grupo TI9A (id=1): Lun-Vie 14:00-15:00
INSERT INTO horario (id_grupo, dia, hora_inicio, hora_fin) VALUES
    (1,'LUNES',    '14:00','15:00'),
    (1,'MARTES',   '14:00','15:00'),
    (1,'MIERCOLES','14:00','15:00'),
    (1,'JUEVES',   '14:00','15:00'),
    (1,'VIERNES',  '14:00','15:00');

-- Horario grupo DAW01 (id=2): Lun-Vie 15:00-16:00
INSERT INTO horario (id_grupo, dia, hora_inicio, hora_fin) VALUES
    (2,'LUNES',    '15:00','16:00'),
    (2,'MARTES',   '15:00','16:00'),
    (2,'MIERCOLES','15:00','16:00'),
    (2,'JUEVES',   '15:00','16:00'),
    (2,'VIERNES',  '15:00','16:00');

-- Horario grupo DSAC1 (id=3): Lun-Vie 16:00-17:00
INSERT INTO horario (id_grupo, dia, hora_inicio, hora_fin) VALUES
    (3,'LUNES',    '16:00','17:00'),
    (3,'MARTES',   '16:00','17:00'),
    (3,'MIERCOLES','16:00','17:00'),
    (3,'JUEVES',   '16:00','17:00'),
    (3,'VIERNES',  '16:00','17:00');

-- Horario grupo EGS03 (id=4): Lun-Vie 17:00-18:00
INSERT INTO horario (id_grupo, dia, hora_inicio, hora_fin) VALUES
    (4,'LUNES',    '17:00','18:00'),
    (4,'MARTES',   '17:00','18:00'),
    (4,'MIERCOLES','17:00','18:00'),
    (4,'JUEVES',   '17:00','18:00'),
    (4,'VIERNES',  '17:00','18:00');


-- ============================================================
--  10. INSCRIPCIONES  (estudiante inscrito a un grupo)
-- ============================================================
CREATE TABLE inscripciones (
    id_inscripcion   INT AUTO_INCREMENT PRIMARY KEY,
    id_estudiante    INT      NOT NULL,
    id_grupo         INT      NOT NULL,
    id_periodo       INT      NOT NULL,
    fecha_inscripcion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_inscripcion (id_estudiante, id_grupo, id_periodo),
    FOREIGN KEY (id_estudiante) REFERENCES estudiantes(id_estudiante),
    FOREIGN KEY (id_grupo)      REFERENCES grupos(id_grupo),
    FOREIGN KEY (id_periodo)    REFERENCES periodos(id_periodo)
) ENGINE=InnoDB;

-- Inscripciones del estudiante demo al periodo activo
INSERT INTO inscripciones (id_estudiante, id_grupo, id_periodo) VALUES
    (1, 1, 7),
    (1, 2, 7),
    (1, 3, 7),
    (1, 4, 7);


-- ============================================================
--  11. CALIFICACIONES  (por inscripcion / parcial)
-- ============================================================
CREATE TABLE calificaciones (
    id_calificacion  INT AUTO_INCREMENT PRIMARY KEY,
    id_inscripcion   INT           NOT NULL UNIQUE,
    parcial1         DECIMAL(5,2)  DEFAULT NULL,
    parcial2         DECIMAL(5,2)  DEFAULT NULL,
    parcial3         DECIMAL(5,2)  DEFAULT NULL,
    calificacion_final DECIMAL(5,2) DEFAULT NULL,
    estatus          ENUM('EN_CURSO','ACREDITADA','REPROBADA','NO_PRESENTADO')
                                   NOT NULL DEFAULT 'EN_CURSO',
    FOREIGN KEY (id_inscripcion) REFERENCES inscripciones(id_inscripcion)
) ENGINE=InnoDB;

-- Calificaciones del periodo activo (en curso)
INSERT INTO calificaciones (id_inscripcion, parcial1, parcial2, parcial3, calificacion_final, estatus) VALUES
    (1, NULL, NULL, NULL, NULL, 'EN_CURSO'),
    (2, NULL, NULL, NULL, NULL, 'EN_CURSO'),
    (3, NULL, NULL, NULL, NULL, 'EN_CURSO'),
    (4, NULL, NULL, NULL, NULL, 'EN_CURSO');


-- ============================================================
--  12. KARDEX  (historial completo de calificaciones)
-- ============================================================
CREATE TABLE kardex (
    id_kardex        INT AUTO_INCREMENT PRIMARY KEY,
    id_estudiante    INT          NOT NULL,
    id_materia       INT          NOT NULL,
    id_periodo       INT          NOT NULL,
    calificacion     DECIMAL(5,2) NOT NULL,
    estatus          ENUM('ACREDITADA','REPROBADA','RECURSADA') NOT NULL DEFAULT 'ACREDITADA',
    UNIQUE KEY uq_kardex (id_estudiante, id_materia, id_periodo),
    FOREIGN KEY (id_estudiante) REFERENCES estudiantes(id_estudiante),
    FOREIGN KEY (id_materia)    REFERENCES materias(id_materia),
    FOREIGN KEY (id_periodo)    REFERENCES periodos(id_periodo)
) ENGINE=InnoDB;

-- Historial del estudiante demo (semestres 1-9)
INSERT INTO kardex (id_estudiante, id_materia, id_periodo, calificacion, estatus) VALUES
-- Semestre 1 (ENE-JUN-2022)
(1,  1, 1, 90, 'ACREDITADA'),
(1,  2, 1, 88, 'ACREDITADA'),
(1,  3, 1, 85, 'ACREDITADA'),
(1,  4, 1, 92, 'ACREDITADA'),
(1,  5, 1, 87, 'ACREDITADA'),
-- Semestre 2
(1,  6, 2, 88, 'ACREDITADA'),
(1,  7, 2, 75, 'ACREDITADA'),
(1,  8, 2, 91, 'ACREDITADA'),
(1,  9, 2, 84, 'ACREDITADA'),
-- Semestre 3
(1, 10, 3, 86, 'ACREDITADA'),
(1, 11, 3, 80, 'ACREDITADA'),
(1, 12, 3, 78, 'ACREDITADA'),
(1, 13, 3, 90, 'ACREDITADA'),
-- Semestre 4
(1, 14, 4, 88, 'ACREDITADA'),
(1, 15, 4, 82, 'ACREDITADA'),
(1, 16, 4, 85, 'ACREDITADA'),
-- Semestre 5
(1, 17, 5, 87, 'ACREDITADA'),
(1, 18, 5, 91, 'ACREDITADA'),
(1, 19, 5, 83, 'ACREDITADA'),
(1, 20, 5, 79, 'ACREDITADA'),
-- Semestre 6
(1, 21, 6, 88, 'ACREDITADA'),
(1, 22, 6, 92, 'ACREDITADA'),
(1, 23, 6, 86, 'ACREDITADA'),
-- Semestre 7
(1, 24, 6, 85, 'ACREDITADA'),
(1, 25, 6, 89, 'ACREDITADA'),
(1, 26, 6, 90, 'ACREDITADA'),
-- Semestre 8
(1, 27, 6, 83, 'ACREDITADA'),
(1, 28, 6, 87, 'ACREDITADA'),
-- Semestre 9
(1, 29, 6, 80, 'ACREDITADA'),
(1, 30, 6, 82, 'ACREDITADA'),
(1, 31, 6, 78, 'ACREDITADA');


-- ============================================================
--  13. ACTIVIDADES COMPLEMENTARIAS
-- ============================================================
CREATE TABLE actividades_complementarias (
    id_actividad  INT AUTO_INCREMENT PRIMARY KEY,
    id_estudiante INT          NOT NULL,
    nombre        VARCHAR(150) NOT NULL,
    descripcion   TEXT         DEFAULT NULL,
    horas         SMALLINT     NOT NULL DEFAULT 0,
    fecha         DATE         DEFAULT NULL,
    estatus       ENUM('PENDIENTE','APROBADA','RECHAZADA') NOT NULL DEFAULT 'PENDIENTE',
    FOREIGN KEY (id_estudiante) REFERENCES estudiantes(id_estudiante)
) ENGINE=InnoDB;


-- ============================================================
--  14. ACTIVIDADES EXTRAESCOLARES
-- ============================================================
CREATE TABLE actividades_extraescolares (
    id_actividad  INT AUTO_INCREMENT PRIMARY KEY,
    id_estudiante INT          NOT NULL,
    nombre        VARCHAR(150) NOT NULL,
    descripcion   TEXT         DEFAULT NULL,
    horas         SMALLINT     NOT NULL DEFAULT 0,
    fecha         DATE         DEFAULT NULL,
    estatus       ENUM('PENDIENTE','APROBADA','RECHAZADA') NOT NULL DEFAULT 'PENDIENTE',
    FOREIGN KEY (id_estudiante) REFERENCES estudiantes(id_estudiante)
) ENGINE=InnoDB;


-- ============================================================
--  15. TUTORIAS
-- ============================================================
CREATE TABLE tutorias (
    id_tutoria    INT AUTO_INCREMENT PRIMARY KEY,
    id_estudiante INT  NOT NULL,
    id_docente    INT  NOT NULL,   -- docente tutor
    fecha         DATE NOT NULL,
    observaciones TEXT DEFAULT NULL,
    FOREIGN KEY (id_estudiante) REFERENCES estudiantes(id_estudiante),
    FOREIGN KEY (id_docente)    REFERENCES docentes(id_docente)
) ENGINE=InnoDB;


-- ============================================================
--  16. RECIBOS  (pagos y aportaciones)
-- ============================================================
CREATE TABLE recibos (
    id_recibo        INT AUTO_INCREMENT PRIMARY KEY,
    id_estudiante    INT           NOT NULL,
    id_periodo       INT           DEFAULT NULL,
    descripcion      VARCHAR(200)  NOT NULL,
    referencia       VARCHAR(50)   DEFAULT NULL,
    fecha_emision    DATE          NOT NULL,
    fecha_vigencia   DATE          NOT NULL,
    importe          DECIMAL(10,2) NOT NULL,
    estatus          ENUM('PENDIENTE','CUBIERTO','VENCIDO') NOT NULL DEFAULT 'PENDIENTE',
    fecha_pago       DATE          DEFAULT NULL,
    FOREIGN KEY (id_estudiante) REFERENCES estudiantes(id_estudiante),
    FOREIGN KEY (id_periodo)    REFERENCES periodos(id_periodo)
) ENGINE=InnoDB;

INSERT INTO recibos (id_estudiante, id_periodo, descripcion, referencia, fecha_emision, fecha_vigencia, importe, estatus, fecha_pago) VALUES
    (1, 7, 'APORTACION VOLUNTARIA REINSCRIPCION', 'REF-20260203-001',
     '2026-02-03', '2026-02-13', 3100.00, 'CUBIERTO', '2026-02-10');


-- ============================================================
--  17. TICKETS  (soporte / solicitudes)
-- ============================================================
CREATE TABLE tickets (
    id_ticket         INT AUTO_INCREMENT PRIMARY KEY,
    id_estudiante     INT          NOT NULL,
    clave             VARCHAR(20)  NOT NULL UNIQUE,  -- TK-0001
    descripcion       TEXT         NOT NULL,
    estatus           ENUM('ABIERTO','EN_PROCESO','FINALIZADO','CANCELADO')
                                   NOT NULL DEFAULT 'ABIERTO',
    comentario        TEXT         DEFAULT NULL,
    fecha_creacion    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP
                                            ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_estudiante) REFERENCES estudiantes(id_estudiante)
) ENGINE=InnoDB;


-- ============================================================
--  VISTAS UTILES
-- ============================================================

-- Vista: promedio general del estudiante
CREATE OR REPLACE VIEW v_promedios AS
SELECT
    e.id_estudiante,
    e.numero_control,
    CONCAT(e.nombre,' ',e.apellido_paterno,' ',IFNULL(e.apellido_materno,'')) AS nombre_completo,
    ROUND(AVG(k.calificacion), 2)                                              AS promedio_general,
    ROUND(AVG(CASE WHEN k.estatus = 'ACREDITADA' THEN k.calificacion END), 2) AS promedio_sin_reprobadas,
    COUNT(CASE WHEN k.estatus = 'REPROBADA' THEN 1 END)                       AS materias_reprobadas
FROM estudiantes e
JOIN kardex k ON k.id_estudiante = e.id_estudiante
GROUP BY e.id_estudiante;

-- Vista: horario completo del estudiante (periodo activo)
CREATE OR REPLACE VIEW v_horario_activo AS
SELECT
    e.numero_control,
    m.nombre_corto   AS materia,
    d.apellido_paterno AS docente,
    g.clave_grupo,
    g.aula,
    h.dia,
    h.hora_inicio,
    h.hora_fin
FROM inscripciones i
JOIN estudiantes e  ON e.id_estudiante = i.id_estudiante
JOIN grupos      g  ON g.id_grupo      = i.id_grupo
JOIN materias    m  ON m.id_materia    = g.id_materia
JOIN docentes    d  ON d.id_docente    = g.id_docente
JOIN horario     h  ON h.id_grupo      = g.id_grupo
JOIN periodos    p  ON p.id_periodo    = i.id_periodo
WHERE p.activo = 1
ORDER BY FIELD(h.dia,'LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO'), h.hora_inicio;

-- Vista: kardex completo
CREATE OR REPLACE VIEW v_kardex AS
SELECT
    e.numero_control,
    CONCAT(e.nombre,' ',e.apellido_paterno) AS estudiante,
    p.nombre    AS periodo,
    m.clave,
    m.nombre    AS materia,
    m.semestre,
    m.creditos,
    k.calificacion,
    k.estatus
FROM kardex k
JOIN estudiantes e ON e.id_estudiante = k.id_estudiante
JOIN materias    m ON m.id_materia    = k.id_materia
JOIN periodos    p ON p.id_periodo    = k.id_periodo
ORDER BY m.semestre, m.nombre;
