// public/client/script/categorias-lavados.js

console.log('📱 Script categorias-lavados.js cargado.');

document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 DOM cargado. Inicializando todo...');

    // --- Conexión Socket.IO ---
    if (typeof io === 'undefined') {
        console.error('📱 ERROR: io (Socket.IO) no está definido...');
        return;
    }
    const socketCategoriesClient = io();

    socketCategoriesClient.on('connect', () => {
        console.log('📱✅ Categorias Client Conectado:', socketCategoriesClient.id);
    });
    socketCategoriesClient.on('connect_error', (err) => {
        console.error('📱❌ Error de conexión Socket.IO:', err);
    });
    socketCategoriesClient.on('disconnect', () => {
        console.log('📱 Categorias Client Desconectado');
    });

    // --- Lógica de Hover ---
    const categoriasHover = document.querySelectorAll('.lavado-card[data-category-id]');
    console.log(`📱 Encontrados ${categoriasHover.length} elementos '.lavado-card[data-category-id]' para hover.`);
    if (categoriasHover.length === 0) {
        console.warn('📱 No se encontraron elementos para añadir listeners de hover.');
    }
    categoriasHover.forEach(card => {
        const categoryId = card.dataset.categoryId;
        if (!categoryId) return;
        // console.log(`📱 Añadiendo listeners a tarjeta: ${categoryId}`); // Log opcional
        card.addEventListener('mouseenter', () => {
            // console.log(`➡️ MOUSE ENTER sobre tarjeta: ${categoryId}`); // Log opcional
            socketCategoriesClient.emit('hoverCategory', { categoryId: categoryId });
        });
        card.addEventListener('mouseleave', () => {
            // console.log(`⬅️ MOUSE LEAVE de tarjeta: ${categoryId}`); // Log opcional
            socketCategoriesClient.emit('unhoverCategory', { categoryId: categoryId });
        });
    });

    // --- Lógica de Favoritos y Botones (integrada aquí) ---
    const usuarioActual = localStorage.getItem('loggedInUser');
    const corazones = document.querySelectorAll('.heart'); // Selecciona los corazones

    if (!usuarioActual) {
        console.log('📱 Usuario no logueado. Bloqueando corazones.');
        corazones.forEach(corazon => {
            corazon.style.cursor = 'not-allowed'; // Indica visualmente que no se puede hacer clic
            corazon.addEventListener('click', (e) => {
                e.preventDefault(); // Prevenir cualquier acción por defecto
                alert("Debes registrarte o iniciar sesión para guardar lavados como favoritos");
            });
        });
        // No necesitamos `return` aquí si el resto de la lógica está dentro del `if (usuarioActual)`
    }

    // Solo añadir listeners y fetch si hay usuario
    if (usuarioActual) {
        console.log(`📱 Usuario logueado: ${usuarioActual}. Cargando y configurando favoritos.`);
        fetch('/favoritos')
            .then(res => {
                if (!res.ok) throw new Error('Error al obtener favoritos');
                return res.json();
            })
            .then(favoritosData => {
                let favoritos = favoritosData[usuarioActual] || []; // Array de favoritos del usuario

                corazones.forEach(corazon => {
                    // Encontrar el contenedor principal y el nombre del lavado
                    const sectionLavado = corazon.closest('section.lavado'); // El elemento que tiene el H2
                    if (!sectionLavado) {
                        console.warn('No se encontró section.lavado para el corazón:', corazon);
                        return;
                    }
                    const nombreLavado = sectionLavado.querySelector('h2')?.textContent.trim();
                    if (!nombreLavado) {
                         console.warn('No se encontró h2 para el corazón en:', sectionLavado);
                         return;
                    }
                    const lavadoCard = sectionLavado.querySelector('.lavado-card'); // El div interno

                    // Establecer estado inicial del corazón
                    const esFavoritoInicial = favoritos.some(lav => lav.nombre === nombreLavado);
                    if (esFavoritoInicial) {
                        corazon.src = '/images/cora_relleno.svg'; // Ruta absoluta
                        corazon.classList.add('activo');
                    } else {
                        corazon.src = '/images/corazon.svg'; // Ruta absoluta
                        corazon.classList.remove('activo');
                    }

                    // Añadir listener de CLICK al corazón
                    corazon.addEventListener('click', () => {
                        let esFavoritoAhora; // Para saber qué estado se guardó

                        if (corazon.classList.contains('activo')) {
                            // --- Quitar de favoritos ---
                            corazon.classList.remove('activo');
                            corazon.src = '/images/corazon.svg';
                            favoritos = favoritos.filter(lav => lav.nombre !== nombreLavado);
                            esFavoritoAhora = false;
                            console.log(`💔 "${nombreLavado}" quitado de favoritos localmente.`);
                        } else {
                            // --- Añadir a favoritos ---
                            corazon.classList.add('activo');
                            corazon.src = '/images/cora_relleno.svg';
                            // Extraer info SOLO al añadir
                            const descripcion = lavadoCard?.querySelector("p")?.textContent.trim() || "";
                            const items = lavadoCard?.querySelectorAll("ul li");
                            const imagen = lavadoCard?.querySelector("img.icon")?.getAttribute("src") || "";
                            const infoLavado = {
                                nombre: nombreLavado,
                                // Extraer datos de forma más segura
                                temperatura: items?.[0]?.textContent.split(":")[1]?.trim() || "",
                                duracion: items?.[1]?.textContent.split(":")[1]?.trim() || "",
                                centrifugado: items?.[2]?.textContent.split(":")[1]?.trim() || "",
                                detergente: items?.[3]?.textContent.split(":")[1]?.trim() || "",
                                imagen: imagen // Ya debería ser ruta absoluta si corregiste HTML
                            };
                            favoritos.push(infoLavado);
                            esFavoritoAhora = true;
                            console.log(`❤️ "${nombreLavado}" añadido a favoritos localmente.`);
                        }

                        // Guardar en el servidor backend
                        console.log(`💾 Guardando favoritos actualizados para ${usuarioActual} en backend...`);
                        fetch('/guardar-favoritos', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ usuario: usuarioActual, favoritos: favoritos }) // Enviar la lista actualizada
                        })
                        .then(res => {
                            if (!res.ok) throw new Error('Error al guardar favoritos en backend');
                            return res.text();
                        })
                        .then(msg => {
                            console.log(`✅ Backend dice: ${msg}`);
                            // *** ¡¡NUEVO!! Emitir evento Socket.IO tras guardar con éxito ***
                            console.log(`⚡ Emitiendo 'favoritesUpdated' para notificar a otros clientes.`);
                            socketCategoriesClient.emit('favoritesUpdated', {
                                userId: usuarioActual,
                                changedWash: { // Opcional: enviar qué cambió
                                    nombre: nombreLavado,
                                    esFavorito: esFavoritoAhora
                                }
                            });
                        })
                        .catch(err => console.error('❌ Error en fetch /guardar-favoritos:', err));
                    }); // Fin addEventListener click corazón
                }); // Fin corazones.forEach
            })
            .catch(err => console.error('❌ Error inicial cargando favoritos:', err));
    } // Fin if (usuarioActual)

    // --- Lógica Botones EMPEZAR ---
    const botones = document.querySelectorAll(".lavado-button .button");
    botones.forEach((boton) => {
      boton.addEventListener("click", () => {
        const section = boton.closest(".lavado");
        const card = section?.querySelector(".lavado-card"); // Buscar dentro de la sección
        if (!section || !card) {
            console.error("Error al encontrar sección o tarjeta para botón EMPEZAR");
            return;
        }
        const nombre = section.querySelector("h2")?.textContent.trim();
        const descripcion = card.querySelector("p")?.textContent.trim() || "";
        const items = card.querySelectorAll("ul li");
        const imagen = card.querySelector("img.icon")?.getAttribute("src") || "";
        if (!nombre) return; // Salir si no hay nombre

        const lavado = { /* ... crear objeto lavado ... */ };
        localStorage.setItem("lavadoSeleccionado", JSON.stringify(lavado));
        window.location.href = "empezar-lavado.html";
      });
    });

}); // Fin DOMContentLoaded Principal