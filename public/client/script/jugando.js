document.addEventListener('DOMContentLoaded', function() {
    const socket = io();
    
    // Mostrar datos del juego
    document.getElementById('game-title').textContent = 
        localStorage.getItem('selectedGameTitle') || 'Juego';
    
    document.getElementById('game-description').textContent = 
        localStorage.getItem('selectedGameDescription') || 'Descripción del juego';

    // Configurar botón de salida
    document.getElementById('exit-button').addEventListener('click', function() {
        /*emit redirigir el servidor a index*/ 
        socket.emit('closeGameDisplay');
        
        // Redirigir a la página de juegos
        window.location.href = 'juegos.html';
    });

    // Configurar controles específicos para "El Rey del Tendedero"
    if (localStorage.getItem('selectedGameTitle') === 'El Rey del Tendedero') {
        initDeviceOrientation(); // Tu función existente para sensores
    }
});