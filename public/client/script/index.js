const socket = io(); // conectar
socket.on('connect', () => {});


const categorias = document.querySelectorAll(".categoria");

// FUNCION PARA LAS TRANSICIONES DE CATEGORIAS
function handleHover(indexHovered) {
  categorias.forEach((el, idx) => {
    el.classList.remove("mover-izquierda", "mover-derecha");

    if (indexHovered === 0) {
      // si es la primera, mueve las siguientes a la derecha
      if (idx > indexHovered) {
        el.classList.add("mover-derecha");
      }
    } else if (indexHovered === 1) {
      // si es la del centro, solo mueve la de la derecha
      if (idx > indexHovered) {
        el.classList.add("mover-derecha");
      }
      // La primera (índice 0) se queda sin moverse
    } else if (indexHovered === 2) {
      // si es la última, mueve las anteriores a la izquierda
      if (idx < indexHovered) {
        el.classList.add("mover-izquierda");
      }
    }
  });
}

function handleLeave() {
  categorias.forEach(el => {
    el.classList.remove("mover-izquierda", "mover-derecha");
  });
}

categorias.forEach((categoria, index) => {
  categoria.addEventListener("mouseenter", () => handleHover(index));
  categoria.addEventListener("mouseleave", handleLeave);
});


// Ejemplo para enviar un evento al pulsar un botón (ajusta el selector)
const botonLanzar = document.querySelector('.lavado-button'); // Ajusta este selector
if (botonLanzar) {
    botonLanzar.addEventListener('click', () => {
        console.log('Móvil: Enviando evento "lanzar"');
        socket.emit('lanzar'); // Envía el evento 'lanzar'
    });
}

// links de ver mas en categorias
const verMasLink = document.getElementById('ver-mas-categorias');

if (verMasLink) {
  verMasLink.addEventListener('click', (event) => {
    event.preventDefault(); 

    // obtenemos al usuario actual del localStorage
    const usuarioActual = localStorage.getItem('loggedInUser');
    
    // console.log('Click en "ver más"');

    // emite el cambio de pantalla al servidor
    socket.emit('requestDisplayChange', {
      targetPage: '/display/categories',
      userId: usuarioActual // envía el username del usuario logueado
  });

    window.location.href = verMasLink.href;
  });
} else {
    console.error("No se encontró el enlace 'ver-mas-categorias'");
}

// FUNCION PARA ABRIR LAS VENTANAS DE LOS JUEGOS
function loadJuegos() {

  // console.log("Botón de mando pulsado");
  socket.emit("abrir-juegos"); 
  window.location.href = 'pantalla-carga.html';
}
