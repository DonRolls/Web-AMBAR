USE ambar;
GO
-- 1. NUEVAS COLUMNAS EN Materias
IF COL_LENGTH('Materias', 'NumUnidades') IS NULL
    ALTER TABLE Materias ADD NumUnidades INT NOT NULL DEFAULT 3;
GO
IF COL_LENGTH('Materias', 'Semestre') IS NULL
    ALTER TABLE Materias ADD Semestre INT NOT NULL DEFAULT 1;
GO

-- 2. NUEVA COLUMNA EN Grupos
IF COL_LENGTH('Grupos', 'MaxAlumnos') IS NULL
    ALTER TABLE Grupos ADD MaxAlumnos INT NOT NULL DEFAULT 40;
GO

-- 3. COLUMNAS DINÁMICAS EN Calificaciones
IF COL_LENGTH('Calificaciones', 'Unidad4') IS NULL
    ALTER TABLE Calificaciones ADD Unidad4 DECIMAL(5,2) NULL;
GO
IF COL_LENGTH('Calificaciones', 'Unidad5') IS NULL
    ALTER TABLE Calificaciones ADD Unidad5 DECIMAL(5,2) NULL;
GO

-- Renombrar Parcial1/2/3 a Unidad1/2/3 para consistencia

EXEC sp_rename 'Calificaciones.Parcial1', 'Unidad1', 'COLUMN';
GO
EXEC sp_rename 'Calificaciones.Parcial2', 'Unidad2', 'COLUMN';
GO
EXEC sp_rename 'Calificaciones.Parcial3', 'Unidad3', 'COLUMN';
GO


-- 4. STORED PROCEDURE: crear grupo (coordinador)
CREATE OR ALTER PROCEDURE sp_CrearGrupo
    @ID_Materia  INT,
    @ID_Docente  INT,
    @ID_Periodo  INT,
    @Aula        NVARCHAR(20),
    @MaxAlumnos  INT = 40
AS
BEGIN
    -- Toma el semestre de la materia automáticamente
    DECLARE @Semestre INT;
    SELECT @Semestre = Semestre FROM Materias WHERE ID_Materia = @ID_Materia;

    INSERT INTO Grupos (ID_Materia, ID_Docente, ID_Periodo, Aula, Semestre, Estatus, MaxAlumnos)
    VALUES (@ID_Materia, @ID_Docente, @ID_Periodo, @Aula, @Semestre, 'ABIERTO', @MaxAlumnos);

    SELECT SCOPE_IDENTITY() AS ID_Grupo;
END;
GO

-- 5. STORED PROCEDURE: validar cupo antes de inscribir
CREATE OR ALTER PROCEDURE sp_ValidarCupoGrupo
    @ID_Grupo    INT,
    @EsCoord     BIT = 0   -- 1 si lo inscribe el coordinador (permite +5)
AS
BEGIN
    SELECT
        g.MaxAlumnos,
        COUNT(i.ID_Inscripcion)                           AS Inscritos,
        g.MaxAlumnos - COUNT(i.ID_Inscripcion)            AS Disponibles,
        CASE
            WHEN @EsCoord = 0 AND COUNT(i.ID_Inscripcion) >= g.MaxAlumnos THEN 0
            WHEN @EsCoord = 1 AND COUNT(i.ID_Inscripcion) >= g.MaxAlumnos + 5 THEN 0
            ELSE 1
        END AS PuedeInscribir
    FROM Grupos g
    LEFT JOIN Inscripciones i ON i.ID_Grupo = g.ID_Grupo
    WHERE g.ID_Grupo = @ID_Grupo
    GROUP BY g.MaxAlumnos;
END;
GO


-- 6. ACTUALIZAR sp_CoordStats para incluir campos nuevos
CREATE OR ALTER PROCEDURE sp_CoordStats
    @ID_Departamento INT
