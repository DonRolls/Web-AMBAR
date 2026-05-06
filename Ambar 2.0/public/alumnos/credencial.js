document.addEventListener("DOMContentLoaded", async () => {
    // 1. Obtener el número de control del localStorage
    const nctrl = sessionStorage.getItem("N_ctrl");
    if (!nctrl) {
        window.location.href = "/login.html"; // Redirigir si no hay sesión
        return;
    }
 
    // Referencias a los elementos del DOM (Frente)
    const fotoEl = document.querySelector(".cred-foto");
    const nombreEl = document.querySelector(".cred-nombre");
    const carreraEl = document.querySelector(".cred-info .cred-field:nth-child(2) strong");
    const nctrlEl = document.querySelector(".cred-info .cred-field:nth-child(3) strong");
 
    // 2. Intentar cargar datos desde la API para asegurar información actualizada
    try {
        const response = await fetch(`http://localhost:3000/alumno/${nctrl}`);
        if (response.ok) {
            const data = await response.json();
            
            // Actualizar campos con datos de la BD
            nombreEl.textContent = `${data.Nombre} ${data.Apellidos}`.toUpperCase();
            carreraEl.textContent = data.Carrera;
            nctrlEl.textContent = data.N_ctrl;
 
            // Manejo de la foto
            if (data.Foto) {
                fotoEl.innerHTML = `<img src="${data.Foto}" alt="Foto Perfil" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">`;
            }
        } else {
            // Si la API falla, usamos datos de respaldo del localStorage
            nombreEl.textContent = sessionStorage.getItem("Nombre") || "ESTUDIANTE";
            nctrlEl.textContent = nctrl;
        }
    } catch (error) {
        console.error("Error al conectar con el servidor para la credencial:", error);
    }
 
    // 3. Lógica de Vigencia Automática (Reverso)
    const currentYear = new Date().getFullYear();
    const yearBoxes = document.querySelectorAll(".year-box");
    
    yearBoxes.forEach((box, index) => {
        const year = currentYear + index;
        box.textContent = year;
        // Marcar como activo solo el año actual
        if (index === 0) box.classList.add("active");
        else box.classList.remove("active");
    });
});