
-- AMBAR — PLAN DE ESTUDIOS DE 53 MATERIAS (ING. INFORMÁTICA)
USE ambar;
GO

DELETE FROM Materias WHERE id_carrera = 2;
GO

PRINT 'Insertando plan de estudios completo (53 materias)...';

-- SEMESTRE 1 (6 materias + Tutoría)
INSERT INTO Materias (Clave, Nombre, Creditos, id_carrera, Semestre) VALUES
('ACC-0901', 'Cálculo Diferencial', 5, 2, 1),
('AEF-1041', 'Fundamentos de Programación', 5, 2, 1),
('ACA-0907', 'Taller de Ética', 4, 2, 1),
('ACC-0906', 'Fundamentos de Investigación', 4, 2, 1),
('AEF-1052', 'Matemáticas Discretas I', 5, 2, 1),
('AEH-1013', 'Desarrollo Humano', 4, 2, 1),
('TUT-001', 'Tutoría I', 1, 2, 1);

-- SEMESTRE 2 (6 materias)
INSERT INTO Materias (Clave, Nombre, Creditos, id_carrera, Semestre) VALUES
('ACF-0902', 'Cálculo Integral', 5, 2, 2),
('AEF-1053', 'Programación Orientada a Objetos', 5, 2, 2),
('AEC-1008', 'Contabilidad Financiera', 4, 2, 2),
('AEF-1054', 'Matemáticas Discretas II', 5, 2, 2),
('AEF-1055', 'Probabilidad y Estadística', 5, 2, 2),
('AEC-1061', 'Taller de Legislación', 4, 2, 2);

-- SEMESTRE 3 (6 materias)
INSERT INTO Materias (Clave, Nombre, Creditos, id_carrera, Semestre) VALUES
('AED-1026', 'Estructura de Datos', 5, 2, 3),
('ACF-0903', 'Cálculo Vectorial', 5, 2, 3),
('AEC-1003', 'Arquitectura de Computadoras', 4, 2, 3),
('AEC-1042', 'Investigación de Operaciones', 4, 2, 3),
('AEC-1058', 'Sistemas Operativos I', 4, 2, 3),
('AEC-1057', 'Química', 4, 2, 3);

-- SEMESTRE 4 (6 materias)
INSERT INTO Materias (Clave, Nombre, Creditos, id_carrera, Semestre) VALUES
('AED-1067', 'Tópicos Avanzados de Programación', 5, 2, 4),
('ACF-0901', 'Álgebra Lineal', 5, 2, 4),
('AEF-1031', 'Fundamentos de Bases de Datos', 5, 2, 4),
('AEC-1059', 'Sistemas Operativos II', 4, 2, 4),
('AEC-1046', 'Métodos Numéricos', 4, 2, 4),
('AEC-1031', 'Física para Informática', 4, 2, 4);

-- SEMESTRE 5 (6 materias + Act. Complementaria)
INSERT INTO Materias (Clave, Nombre, Creditos, id_carrera, Semestre) VALUES
('AEF-1032', 'Fundamentos de Ingeniería de Software', 5, 2, 5),
('AEC-1062', 'Taller de Bases de Datos', 4, 2, 5),
('AEC-1056', 'Fundamentos de Redes', 4, 2, 5),
('AEC-1034', 'Graficación', 4, 2, 5),
('AEC-1041', 'Lenguajes y Autómatas I', 4, 2, 5),
('AEC-1060', 'Simulación', 4, 2, 5),
('ACT-001', 'Actividades Complementarias', 5, 2, 5);

-- SEMESTRE 6 (6 materias)
INSERT INTO Materias (Clave, Nombre, Creditos, id_carrera, Semestre) VALUES
('AED-1035', 'Ingeniería de Software', 5, 2, 6),
('AEC-1002', 'Administración de Bases de Datos', 4, 2, 6),
('AEC-1055', 'Redes de Computadora', 4, 2, 6),
('AEC-1042_2', 'Lenguajes y Autómatas II', 4, 2, 6),
('AEC-1063', 'Sistemas Programables', 4, 2, 6),
('AEC-1040', 'Interconectividad de Redes', 4, 2, 6);

-- SEMESTRE 7 (6 materias)
INSERT INTO Materias (Clave, Nombre, Creditos, id_carrera, Semestre) VALUES
('AEC-1032', 'Gestión de Proyectos de Software', 4, 2, 7),
('AEC-1064', 'Taller de Ingeniería de Software', 4, 2, 7),
('AEW-1001', 'Programación Web', 5, 2, 7),
('AEC-1040_2', 'Inteligencia Artificial', 4, 2, 7),
('AEC-1010', 'Conmutación y Enrutamiento', 4, 2, 7),
('AED-1015', 'Desarrollo de Aplicaciones Móviles', 5, 2, 7);

-- SEMESTRE 8 (5 materias de Especialidad)
INSERT INTO Materias (Clave, Nombre, Creditos, id_carrera, Semestre, EsOptativa) VALUES
('CLD-001', 'Arquitectura de Nube', 5, 2, 8, 1),
('CLD-002', 'Servicios Web Pro', 5, 2, 8, 1),
('CLD-003', 'Seguridad en Nube', 5, 2, 8, 1),
('CLD-004', 'Cloud DevOps', 5, 2, 8, 1),
('CLD-005', 'Contenedores y Orquestación', 5, 2, 8, 1);

-- SEMESTRE 9 (2 materias finales)
INSERT INTO Materias (Clave, Nombre, Creditos, id_carrera, Semestre) VALUES
('RES-001', 'Residencia Profesional', 10, 2, 9),
('SER-001', 'Servicio Social', 10, 2, 9);

PRINT 'Plan de estudios de 53 materias cargado correctamente.';
GO
