document.addEventListener("DOMContentLoaded", () => {
  const usuario = localStorage.getItem("loggedInUser");
  if (!usuario) return;

  const socketHistorial = io(); // Conexión específica para esta página
  socketHistorial.on('connect', () => console.log('📱✅ Historial Client Conectado:', socketHistorial.id));
  socketHistorial.on('connect_error', (err) => console.error('📱❌ Error conexión socket en historial.js:', err));

  // Mostrar nombre del usuario
  document.querySelector(".username").textContent = usuario;

  // =========================
  // LAVADOS COMPLETADOS
  // =========================
  fetch(`/lavados/${usuario}`)
    .then(res => res.json())
    .then(lavados => {
      const ultimosTres = lavados.slice(0, 3);
      const contenedor = document.querySelector(".categoria-list");
      contenedor.innerHTML = "";

      ultimosTres.forEach((lavado, index) => {
        const div = document.createElement("div");
        div.classList.add("categoria");
        if (index === 2) div.classList.add("eco");
        div.innerHTML = `
          <img src="${lavado.imagen}" alt="${lavado.nombre}" />
          <div class="info">
            <p><strong>${lavado.nombre || 'No definido'}</strong></p>
            <p>Temperatura: ${lavado.temperatura || 'No definido'}</p>
            <p>Duración: ${lavado.duracion || 'No definido'}</p>
            <p>Centrifugado: ${lavado.centrifugado || 'No definido'}</p>
          </div>
        `;
        contenedor.appendChild(div);
      });

      // Actualizar contador de lavados completados
      document.querySelector(".completados").textContent = lavados.length;

      // Hover animaciones
      const categorias = document.querySelectorAll(".categoria");

      categorias.forEach((categoria, index) => {
        categoria.addEventListener("mouseenter", () => handleHover(index));
        categoria.addEventListener("mouseleave", handleLeave);
      });

      function handleHover(indexHovered) {
        categorias.forEach((el, idx) => {
          el.classList.remove("mover-izquierda", "mover-derecha");

          if (indexHovered === 0) {
            if (idx > indexHovered) el.classList.add("mover-derecha");
          } else if (indexHovered === 1) {
            if (idx > indexHovered) el.classList.add("mover-derecha");
          } else if (indexHovered === 2) {
            if (idx < indexHovered) el.classList.add("mover-izquierda");
          }
        });
      }

      function handleLeave() {
        categorias.forEach(el =>
          el.classList.remove("mover-izquierda", "mover-derecha")
        );
      }
    });

  // =========================
  // LAVADOS FAVORITOS
  // =========================
  fetch(`/api/users/${usuario}/favoritos`)
  .then(res => res.json())
    .then(favoritos => {
      document.querySelector(".favoritos").textContent = favoritos.length;

      if (favoritos.length === 0) return;

      const ultimo = favoritos.at(-1);
      if (!ultimo) return;

      document.querySelector(".lavado-box-none").classList.add("none");

      const favBox = document.querySelector(".lavado-box");
      const favDiv = document.createElement("div");
      favDiv.classList.add("lavado-sombra");
      favDiv.innerHTML = `
        <div class="sombra sombra-50"></div>
        <div class="sombra sombra-20"></div>
        <div class="lavado">
          <div class="lavado-header">
            <img src="${ultimo.imagen}" alt="${ultimo.nombre}" class="ult-lavado-icono"/>
            <div class="lavado-text">
              <h3>${ultimo.nombre}</h3><br>
              <p>${ultimo.descripcion}</p>
              <div class="lavado-button">
                <button class="button-lav">Empezar</button>
              </div>
            </div>
          </div>
        </div>
      `;

      favBox.appendChild(favDiv);

      if (typeof io === 'undefined') { console.error('Perfil script: io no definido.'); return; }
    const socketPerfil = io(); // O reutiliza una conexión existente


    // --- NUEVA LÓGICA PARA "VER MÁS PROGRAMAS" ---
    const verMasProgramasBtn = document.getElementById('ver-mas-programas');

    if (verMasProgramasBtn) {
        verMasProgramasBtn.addEventListener('click', (event) => {
            event.preventDefault(); // Prevenir navegación normal del enlace <a>
            const usuario = localStorage.getItem("loggedInUser"); // Obtener usuario actual

            if (!usuario) {
                alert("Debes iniciar sesión para ver tus programas.");
                const loginPopup = document.getElementById('popup-login');
                if (loginPopup) loginPopup.style.display = 'flex';
                return;
            }

            console.log(`📱 Botón 'Ver Más Programas' presionado por ${usuario}.`);

            // 1. Notificar al servidor para que muestre la pantalla de "Mis Programas"
            socketPerfil.emit('requestDisplayChange', {
                targetPage: '/display/my-programs', // Nueva ruta para el servidor
                userId: usuario
            });

            // 2. Navegar el cliente a su página de gestión (lavados-favs.html)
            window.location.href = 'lavados-favs.html'; // O usa event.target.href si era un <a>
        });
        console.log("📱 Listener añadido a #ver-mas-programas.");
    } else {
        console.warn("Botón/Enlace #ver-mas-programas no encontrado.");
    }

    });

    const verMasHistorialLink = document.getElementById('historial'); // El enlace <a>

    if (verMasHistorialLink) {
        verMasHistorialLink.addEventListener('click', (event) => {
            event.preventDefault(); // Prevenir navegación normal del enlace
            const usuario = localStorage.getItem("loggedInUser"); // Obtener usuario actual

            if (!usuario) {
                alert("Debes iniciar sesión para ver el historial completo.");
                return;
            }

            console.log(`📱 Botón 'Ver Más Historial' presionado por ${usuario}.`);

            // 1. Notificar al servidor para que muestre la pantalla de historial
            // Asegúrate que tienes una conexión socket disponible (ej: socketPerfil)
             if (typeof socketPerfil !== 'undefined' && socketPerfil.connected) {
                 socketPerfil.emit('requestDisplayChange', {
                    targetPage: '/display/historial', // Nueva ruta para el servidor
                    userId: usuario
                 });
             } else {
                 console.error("Socket no conectado en perfil.js para emitir requestDisplayChange");
                 // Considera reconectar o mostrar error
             }


            // 2. Navegar el cliente a su página de historial completa
            window.location.href = 'historial.html'; // Navega al HTML del cliente

        });
        console.log("📱 Listener añadido a #historial (ver más).");
    } else {
        console.warn("Enlace #historial no encontrado en perfil.html.");
    }


  });


