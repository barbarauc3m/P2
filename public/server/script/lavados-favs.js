// public/server/script/my-programs-display.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('🖥️ Script my-programs-display.js cargado');

    // --- Elementos DOM ---
    const userDisplayElement = document.getElementById('my-programs-user');
    const favContainer = document.getElementById('my-programs-favoritos');
    const persContainer = document.getElementById('my-programs-personalizados');
    const overlay = document.querySelector('.focus-overlay'); // Overlay para focus

    // --- Obtener Usuario ---
    const userId = sessionStorage.getItem('currentDisplayUserId');
    if (userDisplayElement) userDisplayElement.textContent = userId || 'Desconocido';
    if (!userId) {
        console.error('🖥️ No hay userId en sessionStorage.');
        if(favContainer) favContainer.innerHTML = '<p class="error-message">Usuario no identificado.</p>';
        if(persContainer) persContainer.innerHTML = '<p class="error-message">Usuario no identificado.</p>';
        return;
    }

    // --- Función Helper para Sanitizar ID (para data-category-id) ---
    function sanitizeId(text) {
        if (!text) return `item-${Math.random().toString(36).substr(2, 9)}`;
        return text.toLowerCase()
                   .replace(/\s+/g, '-') // Reemplaza espacios con guiones
                   .replace(/[^\w-]+/g, ''); // Quita caracteres no alfanuméricos (excepto guion)
    }

     // --- Función Helper para Crear HTML (Adaptada de categorias-lavados servidor) ---
     function createWashDisplayElement(lavado, type) {
        const section = document.createElement('section');
        section.className = 'category-display'; // Usar la clase del CSS de categorías

        let imagenSrc = '/images/default-wash.png';
        let displayId = sanitizeId(lavado.nombre); // Crear ID único basado en nombre

        if (type === 'favorito') {
             imagenSrc = lavado.imagen || imagenSrc;
             // Podríamos usar un prefijo para evitar colisiones si nombres se repiten entre tipos
             // displayId = 'fav-' + displayId;
        } else if (type === 'personalizado') {
             imagenSrc = '/images/personalizado.svg';
             // displayId = 'pers-' + displayId;
        }
         section.dataset.categoryId = displayId; // Añadir el data attribute para el focus

         // HTML interno (similar a categorias-lavados servidor, sin detalles ul/botones aquí)
        section.innerHTML = `
            <img src="${imagenSrc}" class="icon" alt="${lavado.nombre || type}">
            <h2>${lavado.nombre || 'Sin Nombre'}</h2>
            <p>${(type === 'favorito' ? lavado.descripcion : lavado.nivelSuciedad) || ''}</p>
        `;
        return section;
    }


    // --- Fetch de Datos y Muestra ---
    console.log(`🖥️ Cargando programas para ${userId}...`);
    Promise.all([
        fetch(`/api/users/${userId}/favoritos`).then(res => res.ok ? res.json() : []),
        fetch(`/api/users/${userId}/personalizados`).then(res => res.ok ? res.json() : [])
    ])
    .then(([favoritos, personalizados]) => {
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
    })
    .catch(error => {
        console.error("🖥️ Error cargando programas:", error);
        if(favContainer) favContainer.innerHTML = '<p class="error-message">Error</p>';
        if(persContainer) persContainer.innerHTML = '<p class="error-message">Error</p>';
    });


    // --- LÓGICA DE FOCUS/HOVER (Copiada/Adaptada de categorias-lavados.js servidor) ---
    const socketMyPrograms = io(); // Conexión para esta página
    let intendedFocusId = null;
    let focusTimeout = null;
    // Necesitamos el contenedor padre que tendrá la clase .container-focused
    // Podría ser '.mis-programas-display' o el body, o añadimos la clase a ambos contenedores?
    // Vamos a asumir que CADA .categories-container puede tener .container-focused
    const allContainers = document.querySelectorAll('.categories-container');

    socketMyPrograms.on('connect', () => console.log('🖥️ Socket my-programs conectado.'));

    function applyFocus(categoryId) {
        if (!overlay) return;
        console.log(`🖥️ Aplicando foco MY-PROGRAMS a: ${categoryId}`);
        overlay.classList.add('active');
        // Añadir clase a AMBOS contenedores para atenuar todo
        allContainers.forEach(c => c.classList.add('container-focused'));

        // Quitar foco previo
        document.querySelectorAll('.category-display.focused').forEach(el => el.classList.remove('focused'));

        // Aplicar foco nuevo
        const elementToFocus = document.querySelector(`.category-display[data-category-id="${categoryId}"]`);
        if (elementToFocus) {
            elementToFocus.classList.add('focused');
        } else {
             console.log(`🖥️ Elemento ${categoryId} no encontrado para focus.`);
             removeFocus(); // Si no se encuentra, quitar estado focus
        }
    }

    function removeFocus() {
        if (!overlay) return;
        console.log(`🖥️ Quitando foco MY-PROGRAMS.`);
        intendedFocusId = null;
        overlay.classList.remove('active');
        allContainers.forEach(c => c.classList.remove('container-focused'));
        document.querySelectorAll('.category-display.focused').forEach(el => el.classList.remove('focused'));
    }

    socketMyPrograms.on('highlightCategory', (data) => {
         // Solo aplicar si estamos en esta página (evita errores si el evento llega a otra)
         if(window.location.pathname === '/display/my-programs') {
             console.log(`🖥️ Recibido highlightCategory MY-PROGRAMS para: ${data.categoryId}`);
             clearTimeout(focusTimeout);
             intendedFocusId = data.categoryId;
             applyFocus(data.categoryId);
         }
    });

    socketMyPrograms.on('unhighlightCategory', (data) => {
        if(window.location.pathname === '/display/my-programs') {
            console.log(`🖥️ Recibido unhighlightCategory MY-PROGRAMS para: ${data.categoryId}`);
            if (data.categoryId === intendedFocusId) {
                 focusTimeout = setTimeout(() => {
                     if (intendedFocusId === data.categoryId) removeFocus();
                 }, 50);
            } else {
                console.log(`🖥️ Ignorando unhighlight MY-PROGRAMS para ${data.categoryId}`);
            }
        }
    });

    // Quitar foco si se hace clic en el overlay
    overlay?.addEventListener('click', removeFocus);

     socketMyPrograms.on('disconnect', () => {
        console.log('🖥️ Socket my-programs desconectado');
        removeFocus();
    });

}); // Fin DOMContentLoaded