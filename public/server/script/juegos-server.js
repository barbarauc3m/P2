document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const gameContainer = document.getElementById('game-container'); // Asegúrate de tener este elemento en tu HTML del servidor

    socket.on('showGameOnServer', (data) => {
        console.log(`🖥️ Mostrando juego en servidor: ${data.gameName}`);
        
        // Limpiar contenedor
        gameContainer.innerHTML = '';
        
        // Crear iframe
        const iframe = document.createElement('iframe');
        iframe.src = data.gameFile;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        
        // Añadir al contenedor
        gameContainer.appendChild(iframe);
        
        // Mostrar contenedor (si estaba oculto)
        gameContainer.style.display = 'block';
    });

    // Botón para volver (opcional)
    const backButton = document.createElement('button');
    backButton.textContent = 'Volver';
    backButton.style.position = 'fixed';
    backButton.style.top = '20px';
    backButton.style.left = '20px';
    backButton.style.zIndex = '1000';
    backButton.addEventListener('click', () => {
        gameContainer.style.display = 'none';
        gameContainer.innerHTML = '';
    });
    document.body.appendChild(backButton);
});