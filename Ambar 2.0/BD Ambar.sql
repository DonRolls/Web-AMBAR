-- ============================================================
-- AMBAR — ESTRUCTURA COMPLETA DE BASE DE DATOS
-- Versión unificada: BD_Ambar + BD_Alter + BD_Alter2
--
-- INSTRUCCIONES DE USO:
--   1. Ejecutar este archivo  → crea toda la estructura
--   2. Ejecutar BD_Alter2.sql → Realiza los nuevos cambios
--   3. Ejecutar BD_Datos.sql  → inserta datos por defecto
-- ============================================================
 
USE master;
GO
ALTER DATABASE ambar SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
DROP DATABASE ambar;
GO
 
CREATE DATABASE ambar;
GO
USE ambar;
GO
 
-- ============================================================
-- TABLAS BASE
-- ============================================================
 
CREATE TABLE Departamentos (
    ID_Departamento INT IDENTITY(1,1) PRIMARY KEY,
    Nombre          NVARCHAR(200) NOT NULL
);
 
CREATE TABLE carrera (
    id_carrera      INT IDENTITY(1,1) PRIMARY KEY,
    clave           NVARCHAR(20)  NOT NULL UNIQUE,
    nombre          NVARCHAR(150) NOT NULL,
    ID_Departamento INT NULL,
    CONSTRAINT FK_Carrera_Depto FOREIGN KEY (ID_Departamento)
        REFERENCES Departamentos(ID_Departamento)
);
 
CREATE TABLE especialidad (
    id_especialidad INT IDENTITY(1,1) PRIMARY KEY,
    Nombre          NVARCHAR(200) NOT NULL,
    id_carrera      INT NOT NULL,
    CONSTRAINT FK_especialidad_Carrera FOREIGN KEY (id_carrera)
        REFERENCES carrera(id_carrera)
);
 
CREATE TABLE Alumnos (
    N_ctrl          NVARCHAR(10)  NOT NULL PRIMARY KEY,
    Nombre          NVARCHAR(100) NOT NULL,
    Apellidos       NVARCHAR(100) NOT NULL,
    Email           NVARCHAR(150) NOT NULL,
    Pass            NVARCHAR(255) NOT NULL,      -- texto plano
    id_carrera      INT NOT NULL,
    ID_Especialidad INT NULL,
    Semestre        INT NOT NULL DEFAULT 1,
    Estatus         NVARCHAR(20)  NOT NULL DEFAULT 'VIGENTE',
    Foto            NVARCHAR(300) NULL,
    FechaIngreso    DATE NULL,
    CONSTRAINT FK_Alumnos_Carrera      FOREIGN KEY (id_carrera)      REFERENCES carrera(id_carrera),
    CONSTRAINT FK_Alumnos_Especialidad FOREIGN KEY (ID_Especialidad) REFERENCES especialidad(id_especialidad)
);
 
-- ── Docentes: incluye N_ctrl y Pass desde el inicio (BD_Alter) ──────────────
CREATE TABLE Docentes (
    ID_Docente INT IDENTITY(1,1) PRIMARY KEY,
    Nombre     NVARCHAR(100) NOT NULL,
    Apellidos  NVARCHAR(100) NOT NULL,
    Email      NVARCHAR(150) NULL,
    N_ctrl     NVARCHAR(10)  NOT NULL UNIQUE,
    Pass       NVARCHAR(255) NOT NULL DEFAULT 'docente123'
);
 
-- ── Materias: incluye NumUnidades y Semestre desde el inicio (BD_Alter2) ────
CREATE TABLE Materias (
    ID_Materia  INT IDENTITY(1,1) PRIMARY KEY,
    Clave       NVARCHAR(20)  NOT NULL UNIQUE,
    Nombre      NVARCHAR(150) NOT NULL,
    Creditos    INT NOT NULL DEFAULT 0,
    EsOptativa  BIT NOT NULL DEFAULT 0,
    id_carrera  INT NOT NULL,
    NumUnidades INT NOT NULL DEFAULT 3,          -- BD_Alter2
    Semestre    INT NOT NULL DEFAULT 1,           -- BD_Alter2
    CONSTRAINT FK_Materias_Carrera FOREIGN KEY (id_carrera) REFERENCES carrera(id_carrera)
);
 
CREATE TABLE PeriodosEscolares (
    ID_Periodo  INT IDENTITY(1,1) PRIMARY KEY,
    Nombre      NVARCHAR(50) NOT NULL,
    FechaInicio DATE NOT NULL,
    FechaFin    DATE NOT NULL,
    Activo      BIT NOT NULL DEFAULT 0
);
 
