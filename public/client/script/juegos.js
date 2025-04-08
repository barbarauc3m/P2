// Función para cargar el juego seleccionado
function loadGame(gameTitle, gameDescription) {
    // Guardar la información del juego seleccionado
    localStorage.setItem('selectedGameTitle', gameTitle);
    localStorage.setItem('selectedGameDescription', gameDescription);

    // Redirigir a la pantalla de juego
    window.location.href = 'jugando.html';
}

function initDeviceOrientation() {    
    const socket = io();

    let lastBeta = null;
    let lastTime = null;

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
}

// Para jugando.html - Cargar los datos del juego seleccionado
document.addEventListener("DOMContentLoaded", function() {

    const selectedGame = localStorage.getItem("selectedGameTitle");
    if (selectedGame === 'El Rey del Tendedero') {
        console.log('🧭 Activando sensor para El Rey del Tendedero');
        initDeviceOrientation();
    }

    // Si estamos en la página de juego
    if (document.getElementById("game-title")) {
        const titleElement = document.getElementById("game-title");
        const descriptionElement = document.getElementById("game-description");
        
        // Cargar la información del juego seleccionado
        titleElement.textContent = localStorage.getItem("selectedGameTitle") || "Juego";
        descriptionElement.textContent = localStorage.getItem("selectedGameDescription") || "Descripción del juego.";
    }
    
    // Configurar botones (solo en jugando.html)
    const exitButton = document.getElementById("exit-button");
    const pauseButton = document.getElementById("pause-button");
    const restartButton = document.getElementById("restart-button");
    
    if (exitButton) {
        exitButton.addEventListener("click", function() {
            window.location.href = "juegos.html";
        });
    }
    
    if (pauseButton) {
        pauseButton.addEventListener("click", function() {
            alert("Juego pausado");
        });
    }
    
    if (restartButton) {
        restartButton.addEventListener("click", function() {
            alert("Juego reiniciado");
        });
    }
    
    // Configurar efecto 3D mejorado para las cartas (solo en juegos.html)
    const cardContainers = document.querySelectorAll('.card-container');

    cardContainers.forEach(container => {
        container.addEventListener('mousemove', (e) => {
            const card = container.querySelector('.card');
            const rect = container.getBoundingClientRect();
            
            // Posición relativa al centro (-0.5 a 0.5)
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            
            // Rotación más pronunciada (30 grados máximo en lugar de 20)
            const xRotation = y * 30;  // Hasta 15 grados en cada dirección
            const yRotation = -x * 30; // Invertido para que se aleje del ratón
            
            // Añadir un pequeño efecto de traslación para mayor profundidad
            const xTranslate = x * 10;
            const yTranslate = y * 10;
            
            // Aplicar transformación con perspectiva
            card.style.transform = `
                perspective(1000px) 
                rotateX(${xRotation}deg) 
                rotateY(${yRotation}deg)
                translateX(${xTranslate}px)
                translateY(${yTranslate}px)
            `;
            
            // Efecto de brillo más pronunciado
            const distanceFromCenter = Math.sqrt(x*x + y*y) * 2;
            card.style.filter = `brightness(${1 + 0.3 * distanceFromCenter})`;
            
            // Añadir sombra dinámica para efecto de profundidad
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
    });
});
