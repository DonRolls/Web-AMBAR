USE ambar;
GO
 
-- ─────────────────────────────────────────────
--  1. ESTATUS EN GRUPOS (abierto / cerrado)
-- ─────────────────────────────────────────────
ALTER TABLE Grupos
    ADD Estatus NVARCHAR(20) NOT NULL DEFAULT 'ABIERTO';
GO
 
UPDATE Grupos SET Estatus = 'ABIERTO';
GO
 
-- ─────────────────────────────────────────────
--  2. DEPARTAMENTOS (agrupan carreras)
-- ─────────────────────────────────────────────
CREATE TABLE Departamentos (
    ID_Departamento INT          IDENTITY(1,1) PRIMARY KEY,
    Nombre          NVARCHAR(200) NOT NULL
);
GO
 
INSERT INTO Departamentos (Nombre) VALUES
    ('SISTEMAS Y COMPUTACION'),
    ('INGENIERIA INDUSTRIAL'),
    ('CIENCIAS BASICAS');
GO
 
-- Vincular carrera → departamento
ALTER TABLE carrera
    ADD ID_Departamento INT NULL
    CONSTRAINT FK_Carrera_Depto FOREIGN KEY REFERENCES Departamentos(ID_Departamento);
GO
 
UPDATE carrera SET ID_Departamento = 1 WHERE Clave IN ('ISC','IINF');
UPDATE carrera SET ID_Departamento = 2 WHERE Clave = 'IIA';
UPDATE carrera SET ID_Departamento = 1 WHERE Clave = 'IElec';
GO
 
-- ─────────────────────────────────────────────
--  3. COORDINADORES
-- ─────────────────────────────────────────────
CREATE TABLE Coordinadores (
    ID_Coordinador  INT           IDENTITY(1,1) PRIMARY KEY,
    Nombre          NVARCHAR(100) NOT NULL,
    Apellidos       NVARCHAR(100) NOT NULL,
    Email           NVARCHAR(150) NOT NULL UNIQUE,
    Pass            NVARCHAR(255) NOT NULL,
    ID_Departamento INT           NOT NULL,
    CONSTRAINT FK_Coord_Depto FOREIGN KEY (ID_Departamento)
        REFERENCES Departamentos(ID_Departamento)
);
GO
 
-- Coordinadores de prueba  (pass: coord123)
INSERT INTO Coordinadores (Nombre, Apellidos, Email, Pass, ID_Departamento) VALUES
    ('Marco Antonio', 'Rios Fuentes',    'coord.sistemas@tijuana.tecnm.mx',
        HASHBYTES('SHA2_256','coord123'), 1),
    ('Irene',         'Salazar Medina',  'coord.industrial@tijuana.tecnm.mx',
        HASHBYTES('SHA2_256','coord123'), 2);
GO
 
-- ─────────────────────────────────────────────
--  USUARIO DEMO  (pass: 1234)
--  Solo para visualizar pantallas del coordinador
-- ─────────────────────────────────────────────
INSERT INTO Coordinadores (Nombre, Apellidos, Email, Pass, ID_Departamento) VALUES
    ('Coordi', 'Demo', 'coordi@tijuana.tecnm.mx',
        HASHBYTES('SHA2_256','1234'), 1);
GO
 
-- ─────────────────────────────────────────────
--  4. HISTORIAL DE CAMBIOS (auditoría)
-- ─────────────────────────────────────────────
CREATE TABLE HistorialCambios (
    ID_Historial    INT           IDENTITY(1,1) PRIMARY KEY,
    ID_Coordinador  INT           NOT NULL,
    TipoCambio      NVARCHAR(50)  NOT NULL,   -- GRUPO_EDIT / GRUPO_ESTATUS / ALU_GRUPO / ALU_ESPECIALIDAD / ALU_CARRERA
    Descripcion     NVARCHAR(500) NOT NULL,
    Fecha           DATETIME      NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Hist_Coord FOREIGN KEY (ID_Coordinador)
        REFERENCES Coordinadores(ID_Coordinador)
);
GO
 
-- Historial de prueba
INSERT INTO HistorialCambios (ID_Coordinador, TipoCambio, Descripcion) VALUES
    (1, 'GRUPO_ESTATUS',   'Grupo SCD-2502-IF8A cerrado temporalmente por mantenimiento de aula'),
    (1, 'ALU_ESPECIALIDAD','Alumno 22210550 cambió de especialidad a Inteligencia Artificial'),
    (1, 'GRUPO_EDIT',      'Docente del grupo ACD-1047 cambiado a Laura Perez Soto'),
    (1, 'ALU_GRUPO',       'Alumno 23210101 movido al grupo 2 de Gestión de Proyectos'),
    (1, 'ALU_CARRERA',     'Alumno 24210900 transferido de IElec a IINF (mismo departamento)');