AS
BEGIN
    SELECT
        (SELECT COUNT(*) FROM Alumnos a JOIN carrera c ON a.id_carrera=c.id_carrera
         WHERE c.ID_Departamento=@ID_Departamento AND a.Estatus='VIGENTE')   AS TotalAlumnos,
        (SELECT COUNT(*) FROM Grupos g
         JOIN Materias m ON g.ID_Materia=m.ID_Materia
         JOIN carrera c ON m.id_carrera=c.id_carrera
         JOIN PeriodosEscolares pe ON g.ID_Periodo=pe.ID_Periodo
         WHERE c.ID_Departamento=@ID_Departamento AND pe.Activo=1)           AS TotalGrupos,
        (SELECT COUNT(*) FROM Grupos g
         JOIN Materias m ON g.ID_Materia=m.ID_Materia
         JOIN carrera c ON m.id_carrera=c.id_carrera
         JOIN PeriodosEscolares pe ON g.ID_Periodo=pe.ID_Periodo
         WHERE c.ID_Departamento=@ID_Departamento AND pe.Activo=1
           AND g.Estatus='CERRADO')                                          AS GruposCerrados,
        (SELECT COUNT(*) FROM Docentes)                                      AS TotalDocentes;
END;
GO

PRINT 'Cambios iniciales ejecutados correctamente.';
GO


-- 7. CREAR TABLAS PARA ACTIVIDADES

INSERT INTO PeriodoCargaMaterias (ID_Periodo_Escolar, FechaInicio, FechaFin, Activo)
SELECT TOP 1 ID_Periodo, GETDATE(), DATEADD(day, 30, GETDATE()), 0
FROM PeriodosEscolares WHERE Activo = 1;

-- Tabla para el catálogo de actividades disponibles
CREATE TABLE CatalogoActividades (
    ID_Catalogo INT IDENTITY(1,1) PRIMARY KEY,
    Titulo VARCHAR(100) NOT NULL,
    Descripcion VARCHAR(255) NOT NULL,
    Tipo VARCHAR(50) NOT NULL, -- 'COMPLEMENTARIA', 'EXTRAESCOLAR' o 'TUTORIA'
    FechaInicio DATE NOT NULL,
    FechaFin DATE NOT NULL,
    Horas INT NOT NULL,
    Cupo INT NOT NULL,
    ID_Docente INT,
    FOREIGN KEY (ID_Docente) REFERENCES Docentes(ID_Docente)
);

-- Tabla para controlar si el periodo de inscripción está abierto o cerrado
CREATE TABLE ControlActividades (
    Tipo VARCHAR(50) PRIMARY KEY, -- 'Complementaria', 'Extraescolar' o 'Tutoria'
    Activo BIT NOT NULL DEFAULT 0
);

-- Insertar los registros de control por defecto (cerrados inicialmente)
INSERT INTO ControlActividades (Tipo, Activo) VALUES ('Complementaria', 0);
INSERT INTO ControlActividades (Tipo, Activo) VALUES ('Extraescolar', 0);
GO


-- 8. AGREGAR COLUMNA ESTATUS A LAS TABLAS DE INSCRIPCIÓN DE ACTIVIDADES
IF COL_LENGTH('ActividadesComplementarias', 'Estatus') IS NULL
    ALTER TABLE ActividadesComplementarias ADD Estatus VARCHAR(20) NOT NULL DEFAULT 'APROBADA';
GO
IF COL_LENGTH('ActividadesExtraescolares', 'Estatus') IS NULL
    ALTER TABLE ActividadesExtraescolares ADD Estatus VARCHAR(20) NOT NULL DEFAULT 'APROBADA';
GO
IF COL_LENGTH('Tutorias', 'Estatus') IS NULL
    ALTER TABLE Tutorias ADD Estatus VARCHAR(20) NOT NULL DEFAULT 'APROBADA';
GO

PRINT 'Tablas y columnas para control de estatus de actividades agregadas correctamente.';
GO

-- 9. NUEVAS COLUMNAS EN Alumnos PARA DATOS PERSONALES
IF COL_LENGTH('Alumnos', 'Curp') IS NULL
    ALTER TABLE Alumnos ADD Curp NVARCHAR(18) NULL;
GO
IF COL_LENGTH('Alumnos', 'Ciudad') IS NULL
    ALTER TABLE Alumnos ADD Ciudad NVARCHAR(100) NULL;
