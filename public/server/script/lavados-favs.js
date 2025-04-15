// public/server/script/my-programs-display.js

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🖥️ Script my-programs-display.js cargado');

    // --- Elementos DOM (IDs del HTML my-programs-display.html) ---
    const userDisplayElement = document.getElementById('my-programs-user');
    const favContainer = document.getElementById('my-programs-favoritos');
    const persContainer = document.getElementById('my-programs-personalizados');
    const overlay = document.querySelector('.focus-overlay'); // Overlay para focus

    // --- Obtener Usuario de sessionStorage ---
    const userId = sessionStorage.getItem('currentDisplayUserId');

    // --- Validaciones Iniciales ---
    if (userDisplayElement) userDisplayElement.textContent = userId || 'Desconocido'; // Muestra el ID mientras carga
    if (!userId || !favContainer || !persContainer || !overlay) {
        console.error('🖥️ Error: Falta userId o elementos HTML (#my-programs-favoritos, #my-programs-personalizados, .focus-overlay) en my-programs-display.html');
        // Mostrar error en ambos contenedores
        const errorHtml = '<p class="error-message">Error al cargar la página.</p>';
        if(favContainer) favContainer.innerHTML = errorHtml;
        if(persContainer) persContainer.innerHTML = errorHtml;
        return;
    }

    // Mensajes de carga
    favContainer.innerHTML = '<p>Cargando favoritos...</p>';
    persContainer.innerHTML = '<p>Cargando personalizados...</p>';
    console.log(`🖥️ Cargando programas para ${userId}...`);

    // --- Función Sanitize ID (Importante que sea la misma que usa el cliente al emitir hover) ---
    function sanitizeId(text) {
         if (!text) return `item-${Math.random().toString(36).substr(2, 9)}`;
         return text.toString().toLowerCase()
                   .replace(/\s+/g, '-') // Reemplaza espacios con guiones
                   .replace(/[^\w-]+/g, '') // Quita caracteres no alfanuméricos (excepto guion)
                   .replace(/[:\/,]/g, '-'); // Quita caracteres problemáticos de fechas/horas
    }

    // --- Función Crear HTML (Estilo Tarjeta Categoría) ---
     function createWashDisplayElement(lavado, type) {
        const section = document.createElement('section');
        section.className = 'category-display'; // <<< USA LA CLASE PARA EL ESTILO

        // Crear ID único para el hover (Debe coincidir con cómo lo genera el cliente que emite el hover)
        // Si el hover viene de categorias-lavados.js, usa el ID de ahí.
        // Si viene de lavados-favs.js, asegúrate que ese script también genera y usa un ID único.
        // Asumiremos que el cliente envía un ID basado en el nombre para estos casos.
        const uniqueId = sanitizeId(`${lavado.nombre || type}-${type}`);
        section.dataset.categoryId = uniqueId; // ID para la animación

        let imagenSrc = '/images/default-wash.png';
        let titulo = lavado.nombre || (type === 'personalizado' ? 'Personalizado' : 'Favorito');

        if (type === 'favorito') {
             imagenSrc = lavado.imagen || imagenSrc;
             // Corregir si la ruta viene mal
             if (imagenSrc.startsWith('.')) imagenSrc = '/images/' + imagenSrc.split('/').pop();
        } else if (type === 'personalizado') {
             imagenSrc = '/images/personalizado.svg';
        }

        // HTML interno simple para la tarjeta
        section.innerHTML = `
            <h2>${titulo}</h2>
            <div class="lavado-card"> <img src="${imagenSrc}" class="icon" alt="${titulo}">
                <div class="info">
                    <p>${(type === 'favorito' ? lavado.descripcion : lavado.nivelSuciedad) || ''}</p>
                </div>
            </div>
        `;
        return section;
    }

    // --- Fetch de Datos y Muestra ---
    try {
        const [favoritos, personalizados] = await Promise.all([
            fetch(`/api/users/${userId}/favoritos`).then(res => res.ok ? res.json().catch(() => []) : Promise.reject(`Error ${res.status} fav`)),
            fetch(`/api/users/${userId}/personalizados`).then(res => res.ok ? res.json().catch(() => []) : Promise.reject(`Error ${res.status} pers`))
        ]);

        // Mostrar Favoritos
        favContainer.innerHTML = ''; // Limpiar
        if (favoritos.length > 0) {
            favoritos.forEach(fav => favContainer.appendChild(createWashDisplayElement(fav, 'favorito')));
        } else {
            favContainer.innerHTML = '<p>Sin favoritos</p>';
        }

        // Mostrar Personalizados
        persContainer.innerHTML = ''; // Limpiar
        if (personalizados.length > 0) {
             personalizados.forEach(pers => persContainer.appendChild(createWashDisplayElement(pers, 'personalizado')));
        } else {
             persContainer.innerHTML = '<p>Sin personalizados</p>';
        }

    } catch (error) {
        console.error("🖥️ Error cargando programas (favoritos o personalizados):", error);
        favContainer.innerHTML = `<p class="error-message">Error: ${error.message || 'No se pudieron cargar'}</p>`;
        persContainer.innerHTML = `<p class="error-message">Error: ${error.message || 'No se pudieron cargar'}</p>`;
    }


    // --- LÓGICA DE FOCUS/HOVER (Requerida en esta página) ---
    const socketMyPrograms = io(); // Conexión para esta página específica
    let intendedFocusId = null;
    let focusTimeout = null;
    // Contenedores donde buscar los elementos .category-display
    const allContainers = document.querySelectorAll('.categories-container'); // Selecciona ambos contenedores

    socketMyPrograms.on('connect', () => console.log('🖥️ Socket my-programs conectado.'));
     socketMyPrograms.on('connect_error', (err) => console.error('🖥️❌ Error conexión Socket en my-programs:', err));

    function applyFocus(categoryId) {
        if (!overlay || allContainers.length === 0) return;


        overlay.classList.add('active');
        allContainers.forEach(c => c.classList.add('container-focused')); // Atenuar ambos

        document.querySelectorAll('.category-display.focused').forEach(el => el.classList.remove('focused')); // Quitar foco previo

        
        // Buscar en ambos contenedores
        const elementToFocus = document.querySelector(`.category-display[data-category-id="${categoryId}"]`);


        // --- DEBUGGING ---
        const selector = `.category-display[data-category-id="${categoryId}"]`;
        console.log(`🖥️ Intentando seleccionar: ${selector}`);
        console.log("🖥️ Elemento encontrado:", elementToFocus); // ¿Es null o el elemento HTML?
        // --- FIN DEBUGGING ---

        if (elementToFocus) {
            elementToFocus.classList.add('focused');
        } else {
             console.log(`🖥️ Elemento ${categoryId} no encontrado para focus en my-programs.`);
             removeFocus();
        }

                
    }

    function removeFocus() {
        if (!overlay || allContainers.length === 0) return;
        intendedFocusId = null;
        overlay.classList.remove('active');
        allContainers.forEach(c => c.classList.remove('container-focused'));
        document.querySelectorAll('.category-display.focused').forEach(el => el.classList.remove('focused'));
    }

    socketMyPrograms.on('highlightCategory', (data) => {
         // Aplicar SOLO si estamos en esta página
         if(window.location.pathname === '/display/lavados-favs') {
            clearTimeout(focusTimeout);
            intendedFocusId = data.categoryId;
            applyFocus(data.categoryId);
         }
    });

    socketMyPrograms.on('unhighlightCategory', (data) => {
        if(window.location.pathname === '/display/lavados-favs') {
            if (data.categoryId === intendedFocusId) {
                 focusTimeout = setTimeout(() => {
                     if (intendedFocusId === data.categoryId) removeFocus();
                 }, 50);
            }
        }
    });

    overlay?.addEventListener('click', removeFocus);
    socketMyPrograms.on('disconnect', () => {
         console.log('🖥️ Socket my-programs desconectado');
         removeFocus();
    });

}); // Fin DOMContentLoaded