document.addEventListener('DOMContentLoaded', () => {

    // conexion SOCKET.IO
    const socketCategoriesClient = io();

    socketCategoriesClient.on('connect', () => {});

    // LÓGICA PARA EL HOVER DE CATEGORÍAS
    const categoriasHover = document.querySelectorAll('.lavado-card[data-category-id]'); // se seleccionan todos los ids de lavado

    categoriasHover.forEach(card => {
        const categoryId = card.dataset.categoryId; // data-category-id de la card de lavado
        if (!categoryId) return;

        // emite el evento al servidor cuando el mouse entra o sale de la card
        card.addEventListener('mouseenter', () => {
            socketCategoriesClient.emit('hoverCategory', { categoryId: categoryId }); // emite hover
        });
        card.addEventListener('mouseleave', () => {
            socketCategoriesClient.emit('unhoverCategory', { categoryId: categoryId }); // emite unhover
        });
    });

    // FAVORITOS
    const usuarioActual = localStorage.getItem('loggedInUser');
    const corazones = document.querySelectorAll('.heart'); // seleccionamos los corazones

    // no hay isuario registrado
    if (!usuarioActual) {
        // console.log('Usuario no logueado. Bloqueando corazones.');
        corazones.forEach(corazon => {
            corazon.style.cursor = 'not-allowed'; // visualmente que no se puede hacer clic
            corazon.addEventListener('click', (e) => {
                e.preventDefault();
                alert("Debes registrarte o iniciar sesión para guardar lavados como favoritos");
            });
        });
    }

    // hay usuario registrado
    if (usuarioActual) {
        // console.log(`usuario logueado: ${usuarioActual}`);
        fetch(`/api/users/${usuarioActual}/favoritos`) // obtenemos los favoritos del usuario
            // el servidor responde con un JSON
            .then(res => {
                return res.json();
            })
            // si la respuesta es correcta obtenemos los favoritos
            .then(favoritosData => {
                let favoritos = favoritosData || []; // no favoritos? pues vacio 

                corazones.forEach(corazon => {
                    // encontramos el contenedor principal y el nombre del lavado
                    const sectionLavado = corazon.closest('section.lavado'); // seccioin lavado
                    if (!sectionLavado) {
                        console.warn('No se encontró section.lavado para el corazón:', corazon);
                        return;
                    }
                    const nombreLavado = sectionLavado.querySelector('h2')?.textContent.trim(); // nombre del lavado
                    if (!nombreLavado) {
                         console.warn('No se encontró h2 para el corazón en:', sectionLavado);
                         return;
                    }
                    const lavadoCard = sectionLavado.querySelector('.lavado-card'); // div card de lavado

                    // el corazon es innicialmente vacio
                    const esFavoritoInicial = favoritos.some(lav => lav.nombre === nombreLavado);
                    if (esFavoritoInicial) {
                        corazon.src = '/images/cora_relleno.svg'; // si es favorito, corazon relleno
                        corazon.classList.add('activo');
                    } else {
                        corazon.src = '/images/corazon.svg'; // si no corazon normal
                        corazon.classList.remove('activo');
                    }

                    // CLICK AL CORAZON PARA AÑIDR O QUITAR DE FAVORITOS
                    corazon.addEventListener('click', () => {
                        let esFavoritoAhora; // par a saber si se ha añadido o quitado de favoritos

                        if (corazon.classList.contains('activo')) {
                            // QUITAR DE FAVORITOS
                            corazon.classList.remove('activo'); // remover la clase activa
                            corazon.src = '/images/corazon.svg'; // vuelta a la foto normal
                            favoritos = favoritos.filter(lav => lav.nombre !== nombreLavado);
                            esFavoritoAhora = false;
                            // console.log(`"${nombreLavado}" quitado de favoritos`);
                        } else {
                            // AÑADIR A FAVORITOS
                            corazon.classList.add('activo'); // añadir la clase activa
                            corazon.src = '/images/cora_relleno.svg'; // foto rellena
                            // extraemos info del lavado para añadirlo al json del user en la parte de favs
                            const descripcion = lavadoCard?.querySelector("p")?.textContent.trim() || "";
                            const items = lavadoCard?.querySelectorAll("ul li");
                            const imagen = lavadoCard?.querySelector("img.icon")?.getAttribute("src") || "";
                            const infoLavado = {
                                nombre: nombreLavado,
                                descripcion: descripcion,
                                temperatura: items?.[0]?.textContent.split(":")[1]?.trim() || "",
                                duracion: items?.[1]?.textContent.split(":")[1]?.trim() || "",
                                centrifugado: items?.[2]?.textContent.split(":")[1]?.trim() || "",
                                detergente: items?.[3]?.textContent.split(":")[1]?.trim() || "",
                                imagen: imagen
                            };
                            favoritos.push(infoLavado);
                            esFavoritoAhora = true;
                            // console.log(`"${nombreLavado}" añadido a favoritos`);
                        }

                        // GUARDAR FAVORITOS EN EL BACKEND
                        // console.log(`Guardando favoritos actualizados para ${usuarioActual} en backend`);
                        fetch('/guardar-favoritos', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ usuario: usuarioActual, favoritos: favoritos }) // enviamos la lista actualizada
                        })
                        .then(res => {
                            if (!res.ok) throw new Error('Error al guardar favoritos en backend');
                            return res.text();
                        })
                        .then(msg => {
                            // emitimos para otros clientes que se ha actualizado el favorito
                            socketCategoriesClient.emit('favoritesUpdated', {
                                userId: usuarioActual,
                                changedWash: {
                                    nombre: nombreLavado,
                                    esFavorito: esFavoritoAhora
                                }
                            });
                        })
                        .catch(err => console.error('❌ Error en fetch /guardar-favoritos:', err));
                    }); // FIN CLICK CORAZON
                }); // FIN FAVS CORAZONES
            })
            .catch(err => console.error('❌ Error inicial cargando favoritos:', err));
    } 

    // BOTONES PARA INICIAR UN LAVADO
    const botones = document.querySelectorAll(".lavado-button .button");
    botones.forEach((boton) => {
      boton.addEventListener("click", () => {
        const section = boton.closest(".lavado"); // seccion en la que esta el boton
        const card = section?.querySelector(".lavado-card"); // buscamos dentro de la sección
        if (!section || !card) {
            console.error("Error al encontrar sección o tarjeta para botón EMPEZAR"); // no se encontró la sección o la tarjeta
            return;
        }

        // cogemos info del lavado seleccionado
        const nombre = section.querySelector("h2")?.textContent.trim();
        const descripcion = card.querySelector("p")?.textContent.trim() || "";
        const items = card.querySelectorAll("ul li");
        const imagen = card.querySelector("img.icon")?.getAttribute("src") || "";
        if (!nombre) return; // SALIR si no hay nombre

        // guardamos el lavado seleccionado en localStorage
        const lavado = { 
            nombre: nombre,
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
        localStorage.setItem("lavadoSeleccionado", JSON.stringify(lavado)); // guardamos localstorage

        // emitir evento para cambiar la pantalla en el servidor
        socketCategoriesClient.emit('requestDisplayChange', {
            targetPage: '/display/empezar-lavado',
        });

        window.location.href = "empezar-lavado.html";
      });
    });

    // BOTONES PARA VOLVER A LA PANTALLA DE INICIO
    const backButton = document.querySelector("#back-button-categorias");
    const homeButton = document.querySelector("#home-button-categorias");

    document.getElementById('home-button-categorias').addEventListener('click', function() {
        /*emit redirigir el servidor a index*/ 
        socketCategoriesClient.emit('requestDisplayChange', { targetPage: '/' });
        
        // Redirigir a la página de juegos
        window.location.href = 'index.html';
    });

    document.getElementById('boton-mando').addEventListener('click', function() {
        /*emit redirigir el servidor a juegos*/ 
        socketCategoriesClient.emit('requestDisplayChange', { targetPage: '/juegos-server.html' });
        
        // Redirigir a la página de juegos
        window.location.href = 'juegos.html';
    });

    function navigateAndSignalDisplay(event, clientTarget, serverTarget) {
        if (event) {
          event.preventDefault(); // Evita la navegación normal del enlace
        }
 
        // Emitir señal para cambiar la pantalla del servidor
        socketCategoriesClient.emit('requestDisplayChange', {
          targetPage: serverTarget,
        });
 
        // Navegar el cliente
        window.location.href = clientTarget;
      }
 
      if (backButton) {
        backButton.addEventListener("click", (e) => navigateAndSignalDisplay(e, '/mobile', '/'));
      }
      if (homeButton) {
        homeButton.addEventListener("click", (e) => navigateAndSignalDisplay(e, '/mobile', '/'));
      }

}); 

// FUNCION PARA ABRIR LAS VENTANAS DE LOS JUEGOS
function loadJuegos() {

    // console.log("Botón de mando pulsado");
    socket.emit("abrir-juegos"); 
    window.location.href = 'pantalla-carga.html';
  }