const socketCategoriesServer = io(); // conexion socket.io

const container = document.querySelector('.categories-container');
const overlay = document.querySelector('.focus-overlay');
let intendedFocusId = null; // variable para rastrear el foco deseado


// FUNCION PARA MOSTRAR LOS FAVORITOS (corazon)
function loadAndDisplayFavorites() {
    const userId = sessionStorage.getItem('currentDisplayUserId');

    if (!userId) {
        console.warn('🖥️ No hay userId en sessionStorage. No se pueden mostrar favoritos.');
         document.querySelectorAll('.category-display .heart').forEach(heart => {
            heart.src = '/images/corazon.svg'; // Ruta absoluta
            heart.classList.remove('active'); // Si usas clase 'active'
         });
        return;
    }

    // fetch para obtener los favoritos del usuario
    fetch(`/api/users/${userId}/favoritos`) 
        .then(res => {
            if (!res.ok) {
                throw new Error(`Error en fetch /favoritos: ${res.statusText}`);
            }
            return res.json();
        })
        .then(allFavoritosData => {
            const userFavorites = allFavoritosData || [];

            const serverCategories = document.querySelectorAll('.category-display[data-category-id]');

            serverCategories.forEach(categoryElement => {
                const categoryId = categoryElement.dataset.categoryId;
                const heart = categoryElement.querySelector('.heart');
                const nombreLavado = categoryElement.querySelector('h2')?.textContent.trim();

                // Comprobar si este lavado está en los favoritos del usuario
                const esFavorito = userFavorites.some(fav => fav.nombre === nombreLavado);

                if (esFavorito) {
                    heart.src = '/images/cora_relleno.svg'; // corazón relleno
                    heart.classList.add('active'); 
                } else {
                    heart.src = '/images/corazon.svg'; // corazón vacío
                    heart.classList.remove('active');
                }
                heart.style.display = 'block';
            });
        })
        .catch(err => {
            console.error('🖥️ Error al cargar o procesar favoritos:', err);
            document.querySelectorAll('.category-display .heart').forEach(heart => {
                 heart.style.display = 'none'; // ocultamos en caso de error
            });
        });
}


// FUNCION EPICA PARA PONER EL FOCUS EN UNA CATEGORIA CUANDO EL USER HACE HOVER
function applyFocus(categoryId) {

    // console.log(`foco a: ${categoryId}`);

    overlay.classList.add('active'); // modo overlay active
    container.classList.add('container-focused'); // modo focus

    // quitamos el foco previo para que no se vea feo
    const currentFocused = container.querySelector('.category-display.focused');
    if (currentFocused) {
        currentFocused.classList.remove('focused');
    }

    // aplicamos le foco a nuevo elemento
    const elementToFocus = container.querySelector(`.category-display[data-category-id="${categoryId}"]`); // foco a
    if (elementToFocus) {
        elementToFocus.classList.add('focused');
        // console.log(`${categoryId} foco`);
    } else {
        // si no hay limpiamos
        removeFocus();
    }
}

// FUNCION PARA QUITAR EL FOCUS
function removeFocus() {
    if (!container || !overlay) return;
    // console.log(`quitando foco`);
    intendedFocusId = null;

    overlay.classList.remove('active'); // fuera
    container.classList.remove('container-focused'); // fuera

    const focusedElement = container.querySelector('.category-display.focused');
    if (focusedElement) {
        focusedElement.classList.remove('focused');
    }
}

// conexiones socket para cuando llega el evento de FOCUS
socketCategoriesServer.on('highlightCategory', (data) => {
    // console.log(`focus para: ${data.categoryId}`);

    intendedFocusId = data.categoryId; // id de la categoría que queremos focus
    applyFocus(data.categoryId); // focus
});

// conexiones socket para cuando llega el evento de UNFOCUS
socketCategoriesServer.on('unhighlightCategory', (data) => {
    // console.log(`unfocus a: ${data.categoryId}`);

    // si el id de la categoría coincide con el que tenemos en intendedFocusId fuera focus
    if (data.categoryId === intendedFocusId) {
        console.log(` intendedFocusId (${intendedFocusId}). Quitando foco AHORA.`);
        removeFocus(); // Llama a removeFocus directamente, sin delay.
    } else {
        // si no coincide, significa que el usuario ya hizo hover en OTRA categoría asi que ignoramos el unfocus
        // console.log(`Ignorando unfocus para ${data.categoryId} foco actual: ${intendedFocusId}`);
    }
});

// conexiones socket para updatear el corazon de los favs
socketCategoriesServer.on('refreshFavorites', (data) => {
    // console.log(`refresh favs para usuario: ${data.userId}`);
    const currentlyDisplayedUserId = sessionStorage.getItem('currentDisplayUserId');

    // comprobar si la actualización es para el usuario que estamos mostrando
    if (data.userId && data.userId === currentlyDisplayedUserId) {
        // console.log(`actualizando favs para ${data.userId}`);

        loadAndDisplayFavorites(); // cargamos otra ve
    } else {
        // console.log(`otro user ${data.userId} vs ${currentlyDisplayedUserId})`);
    }
});

socketCategoriesServer.on('connect', () => {
    loadAndDisplayFavorites(); // cargar favoritos al conectar
});

socketCategoriesServer.on('disconnect', () => {
    // quitamos foco si el cliente se desconecta
    removeFocus();
});

// quitamos foco si se hace clic en el overlay
overlay?.addEventListener('click', () => {
    removeFocus();
});