
// Configuración del juego
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score-display');
const timerDisplay = document.getElementById('timer-display');
const gameOverDisplay = document.getElementById('game-over');

// Ajustar tamaño del canvas
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Variables del juego
let score = 0;
let timeLeft = 60;
let gameActive = true;
let gameTimer;

// Jugador
const player = {
    x: canvas.width / 2 - 50,
    y: canvas.height - 100,
    width: 100,
    height: 100,
    speed: 10,
    img: new Image()
};
player.img.src = 'images/carrito.png'; // Asegúrate de tener esta imagen

// Objetos que caen
let fallingItems = [];
const itemTypes = [
    { name: 'camiseta', points: 1, img: new Image() },
    { name: 'pantalon', points: 1, img: new Image() },
    { name: 'calcetin', points: 1, img: new Image() },
    { name: 'bomba', points: -1, img: new Image() }
];

// Cargar imágenes
itemTypes[0].img.src = 'images/camiseta.png';
itemTypes[1].img.src = 'images/pantalon.png';
itemTypes[2].img.src = 'images/calcetin.png';
itemTypes[3].img.src = 'images/bomba.png';

// Teclado
const keys = {
    ArrowLeft: false,
    ArrowRight: false
};

// Eventos de teclado
window.addEventListener('keydown', (e) => {
    if (e.key in keys) {
        keys[e.key] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key in keys) {
        keys[e.key] = false;
    }
});

// Crear nuevos objetos que caen
function createFallingItem() {
    if (!gameActive) return;
    
    const type = Math.random() < 0.8 ? 
        itemTypes[Math.floor(Math.random() * 3)] : // 80% de probabilidad para ropa
        itemTypes[3]; // 20% para bomba
    
    fallingItems.push({
        type: type,
        x: Math.random() * (canvas.width - 50),
        y: -50,
        width: 50,
        height: 50,
        speed: 3 + Math.random() * 3
    });
}

// Actualizar posición del jugador
function updatePlayer() {
    if (keys.ArrowLeft && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys.ArrowRight && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
}

// Actualizar posición de los objetos
function updateItems() {
    for (let i = fallingItems.length - 1; i >= 0; i--) {
        const item = fallingItems[i];
        item.y += item.speed;

        // Detectar colisión con el jugador
        if (
            item.y + item.height > player.y &&
            item.x + item.width > player.x &&
            item.x < player.x + player.width
        ) {
            score += item.type.points;
            scoreDisplay.textContent = `Puntos: ${score}`;
            fallingItems.splice(i, 1);
            continue;
        }

        // Eliminar si llega al suelo
        if (item.y > canvas.height) {
            fallingItems.splice(i, 1);
        }
    }
}

// Dibujar elementos
function draw() {
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar jugador
    ctx.drawImage(player.img, player.x, player.y, player.width, player.height);

    // Dibujar objetos
    fallingItems.forEach(item => {
        ctx.drawImage(item.type.img, item.x, item.y, item.width, item.height);
    });
}

// Bucle del juego
function gameLoop() {
    if (!gameActive) return;

    updatePlayer();
    updateItems();
    draw();
    requestAnimationFrame(gameLoop);
}

// Temporizador del juego
function startGameTimer() {
    gameTimer = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = `Tiempo: ${timeLeft}`;

        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

// Finalizar juego
function endGame() {
    gameActive = false;
    clearInterval(gameTimer);
    clearInterval(itemInterval);
    gameOverDisplay.style.display = 'block';
    gameOverDisplay.textContent = `¡Juego Terminado! Puntos: ${score}`;
}

// Iniciar juego
function startGame() {
    gameActive = true;
    score = 0;
    timeLeft = 60;
    scoreDisplay.textContent = `Puntos: ${score}`;
    timerDisplay.textContent = `Tiempo: ${timeLeft}`;
    gameOverDisplay.style.display = 'none';
    fallingItems = [];
    
    startGameTimer();
    gameLoop();
}

// Generar objetos cada segundo
const itemInterval = setInterval(createFallingItem, 1000);

// Redimensionar canvas
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.y = canvas.height - 100;
});

// Iniciar el juego cuando todas las imágenes estén cargadas
let imagesLoaded = 0;
const totalImages = 1 + itemTypes.length; // Jugador + tipos de items

function checkImagesLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        startGame();
    }
}

player.img.onload = checkImagesLoaded;
itemTypes.forEach(type => {
    type.img.onload = checkImagesLoaded;
});
    