-- ── Grupos: incluye MaxAlumnos desde el inicio (BD_Alter2) ──────────────────
CREATE TABLE Grupos (
    ID_Grupo   INT IDENTITY(1,1) PRIMARY KEY,
    ID_Materia INT NOT NULL,
    ID_Docente INT NOT NULL,
    ID_Periodo INT NOT NULL,
    Aula       NVARCHAR(20) NOT NULL,
    Semestre   INT NOT NULL,
    Estatus    NVARCHAR(20) NOT NULL DEFAULT 'ABIERTO',
    MaxAlumnos INT NOT NULL DEFAULT 40,           -- BD_Alter2
    CONSTRAINT FK_Grupos_Materia FOREIGN KEY (ID_Materia) REFERENCES Materias(ID_Materia),
    CONSTRAINT FK_Grupos_Docente FOREIGN KEY (ID_Docente) REFERENCES Docentes(ID_Docente),
    CONSTRAINT FK_Grupos_Periodo FOREIGN KEY (ID_Periodo) REFERENCES PeriodosEscolares(ID_Periodo)
);
 
CREATE TABLE HorarioGrupo (
    ID_Horario INT IDENTITY(1,1) PRIMARY KEY,
    ID_Grupo   INT NOT NULL,
    DiaSemana  NVARCHAR(10) NOT NULL,
    HoraInicio TIME NOT NULL,
    HoraFin    TIME NOT NULL,
    CONSTRAINT FK_HorarioGrupo_Grupo FOREIGN KEY (ID_Grupo) REFERENCES Grupos(ID_Grupo)
);
 
CREATE TABLE Inscripciones (
    ID_Inscripcion  INT IDENTITY(1,1) PRIMARY KEY,
    N_ctrl          NVARCHAR(10) NOT NULL,
    ID_Grupo        INT NOT NULL,
    FechaInscripcion DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    CONSTRAINT FK_Inscripciones_Alumno FOREIGN KEY (N_ctrl)    REFERENCES Alumnos(N_ctrl),
    CONSTRAINT FK_Inscripciones_Grupo  FOREIGN KEY (ID_Grupo)  REFERENCES Grupos(ID_Grupo)
);
 
-- ── Calificaciones: columnas ya renombradas a Unidad1-5 (BD_Alter2) ─────────
CREATE TABLE Calificaciones (
    ID_Calificacion INT IDENTITY(1,1) PRIMARY KEY,
    ID_Inscripcion  INT NOT NULL UNIQUE,
    Unidad1         DECIMAL(5,2) NULL,           -- antes Parcial1
    Unidad2         DECIMAL(5,2) NULL,           -- antes Parcial2
    Unidad3         DECIMAL(5,2) NULL,           -- antes Parcial3
    Unidad4         DECIMAL(5,2) NULL,           -- BD_Alter2
    Unidad5         DECIMAL(5,2) NULL,           -- BD_Alter2
    CalFinal        DECIMAL(5,2) NULL,
    Estatus         NVARCHAR(20) NOT NULL DEFAULT 'EN CURSO',
    CONSTRAINT FK_Calificaciones_Inscripcion FOREIGN KEY (ID_Inscripcion)
        REFERENCES Inscripciones(ID_Inscripcion)
);
 
CREATE TABLE Kardex (
    ID_Kardex  INT IDENTITY(1,1) PRIMARY KEY,
    N_ctrl     NVARCHAR(10) NOT NULL,
    ID_Materia INT NOT NULL,
    ID_Periodo INT NOT NULL,
    Semestre   INT NOT NULL,
    CalFinal   DECIMAL(5,2) NULL,
    Estatus    NVARCHAR(20) NOT NULL DEFAULT 'APROBADO',
    CONSTRAINT FK_Kardex_Alumno   FOREIGN KEY (N_ctrl)     REFERENCES Alumnos(N_ctrl),
    CONSTRAINT FK_Kardex_Materia  FOREIGN KEY (ID_Materia) REFERENCES Materias(ID_Materia),
    CONSTRAINT FK_Kardex_Periodo  FOREIGN KEY (ID_Periodo) REFERENCES PeriodosEscolares(ID_Periodo)
);
 
CREATE TABLE ActividadesComplementarias (
    ID_Actividad INT IDENTITY(1,1) PRIMARY KEY,
    N_ctrl       NVARCHAR(10)  NOT NULL,
    Descripcion  NVARCHAR(300) NOT NULL,
    Fecha        DATE NOT NULL,
    Horas        INT NOT NULL DEFAULT 0,
    CONSTRAINT FK_ActComp_Alumno FOREIGN KEY (N_ctrl) REFERENCES Alumnos(N_ctrl)
);
 
