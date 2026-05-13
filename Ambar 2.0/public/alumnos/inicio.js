
document.addEventListener("DOMContentLoaded", async () => {
    const nctrl = sessionStorage.getItem("N_ctrl");
    if (!nctrl) {
        window.location.href = "../login.html";
        return;
    }

    try {
        // 1. Obtener datos del alumno
        const res = await fetch(`/alumno/${nctrl}`);
        const data = await res.json();

        if (data.error) {
            console.error("Error al obtener datos:", data.error);
            return;
        }

        // 2. Poblar el DOM
        // Nombre y subtítulo
        document.querySelector(".stu-nombre").textContent = `${data.Nombre} ${data.Apellidos}`;
        document.querySelector(".stu-sub").textContent = `${data.N_ctrl} — ${data.Email}`;

        // Grid de información
        const fields = document.querySelectorAll(".info-field span");
        fields[0].textContent = data.Carrera || "—";
        fields[1].textContent = data.Especialidad || "NO ASIGNADA";
        fields[2].textContent = data.Semestre || "—";
        fields[3].textContent = data.PromSinRep ? parseFloat(data.PromSinRep).toFixed(2) : "0.00";
        fields[4].textContent = data.PromConRep ? parseFloat(data.PromConRep).toFixed(2) : "0.00";
        fields[5].textContent = data.PromUltimo ? parseFloat(data.PromUltimo).toFixed(2) : "0.00";
        
        const estatusBadge = fields[6].querySelector(".badge-vigente");
        if (estatusBadge) {
            estatusBadge.textContent = `● ${data.Estatus}`;
            if (data.Estatus !== 'VIGENTE') {
                estatusBadge.style.background = '#FEF2F2';
                estatusBadge.style.color = '#B91C1C';
            }
        }

        // Selector de carrera (si aplica)
        const deptValue = document.querySelector(".dept-value");
        if (deptValue) deptValue.textContent = data.Carrera;

        // Foto (si existe)
        const fotoContainer = document.querySelector(".foto-placeholder");
        if (data.Foto && fotoContainer) {
            fotoContainer.innerHTML = `<img src="${data.Foto}" style="width:100%;height:100%;object-fit:cover">`;
        }

    } catch (err) {
        console.error("Error en inicio.js:", err);
    }
});
