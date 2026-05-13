
-- AMBAR — CARGA DE MATERIAS (DEMO)
-- Inscribe a los alumnos en grupos y genera sus registros de calificaciones

USE ambar;
GO

PRINT 'Insertando carga de materias para alumnos...';

-- 1. Inscribir a JESUS ARMANDO (21212680) en los 5 grupos disponibles
INSERT INTO Inscripciones (N_ctrl, ID_Grupo, FechaInscripcion) VALUES
    ('21212680', 1, GETDATE()),
    ('21212680', 2, GETDATE()),
    ('21212680', 3, GETDATE()),
    ('21212680', 4, GETDATE()),
    ('21212680', 5, GETDATE());

-- 2. Inscribir a DIANA FABIOLA (23210202) en algunos grupos
INSERT INTO Inscripciones (N_ctrl, ID_Grupo, FechaInscripcion) VALUES
    ('23210202', 1, GETDATE()),
    ('23210202', 3, GETDATE());

-- 3. Inscribir a MANUEL (22210333) en otros grupos
INSERT INTO Inscripciones (N_ctrl, ID_Grupo, FechaInscripcion) VALUES
    ('22210333', 2, GETDATE()),
    ('22210333', 4, GETDATE());
GO

-- 4. ASIGNAR HORARIOS A LOS GRUPOS (Para que aparezcan en la cuadrícula)
-- Limpiamos primero por si se vuelve a ejecutar
DELETE FROM HorarioGrupo WHERE ID_Grupo IN (1, 2, 3, 4, 5);

PRINT 'Asignando horarios a los grupos...';

-- Grupo 1: 08:00 - 09:00 (Ya estaba en BD_Datos, pero lo aseguramos)
INSERT INTO HorarioGrupo (ID_Grupo, DiaSemana, HoraInicio, HoraFin)
SELECT 1, d.dia, '08:00', '09:00' FROM (VALUES ('Lunes'),('Martes'),('Miercoles'),('Jueves'),('Viernes')) AS d(dia);

-- Grupo 2: 09:00 - 10:00
INSERT INTO HorarioGrupo (ID_Grupo, DiaSemana, HoraInicio, HoraFin)
SELECT 2, d.dia, '09:00', '10:00' FROM (VALUES ('Lunes'),('Martes'),('Miercoles'),('Jueves'),('Viernes')) AS d(dia);

-- Grupo 3: 10:00 - 11:00
INSERT INTO HorarioGrupo (ID_Grupo, DiaSemana, HoraInicio, HoraFin)
SELECT 3, d.dia, '10:00', '11:00' FROM (VALUES ('Lunes'),('Martes'),('Miercoles'),('Jueves'),('Viernes')) AS d(dia);

-- Grupo 4: 11:00 - 12:00
INSERT INTO HorarioGrupo (ID_Grupo, DiaSemana, HoraInicio, HoraFin)
SELECT 4, d.dia, '11:00', '12:00' FROM (VALUES ('Lunes'),('Martes'),('Miercoles'),('Jueves'),('Viernes')) AS d(dia);

-- Grupo 5: 12:00 - 13:00
INSERT INTO HorarioGrupo (ID_Grupo, DiaSemana, HoraInicio, HoraFin)
SELECT 5, d.dia, '12:00', '13:00' FROM (VALUES ('Lunes'),('Martes'),('Miercoles'),('Jueves'),('Viernes')) AS d(dia);
GO

-- 5. Generar registros de CALIFICACIONES para cada inscripción
-- Usamos un INSERT SELECT para crear una fila en Calificaciones por cada fila en Inscripciones
INSERT INTO Calificaciones (ID_Inscripcion, Unidad1, Unidad2, Unidad3, Estatus)
SELECT 
    ID_Inscripcion, 
    NULL, -- Unidad 1
    NULL, -- Unidad 2
    NULL, -- Unidad 3
    'EN CURSO'
FROM Inscripciones
WHERE ID_Inscripcion NOT IN (SELECT ID_Inscripcion FROM Calificaciones);
GO

-- 5. Poner algunas calificaciones de ejemplo para JESUS ARMANDO (primeras 5 inscripciones)
UPDATE Calificaciones
SET Unidad1 = 90, Unidad2 = 85
WHERE ID_Inscripcion IN (SELECT TOP 5 ID_Inscripcion FROM Inscripciones WHERE N_ctrl = '21212680');
GO

PRINT 'Carga de materias completada.';

-- 6. POBLAR KÁRDEX (Historial académico de Jesús Armando)
PRINT 'Poblando historial académico (Kárdex)...';

-- Borramos para evitar duplicados
DELETE FROM Kardex WHERE N_ctrl = '21212680';

-- Semestre 1 (Aprobadas)
INSERT INTO Kardex (N_ctrl, ID_Materia, ID_Periodo, Semestre, CalFinal, Estatus)
SELECT '21212680', ID_Materia, 1, 1, 85, 'APROBADO' FROM Materias WHERE Semestre = 1 AND id_carrera = 2;

-- Semestre 2 (Aprobadas y una reprobada)
INSERT INTO Kardex (N_ctrl, ID_Materia, ID_Periodo, Semestre, CalFinal, Estatus)
SELECT TOP 5 '21212680', ID_Materia, 2, 2, 90, 'APROBADO' FROM Materias WHERE Semestre = 2 AND id_carrera = 2;
-- Una reprobada en Sem 2
INSERT INTO Kardex (N_ctrl, ID_Materia, ID_Periodo, Semestre, CalFinal, Estatus)
SELECT TOP 1 '21212680', ID_Materia, 2, 2, 45, 'REPROBADO' FROM Materias WHERE Semestre = 2 AND id_carrera = 2 AND ID_Materia NOT IN (SELECT ID_Materia FROM Kardex WHERE N_ctrl = '21212680');

-- Semestre 3 (Aprobadas)
INSERT INTO Kardex (N_ctrl, ID_Materia, ID_Periodo, Semestre, CalFinal, Estatus)
SELECT '21212680', ID_Materia, 3, 3, 80, 'APROBADO' FROM Materias WHERE Semestre = 3 AND id_carrera = 2;

-- Una Crítica (Reprobada 3 veces) - Seleccionamos una materia de Semestre 4
DECLARE @idMatCritica INT;
SELECT TOP 1 @idMatCritica = ID_Materia FROM Materias WHERE Semestre = 4 AND id_carrera = 2;
INSERT INTO Kardex (N_ctrl, ID_Materia, ID_Periodo, Semestre, CalFinal, Estatus) VALUES
('21212680', @idMatCritica, 1, 4, 30, 'REPROBADO'),
('21212680', @idMatCritica, 2, 4, 50, 'REPROBADO'), 
('21212680', @idMatCritica, 3, 4, 20, 'REPROBADO');

PRINT 'Carga de datos completa.';

SELECT 
    a.Nombre + ' ' + a.Apellidos AS Alumno,
    m.Nombre AS Materia,
    g.Aula,
    c.Unidad1,
    c.Unidad2
FROM Inscripciones i
JOIN Alumnos a ON i.N_ctrl = a.N_ctrl
JOIN Grupos g ON i.ID_Grupo = g.ID_Grupo
JOIN Materias m ON g.ID_Materia = m.ID_Materia
LEFT JOIN Calificaciones c ON c.ID_Inscripcion = i.ID_Inscripcion;
GO