CREATE TABLE ActividadesExtraescolares (
    ID_Actividad INT IDENTITY(1,1) PRIMARY KEY,
    N_ctrl       NVARCHAR(10)  NOT NULL,
    Descripcion  NVARCHAR(300) NOT NULL,
    Fecha        DATE NOT NULL,
    Horas        INT NOT NULL DEFAULT 0,
    CONSTRAINT FK_ActExtra_Alumno FOREIGN KEY (N_ctrl) REFERENCES Alumnos(N_ctrl)
);
 
CREATE TABLE Tutorias (
    ID_Tutoria    INT IDENTITY(1,1) PRIMARY KEY,
    N_ctrl        NVARCHAR(10)  NOT NULL,
    ID_Docente    INT NOT NULL,
    Fecha         DATE NOT NULL,
    Observaciones NVARCHAR(500) NULL,
    CONSTRAINT FK_Tutorias_Alumno   FOREIGN KEY (N_ctrl)     REFERENCES Alumnos(N_ctrl),
    CONSTRAINT FK_Tutorias_Docente  FOREIGN KEY (ID_Docente) REFERENCES Docentes(ID_Docente)
);
 
CREATE TABLE Recibos (
    ID_Recibo     INT IDENTITY(1,1) PRIMARY KEY,
    N_ctrl        NVARCHAR(10)   NOT NULL,
    Descripcion   NVARCHAR(200)  NOT NULL,
    FechaEmision  DATE NOT NULL,
    FechaVigencia DATE NOT NULL,
    Importe       DECIMAL(10,2)  NOT NULL,
    Estatus       NVARCHAR(20)   NOT NULL DEFAULT 'PENDIENTE',
    CONSTRAINT FK_Recibos_Alumno FOREIGN KEY (N_ctrl) REFERENCES Alumnos(N_ctrl)
);
 
CREATE TABLE Tickets (
    ID_Ticket   INT IDENTITY(1,1) PRIMARY KEY,
    N_ctrl      NVARCHAR(10)  NOT NULL,
    Fecha       DATETIME NOT NULL DEFAULT GETDATE(),
    Clave       NVARCHAR(20)  NOT NULL UNIQUE,
    Descripcion NVARCHAR(500) NOT NULL,
    Estatus     NVARCHAR(20)  NOT NULL DEFAULT 'ABIERTO',
    Comentario  NVARCHAR(500) NULL,
    CONSTRAINT FK_Tickets_Alumno FOREIGN KEY (N_ctrl) REFERENCES Alumnos(N_ctrl)
);
 
CREATE TABLE PeriodoCargaMaterias (
    ID_Periodo         INT IDENTITY(1,1) PRIMARY KEY,
    ID_Periodo_Escolar INT NOT NULL,
    FechaInicio        DATETIME NOT NULL,
    FechaFin           DATETIME NOT NULL,
    Activo             BIT NOT NULL DEFAULT 0,
    CONSTRAINT FK_PeriodoCarga_Escolar FOREIGN KEY (ID_Periodo_Escolar)
        REFERENCES PeriodosEscolares(ID_Periodo)
);
 
CREATE TABLE Coordinadores (
    ID_Coordinador  INT IDENTITY(1,1) PRIMARY KEY,
    N_ctrl          NVARCHAR(10)  NOT NULL UNIQUE,
    Nombre          NVARCHAR(100) NOT NULL,
    Apellidos       NVARCHAR(100) NOT NULL,
    Email           NVARCHAR(150) NOT NULL UNIQUE,
    Pass            NVARCHAR(255) NOT NULL,      -- texto plano
    ID_Departamento INT NOT NULL,
    CONSTRAINT FK_Coord_Depto FOREIGN KEY (ID_Departamento)
        REFERENCES Departamentos(ID_Departamento)
);
 
CREATE TABLE HistorialCambios (
    ID_Historial    INT IDENTITY(1,1) PRIMARY KEY,
    ID_Coordinador  INT NOT NULL,
    TipoCambio      NVARCHAR(50)  NOT NULL,
    Descripcion     NVARCHAR(500) NOT NULL,
    Fecha           DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Hist_Coord FOREIGN KEY (ID_Coordinador)
        REFERENCES Coordinadores(ID_Coordinador)
);
 