GO
IF COL_LENGTH('Alumnos', 'Telefono') IS NULL
    ALTER TABLE Alumnos ADD Telefono NVARCHAR(20) NULL;
GO
IF COL_LENGTH('Alumnos', 'Colonia') IS NULL
    ALTER TABLE Alumnos ADD Colonia NVARCHAR(100) NULL;
GO
IF COL_LENGTH('Alumnos', 'CorreoPersonal') IS NULL
    ALTER TABLE Alumnos ADD CorreoPersonal NVARCHAR(150) NULL;
GO
IF COL_LENGTH('Alumnos', 'Calle') IS NULL
    ALTER TABLE Alumnos ADD Calle NVARCHAR(200) NULL;
GO
IF COL_LENGTH('Alumnos', 'FechaNacimiento') IS NULL
    ALTER TABLE Alumnos ADD FechaNacimiento DATE NULL;
GO
IF COL_LENGTH('Alumnos', 'CodigoPostal') IS NULL
    ALTER TABLE Alumnos ADD CodigoPostal NVARCHAR(10) NULL;
GO

-- 10. TABLA INTERMEDIA PARA CARRERAS POR ALUMNO (MULTIPLE CARRERA)
IF OBJECT_ID('AlumnoCarreras', 'U') IS NULL
BEGIN
    CREATE TABLE AlumnoCarreras (
        N_ctrl NVARCHAR(10) NOT NULL,
        id_carrera INT NOT NULL,
        Estatus NVARCHAR(20) NOT NULL, -- 'INSCRITO', 'COMPLETADO'
        PRIMARY KEY (N_ctrl, id_carrera),
        CONSTRAINT FK_AlumnoCarreras_Alumno FOREIGN KEY (N_ctrl) REFERENCES Alumnos(N_ctrl),
        CONSTRAINT FK_AlumnoCarreras_Carrera FOREIGN KEY (id_carrera) REFERENCES carrera(id_carrera)
    );
END
GO

-- 11. INSERCIÓN DE DATOS DE EJEMPLO PARA MULTICARRERA Y DATOS PERSONALES
-- Limpiar relaciones previas si existen para evitar duplicados
DELETE FROM AlumnoCarreras;
GO

INSERT INTO AlumnoCarreras (N_ctrl, id_carrera, Estatus) VALUES
    ('21212680', 2, 'INSCRITO'),
    ('21212680', 1, 'COMPLETADO'),
    ('23210202', 2, 'INSCRITO'),
    ('22210333', 1, 'INSCRITO'),
    ('22210333', 3, 'COMPLETADO');
GO

-- Actualizar alumnos con datos personales
UPDATE Alumnos SET 
    Curp = 'VIBJ010809HBCLLR01',
    Ciudad = 'Tijuana',
    Telefono = '6641234567',
    Colonia = 'Zona Centro',
    CorreoPersonal = 'armando.villa@gmail.com',
    Calle = 'Av. Revolucion 123',
    FechaNacimiento = '2001-08-09',
    CodigoPostal = '22000'
WHERE N_ctrl = '21212680';

UPDATE Alumnos SET 
    Curp = 'LUNE030120MBCLLR02',
    Ciudad = 'Tijuana',
    Telefono = '6649876543',
    Colonia = 'Rio Tijuana',
    CorreoPersonal = 'diana.luna@gmail.com',
    Calle = 'Paseo de los Heroes 456',
    FechaNacimiento = '2003-01-20',
    CodigoPostal = '22010'
WHERE N_ctrl = '23210202';

UPDATE Alumnos SET 
    Curp = 'OCBM020815HBCLLR03',
    Ciudad = 'Tijuana',
    Telefono = '6645554433',
    Colonia = 'Otay Universidad',
    CorreoPersonal = 'manuel.ochoa@gmail.com',
    Calle = 'Calzada Tecnologico 789',
    FechaNacimiento = '2002-08-15',
    CodigoPostal = '22427'
WHERE N_ctrl = '22210333';
GO

PRINT 'Tablas, columnas y datos de ejemplo para multicarrera y datos personales agregados correctamente.';
GO