//import VoiceRecognition from './voice-recognition.js';
let voiceControl;

window.socket = io();  // Definimos el socket globalmente
const socket = window.socket;

// Elementos del popup
const shakePopup = document.getElementById('shake-popup');
const pausePopup = document.getElementById('pause-popup');
const finPopup = document.getElementById('fin-popup');

let juegoIniciado = false;

socket.on('connect', () => {
    console.log('✅ Socket conectado (ID):', socket.id);
});

socket.on('connect_error', (err) => {
    console.error('❌ Error de conexión con el servidor de Socket.IO:', err.message);
});

socket.on('juego-reanudado', () => {
    console.log("Juego reanudado");
    pausePopup.style.display = 'none';
});

socket.on('voiceControl-start', () => {
    console.log("Cliente ha recibido el mensaje voiceControl-start.");
    console.log("Se solicita activar voiceControl.");
    voiceControl.start()
});

socket.on('juego-finished', () => {
    console.log("Juego terminado");
    finPopup.style.display = 'flex';
});

socket.on('juego-reiniciado', () => {
    console.log("Juego reiniciado");
    finPopup.style.display = 'none';
});

document.addEventListener('DOMContentLoaded', function() {
        
    // Mostrar popup inmediatamente al cargar
    shakePopup.style.display = 'flex';
    
    // Mostrar datos del juego
    const gameTitle = localStorage.getItem('selectedGameTitle') || 'Juego';
    document.getElementById('game-title').textContent = gameTitle;
   
    // Configurar botón de salida
    document.getElementById('exit-button').addEventListener('click', function() {
        /*emit redirigir el servidor a index*/ 
        socket.emit('closeGameDisplay');
        
        // Redirigir a la página de juegos
        window.location.href = 'juegos.html';
    });

    // Detectar juego seleccionado y configurar controles
    if (gameTitle === 'El Rey del Tendedero') {
        console.log("Configurando controles para El Rey del Tendedero");
        setupShakeDetection('juego-empezar', juego2);
    } 
    else if (gameTitle === 'Atrapa la Ropa') {
        console.log("Configurando controles para Atrapa la Ropa");
        setupShakeDetection('juego-empezar', juego1);
    }

});

// ======== FUNCIÓN UNIFICADA PARA DETECCIÓN DE AGITADO ========

function vibrar(pattern = 200) {
    if ("vibrate" in navigator) {
        navigator.vibrate(pattern);
    }
}

function setupShakeDetection(eventName, gameFunction) {
    const SHAKE_THRESHOLD = 13;
    const SHAKE_TIMEOUT = 1000;
    const REQUIRED_SHAKES = 4;
    
    let shakeCount = 0;
    let lastShakeTime = 0;
    let lastUpdate = 0;
    let lastX = null, lastY = null, lastZ = null;

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
                    console.log("📳 ¡Agitado detectado!");

                    vibrar();

                    // Ocultar popup y comenzar juego
                    shakePopup.style.display = 'none';
                    finPopup.style.display = 'none';
                    socket.emit(eventName);
                    juegoIniciado = true;
                    window.removeEventListener('devicemotion', onDeviceMotion);
                    
                    // Iniciar los controles específicos del juego
                    if (gameFunction) gameFunction();
                }
            }
        }

        lastX = x;
        lastY = y;
        lastZ = z;
    }

    // Solicitar permisos en iOS
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    window.addEventListener('devicemotion', onDeviceMotion);
                } else {
                    alert("Se necesitan permisos para jugar");
                }
            })
            .catch(console.error);
    } else {
        window.addEventListener('devicemotion', onDeviceMotion);
    }
}

// ====================== MANEJO DE ACELERÓMETRO (existente) ======================
function handleMotion(event) {
    if (juegoIniciado) {
        const acc = event.accelerationIncludingGravity;
        if (!acc) return;
        
        const x = acc.x;
        const y = acc.y;
        const z = acc.z;

        socket.emit('accelerationData', { x, y });
    }
}


// ====================== JUEGO 1 ==========================

function juego1() {   
    
    voiceControl = new VoiceRecognition(socket);
    voiceControl.stop();

    console.log('🚗 Activando controles de movimiento para el carrito');
    controlarMovimientoCarrito();

    // Configurar botones de pausa/reinicio si es necesario
    const pauseButton = document.getElementById("pause-button");
    if (pauseButton) {
        pauseButton.addEventListener("click", function() {
            console.log("Pausa solicitada desde el móvil");
            voiceControl.start(); // Activar reconocimiento durante pausa
            pausePopup.style.display = 'flex';
            socket.emit('juego-pausar');
        });
    }

    const restartButton = document.getElementById("restart-button");
    if (restartButton) {
        restartButton.addEventListener("click", function() {
            finPopup.style.display = 'none';
            socket.emit('juego-reiniciar');
        });
    }
}

function controlarMovimientoCarrito() {
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', (event) => {
          // Usamos solo el eje beta (inclinación frontal) para el carrito
          const inclinacion = event.beta;
          
          // Normalizamos la inclinación a un rango de -90 a 90
          const inclinacionNormalizada = Math.max(-90, Math.min(90, inclinacion));
          
          // Enviar solo la inclinación al servidor con un evento específico
          if (socket) {
              socket.emit('movimientoCarrito', inclinacionNormalizada);
          }
      });
    } else {
      console.log("Tu navegador no soporta DeviceOrientationEvent");
    }
  }


// ====================== JUEGO 2 ==========================

function juego2() {    
    //console.log('🧭 Activando puntero Wii remoto desde móvil');
    voiceControl = new VoiceRecognition(socket);
    voiceControl.stop();

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
            voiceControl.start(); // Activar reconocimiento durante pausa
            pausePopup.style.display = 'flex';
            socket.emit('juego-pausar');
        });
    }

    // Y cuando se presiona 'Reiniciar' en el móvil
    const restartButton = document.getElementById("restart-button");
    if (restartButton) {
        restartButton.addEventListener("click", function() {
            console.log("😱 MÓVIL MANDA QUE SE REINICIE EL JUEGO");
            finPopup.style.display = 'none';
            socket.emit('juego-reiniciar');
        });
    }
}