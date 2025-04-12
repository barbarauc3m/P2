window.socket = io();  // Definimos el socket globalmente
const socket = window.socket;

socket.on('connect', () => {
    console.log('✅ Socket conectado (ID):', socket.id);
});

socket.on('connect_error', (err) => {
    console.error('❌ Error de conexión con el servidor de Socket.IO:', err.message);
});

document.addEventListener('DOMContentLoaded', function() {
    //const socket = io();
    
    // Mostrar datos del juego
    document.getElementById('game-title').textContent = 
        localStorage.getItem('selectedGameTitle') || 'Juego';
    
    /*
    document.getElementById('game-description').textContent = 
        localStorage.getItem('selectedGameDescription') || 'Descripción del juego';
    */
    // Configurar botón de salida
    document.getElementById('exit-button').addEventListener('click', function() {
        /*emit redirigir el servidor a index*/ 
        socket.emit('closeGameDisplay');
        
        // Redirigir a la página de juegos
        window.location.href = 'juegos.html';
    });

    // Configurar controles específicos para "El Rey del Tendedero"
    if (localStorage.getItem('selectedGameTitle') === 'El Rey del Tendedero') {
        console.log("Esperando a que el usuario agite.");
        agitarParaEmpezar();
        //juego3();
    }
});

function juego3() {    
    // const socket = io();

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


function agitarParaEmpezar() {
    let shakeCount = 0;
    let lastShakeTime = 0;
    let lastUpdate = 0;
    let lastX = null, lastY = null, lastZ = null;
    let juegoIniciado = false;

    const SHAKE_THRESHOLD = 13; // Sensibilidad del sacudido
    const SHAKE_TIMEOUT = 1000; // ms para contar picos 
    const REQUIRED_SHAKES = 4;  // Cuántos picos de sacudidas se requieren

    function onDeviceMotion(e) {
        if (juegoIniciado) return;

        const acc = e.accelerationIncludingGravity;
        if (!acc) return;

        const now = Date.now();
        if ((now - lastUpdate) < 100) return;
        lastUpdate = now;

        const { x, y, z } = acc;

        if (lastX !== null && lastY !== null && lastZ !== null) {
            const deltaX = Math.abs(x - lastX);
            const deltaY = Math.abs(y - lastY);
            const deltaZ = Math.abs(z - lastZ);

            if (deltaX > SHAKE_THRESHOLD || deltaY > SHAKE_THRESHOLD || deltaZ > SHAKE_THRESHOLD) {
                if (now - lastShakeTime > SHAKE_TIMEOUT) {
                    shakeCount = 0;
                }

                shakeCount++;
                lastShakeTime = now;
                
                if (shakeCount >= REQUIRED_SHAKES) {
                    console.log("📳 ¡Agitado!");
                    socket.emit('juego3-empezar');
                    juegoIniciado = true;
                    window.removeEventListener('devicemotion', onDeviceMotion);
                    juego3();
                }
                    
            }
        }

        lastX = x;
        lastY = y;
        lastZ = z;
    }

    window.addEventListener('devicemotion', onDeviceMotion);
}
