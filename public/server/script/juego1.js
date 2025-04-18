let timer; // Variable para el temporizador
let tiempoRestante = 60; // Guardará el tiempo cuando se pause
let juegoPausado = false; // Nueva bandera para estado de pausa


document.addEventListener("DOMContentLoaded", function() {
    console.log("Dentro de DOMContentLoaded");

    let canvas, ctx;
    let carritoImg;
    let carritoX;
    let carritoY;
    let carritoAncho = 80;
    let carritoAlto = 50;
    let canvasAncho = 600;
    let canvasAlto = 400;
    let juegoTerminado = false;  

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
        maxFrames: 10,
        animationSpeed: 5
    };
    explosion.img.src = '/images/explosion.png';


    function iniciarJuego1() {
        console.log("Dentro de IniciarJuego1");
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

        canvas = document.getElementById('game-canvas');
        canvas.width = 600;
        canvas.height = 400;

        // Mostrar carrito
        const carrito = document.getElementById('carrito-img');
        carrito.style.display = 'block';
        carrito.style.left = '50%';

        // Resetear tiempo al iniciar nueva partida
        tiempoRestante = 60;
        timer = iniciarTemporizador(tiempoRestante);
    }

    function gameFinished() {
        juegoTerminado = true;
        document.getElementById("game-container").style.display = "none";
        document.querySelector(".game-finished-container").style.display = "block";
    }
    function iniciarTemporizador(tiempoInicial = 60) {
        let tiempo = tiempoInicial;
        return setInterval(() => {
            if (!juegoTerminado) {
                tiempo--;
                tiempoRestante = tiempo; // Guardamos el tiempo actual
                document.getElementById('timer-display').textContent = `Tiempo: ${tiempo}`;
                if (tiempo <= 0) {
                    console.log("Se ha agotado el tiempo");
                    clearInterval(timer);
                    clearInterval(caidaInterval);
                    clearInterval(gameInterval);
                    objetos.forEach(o => o.remove());
                    objetos = [];
                    gameFinished();
                }
            }
        }, 1000);
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
            
                if (tipo === 'bomba') {
                    const objRect = obj.getBoundingClientRect();
                    const containerRect = document.getElementById('game-container').getBoundingClientRect();
                
                    const explosionX = objRect.left - containerRect.left + objRect.width / 2;
                    const explosionY = objRect.top - containerRect.top + objRect.height / 2;
                
                    mostrarExplosion(explosionX, explosionY);
                    sonidoBomba.currentTime = 0;
                    sonidoBomba.play();
                }
                
                obj.remove();
                objetos.splice(i, 1);
            }
            
            else if (top > window.innerHeight) {
                obj.remove();
                objetos.splice(i, 1);
            }
        });

        document.getElementById('score-display').textContent = `Puntos: ${score}`;
    }

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
        }, 400);
    }

    function pausarJuego() {
        console.log("En la función pausarJuego()");
        
        // 1. Detener los intervalos de juego
        clearInterval(gameInterval);
        clearInterval(caidaInterval);
        clearInterval(timer);
        
        // 2. Ocultar el juego y mostrar menú de pausa
        document.getElementById("game-container").style.display = "none";
        document.querySelector(".menu-pausa-container").style.display = "block";
        
        // 3. Actualizar estados
        juegoTerminado = true;
        juegoPausado = true;
        
        console.log("Juego pausado: intervalos detenidos");

    }

    function reanudarJuego() {
        console.log("Reanudando juego...");
        
        // 1. Restaurar estados
        juegoTerminado = false;
        juegoPausado = false;
        
        // 2. Mostrar el juego y ocultar menú de pausa
        document.getElementById("game-container").style.display = "block";
        document.querySelector(".menu-pausa-container").style.display = "none";
        
        // 3. Reiniciar los intervalos del juego
        caidaInterval = setInterval(crearObjeto, 1500);
        gameInterval = setInterval(moverObjetos, 50);
        timer = iniciarTemporizador(tiempoRestante); // Continuar con el tiempo restante
        
        console.log("Juego reanudado");
    }

    try {
        window.socket = io();
        const socket = window.socket;
        console.log("Socket conectado en cliente del juego")
    
      socket.on('connect', () => {
        console.log('✅ Ordenador conectado al servidor con socket ID:', socket.id);
      });

      socket.on('actualizarPosicionCarrito', (inclinacion) => {
        moverCarritoPorInclinacion(inclinacion);
      }
      );
    
      socket.on('juego1-empezar', () => {
        console.log("🟢 Señal de empezar recibida desde el móvil");
        iniciarJuego1();
      }); 

      socket.on('juego1-pausar', () => {
        console.log("Pausa recibida desde móvil");
        pausarJuego();
      });

      socket.on('juego1-reiniciar', () => {
        console.log("Reinicio recibido desde móvil");
        reiniciarJuego();
      });

      socket.on('closeGameDisplay', (data) => {
        console.log('El servidor vuelve a menu de juegos', data);
        window.location.href = 'juegos-server.html';
      });

    } catch (error) {
      console.warn("No se pudo conectar a Socket.IO:", error);
    }

    function moverCarritoPorInclinacion(inclinacion) {
        if (juegoTerminado) return; // No mover si el juego está pausado/terminado

        const carrito = document.getElementById('carrito-img');
        const contenedorAncho = window.innerWidth;
        const carritoAncho = carrito.offsetWidth;
        
        // Convertir la inclinación (-90 a 90) a posición en pantalla
        let posicionX = ((inclinacion + 90) / 180) * contenedorAncho;
        
        // Asegurar que el carrito no salga de los límites
        posicionX = Math.max(carritoAncho / 2, Math.min(posicionX, contenedorAncho - carritoAncho / 2));
        
        carrito.style.left = `${posicionX}px`;
        
        // Girar el carrito según la dirección
        if (inclinacion < 0) {
            carrito.style.transform = 'translateX(-50%) scaleX(-1)';
        } else {
            carrito.style.transform = 'translateX(-50%) scaleX(1)';
        }
    }

    

    function reiniciarJuego() {
        console.log("Reiniciando juego...");
        
        // 1. Limpiar todos los intervalos y temporizadores activos
        clearInterval(gameInterval);
        clearInterval(caidaInterval);
        clearInterval(timer);
        
        // 2. Eliminar todos los objetos del juego
        objetos.forEach(o => o.remove());
        objetos = [];
        
        // 3. Restablecer variables del juego
        juegoTerminado = false;
        score = 0;
        
        // 4. Ocultar todos los menús y mostrar el juego
        document.querySelector(".game-finished-container").style.display = "none";
        document.querySelector(".menu-pausa-container").style.display = "none";
        document.getElementById("game-container").style.display = "block";
        
        // 5. Restablecer la pantalla de juego
        document.getElementById('score-display').textContent = 'Puntos: 0';
        document.getElementById('timer-display').textContent = 'Tiempo: 60';
        document.getElementById('game-over').style.display = 'none';
        
        // 6. Reposicionar el carrito
        const carrito = document.getElementById('carrito-img');
        carrito.style.display = 'block';
        carrito.style.left = '50%';
        carrito.style.transform = 'translateX(-50%)'; // Resetear transformación
        
        // 7. Reiniciar los sistemas del juego
        caidaInterval = setInterval(crearObjeto, 1500);
        gameInterval = setInterval(moverObjetos, 50);
        timer = iniciarTemporizador(); // Asignar el nuevo temporizador a la variable timer
        
        console.log("Juego reiniciado correctamente");
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
            socket.emit("juego1-reanudar");
        });
    });
    document.querySelectorAll(".backtoMenu-button").forEach(button => { // volver al menú de inicio y cambiar la pantalla del móvil tmb
        button.addEventListener("click", backtoMenu);
    });

});
