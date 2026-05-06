document.addEventListener("DOMContentLoaded", async () => {
    // 1. VERIFICACIÓN DE SESIÓN
    // Revisamos si el número de control existe en el almacenamiento local del navegador.
    // Si no existe, significa que no ha hecho login y lo regresamos a esa pantalla.
    const nctrl = sessionStorage.getItem("N_ctrl");
    if (!nctrl) {
        window.location.href = "/login.html";
        return;
    }

    // 2. REFERENCIAS AL DOM (Elementos del HTML)
    const nombreEl = document.querySelector(".stu-nombre");
    const idEl = document.querySelector(".stu-id");
    const carreraEl = document.querySelector(".dept-value");
    
    const avisoEl = document.querySelector(".aviso");
    const avisoIcon = document.querySelector(".aviso-icon");
    // Seleccionamos el texto que está justo después del icono en el div de aviso
    const avisoTexto = avisoEl.querySelector("span:nth-child(2)"); 
    
    const btnLogout = document.querySelector(".logout-btn");
    const btnTicket = document.querySelector(".btn-ticket");
    const btnHorario = document.querySelector(".btn-horario");

    // 3. CARGAR DATOS DEL ALUMNO
    try {
        const resAlumno = await fetch(`http://localhost:3000/alumno/${nctrl}`);
        if (resAlumno.ok) {
            const alumno = await resAlumno.json();
            // Actualizamos el HTML con los datos de la Base de Datos
            nombreEl.textContent = `${alumno.Nombre} ${alumno.Apellidos}`.toUpperCase();
            idEl.textContent = alumno.N_ctrl;
            carreraEl.textContent = alumno.Carrera.toUpperCase();
        } else {
            console.error("No se encontró el alumno en la base de datos.");
        }
    } catch (error) {
        console.error("Error al conectar con la API /alumno:", error);
    }

    // 4. VERIFICAR PERIODO DE CARGA DE MATERIAS
    try {
        const resPeriodo = await fetch("http://localhost:3000/periodo-carga");
        if (resPeriodo.ok) {
            const data = await resPeriodo.json();
            
            if (data.abierto) {
                // Si está abierto, cambiamos el estilo del aviso a un verde "Éxito"
                avisoEl.style.borderColor = "rgba(16, 185, 129, 0.5)"; 
                avisoIcon.textContent = "✅";
                avisoTexto.textContent = "El periodo de carga de materias está ABIERTO. Ya puedes seleccionar tus grupos.";
                avisoTexto.style.color = "#10B981"; // Texto verde oscuro
                
                // Nota: Aquí en el futuro puedes inyectar mediante JS la tabla o lista
                // de materias disponibles para que el alumno las seleccione.
            } else {
                // Si está cerrado, mantenemos el estilo de advertencia que ya tienes
                avisoEl.style.borderColor = "rgba(245,158,11,.4)";
                avisoIcon.textContent = "ℹ️";
                avisoTexto.textContent = "Fuera de horario de carga de materias.";
            }
        }
    } catch (error) {
        console.error("Error al consultar el periodo de carga:", error);
    }

    // 5. EVENTOS DE LOS BOTONES
    
    // Cerrar sesión
    btnLogout.addEventListener("click", () => {
        sessionStorage.removeItem("N_ctrl"); // Borramos la sesión
        // Si guardaste más datos (como el rol), puedes usar sessionStorage.clear();
        window.location.href = "/login.html";
    });

    // Redirección a Tickets
    btnTicket.addEventListener("click", () => {
        window.location.href = "/tickets.html"; 
    });

    // Redirección a Horario
    btnHorario.addEventListener("click", () => {
        window.location.href = "/horario.html"; 
    });
});