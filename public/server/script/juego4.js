function startGame() {
    document.querySelector('.game-title').style.display = 'none';
    document.querySelector('.game-start-container').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';

    iniciarCanvas();
  }
  
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const tileSize = 70;
const rows = 6;
const cols = 6;


const prendas = ['camiseta', 'pantalones', 'calcetines'];
const imagenes = {};

// Cargar imágenes
function cargarImagenes(callback) {
let cargadas = 0;
prendas.forEach(prenda => {
    const img = new Image();
    img.src = `/images/${prenda}.png`;
    img.onload = () => {
    imagenes[prenda] = img;
    cargadas++;
    if (cargadas === prendas.length) {
        callback();
    }
    };
});
}

// Generar el tablero con prendas aleatorias
let tablero = [];
function generarTablero() {
tablero = [];
for (let y = 0; y < rows; y++) {
    const fila = [];
    for (let x = 0; x < cols; x++) {
    const prenda = prendas[Math.floor(Math.random() * prendas.length)];
    fila.push(prenda);
    }
    tablero.push(fila);
}
}

// Dibujar el tablero en el canvas
function dibujarTablero() {
ctx.clearRect(0, 0, canvas.width, canvas.height);
for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
    const prenda = tablero[y][x];
    const img = imagenes[prenda];
    const px = x * tileSize;
    const py = y * tileSize;

    // Efecto "Candy" animación entrada
    ctx.save();
    ctx.translate(px + tileSize / 2, py + tileSize / 2);
    const scale = 1 + 0.05 * Math.sin(Date.now() / 200 + x + y);
    ctx.scale(scale, scale);
    ctx.drawImage(img, -tileSize / 2 + 5, -tileSize / 2 + 5, tileSize - 10, tileSize - 10);
    ctx.restore();
    }
}

// Dibujar rejilla
ctx.strokeStyle = '#ccc';
ctx.lineWidth = 2;
for (let x = 0; x <= cols; x++) {
  ctx.beginPath();
  ctx.moveTo(x * tileSize, 0);
  ctx.lineTo(x * tileSize, rows * tileSize);
  ctx.stroke();
}
for (let y = 0; y <= rows; y++) {
  ctx.beginPath();
  ctx.moveTo(0, y * tileSize);
  ctx.lineTo(cols * tileSize, y * tileSize);
  ctx.stroke();
}

requestAnimationFrame(dibujarTablero);
}

// Inicializar
function iniciarCanvas() {
cargarImagenes(() => {
    generarTablero();
    dibujarTablero();
});
}
