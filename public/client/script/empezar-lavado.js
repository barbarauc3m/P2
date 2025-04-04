const lavado = JSON.parse(localStorage.getItem('lavadoSeleccionado'));

    if (lavado) {
      document.getElementById("lavado-nombre").textContent = lavado.nombre;

      // Calcular hora de finalización
      const now = parseFecha(lavado.fechaInicio);
      const duracionMatch = lavado.duracion.match(/(\d+)h\s?(\d+)?/i);
      const minMatch = lavado.duracion.match(/(\d+)\s?min/);

      let totalMin = 0;
      if (duracionMatch) {
        totalMin += parseInt(duracionMatch[1]) * 60;
        if (duracionMatch[2]) totalMin += parseInt(duracionMatch[2]);
      } else if (minMatch) {
        totalMin += parseInt(minMatch[1]);
      }

      const fin = new Date(now.getTime() + totalMin * 60000);
      const horaFinStr = fin.toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' });
      document.getElementById("lavado-hora-fin").textContent = `Terminará a las ${horaFinStr}`;

      // Mostrar configuración
      const configBox = document.getElementById("configuracion-detalles");
      configBox.innerHTML = `
        <p class="lavado-info"><img src="../../../images/temperatura.svg" alt="temperatura" class="info-img" /> Temperatura: ${lavado.temperatura}</p>
        <p class="lavado-info"><img src="../../../images/tiempo_lav.svg" alt="tiempo" class="info-img" />Tiempo de Lavado: ${lavado.duracion}</p>
        <p class="lavado-info"><img src="../../../images/centrifugado.svg" alt="centrifugado" class="info-img" />Centrifugado: ${lavado.centrifugado}</p>
        <p class="lavado-info"><img src="../../../images/detergente.svg" alt="detergente" class="info-img" />Detergente: ${lavado.detergente}</p>
      `;
    }

    document.getElementById("config-title").addEventListener("click", () => {
      const box = document.getElementById("configuracion-box");
      box.classList.toggle("visible");
    });


    function parseFecha(fechaStr) {
        // "27/3/25, 23:34"
        const [fecha, hora] = fechaStr.split(', ');
        const [dia, mes, anio] = fecha.split('/').map(Number);
        const [horas, minutos] = hora.split(':').map(Number);
      
        // Ajustar año (25 → 2025)
        const añoReal = anio < 100 ? 2000 + anio : anio;
      
        return new Date(añoReal, mes - 1, dia, horas, minutos);
      }
      

      document.querySelector(".cssbuttons-io-button").addEventListener("click", () => {
        const lavado = JSON.parse(localStorage.getItem('lavadoSeleccionado'));
        const usuario = localStorage.getItem('loggedInUser');
        if (!lavado || !usuario) {
          alert("Debes estar registrado para guardar el lavado.");
          return;
        }

        // Añadir usuario al objeto que se envía
        lavado.usuario = usuario;

        fetch('/guardar-lavado', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lavado)
        })

          .then(res => res.text())
          .then(msg => {
            console.log(msg);
            alert("Lavado iniciado y guardado correctamente 🧼");
            window.location.href = "/index.html";
          })
          .catch(err => {
            console.error(err);
            alert("Error al guardar el lavado.");
          });
      });
      
      const opciones = document.querySelectorAll(".form-option");

      function handleHover(indexHovered) {
        opciones.forEach((el, idx) => {
          el.classList.remove("mover-izquierda", "mover-derecha");
      
          if (idx === indexHovered) return;
      
          if (idx < indexHovered) {
            el.classList.add("mover-izquierda");
          } else {
            el.classList.add("mover-derecha");
          }
        });
      }
      
      function handleLeave() {
        opciones.forEach(el => {
          el.classList.remove("mover-izquierda", "mover-derecha");
        });
      }
      
      opciones.forEach((opcion, index) => {
        opcion.addEventListener("mouseenter", () => handleHover(index));
        opcion.addEventListener("mouseleave", handleLeave);
      });
      
      // Cierra el popup si el usuario hace clic fuera del contenido
document.addEventListener("click", function (event) {
  const popup = document.getElementById("popup-escaner");
  const container = popup.querySelector(".container");

  if (
    popup.style.display === "flex" &&
    !container.contains(event.target) &&
    !event.target.closest(".scan-button") // para evitar cerrar si hacen clic en el botón original
  ) {
    cerrarPopupEscaner();
  }
});


  function abrirPopupEscaner() {
    document.getElementById("popup-escaner").style.display = "flex";
  }
  
  function cerrarPopupEscaner() {
    document.getElementById("popup-escaner").style.display = "none";
  }
  
  function iniciarEscaneoEtiqueta() {
    cerrarPopupEscaner();
    window.location.href = "escaner-etiqueta.html";
  }
  
  function iniciarEscaneoColor() {
    cerrarPopupEscaner();
    window.location.href = "escaner-color.html";
  }
  