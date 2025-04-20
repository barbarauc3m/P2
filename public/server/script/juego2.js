document.addEventListener("DOMContentLoaded", function() {
    console.log("Dentro de DOMContentLoaded");

    function iniciarJuego2() {
        console.log("Dentro de IniciarJuego2");
        document.querySelector(".game-title").style.display = "none";
        document.querySelector(".game-start-container").style.display = "none";
        document.querySelector(".game-container").style.display = "block";
        
        document.body.style.backgroundImage = 'url("../../../images/garden.jpg")';
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundPosition = "center";
        document.body.style.backgroundRepeat = "no-repeat";
    }

    function pausarJuego(){
        //juegoPerdido = true;
        puedeLanzar = false;
        //document.querySelector(".game-container").style.display = "none";
        document.querySelector(".menu-pausa-container").style.display = "block";
    }

    try {
        window.socket = io();
        const socket = window.socket;
    
      socket.on('connect', () => {
        console.log('✅ Ordenador conectado al servidor con socket ID:', socket.id);
      });

      socket.on('juego-empezar', () => {
        iniciarJuego2();
      });   
      
      socket.on('juego-pausar', () => {
        console.log("Pausa recibida desde móvil");
        pausarJuego();
      });

      socket.on('juego-reanudado', () => {
        reanudarJuego();
      });

      socket.on('juego-backtoMenu', () => {
        console.log("Se vuelve al menú");
        backtoMenu();
      });

      socket.on('juego-reiniciar', () => {
        console.log("Reinicio recibido desde móvil");
        reiniciarJuego();
      });
    
      socket.on('lanzar', () => {
        console.log("🚀 Lanzamiento recibido desde móvil");
        moverPrenda(); 
      });
    
      socket.on('closeGameDisplay', (data) => {
        console.log('El servidor vuelve a index', data);
        window.location.href = 'index.html';
      });      

    } catch (error) {
      console.warn("No se pudo conectar a Socket.IO:", error);
    }

    // Variables para evitar que gameOver y gameWon solapen 
    let juegoPerdido = false;  
    let juegoGanado = false;

    const viewportWidth = window.innerWidth;
    const maxPrendas = Math.floor(viewportWidth / 120);
    // const maxPrendas = 1;  // para pruebassssssss
    document.getElementById('contadorPrendas').textContent = maxPrendas;
    
    const gameContainer = document.querySelector('.game-container');
    const alturaMaxima = 285;
    const velocidad = 8;
    let prendas = [];
    let prendaActual = null;
    let puedeLanzar = true;
    const tiposPrenda = ['camiseta', 'pantalones', 'calcetines'];
    indicePrenda = Math.floor(Math.random() * tiposPrenda.length);

    // Crear la primera prenda
    function crearPrendaInicial() {
        const prenda = document.querySelector('.ropa-container');
        actualizarImagenPrenda(prenda);
        prenda.style.top = '900px';
        prenda.style.left = '50%';
        prenda.style.transform = 'translate(-50%, -50%)';
        prenda.style.animation = 'none';
        prendas.push(prenda);
        prendaActual = prenda;
    }

    function actualizarImagenPrenda(prendaContainer) {
        const img = prendaContainer.querySelector('img');
        const tipo = tiposPrenda[indicePrenda];
        img.src = `../../images/${tipo}.png`;
        img.alt = tipo;
        img.className = tipo; // Actualizamos la clase CSS
        
        // Ajustar el ancho del contenedor según el tipo de prenda
        if (tipo === 'pantalones') {
            prendaContainer.style.width = '80px';
        } else {
            prendaContainer.style.width = '100px';
        }
        
        // Rotamos al siguiente tipo de prenda 
        indicePrenda = Math.floor(Math.random() * tiposPrenda.length);
    }

    // Función para crear una nueva prenda
    function crearNuevaPrenda() {
        const nuevaPrenda = prendaActual.cloneNode(true);
        actualizarImagenPrenda(nuevaPrenda);
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
        
        // Animar la prenda actual primero
        animarPrenda(prendaActual);
        
        // Luego crear nueva prenda (esto se moverá en el callback de animación)
        setTimeout(() => {
            crearNuevaPrenda();
        }, 100); // Pequeño retraso para asegurar que la animación comience
    }

    function detectarColision(prenda) {
        const rect1 = prenda.getBoundingClientRect();
    
        for (let i = 0; i < prendas.length - 1; i++) {
            const otraPrenda = prendas[i];
            if (otraPrenda === prenda) continue;
    
            const rect2 = otraPrenda.getBoundingClientRect();
    
            const colisiona = !(
                rect1.right < rect2.left ||
                rect1.left > rect2.right ||
                rect1.bottom < rect2.top ||
                rect1.top > rect2.bottom
            );
    
            if (colisiona && juegoGanado == false) {
                gameOver();
                return;
            }
        }
    }
    

    function gameOver() {
        juegoPerdido = true;
        document.querySelector(".game-container").style.display = "none";
        document.querySelector(".game-over-container").style.display = "block";
        console.log("Se hace socket.broadcast.emit del voiceControl-start.");
        socket.emit("voiceControl-start");  // activar voiceControl.start(). enviamos esto a server y server manda otro mensaje a cliente
    }

    function gameWon() { 
        juegoGanado = true;   
        document.querySelector(".game-container").style.display = "none";
        document.querySelector(".game-won-container").style.display = "block";
        socket.emit("voiceControl-start");
    }
    

    // Función para animar la prenda
    function animarPrenda(prenda) {
        const currentTop = parseInt(prenda.style.top);
        const nuevaPosicion = currentTop - velocidad;
    
        if (nuevaPosicion <= alturaMaxima) {
            prenda.style.top = `${alturaMaxima - 60}px`;
            iniciarAnimacionFinal(prenda);
        } else {
            prenda.style.top = `${nuevaPosicion}px`;
            detectarColision(prenda); // Detectar colisión mientras sube
            requestAnimationFrame(() => animarPrenda(prenda));
        }
    }
    

    // Función para la animación final
    function iniciarAnimacionFinal(prenda) {
        const contadorElement = document.getElementById("contadorPrendas");
        let contadorActual = parseInt(contadorElement.textContent);
        contadorElement.textContent = contadorActual - 1;
    
        if (contadorElement.textContent <= 0 && juegoPerdido == false) { // El jugador gana
            gameWon();
            return;
        }
        prenda.style.animation = 'moverRopa 8.2s linear 1 forwards';
        
        prenda.addEventListener('animationend', function handler() {
            prenda.removeEventListener('animationend', handler);
            prenda.style.animation = 'seguirMoviendoRopa 20s linear infinite';
        });
    }

    crearPrendaInicial();

    // Función para reiniciar el juego
    function reiniciarJuego() {
        // 1. Restablece el estado del juego
        prendas = [];
        puedeLanzar = true;
        juegoPerdido = false;
        juegoGanado = false;

        const viewportWidth = window.innerWidth;
        const maxPrendas = Math.floor(viewportWidth / 120);
        document.getElementById('contadorPrendas').textContent = maxPrendas;
        
        // 2. Oculta el contenedor de Game Over
        document.querySelector(".game-over-container").style.display = "none";
        document.querySelector(".game-won-container").style.display = "none";
        
        // 3. Muestra el contenedor del juego
        document.querySelector(".game-container").style.display = "block";
        
        // 4. Elimina todas las prendas del DOM excepto la primera
        const todasLasPrendas = document.querySelectorAll('.ropa-container');
        todasLasPrendas.forEach((prenda, index) => {
            if (index > 0) {
                prenda.remove();
            }
        });
    
        // 5. Reinicia la posición de la primera prenda
        const prendaInicial = document.querySelector('.ropa-container');
        prendaInicial.style.top = '900px';
        prendaInicial.style.left = '50%';
        prendaInicial.style.transform = 'translate(-50%, -50%)';
        prendaInicial.style.animation = 'none';
        
        // 6. Actualiza la imagen de la prenda inicial
        actualizarImagenPrenda(prendaInicial);
        
        // 7. Restablece el array de prendas y la prenda actual
        prendas = [prendaInicial];
        prendaActual = prendaInicial;
    }

    function reanudarJuego(){
        puedeLanzar = true;
        document.querySelector(".game-container").style.display = "block";
        document.querySelector(".menu-pausa-container").style.display = "none";
    }

    function backtoMenu(){
        console.log("se envía el emit");
        juegoPerdido = true;
        socket.emit("moverCienteAlMenu");
        window.location.href = './juegos-server.html';
    }

    // Asigna el evento al botón "VOLVER A JUGAR"
    document.querySelectorAll(".restart-button").forEach(button => {
        button.addEventListener("click", reiniciarJuego);
    });
    document.querySelectorAll(".resume-button").forEach(button => {
        button.addEventListener("click", function() {
            console.log("Se ha pulsado reanudar");
            reanudarJuego();
            // Emitir evento de reanudación al servidor
            socket.emit("juego-reanudar");
        });
    });
    document.querySelectorAll(".backtoMenu-button").forEach(button => { // volver al menú de inicio y cambiar la pantalla del móvil tmb
        button.addEventListener("click", backtoMenu);
    });
});