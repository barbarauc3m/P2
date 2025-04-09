// public/server/script/categorias-lavados.js
const socketCategoriesServer = io(); // Usar la misma conexión si es posible

socketCategoriesServer.on('connect', () => {
    console.log('🖥️ Categorias Server Conectado:', socketCategoriesServer.id);
});

function highlightCategory(categoryId) {
    // Quitar highlight de todas primero (por si acaso)
    document.querySelectorAll('.category-display.highlighted').forEach(el => {
        el.classList.remove('highlighted');
    });

    // Añadir highlight a la específica
    const elementToHighlight = document.querySelector(`.category-display[data-category-id="${categoryId}"]`);
    if (elementToHighlight) {
        elementToHighlight.classList.add('highlighted');
        console.log(`🖥️ Resaltando categoría: ${categoryId}`);
    } else {
        console.log(`🖥️ No se encontró categoría para resaltar: ${categoryId}`);
    }
}

function unhighlightCategory(categoryId) {
    const elementToUnhighlight = document.querySelector(`.category-display[data-category-id="${categoryId}"]`);
    if (elementToUnhighlight) {
        elementToUnhighlight.classList.remove('highlighted');
        console.log(`🖥️ Quitand resaltado a categoría: ${categoryId}`);
    }
}

// Escuchar eventos de hover desde el móvil
socketCategoriesServer.on('highlightCategory', (data) => {
    highlightCategory(data.categoryId);
});

socketCategoriesServer.on('unhighlightCategory', (data) => {
    unhighlightCategory(data.categoryId);
});

socketCategoriesServer.on('disconnect', () => {
    console.log('🖥️ Categorias Server Desconectado');
});