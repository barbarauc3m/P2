let canvas, ctx;
let carritoImg;
let carritoX;
let carritoY;
let carritoAncho = 80;
let carritoAlto = 50;
let canvasAncho = 600;
let canvasAlto = 400;


// Prendas del juego
let objetos = [];
let score = 0;
let gameInterval;
let caidaInterval;
const tiposObjetos = [
  { tipo: 'camiseta', src: '/images/camiseta.png', puntos: 1 },
  { tipo: 'pantalon', src: '/images/pantalones.png', puntos: 1 },
  { tipo: 'calcetines', src: '/images/calcetines.png', puntos: 1 },
  { tipo: 'bomba', src: '/images/bomba.png', puntos: -1 }
];

// Explosión de bomba
const sonidoBomba = new Audio('/sounds/explosion.mp3');

const explosion = {
    img: new Image(),
    active: false,
    x: 0,
    y: 0,
    width: 100, 
    height: 100,
    frame: 0,
    maxFrames: 10, // Ajusta según tus necesidades
    animationSpeed: 5
};
explosion.img.src = '/images/explosion.png';

function mostrarExplosion(x, y) {
    const explosionElement = document.createElement('img');
    explosionElement.src = explosion.img.src;
    explosionElement.style.position = 'absolute';
    explosionElement.style.left = `${x - explosion.width / 2}px`;
    explosionElement.style.top = `${y - explosion.height / 2}px`;
    explosionElement.style.width = `${explosion.width}px`;
    explosionElement.style.height = `${explosion.height}px`;
    explosionElement.style.zIndex = 10;
    explosionElement.className = 'explosion';

    document.getElementById('game-container').appendChild(explosionElement);

    setTimeout(() => {
        explosionElement.remove();
    }, 400); // Mostrar por 400ms
}



let timer = 60;
let intervalId;

function startGame() {
    document.querySelector('.game-start-container').style.display = 'none';
    document.querySelector('.game-title').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    document.getElementById('carrito-img').style.display = 'block';
    document.getElementById('score-display').style.display = 'block';
    document.getElementById('timer-display').style.display = 'block';



    score = 0;
    objetos = [];

    document.getElementById('score-display').textContent = 'Puntos: 0';
    document.getElementById('timer-display').textContent = 'Tiempo: 60';
    document.getElementById('game-over').style.display = 'none';

    // Crear objetos cada 800ms
    caidaInterval = setInterval(crearObjeto, 1500);
    // Moverlos cada 50ms
    gameInterval = setInterval(moverObjetos, 50);

    iniciarJuego();
}

function iniciarJuego() {
    canvas = document.getElementById('game-canvas');
    canvas.width = 600;
    canvas.height = 400;

    // Mostrar carrito
    const carrito = document.getElementById('carrito-img');
    carrito.style.display = 'block';

    // Posición inicial
    carrito.style.left = '50%'; // centrado con transform

    // Escuchar teclas
    document.addEventListener('keydown', moverCarritoImg);

    // Temporizador
    iniciarTemporizador();
}

function iniciarTemporizador() {
    let tiempo = 60;
    const timer = setInterval(() => {
        tiempo--;
        document.getElementById('timer-display').textContent = `Tiempo: ${tiempo}`;
        if (tiempo <= 0) {
            clearInterval(timer);
            clearInterval(caidaInterval);
            clearInterval(gameInterval);
            document.getElementById('game-over').style.display = 'block';
            document.getElementById('game-over').textContent = `¡Juego Terminado! Puntuación: ${score}`;
            objetos.forEach(o => o.remove());
            objetos = [];
        }
    }, 1000);
}

function moverCarritoImg(e) {
    const carrito = document.getElementById('carrito-img');
    const paso = 15;
    const contenedorAncho = window.innerWidth;
    const carritoAncho = carrito.offsetWidth;
    const izquierdaActual = carrito.getBoundingClientRect().left;

    let nuevaIzquierda;

    if (e.key === 'ArrowLeft') {
        nuevaIzquierda = izquierdaActual - paso;
        if (nuevaIzquierda < 0) nuevaIzquierda = 0;
        carrito.style.left = `${nuevaIzquierda + carritoAncho / 2}px`;
        carrito.style.transform = 'translateX(-50%) scaleX(-1)'; // gira a la izquierda
    } else if (e.key === 'ArrowRight') {
        nuevaIzquierda = izquierdaActual + paso;
        if (nuevaIzquierda + carritoAncho > contenedorAncho) {
            nuevaIzquierda = contenedorAncho - carritoAncho;
        }
        carrito.style.left = `${nuevaIzquierda + carritoAncho / 2}px`;
        carrito.style.transform = 'translateX(-50%) scaleX(1)'; // gira a la derecha
    }
}


function terminarJuego() {
    clearInterval(intervalId);
    document.getElementById('game-over').style.display = 'block';

    const carrito = document.getElementById('carrito-img');
    carrito.style.display = 'none';
}

function crearObjeto() {
    const objetoInfo = tiposObjetos[Math.floor(Math.random() * tiposObjetos.length)];
    const objeto = document.createElement('img');
    objeto.src = objetoInfo.src;
    objeto.classList.add('objeto');
    objeto.dataset.tipo = objetoInfo.tipo;
    objeto.dataset.puntos = objetoInfo.puntos;
    objeto.style.position = 'absolute';
    objeto.style.top = '0px';
    objeto.style.left = `${Math.random() * (window.innerWidth - 60)}px`;
    objeto.style.width = '80px';
    objeto.style.zIndex = 5;

    document.getElementById('game-container').appendChild(objeto);
    objetos.push(objeto);
}

function moverObjetos() {
    const carrito = document.getElementById('carrito-img');
    const carritoRect = carrito.getBoundingClientRect();

    objetos.forEach((obj, i) => {
        let top = parseInt(obj.style.top);
        obj.style.top = `${top + 5}px`;

        const objRect = obj.getBoundingClientRect();

        if (
            objRect.bottom >= carritoRect.top &&
            objRect.left < carritoRect.right &&
            objRect.right > carritoRect.left
        ) {
            const tipo = obj.dataset.tipo;
            const puntos = parseInt(obj.dataset.puntos);
            score += puntos;
        
            // Mostrar explosión si es bomba
            if (tipo === 'bomba') {
                const objRect = obj.getBoundingClientRect();
                const containerRect = document.getElementById('game-container').getBoundingClientRect();
            
                // Coordenadas relativas al contenedor del juego
                const explosionX = objRect.left - containerRect.left + objRect.width / 2;
                const explosionY = objRect.top - containerRect.top + objRect.height / 2;
            
                mostrarExplosion(explosionX, explosionY);
                sonidoBomba.currentTime = 0; // reinicia el sonido por si se repite rápido
                sonidoBomba.play();

            }
            
        
            obj.remove();
            objetos.splice(i, 1);
        }
        

        // Si toca el suelo y no colisiona
        else if (top > window.innerHeight) {
            obj.remove();
            objetos.splice(i, 1);
        }
    });

    // Actualizar marcador
    document.getElementById('score-display').textContent = `Puntos: ${score}`;
}
