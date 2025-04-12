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
        //initDeviceOrientation(); 
        juego3();
    }
});

function juego3() {    
    const socket = io();

    let lastBeta = null;
    let lastTime = null;

    // API DEVICEORIENTATION para capturar movimientos hacia arriba con el móvil
    window.addEventListener('deviceorientation', function(event) {
        const beta = event.beta;
        if (beta === null) return;

        const currentTime = Date.now();

        if (lastBeta !== null && lastTime !== null) {
            const deltaBeta = beta - lastBeta;
            const deltaTime = currentTime - lastTime;

            if (deltaBeta > 20 && deltaTime < 500) {
                console.log('📱 Inclinación rápida detectada');
                socket.emit('lanzar');
            }
        }

        lastBeta = beta;
        lastTime = currentTime;
    });

    // Para emitir mensajes cuando se presiona 'Pausar' en el móvil
    const pauseButton = document.getElementById("pause-button");
    if (pauseButton) {
        pauseButton.addEventListener("click", function() {
            console.log("😡 MÓVIL MANDA QUE SE PARE EL JUEGO");
            socket.emit('juego3-pausar');
            alert("Juego pausado");
        });
    }

    // Y cuando se presiona 'Reiniciar' en el móvil
    const restartButton = document.getElementById("restart-button");
    if (restartButton) {
        restartButton.addEventListener("click", function() {
            console.log("😱 MÓVIL MANDA QUE SE REINICIE EL JUEGO");
            socket.emit('juego3-reiniciar');
            //alert("Juego reiniciado");
        });
    }
}