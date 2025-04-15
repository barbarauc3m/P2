document.addEventListener("DOMContentLoaded", () => {
    const usuario = localStorage.getItem("loggedInUser");
    if (!usuario) return alert("Debes iniciar sesión.");

    const socketFavsPage = io(); // Conexión para esta página
    socketFavsPage.on('connect', () => console.log('📱✅ Socket conectado en lavados-favs.js:', socketFavsPage.id));
    socketFavsPage.on('connect_error', (err) => console.error('📱❌ Error conexión socket en lavados-favs.js:', err));
    socketFavsPage.on('disconnect', () => console.log('📱 Socket desconectado en lavados-favs.js'));
  
    // FAVORITOS
    fetch(`/api/users/${usuario}/favoritos`)
      .then(res => res.json())
      .then(favoritos => {
        const contenedor = document.getElementById("favoritos-container");
        contenedor.innerHTML = "";
  
        favoritos.forEach((lavado, index) => {
          const div = document.createElement("div");
          div.className = "lavado-card";
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

          div.innerHTML.addEventListener('mouseenter', () => {
            // console.log(`➡️ ENTER ${type}: ${uniqueId}`);
            socketFavsPage.emit('hoverCategory', { categoryId: uniqueId });
        });
        div.innerHTML.addEventListener('mouseleave', () => {
            // console.log(`⬅️ LEAVE ${type}: ${uniqueId}`);
            socketFavsPage.emit('unhoverCategory', { categoryId: uniqueId });
        });


          contenedor.appendChild(div);
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

    personalizados.forEach(lavado => {
        const div = document.createElement("div");
        div.className = "lavado-card";
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

  });
  