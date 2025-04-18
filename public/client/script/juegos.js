// CONEXIÓN SOCKET.IO
const socket = io();

socket.on('connect', () => {
    console.log('📱 Conectado al servidor Socket.IO');
});

socket.on('disconnect', () => {
    console.log('📱 Desconectado del servidor Socket.IO');
});

// Mapeo de nombres de juego a archivos HTML
const gamesMap = [
    {
        title: "Atrapa la Ropa",
        description: "Atrapa las prendas antes de que caigan",
        mobilePage: "jugando.html",
        serverPage: "../server/juego1.html"
    },
    { 
        title: "El Rey del Tendedero",
        description: "Pon la ropa en el tendedero. CUIDADO, que no se toquen entre sí",
        mobilePage: "jugando.html",
        serverPage: "../server/juego2.html"
    }
];

// Función para cargar el juego seleccionado
function loadGame(index) {
    const game = gamesMap[index];
    if (!game) return;

    // 1. Guardar datos para jugando.html
    localStorage.setItem('selectedGameTitle', game.title);
    localStorage.setItem('selectedGameDescription', game.description);

    // 2. Notificar al servidor
    socket.emit('showGameOnServer', {
        gameFile: game.serverPage,
        gameName: game.title
    });

    // 3. Redirigir en el móvil
    window.location.href = game.mobilePage;
}

/// Inicialización cuando el DOM está listo
document.addEventListener("DOMContentLoaded", function() {

    //const selectedGame = localStorage.getItem("selectedGameTitle");
    const selectedGame = localStorage.removeItem("selectedGameTitle");

    /*
    console.log('🧭 Activando puntero Wii remoto desde móvil');
    activarPunteroWii();
    */

    // Configurar sensores si es El Rey del Tendedero
    if (selectedGame === 'El Rey del Tendedero') { // AÑADIR QUE SEA CUANDO SE ESTÉ JUGANDO (variables esas)
        console.log('🧭 SE PRENDEN SENSORES PARA JUEGO2 (deviceOrientation y botones emiten)!!!');
        juego2();
    }

    /*
    // Mostrar datos del juego
    document.getElementById("game-title").textContent = 
        localStorage.getItem("selectedGameTitle") || "Juego";
    
        
    document.getElementById("game-description").textContent = 
        localStorage.getItem("selectedGameDescription") || "Descripción";
        */
    
    // Configurar botón de salida
    document.getElementById('back-button').addEventListener('click', function() {
        /*emit redirigir el servidor a index*/ 
        socket.emit('requestDisplayChange', { targetPage: '/' });
        
        // Redirigir a la página de juegos
        window.location.href = 'index.html';
    });

    // Configurar efecto 3D mejorado para las cartas (solo en juegos.html)
    document.querySelectorAll('.card-container').forEach((container, index) => {
        container.addEventListener('mousemove', (e) => {

            container.addEventListener('click', () => loadGame(index));

            const card = container.querySelector('.card');
            const rect = container.getBoundingClientRect();
            
            // Posición relativa al centro (-0.5 a 0.5)
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            
            // Rotación más pronunciada (30 grados máximo en lugar de 20)
            const xRotation = y * 30;
            const yRotation = -x * 30;
            
            // Efecto de traslación
            const xTranslate = x * 10;
            const yTranslate = y * 10;
            
            // Aplicar transformación
            card.style.transform = `
                perspective(1000px) 
                rotateX(${xRotation}deg) 
                rotateY(${yRotation}deg)
                translateX(${xTranslate}px)
                translateY(${yTranslate}px)
            `;
            
            // Efecto de brillo
            const distanceFromCenter = Math.sqrt(x*x + y*y) * 2;
            card.style.filter = `brightness(${1 + 0.3 * distanceFromCenter})`;
            
            // Sombra dinámica
            card.style.boxShadow = `
                ${-x * 20}px ${-y * 20}px 30px rgba(0, 0, 0, 0.3)
            `;
        });
        
        container.addEventListener('mouseleave', () => {
            const card = container.querySelector('.card');
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateX(0) translateY(0)';
            card.style.filter = 'brightness(1)';
            card.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
        });

        // Añadir evento click para cada tarjeta de juego
        container.addEventListener('click', () => {
            const gameTitle = container.querySelector('h3')?.textContent || '';
            const gameDescription = container.querySelector('p')?.textContent || '';
            loadGame(gameTitle, gameDescription);
        });
    });
});

// Para animar los juegos si inclinas el móvil a un lado o a otro 
// Configuración
const gammaThreshold = 13; // Sensibilidad de inclinación (grados)
const accelerationThreshold = 3; // Sensibilidad del golpe en seco (m/s²)
let currentTilt = null; // 'left', 'right', or null

// Resetear estilos de las tarjetas
function resetTransforms() {
  document.getElementById('card1').style.transform = '';
  document.getElementById('card2').style.transform = '';
}

// --------------- INCLINACIÓN 
window.addEventListener('deviceorientation', (event) => {
  const gamma = event.gamma;
  resetTransforms();

  if (gamma < -gammaThreshold) {
    currentTilt = 'left';
    console.log("Inclinado a la izquierda (Juego 1 seleccionado)");
    socket.emit('expandir-juego1');
  } 
  else if (gamma > gammaThreshold) {
    currentTilt = 'right';
    console.log("Inclinado a la derecha (Juego 2 seleccionado)");
    socket.emit('expandir-juego2');
  } 
  else {
    currentTilt = null; // Centrado
  }
});

// --------------- GOLPE SECO HACIA ARRIBA PARA ABRIR 
window.addEventListener('devicemotion', (event) => {
  const accelerationY = event.acceleration.y; // Aceleración vertical (m/s²)

  // Si hay un golpe brusco hacia arriba
  if (Math.abs(accelerationY) > accelerationThreshold && accelerationY < 0) {
    console.log("¡Golpe seco detectado!", accelerationY);

    // Se ejecuta loadGame() según la inclinación actual
    console.log("Cargando Juego 1 (loadGame(0))");
    if (currentTilt === 'left') {
      loadGame(0); // Juego 1
      
    } 
    else if (currentTilt === 'right') {
      console.log("Cargando Juego 2 (loadGame(1))");
      loadGame(1); // Juego 2
      
    }
  }
});