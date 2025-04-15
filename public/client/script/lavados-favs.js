document.addEventListener("DOMContentLoaded", () => {
    const usuario = localStorage.getItem("loggedInUser");
    if (!usuario) return alert("Debes iniciar sesión.");


    socketFavsPage = io(); // Inicializar conexión
    socketFavsPage.on('connect', () => console.log('📱✅ Socket conectado en lavados-favs.js:', socketFavsPage.id));
    socketFavsPage.on('connect_error', (err) => console.error('📱❌ Error conexión socket en lavados-favs.js:', err));
    socketFavsPage.on('disconnect', () => console.log('📱 Socket desconectado en lavados-favs.js'));


    function sanitizeId(text) {
      if (!text) return `item-${Math.random().toString(36).substr(2, 9)}`;
      return text.toString().toLowerCase()
                .replace(/\s+/g, '-') // Reemplaza espacios con guiones
                .replace(/[^\w-]+/g, '') // Quita caracteres no alfanuméricos (excepto guion)
                .replace(/[:\/,]/g, '-'); // Quita caracteres problemáticos
 }

    // FAVORITOS
    fetch(`/api/users/${usuario}/favoritos`)
      .then(res => res.json())
      .then(favoritos => {
        const contenedor = document.getElementById("favoritos-container");
        contenedor.innerHTML = "";
  
        favoritos.forEach((lavado, index) => {
          const div = document.createElement("div");
          div.className = "lavado-card";

          const tipoFav = 'favorito'; // Definir tipo
          const uniqueIdFav = sanitizeId(`${lavado.nombre || 'fav'}-${tipoFav}`); // Usar tipo, NO index
          div.dataset.categoryId = uniqueIdFav;

          div.innerHTML = `
            <img src="${lavado.imagen}" class="icon" alt="${lavado.nombre}">
            <div class="info">
              <p class="fav-title"><strong>${lavado.nombre}</strong></p>
              <p class="fav-subtitle">${lavado.descripcion}</p>
              <ul>
                <li>Temperatura: ${lavado.temperatura}</li>
                <li>Duración: ${lavado.duracion}</li>
                <li>Centrifugado: ${lavado.centrifugado}</li>
              </ul>
              <div class="lavado-button">
                <button class="button">EMPEZAR</button>
              </div>
            </div>
            <img src="../../../images/cora_relleno.svg" class="heart activo" title="Quitar de favoritos" data-index="${index}" />
          `;
        
          contenedor.appendChild(div);

          if (socketFavsPage) {
            div.addEventListener('mouseenter', () => {
                console.log(`📱 Hover EMITIDO sobre: ${uniqueIdFav}`);
                socketFavsPage.emit('hoverCategory', { categoryId: uniqueIdFav });
            });
            div.addEventListener('mouseleave', () => {
                console.log(`📱 fuera  EMITIDO sobre: ${uniqueIdFav}`);
                socketFavsPage.emit('unhoverCategory', { categoryId: uniqueIdFav });
            });
        }
        });

        // Esperar un tick para que los botones estén ya en el DOM
        setTimeout(() => {
            document.querySelectorAll(".lavado-button .button").forEach(boton => {
            boton.addEventListener("click", () => {
                const card = boton.closest(".lavado-card");
                const nombre = card.querySelector(".fav-title strong")?.textContent.trim() || "";
                const descripcion = card.querySelector(".fav-subtitle")?.textContent.trim() || "";
                const items = card.querySelectorAll("ul li");
                const imagen = card.querySelector("img.icon")?.getAttribute("src") || "";
        
                const lavado = {
                nombre,
                descripcion,
                temperatura: items[0]?.textContent.split(":")[1]?.trim() || "",
                duracion: items[1]?.textContent.split(":")[1]?.trim() || "",
                centrifugado: items[2]?.textContent.split(":")[1]?.trim() || "",
                detergente: items[3]?.textContent.split(":")[1]?.trim() || "",
                fechaInicio: new Date().toLocaleString("es-ES", {
                    dateStyle: "short",
                    timeStyle: "short"
                }),
                imagen
                };
        
                localStorage.setItem("lavadoSeleccionado", JSON.stringify(lavado));
                window.location.href = "empezar-lavado.html";
            });
            });
        }, 0);
        
  
        // Quitar de favoritos con verificación
        contenedor.querySelectorAll(".heart").forEach(icon => {
          icon.addEventListener("click", () => {
            const idx = parseInt(icon.getAttribute("data-index"));
            const confirmar = confirm("¿Quieres quitar este lavado de favoritos?");
            if (!confirmar) return;
  
            favoritos.splice(idx, 1);
  
            fetch("/guardar-favoritos", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ usuario, favoritos })
            })
              .then(res => res.text())
              .then(msg => {
                alert("✅ Favorito eliminado.");
                location.reload();
              })
              .catch(() => alert("❌ Error al quitar favorito."));
          });
        });
      });
  
    // PERSONALIZADOS
    fetch(`/api/users/${usuario}/personalizados`) 
    .then(res => res.json())
    .then(personalizados => {
    const contenedor = document.getElementById("personalizados-container");
    contenedor.innerHTML = "";

    personalizados.forEach((lavado, index) => {
        const div = document.createElement("div");
        div.className = "lavado-card";

        const tipoPers = 'personalizado'; // Definir tipo
        const uniqueIdPers = sanitizeId(`${lavado.nombre || 'pers'}-${tipoPers}`); // Usar tipo, NO index
        div.dataset.categoryId = uniqueIdPers;

        div.innerHTML = `
        <img src="../../../images/personalizado.svg" class="icon" alt="Personalizado">
        <div class="info">
            <p class="fav-title"><strong>${lavado.nombre}</strong></p>
            <p class="fav-subtitle">${lavado.nivelSuciedad}</p>
            <ul>
            <li>Temperatura: ${lavado.temperatura}</li>
            <li>Duración: ${lavado.duracion}</li>
            <li>Centrifugado: ${lavado.centrifugado}</li>
            </ul>
            <div class="lavado-button">
            <button class="button">EMPEZAR</button>
            </div>
        </div>
        ${lavado.favorito ? `<img src="../../../images/corazon.svg" class="heart activo" alt="Favorito">` : ""}
        `;
        contenedor.appendChild(div);

        if (socketFavsPage) {
          div.addEventListener('mouseenter', () => {
              socketFavsPage.emit('hoverCategory', { categoryId: uniqueIdPers });
          });
          div.addEventListener('mouseleave', () => {
              socketFavsPage.emit('unhoverCategory', { categoryId: uniqueIdPers });
          });
      }

      const heartPers = div.querySelector('.heart');
            if (heartPers) {
                 heartPers.addEventListener('click', () => handleTogglePersonalizadoFavorito(usuario, lavado, heartPers));
            }
    });

    // Activar botón "EMPEZAR" para lavados personalizados
    setTimeout(() => {
        document.querySelectorAll("#personalizados-container .lavado-button .button").forEach(boton => {
        boton.addEventListener("click", () => {
            const card = boton.closest(".lavado-card");
            const nombre = card.querySelector(".fav-title strong")?.textContent.trim() || "";
            const descripcion = card.querySelector(".fav-subtitle")?.textContent.trim() || "";
            const items = card.querySelectorAll("ul li");
            const imagen = card.querySelector("img.icon")?.getAttribute("src") || "../../../images/personalizado.svg";
    
            const lavado = {
            nombre,
            descripcion,
            temperatura: items[0]?.textContent.split(":")[1]?.trim() || "",
            duracion: items[1]?.textContent.split(":")[1]?.trim() || "",
            centrifugado: items[2]?.textContent.split(":")[1]?.trim() || "",
            detergente: items[3]?.textContent.split(":")[1]?.trim() || "",
            fechaInicio: new Date().toLocaleString("es-ES", {
                dateStyle: "short",
                timeStyle: "short"
            }),
            imagen
            };
    
            localStorage.setItem("lavadoSeleccionado", JSON.stringify(lavado));
            window.location.href = "empezar-lavado.html";
        });
        });
    }, 0);
    
    });


    const backButtonFavs = document.getElementById('back-button-favs'); // <-- NECESITAS ESTE ID EN TU HTML
    const homeButtonFavs = document.getElementById('home-button-favs'); // <-- NECESITAS ESTE ID EN TU HTML

    // Función para volver al Perfil
    function navigateToProfile(event) {
        event.preventDefault();
        console.log('📱 Botón Atrás (a Perfil) presionado.');
        if (socketFavsPage && socketFavsPage.connected) {
            socketFavsPage.emit('requestDisplayChange', { targetPage: '/display/profile', userId: usuario });
            window.location.href = 'perfil.html'; // Volver a perfil cliente
        } else {
            console.error("Socket no conectado al intentar volver a perfil.");
            alert("Error de conexión.");
            // Fallback: navegar solo cliente
            // window.location.href = 'perfil.html';
        }
    }

    // Función para volver a Home
    function navigateToHome(event) {
         event.preventDefault(); // Si es un enlace
         console.log('📱 Botón Home presionado.');
         if (socketFavsPage && socketFavsPage.connected) {
             socketFavsPage.emit('requestDisplayChange', { targetPage: '/', userId: usuario });
             window.location.href = '/mobile'; // Volver a home cliente
         } else {
             console.error("Socket no conectado al intentar volver a home.");
             alert("Error de conexión.");
             // Fallback:
             // window.location.href = '/mobile';
         }
    }

    // Añadir listeners a los botones de salida
    if (backButtonFavs) {
        backButtonFavs.addEventListener('click', navigateToProfile);
    } else {
        console.warn("Botón #back-button-favs no encontrado en lavados-favs.html");
    }
    if (homeButtonFavs) {
        homeButtonFavs.addEventListener('click', navigateToHome);
    } else {
        console.warn("Botón #home-button-favs no encontrado en lavados-favs.html");
    }

  });
  