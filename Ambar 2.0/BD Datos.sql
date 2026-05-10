
-- AMBAR — DATOS POR DEFECTO

USE ambar;
GO

-- DEPARTAMENTOS

INSERT INTO Departamentos (Nombre) VALUES
    ('SISTEMAS Y COMPUTACION'),
    ('INGENIERIA INDUSTRIAL'),
    ('CIENCIAS BASICAS');
GO


-- CARRERAS

INSERT INTO carrera (Clave, Nombre, ID_Departamento) VALUES
    ('ISC',   'INGENIERIA EN SISTEMAS COMPUTACIONALES',  1),
    ('IINF',  'INGENIERIA INFORMATICA',                   1),
    ('IElec', 'INGENIERIA ELECTRONICA',                   1),
    ('IIA',   'INGENIERIA INDUSTRIAL Y ADMINISTRACION',   2);
GO


-- ESPECIALIDADES

INSERT INTO especialidad (Nombre, id_carrera) VALUES
    ('DESARROLLO DE SOFTWARE USANDO COMPUTO EN LA NUBE',  2),  -- id_especialidad = 1
    ('INTELIGENCIA ARTIFICIAL Y CIENCIA DE DATOS',         2),  -- id_especialidad = 2
    ('REDES Y TELECOMUNICACIONES',                          1);  -- id_especialidad = 3
GO


-- PERIODOS ESCOLARES

INSERT INTO PeriodosEscolares (Nombre, FechaInicio, FechaFin, Activo) VALUES
    ('ENE-JUN 2025', '2025-01-13', '2025-06-27', 0),
    ('AGO-DIC 2025', '2025-08-11', '2025-12-19', 0),
    ('ENE-JUN 2026', '2026-01-12', '2026-06-26', 1);  -- Periodo activo
GO


-- DOCENTES  (con N_ctrl y Pass integrados desde el inicio)

INSERT INTO Docentes (Nombre, Apellidos, Email, N_ctrl, Pass) VALUES
    ('Carlos',   'Mendoza Ruiz',   'c.mendoza@tijuana.tecnm.mx', 'D001', 'docente123'),
    ('Laura',    'Perez Soto',     'l.perez@tijuana.tecnm.mx',   'D002', 'docente123'),
    ('Roberto',  'Garcia Torres',  'r.garcia@tijuana.tecnm.mx',  'D003', 'docente123'),
    ('Patricia', 'Lopez Ibarra',   'p.lopez@tijuana.tecnm.mx',   'D004', 'docente123'),
    ('Eduardo',  'Vazquez Reyes',  'e.vazquez@tijuana.tecnm.mx', 'D005', 'docente123');
GO


-- MATERIAS  (con NumUnidades y Semestre integrados)
-- Ajusta NumUnidades según el plan de estudios de cada materia

INSERT INTO Materias (Clave, Nombre, Creditos, EsOptativa, id_carrera, NumUnidades, Semestre) VALUES
    ('ACD-1047', 'DESARROLLO DE APLICACIONES EN LA NUBE',  5, 0, 2, 5, 8),
    ('ACD-1048', 'GESTION DE PROYECTOS DE SOFTWARE',       4, 0, 2, 4, 8),
    ('ACD-1049', 'ARQUITECTURAS DE SOFTWARE',              5, 0, 2, 5, 8),
    ('ACD-1050', 'SEGURIDAD EN APLICACIONES WEB',          4, 0, 2, 4, 8),
    ('ACD-1051', 'INTEGRACION DE TECNOLOGIAS EMERGENTES',  4, 1, 2, 3, 8),
    ('ACD-1052', 'RESIDENCIA PROFESIONAL',                10, 0, 2, 1, 9);
GO


-- GRUPOS  (con MaxAlumnos integrado)
-- ID_Materia: 1-6, ID_Docente: 1-5, ID_Periodo: 3 (activo)

INSERT INTO Grupos (ID_Materia, ID_Docente, ID_Periodo, Aula, Semestre, MaxAlumnos) VALUES
    (1, 1, 3, 'A-301', 8, 40),
    (2, 2, 3, 'A-302', 8, 35),
    (3, 3, 3, 'B-101', 8, 40),
    (4, 4, 3, 'B-102', 8, 35),
    (5, 5, 3, 'C-201', 8, 30);
GO

-- HORARIOS DE GRUPOS  (Grupo 1 como ejemplo, L-V 08:00-09:00)

INSERT INTO HorarioGrupo (ID_Grupo, DiaSemana, HoraInicio, HoraFin)
SELECT
    ID_Grupo,
    d.dia,
    '08:00',
    '09:00'
FROM Grupos
CROSS JOIN (VALUES ('Lunes'),('Martes'),('Miercoles'),('Jueves'),('Viernes')) AS d(dia)
WHERE ID_Grupo = 1;
GO


-- ALUMNOS  (contraseñas en texto plano)

INSERT INTO Alumnos (N_ctrl, Nombre, Apellidos, Email, Pass, id_carrera, ID_Especialidad, Semestre, Estatus, FechaIngreso) VALUES
    ('21212680', 'JESUS ARMANDO', 'VILLA BARRAZA',   'l21212680@tijuana.tecnm.mx', '12345',    2, 1, 10, 'VIGENTE', '2021-08-09'),
    ('23210202', 'DIANA FABIOLA', 'LUNA ESPINOZA',   'l23210202@tijuana.tecnm.mx', 'Pass1234', 2, 1,  4, 'VIGENTE', '2023-01-20'),
    ('22210333', 'MANUEL',        'OCHOA BERNAL',    'l22210333@tijuana.tecnm.mx', 'Pass1234', 1, 3,  6, 'VIGENTE', '2022-08-15');
GO


-- COORDINADORES  (contraseñas en texto plano)
INSERT INTO Coordinadores (N_ctrl, Nombre, Apellidos, Email, Pass, ID_Departamento) VALUES
    ('C001', 'Marco Antonio', 'Rios Fuentes', 'coord.sistemas@tijuana.tecnm.mx', 'coord123', 1),
    ('C003', 'Coordi',        'Demo',         'coordi@tijuana.tecnm.mx',          '1234',     1);
GO

-- ADMINISTRADORES
INSERT INTO Administradores (N_ctrl, Nombre, Apellidos, Email, Pass) VALUES
    ('A001', 'Admin', 'Principal', 'admin@tijuana.tecnm.mx', 'admin123');
GO

PRINT 'BD_Datos.sql ejecutado correctamente — datos por defecto insertados.';
GO