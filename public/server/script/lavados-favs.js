// public/server/script/my-programs-display.js

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🖥️ Script my-programs-display.js cargado');

    const userDisplayElement = document.getElementById('my-programs-user');
    const favContainer = document.getElementById('my-programs-favoritos');
    const persContainer = document.getElementById('my-programs-personalizados');
    const overlay = document.querySelector('.focus-overlay'); // Overlay para focus

    const userId = sessionStorage.getItem('currentDisplayUserId');

    if (userDisplayElement) userDisplayElement.textContent = userId || 'Desconocido'; 
    

    favContainer.innerHTML = '<p>Cargando favoritos...</p>';
    persContainer.innerHTML = '<p>Cargando personalizados...</p>';


    
    function sanitizeId(text) {
         if (!text) return `item-${Math.random().toString(36).substr(2, 9)}`;
         return text.toString().toLowerCase()
                   .replace(/\s+/g, '-') // reemplaza espacios con guiones
                   .replace(/[^\w-]+/g, '') // quiya caracteres no alfanuméricos (excepto guion)
                   .replace(/[:\/,]/g, '-'); // quita caracteres problemáticos de fechas/horas
    }

    // FUNCION PARA CREAR LAS CARDS QUE SE MUESTRAN EN PANTALLA
     function createWashDisplayElement(lavado, type) {
        const section = document.createElement('section');
        section.className = 'category-display'; // mimsa que categorias-lavados.css porque aqui somos bien ratas

        const uniqueId = sanitizeId(`${lavado.nombre || type}-${type}`); // id unico para hover
        section.dataset.categoryId = uniqueId; 

        let titulo = lavado.nombre || (type === 'personalizado' ? 'Personalizado' : 'Favorito');

        if (type === 'favorito') {
             imagenSrc = lavado.imagen || imagenSrc;
        } else if (type === 'personalizado') {
             imagenSrc = '/images/personalizado.svg';
        }

        // HTML para la card
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

    // DATOS DE FAVORITOS Y PERSONALIZADOS
    try {
        const [favoritos, personalizados] = await Promise.all([
            fetch(`/api/users/${userId}/favoritos`).then(res => res.ok ? res.json().catch(() => []) : Promise.reject(`Error ${res.status} fav`)),
            fetch(`/api/users/${userId}/personalizados`).then(res => res.ok ? res.json().catch(() => []) : Promise.reject(`Error ${res.status} pers`))
        ]);

        // FAVORITOS
        favContainer.innerHTML = ''; // clean
        if (favoritos.length > 0) {
            favoritos.forEach(fav => favContainer.appendChild(createWashDisplayElement(fav, 'favorito')));
        } else {
            favContainer.innerHTML = '<p>Sin favoritos</p>';
        }

        // PERSONALIZADOS
        persContainer.innerHTML = ''; // clean
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


    // LOGICA DE HOVER
    const socketMyPrograms = io(); 
    let intendedFocusId = null;
    let focusTimeout = null;
    const allContainers = document.querySelectorAll('.categories-container'); 

    socketMyPrograms.on('connect', () => {});

    function applyFocus(categoryId) {
        if (!overlay || allContainers.length === 0) return;


        overlay.classList.add('active');
        allContainers.forEach(c => c.classList.add('container-focused')); 

        document.querySelectorAll('.category-display.focused').forEach(el => el.classList.remove('focused')); // quitar foco previo

        
        // Buscar en ambos contenedores
        const elementToFocus = document.querySelector(`.category-display[data-category-id="${categoryId}"]`);

        const selector = `.category-display[data-category-id="${categoryId}"]`;
        // console.log(`Intentando seleccionar: ${selector}`);
        // console.log("S Elemento encontrado:", elementToFocus); 

        if (elementToFocus) {
            elementToFocus.classList.add('focused'); // focused hover
        } else {
             // console.log(`Elemento ${categoryId} no encontrado para focus`);
             removeFocus();
        }

                
    }

    // FUNCION PARA QUITAR EL FOCUS
    function removeFocus() {
        if (!overlay || allContainers.length === 0) return;
        intendedFocusId = null;
        overlay.classList.remove('active');
        allContainers.forEach(c => c.classList.remove('container-focused'));
        document.querySelectorAll('.category-display.focused').forEach(el => el.classList.remove('focused')); //fuera
    }

    socketMyPrograms.on('highlightCategory', (data) => {
         // aplicamos SOLO si estamos en esta página
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
         removeFocus();
    });

}); 