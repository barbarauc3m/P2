document.addEventListener("DOMContentLoaded", function() {
    // Configuración inicial del juego
    document.querySelector(".start-button").addEventListener("click", function() {
        document.querySelector(".game-title").style.display = "none";
        document.querySelector(".game-start-container").style.display = "none";
        document.querySelector(".game-container").style.display = "block";
        
        document.body.style.backgroundImage = 'url("../../../images/garden.jpg")';
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundPosition = "center";
        document.body.style.backgroundRepeat = "no-repeat";
    });

    const gameContainer = document.querySelector('.game-container');
    const alturaMaxima = 260;
    const velocidad = 8;
    let prendas = [];
    let prendaActual = null;
    let puedeLanzar = true;

    // Crear la primera prenda
    function crearPrendaInicial() {
        const prenda = document.querySelector('.ropa-container');
        prenda.style.top = '900px';
        prenda.style.left = '50%';
        prenda.style.transform = 'translate(-50%, -50%)';
        prenda.style.animation = 'none';
        prendas.push(prenda);
        prendaActual = prenda;
    }

    crearPrendaInicial();

    // Función para crear una nueva prenda
    function crearNuevaPrenda() {
        const nuevaPrenda = prendaActual.cloneNode(true);
        nuevaPrenda.style.animation = 'none';
        nuevaPrenda.style.top = '900px';
        nuevaPrenda.style.left = '50%';
        nuevaPrenda.style.transform = 'translate(-50%, -50%)';
        gameContainer.appendChild(nuevaPrenda);
        prendas.push(nuevaPrenda);
        prendaActual = nuevaPrenda;
        puedeLanzar = true;
    }

    // Función para mover la prenda
    function moverPrenda() {
        if (!puedeLanzar || !prendaActual) return;

        puedeLanzar = false;
        
        // Crear nueva prenda inmediatamente al lanzar
        crearNuevaPrenda();
        
        // Animar la prenda que se está lanzando
        animarPrenda(prendaActual);
    }

    // Función para animar la prenda
    function animarPrenda(prenda) {
        const currentTop = parseInt(prenda.style.top);
        const nuevaPosicion = currentTop - velocidad;

        if (nuevaPosicion <= alturaMaxima) {
            prenda.style.top = `${alturaMaxima-60}px`;
            iniciarAnimacionFinal(prenda);
        } else {
            prenda.style.top = `${nuevaPosicion}px`;
            requestAnimationFrame(() => animarPrenda(prenda));
        }
    }

    // Función para la animación final
    function iniciarAnimacionFinal(prenda) {
        prenda.style.animation = 'moverRopa 8.8s linear 1 forwards';
        
        prenda.addEventListener('animationend', function handler() {
            prenda.removeEventListener('animationend', handler);
            prenda.style.animation = 'seguirMoviendoRopa 20s linear infinite';
        });
    }

    // Evento de teclado
    document.addEventListener('keydown', function(e) {
        if (e.code === 'Space' && puedeLanzar) {
            e.preventDefault();
            moverPrenda();
        }
    });
});