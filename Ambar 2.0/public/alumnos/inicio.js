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

        // Selector de carrera
        const deptValue = document.querySelector(".dept-value");
        if (deptValue) deptValue.textContent = data.Carrera;

        // Foto (si existe)
        const fotoContainer = document.querySelector(".foto-placeholder");
        if (data.Foto && fotoContainer) {
            fotoContainer.innerHTML = `<img src="${data.Foto}" style="width:100%;height:100%;object-fit:cover">`;
        }

        // 3. Poblar Datos Personales
        document.getElementById("val-curp").textContent = data.Curp || "—";
        document.getElementById("val-calle").textContent = data.Calle || "—";
        document.getElementById("val-telefono").textContent = data.Telefono || "—";
        document.getElementById("val-colonia").textContent = data.Colonia || "—";
        document.getElementById("val-correo").textContent = data.CorreoPersonal || "—";
        document.getElementById("val-ciudad").textContent = data.Ciudad || "—";
        document.getElementById("val-cp").textContent = data.CodigoPostal || "—";
        
        if (data.FechaNacimiento) {
            const parts = data.FechaNacimiento.split("-");
            if (parts.length === 3) {
                document.getElementById("val-nacimiento").textContent = `${parts[2]}/${parts[1]}/${parts[0]}`;
            } else {
                document.getElementById("val-nacimiento").textContent = data.FechaNacimiento;
            }
        } else {
            document.getElementById("val-nacimiento").textContent = "—";
        }

        // 4. Poblar Carga Académica
        document.getElementById("val-fecha-carga").textContent = data.FechaCarga || "No inscrita";
        
        const cardAdeudo = document.getElementById("card-adeudo");
        const iconAdeudo = document.getElementById("icon-adeudo");
        const valAdeudo = document.getElementById("val-adeudo");

        if (data.CantidadAdeudos > 0) {
            cardAdeudo.className = "carga-card has-adeudo";
            iconAdeudo.textContent = "❌";
            valAdeudo.textContent = `Sí, cuenta con adeudo (${data.CantidadAdeudos} recibo${data.CantidadAdeudos > 1 ? 's' : ''} pendiente${data.CantidadAdeudos > 1 ? 's' : ''})`;
        } else {
            cardAdeudo.className = "carga-card no-adeudo";
            iconAdeudo.textContent = "✔️";
            valAdeudo.textContent = "No cuenta con adeudo";
        }

        // 5. Cargar lista de carreras para la caja de despliegue
        const careerSelector = document.getElementById("career-selector");
        const careerDropdown = document.getElementById("career-dropdown");

        if (careerSelector && careerDropdown) {
            careerSelector.addEventListener("click", (e) => {
                e.stopPropagation();
                careerDropdown.classList.toggle("show");
            });

            window.addEventListener("click", () => {
                careerDropdown.classList.remove("show");
            });

            try {
                const careersRes = await fetch(`/alumno/${nctrl}/carreras`);
                const careers = await careersRes.json();

                if (Array.isArray(careers)) {
                    careerDropdown.innerHTML = "";
                    careers.forEach(c => {
                        const item = document.createElement("div");
                        item.className = "dept-dropdown-item";
                        
                        const badgeClass = c.Estatus === "INSCRITO" ? "inscrito" : "completado";
                        const badgeText = c.Estatus === "INSCRITO" ? "Inscrito" : "Completado";
                        
                        item.innerHTML = `
                            <span>${c.Carrera}</span>
                            <span class="badge ${badgeClass}">${badgeText}</span>
                        `;
                        
                        if (c.id_carrera === data.id_carrera) {
                            item.style.background = "var(--gold-glow)";
                            item.style.fontWeight = "bold";
                        }

                        item.addEventListener("click", async (e) => {
                            e.stopPropagation();
                            careerDropdown.classList.remove("show");
                            
                            if (c.id_carrera === data.id_carrera) return;

                            try {
                                const changeRes = await fetch(`/alumno/${nctrl}/carrera`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ id_carrera: c.id_carrera })
                                });
                                const changeData = await changeRes.json();
                                if (changeData.success) {
                                    sessionStorage.setItem("carrera", c.Carrera);
                                    window.location.reload();
                                } else {
                                    alert("Error al cambiar de carrera: " + changeData.error);
                                }
                            } catch (err) {
                                console.error("Error switching career:", err);
                            }
                        });
                        
                        careerDropdown.appendChild(item);
                    });
                }
            } catch (err) {
                console.error("Error cargando carreras del alumno:", err);
            }
        }

    } catch (err) {
        console.error("Error en inicio.js:", err);
    }

    // 6. Configurar acordeones
    const accordions = [
        { headerId: "accordion-datos", panelId: "panel-datos" },
        { headerId: "accordion-carga", panelId: "panel-carga" }
    ];

    accordions.forEach(({ headerId, panelId }) => {
        const header = document.getElementById(headerId);
        const panel = document.getElementById(panelId);
        
        if (header && panel) {
            header.addEventListener("click", () => {
                header.classList.toggle("open");
                panel.classList.toggle("open");
            });
        }
    });
});
