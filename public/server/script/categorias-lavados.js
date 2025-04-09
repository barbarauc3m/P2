// public/server/script/categorias-lavados.js
const socketCategoriesServer = io();

const container = document.querySelector('.categories-container');
const overlay = document.querySelector('.focus-overlay');
let intendedFocusId = null; // Variable para rastrear el foco deseado
let focusTimeout = null; // Variable para manejar posibles delays rápidos


function loadAndDisplayFavorites() {
    const userId = sessionStorage.getItem('currentDisplayUserId');

    if (!userId) {
        console.warn('🖥️ No hay userId en sessionStorage. No se pueden mostrar favoritos.');
        // Podrías asegurarte que todos los corazones están vacíos
         document.querySelectorAll('.category-display .heart').forEach(heart => {
            heart.src = '/images/corazon.svg'; // Ruta absoluta
            heart.classList.remove('active'); // Si usas clase 'active'
         });
        return;
    }

    fetch('/favoritos') // Llama al mismo endpoint que usa el cliente
        .then(res => {
            if (!res.ok) {
                throw new Error(`Error en fetch /favoritos: ${res.statusText}`);
            }
            return res.json();
        })
        .then(allFavoritosData => {
            const userFavorites = allFavoritosData[userId] || [];

            const serverCategories = document.querySelectorAll('.category-display[data-category-id]');

            serverCategories.forEach(categoryElement => {
                const categoryId = categoryElement.dataset.categoryId;
                const heart = categoryElement.querySelector('.heart');
                const nombreLavado = categoryElement.querySelector('h2')?.textContent.trim();

                // Comprobar si este lavado está en los favoritos del usuario
                const esFavorito = userFavorites.some(fav => fav.nombre === nombreLavado);

                if (esFavorito) {
                    console.log(`🖥️ Marcando "${nombreLavado}" como favorito.`);
                    heart.src = '/images/cora_relleno.svg'; // Ruta absoluta corazón relleno
                    heart.classList.add('active'); // Opcional: si usas CSS extra
                } else {
                    heart.src = '/images/corazon.svg'; // Ruta absoluta corazón vacío
                    heart.classList.remove('active');
                }
                // Hacer visible el corazón (ya que tu CSS base lo oculta)
                heart.style.display = 'block'; // O añade una clase para mostrarlo
            });
        })
        .catch(err => {
            console.error('🖥️ Error al cargar o procesar favoritos:', err);
            // Ocultar todos los corazones o ponerlos vacíos en caso de error
            document.querySelectorAll('.category-display .heart').forEach(heart => {
                 heart.style.display = 'none'; // Ocultar en caso de error
            });
        });
}



function applyFocus(categoryId) {
    if (!container || !overlay) {
        console.error('Error: Container u overlay no encontrados.');
        return;
    }
    console.log(`🖥️ Aplicando foco a: ${categoryId}`);

    // Activar overlay y modo focus en el contenedor
    overlay.classList.add('active');
    container.classList.add('container-focused');

    // Quitar foco previo (si lo hay) - Asegura limpieza antes de añadir el nuevo
    const currentFocused = container.querySelector('.category-display.focused');
    if (currentFocused) {
        currentFocused.classList.remove('focused');
    }

    // Aplicar foco al nuevo elemento
    const elementToFocus = container.querySelector(`.category-display[data-category-id="${categoryId}"]`);
    if (elementToFocus) {
        elementToFocus.classList.add('focused');
        console.log(`🖥️ Categoría ${categoryId} enfocada.`);
    } else {
        console.log(`🖥️ No se encontró categoría para enfocar: ${categoryId}`);
        // Si no se encuentra, limpiamos el estado de foco
        removeFocus();
    }
}

// Asegúrate que la función removeFocus sigue igual:
function removeFocus() {
    if (!container || !overlay) return;
    console.log(`🖥️ Quitando foco (si existe).`);
    intendedFocusId = null; // Limpiar el ID deseado

    overlay.classList.remove('active');
    container.classList.remove('container-focused');

    const focusedElement = container.querySelector('.category-display.focused');
    if (focusedElement) {
        focusedElement.classList.remove('focused');
    }
}
// --- MANEJO DE EVENTOS SOCKET ---

// Cuando llega la orden de enfocar
socketCategoriesServer.on('highlightCategory', (data) => {
    console.log(`🖥️ Recibido highlightCategory para: ${data.categoryId}`);
    // Limpiar cualquier timeout pendiente para quitar foco
    clearTimeout(focusTimeout);
    // Establecer cuál es el ID que queremos enfocar
    intendedFocusId = data.categoryId;
    // Aplicar el foco
    applyFocus(data.categoryId);
});

// Cuando llega la orden de quitar el foco
socketCategoriesServer.on('unhighlightCategory', (data) => {
    console.log(`🖥️ Recibido unhighlightCategory para: ${data.categoryId}`);

    // **LÓGICA SIMPLIFICADA:**
    // Solo quitar el foco si el ID que se pide quitar ('data.categoryId')
    // es el que actualmente se supone que debe estar enfocado ('intendedFocusId').
    if (data.categoryId === intendedFocusId) {
        console.log(`🖥️ Coincide con intendedFocusId (${intendedFocusId}). Quitando foco AHORA.`);
        removeFocus(); // Llama a removeFocus directamente, sin delay.
    } else {
        // Si no coincide, significa que el usuario ya hizo hover en OTRA categoría
        // antes de que llegara este mensaje de 'unhighlight', por lo que
        // ignoramos este mensaje para no quitar el foco del elemento nuevo.
        console.log(`🖥️ Ignorando unhighlight para ${data.categoryId} (foco deseado actual: ${intendedFocusId}).`);
    }
});

socketCategoriesServer.on('refreshFavorites', (data) => {
    console.log(`🖥️ Recibido 'refreshFavorites' para usuario: ${data.userId}`);
    const currentlyDisplayedUserId = sessionStorage.getItem('currentDisplayUserId');

    // Comprobar si la actualización es para el usuario que estamos mostrando
    if (data.userId && data.userId === currentlyDisplayedUserId) {
        console.log(`🖥️ La actualización de favoritos es para el usuario actual. Refrescando vista...`);

        // Opción 1: Volver a cargar TODO (más simple)
        loadAndDisplayFavorites();
    } else {
        console.log(`🖥️ Actualización de favoritos ignorada (Usuario diferente: ${data.userId} vs ${currentlyDisplayedUserId})`);
    }
});

socketCategoriesServer.on('connect', () => {
    console.log('🖥️ Categorias Server Conectado:', socketCategoriesServer.id);
    loadAndDisplayFavorites(); // Cargar favoritos al conectar
});

socketCategoriesServer.on('disconnect', () => {
    console.log('🖥️ Categorias Server Desconectado');
    // Quitar foco si el cliente se desconecta
    removeFocus();
});

// Quitar foco si se hace clic en el overlay
overlay?.addEventListener('click', () => {
    removeFocus();
    // Opcional: podrías emitir un evento de vuelta al móvil si es necesario
    // socketCategoriesServer.emit('focusClosedByOverlay');
});