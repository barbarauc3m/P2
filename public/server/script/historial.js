
document.addEventListener('DOMContentLoaded', async () => { // Usamos async
    console.log('🖥️ Script history-display.js cargado');

    // --- Elementos DOM ---
    const userDisplayElement = document.getElementById('history-user');
    const historyContainer = document.getElementById('history-display-container');
    const overlay = document.querySelector('.focus-overlay');

    // --- Obtener Usuario ---
    const userId = sessionStorage.getItem('currentDisplayUserId');
    if (userDisplayElement) userDisplayElement.textContent = userId || 'Desconocido';
    if (!userId || !historyContainer || !overlay) {
        console.error('🖥️ Error: Falta userId o elementos HTML esenciales.');
         if(historyContainer) historyContainer.innerHTML = '<p class="error-message">Error al cargar la página.</p>';
        return;
    }

    historyContainer.innerHTML = '<p>Cargando historial...</p>';

    // --- Función Sanitize ID (Copiada) ---
    function sanitizeId(text) {
         if (!text) return `hist-${Math.random().toString(36).substr(2, 9)}`;
         return text.toString().toLowerCase()
                   .replace(/\s+/g, '-')
                   .replace(/[^\w-]+/g, '')
                   .replace(/[:\/]/g, '-'); // Reemplazar ':' y '/' también
    }

    // --- Función Crear HTML (Adaptada) ---
     function createHistoryDisplayElement(lavado, index) {
        const section = document.createElement('section');
        section.className = 'category-display'; // Reutilizar clase de estilo

        // Crear ID único para el hover
        const uniqueId = sanitizeId(`${lavado.nombre}-${lavado.fechaInicio || index}`);
        section.dataset.categoryId = uniqueId; // ID para la animación

        let imagenSrc = lavado.imagen || '/images/default-wash.png';
        if (imagenSrc.startsWith('.')) imagenSrc = '/images/' + imagenSrc.split('/').pop();

        // HTML interno (similar a categorias)
        section.innerHTML = `
            <h2>${lavado.nombre || 'Lavado'}</h2>
            <div class="lavado-card">
                <img src="${imagenSrc}" class="icon" alt="${lavado.nombre || 'Historial'}">
                <div class="info">
                    <p>${lavado.fechaInicio ? fechaBonita(parseFecha(lavado.fechaInicio)) : 'Fecha desconocida'}</p>
                    <p style="font-size:0.8em">${lavado.temperatura || '?'} | ${lavado.duracion || '?'} | ${lavado.centrifugado || '?'}</p>
                </div>
            </div>
        `;
        return section;
    }

    // --- Fetch y Mostrar Historial (Últimos 8) ---
    try {
        const response = await fetch(`/lavados/${userId}`);
        if (!response.ok) throw new Error(`Error ${response.status} al obtener historial`);
        const historial = await response.json().catch(() => []);

        historyContainer.innerHTML = ''; // Limpiar

        if (historial.length === 0) {
            historyContainer.innerHTML = '<p>Historial vacío.</p>';
        } else {
            // Mostrar los últimos 8 (slice(0, 8) si están ordenados del más nuevo al más viejo)
             // Si están al revés (más viejo primero), sería slice(-8)
             // Asumimos que unshift los pone al principio, así que slice(0,8) está bien.
            historial.slice(0, 8).forEach((lavado, index) => {
                historyContainer.appendChild(createHistoryDisplayElement(lavado, index));
            });
        }
    } catch (error) {
        console.error("🖥️ Error cargando historial:", error);
        historyContainer.innerHTML = '<p class="error-message">Error al cargar historial.</p>';
    }


    // --- LÓGICA DE FOCUS/HOVER (Copiada/Adaptada) ---
    const socketHistoryDisplay = io();
    let intendedFocusId = null;
    let focusTimeout = null;
    // El contenedor que tiene los .category-display
    const containerForFocus = historyContainer; // Usamos el contenedor del historial

    socketHistoryDisplay.on('connect', () => {});

    function applyFocus(categoryId) {
        if (!overlay || !containerForFocus) return;
        overlay.classList.add('active');
        containerForFocus.classList.add('container-focused'); // Aplicar al contenedor específico

        const currentFocused = containerForFocus.querySelector('.category-display.focused');
        if (currentFocused) currentFocused.classList.remove('focused');

        const elementToFocus = containerForFocus.querySelector(`.category-display[data-category-id="${categoryId}"]`);
        if (elementToFocus) {
            elementToFocus.classList.add('focused');
        } else {
             console.log(`🖥️ Elemento ${categoryId} no encontrado para focus en historial.`);
             removeFocus();
        }
    }

    function removeFocus() {
        if (!overlay || !containerForFocus) return;
        intendedFocusId = null;
        overlay.classList.remove('active');
        containerForFocus.classList.remove('container-focused');
        const focusedElement = containerForFocus.querySelector('.category-display.focused');
        if (focusedElement) focusedElement.classList.remove('focused');
    }

    socketHistoryDisplay.on('highlightCategory', (data) => {
         if(window.location.pathname === '/display/historial') {
            clearTimeout(focusTimeout);
            intendedFocusId = data.categoryId;
            applyFocus(data.categoryId);
         }
    });

    socketHistoryDisplay.on('unhighlightCategory', (data) => {
        if(window.location.pathname === '/display/historial') {
            if (data.categoryId === intendedFocusId) {
                 focusTimeout = setTimeout(() => {
                     if (intendedFocusId === data.categoryId) removeFocus();
                 }, 50);
            }
        }
    });

    overlay?.addEventListener('click', removeFocus);
    socketHistoryDisplay.on('disconnect', removeFocus);


    function parseFecha(fechaStr) {
        const [fecha, hora] = fechaStr.split(', ');
        const [dia, mes, anio] = fecha.split('/').map(Number);
        const [horas, minutos] = hora.split(':').map(Number);
        const añoReal = anio < 100 ? 2000 + anio : anio;
        return new Date(añoReal, mes - 1, dia, horas, minutos);
      }
      
      function fechaBonita(fecha) {
        const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio',
                       'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return `${dias[fecha.getDay()]}, ${fecha.getDate()} ${meses[fecha.getMonth()]}`;
      }

}); // Fin DOMContentLoaded