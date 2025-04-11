// CONEXIÓN SOCKET.IO
const socket = io();

socket.on('connect', () => {
    console.log('📱 Conectado al servidor Socket.IO');
});

socket.on('disconnect', () => {
    console.log('📱 Desconectado del servidor Socket.IO');
});

// Mapeo de nombres de juego a archivos HTML
const gamesMap = {
    'Atrapa la Ropa': 'juego1.html',
    'Duelo de Doblado': 'juego2.html',
    'El Rey del Tendedero': 'juego3-inicio.html',
    'Combo de Manchas': 'juego4.html'
};

// Función para cargar el juego seleccionado
function loadGame(gameTitle, gameDescription) {

    console.log(`🎮 Juego seleccionado: ${gameTitle}`);
    
    // Guardar la información del juego seleccionado
    localStorage.setItem('selectedGameTitle', gameTitle);
    localStorage.setItem('selectedGameDescription', gameDescription);
    
    // Notificar al servidor qué juego se ha seleccionado
    socket.emit('gameSelected', {
        gameName: gameTitle,
        gameDescription: gameDescription,
        gameFile: gamesMap[gameTitle]
    });
    
    // Redirigir a la pantalla de juego
    window.location.href = gamesMap[gameTitle] || 'jugando.html';
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

/// Inicialización cuando el DOM está listo
document.addEventListener("DOMContentLoaded", function() {
    // Configurar sensores si es El Rey del Tendedero
    const selectedGame = localStorage.getItem("selectedGameTitle");
    if (selectedGame === 'El Rey del Tendedero') {
        console.log('🧭 Activando sensor para El Rey del Tendedero');
        initDeviceOrientation();
    }

    // Si estamos en la página de juego (jugando.html)
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
            socket.emit('gameControl', { action: 'pause' });
            alert("Juego pausado");
        });
    }
    
    if (restartButton) {
        restartButton.addEventListener("click", function() {
            socket.emit('gameControl', { action: 'restart' });
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

    // Escuchar controles desde el servidor (para juegos que lo necesiten)
    socket.on('gameControl', (data) => {
        console.log('🎮 Control recibido:', data.action);
        // Implementa las acciones según tu juego
        switch(data.action) {
            case 'move-left':
                // Tu lógica para mover izquierda
                break;
            case 'move-right':
                // Tu lógica para mover derecha
                break;
            case 'start':
                // Iniciar juego
                break;
        }
    });
});