GO
 
-- ─────────────────────────────────────────────
--  5. ALUMNO EXTRA para el coordinador  (21212680 ya existe)
--     Agregar algunos alumnos más del mismo depto para demostración
-- ─────────────────────────────────────────────
INSERT INTO Alumnos (N_ctrl, Nombre, Apellidos, Email, Pass, id_carrera, ID_Especialidad, Semestre, Estatus, FechaIngreso)
VALUES
('23210202', 'DIANA FABIOLA', 'LUNA ESPINOZA',   'l23210202@tijuana.tecnm.mx', HASHBYTES('SHA2_256','Pass1234'), 2, 1, 4, 'VIGENTE', '2023-01-20'),
('22210333', 'MANUEL',        'OCHOA BERNAL',    'l22210333@tijuana.tecnm.mx', HASHBYTES('SHA2_256','Pass1234'), 1, 3, 6, 'VIGENTE', '2022-08-15'),
('24210111', 'PAOLA',         'IBARRA SOLIS',    'l24210111@tijuana.tecnm.mx', HASHBYTES('SHA2_256','Pass1234'), 2, 2, 2, 'VIGENTE', '2024-01-10'),
('21210777', 'RICARDO',       'MONTOYA PARRA',   'l21210777@tijuana.tecnm.mx', HASHBYTES('SHA2_256','Pass1234'), 1, 3, 8, 'BAJA',    '2021-08-25'),
('23210455', 'VALERIA',       'CRUZ TAPIA',      'l23210455@tijuana.tecnm.mx', HASHBYTES('SHA2_256','Pass1234'), 2, 1, 4, 'VIGENTE', '2023-01-20');
GO
 
-- Inscripciones extra para nuevos alumnos (periodo activo = 3)
INSERT INTO Inscripciones (N_ctrl, ID_Grupo, FechaInscripcion) VALUES
    ('23210202', 2, '2026-01-12'),
    ('23210202', 3, '2026-01-12'),
    ('22210333', 1, '2026-01-12'),
    ('22210333', 4, '2026-01-12'),
    ('24210111', 1, '2026-01-12'),
    ('23210455', 2, '2026-01-12'),
    ('23210455', 5, '2026-01-12');
GO
 
-- Calificaciones de nuevos alumnos
INSERT INTO Calificaciones (ID_Inscripcion, Parcial1, Parcial2, Parcial3, CalFinal, Estatus)
SELECT ID_Inscripcion, 
       CAST(70 + (CHECKSUM(NEWID()) % 25) AS DECIMAL(5,2)),
       CAST(70 + (CHECKSUM(NEWID()) % 25) AS DECIMAL(5,2)),
       NULL, NULL, 'EN CURSO'
FROM Inscripciones
WHERE N_ctrl IN ('23210202','22210333','24210111','23210455')
  AND ID_Grupo BETWEEN 1 AND 5;
GO
 
-- Kardex histórico de prueba para algunos alumnos
INSERT INTO Kardex (N_ctrl, ID_Materia, ID_Periodo, Semestre, CalFinal, Estatus) VALUES
    ('21212680', 1, 1, 8, 88.00, 'APROBADO'),
    ('21212680', 2, 1, 8, 91.00, 'APROBADO'),
    ('21212680', 3, 2, 9, 79.00, 'APROBADO'),
    ('21212680', 4, 2, 9, 85.00, 'APROBADO'),
    ('23210202', 1, 1, 2, 76.00, 'APROBADO'),
    ('23210202', 2, 2, 3, 82.00, 'APROBADO'),
    ('22210333', 3, 1, 4, 68.00, 'REPROBADO'),
    ('22210333', 3, 2, 5, 74.00, 'APROBADO');
GO
 
-- ─────────────────────────────────────────────
--  6. STORED PROCEDURE — login coordinador
-- ─────────────────────────────────────────────
CREATE OR ALTER PROCEDURE sp_LoginCoordinador
    @Email NVARCHAR(150),
    @Pass  NVARCHAR(255)
AS
BEGIN
    SELECT c.ID_Coordinador, c.Nombre, c.Apellidos, c.Email,
           d.Nombre AS Departamento, c.ID_Departamento
    FROM   Coordinadores c
    JOIN   Departamentos d ON c.ID_Departamento = d.ID_Departamento
    WHERE  c.Email = @Email
      AND  c.Pass  = HASHBYTES('SHA2_256', @Pass);
END;
GO
 
PRINT 'BD_COORD_ADDITIONS ejecutado correctamente.';
GO