-- ── Administradores (BD_Alter) ───────────────────────────────────────────────
CREATE TABLE Administradores (
    ID_Administrador INT IDENTITY(1,1) PRIMARY KEY,
    N_ctrl           NVARCHAR(10)  NOT NULL UNIQUE,
    Nombre           NVARCHAR(100) NOT NULL,
    Apellidos        NVARCHAR(100) NOT NULL,
    Email            NVARCHAR(150) NOT NULL UNIQUE,
    Pass             NVARCHAR(255) NOT NULL,
    Activo           BIT NOT NULL DEFAULT 1
);
 
-- ============================================================
-- STORED PROCEDURES
-- ============================================================
 
GO
CREATE OR ALTER PROCEDURE sp_LoginCoordinador
    @N_ctrl NVARCHAR(10),
    @Pass   NVARCHAR(255)
AS
BEGIN
    SELECT c.ID_Coordinador, c.N_ctrl, c.Nombre, c.Apellidos, c.Email,
           d.Nombre AS Departamento, c.ID_Departamento
    FROM   Coordinadores c
    JOIN   Departamentos d ON c.ID_Departamento = d.ID_Departamento
    WHERE  c.N_ctrl = @N_ctrl AND c.Pass = @Pass;
END;
GO
 
CREATE OR ALTER PROCEDURE sp_CoordStats
    @ID_Departamento INT
AS
BEGIN
    SELECT
        (SELECT COUNT(*) FROM Alumnos a
         JOIN carrera c ON a.id_carrera = c.id_carrera
         WHERE c.ID_Departamento = @ID_Departamento AND a.Estatus = 'VIGENTE')  AS TotalAlumnos,
 
        (SELECT COUNT(*) FROM Grupos g
         JOIN Materias m ON g.ID_Materia = m.ID_Materia
         JOIN carrera c ON m.id_carrera = c.id_carrera
         JOIN PeriodosEscolares pe ON g.ID_Periodo = pe.ID_Periodo
         WHERE c.ID_Departamento = @ID_Departamento AND pe.Activo = 1)          AS TotalGrupos,
 
        (SELECT COUNT(*) FROM Grupos g
         JOIN Materias m ON g.ID_Materia = m.ID_Materia
         JOIN carrera c ON m.id_carrera = c.id_carrera
         JOIN PeriodosEscolares pe ON g.ID_Periodo = pe.ID_Periodo
         WHERE c.ID_Departamento = @ID_Departamento AND pe.Activo = 1
           AND g.Estatus = 'CERRADO')                                           AS GruposCerrados,
 
        (SELECT COUNT(*) FROM Docentes)                                         AS TotalDocentes;
END;
GO
 
CREATE OR ALTER PROCEDURE sp_CrearGrupo
    @ID_Materia INT,
    @ID_Docente INT,
    @ID_Periodo INT,
    @Aula       NVARCHAR(20),
    @MaxAlumnos INT = 40
AS
BEGIN
    DECLARE @Semestre INT;
    SELECT @Semestre = Semestre FROM Materias WHERE ID_Materia = @ID_Materia;
 
    INSERT INTO Grupos (ID_Materia, ID_Docente, ID_Periodo, Aula, Semestre, Estatus, MaxAlumnos)
    VALUES (@ID_Materia, @ID_Docente, @ID_Periodo, @Aula, @Semestre, 'ABIERTO', @MaxAlumnos);
 
    SELECT SCOPE_IDENTITY() AS ID_Grupo;
END;
GO
 
CREATE OR ALTER PROCEDURE sp_ValidarCupoGrupo
    @ID_Grupo INT,
    @EsCoord  BIT = 0
AS
BEGIN
    SELECT
        g.MaxAlumnos,
        COUNT(i.ID_Inscripcion)                                     AS Inscritos,
        g.MaxAlumnos - COUNT(i.ID_Inscripcion)                      AS Disponibles,
        CASE
            WHEN @EsCoord = 0 AND COUNT(i.ID_Inscripcion) >= g.MaxAlumnos     THEN 0
            WHEN @EsCoord = 1 AND COUNT(i.ID_Inscripcion) >= g.MaxAlumnos + 5 THEN 0
            ELSE 1
        END AS PuedeInscribir
    FROM Grupos g
    LEFT JOIN Inscripciones i ON i.ID_Grupo = g.ID_Grupo
    WHERE g.ID_Grupo = @ID_Grupo
    GROUP BY g.MaxAlumnos;
END;
GO
 
GRANT EXECUTE ON sp_LoginCoordinador  TO public;
GRANT EXECUTE ON sp_CoordStats        TO public;
GRANT EXECUTE ON sp_CrearGrupo        TO public;
GRANT EXECUTE ON sp_ValidarCupoGrupo  TO public;
GO
 
PRINT 'BD_Estructura.sql ejecutado correctamente — estructura lista.';
GO