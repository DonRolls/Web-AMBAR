
const alumnoRepository = require("../repositories/alumno_repository");
const coordinadorRepository = require("../repositories/coordinador_repository"); // Lo creamos después
const docenteRepository = require("../repositories/docente_repository");

const authService = {
    login: async (nctrl, pass) => {
        // 1. Intentar como alumno
        const alumno = await alumnoRepository.loginAlumno(nctrl, pass);
        if (alumno) {
            return {
                success: true,
                rol: "Alumno",
                N_ctrl: alumno.N_ctrl,
                nombre: alumno.Nombre,
                apellidos: alumno.Apellidos,
                email: alumno.Email,
                carrera: alumno.Carrera,
                semestre: alumno.Semestre,
                foto: alumno.Foto
            };
        }

        // 2. Intentar como coordinador
        const coord = await coordinadorRepository.loginCoordinador(nctrl, pass);
        if (coord) {
            return {
                success: true,
                rol: "Coordinador",
                ID_Coordinador: coord.ID_Coordinador,
                N_ctrl: coord.N_ctrl,
                nombre: coord.Nombre,
                apellidos: coord.Apellidos,
                email: coord.Email,
                departamento: coord.Departamento,
                idDepto: coord.ID_Departamento
            };
        }
        // 3. Intentar como Docente
        const docente = await docenteRepository.loginDocente(nctrl, pass);
        if (docente) {
            return {
                success: true,
                rol: "Docente",
                ID_Docente: docente.ID_Docente,
                N_ctrl: docente.N_ctrl,
                nombre: docente.Nombre,
                apellidos: docente.Apellidos,
                email: docente.Email
            };
        }   
        return { success: false, error: "Credenciales incorrectas" };
    }
};

module.exports = authService;