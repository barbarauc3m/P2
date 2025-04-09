const categorias = document.querySelectorAll(".categoria");

function handleHover(indexHovered) {
  categorias.forEach((el, idx) => {
    el.classList.remove("mover-izquierda", "mover-derecha");

    if (indexHovered === 0) {
      // Si es la primera, mueve las siguientes a la derecha
      if (idx > indexHovered) {
        el.classList.add("mover-derecha");
      }
    } else if (indexHovered === 1) {
      // Si es la del centro, solo mueve la de la derecha
      if (idx > indexHovered) {
        el.classList.add("mover-derecha");
      }
      // La primera (índice 0) se queda sin moverse
    } else if (indexHovered === 2) {
      // Si es la última, mueve las anteriores a la izquierda
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




// Al principio de /client/script/index.js (o un archivo dedicado)
const socket = io(); // Conecta al servidor

socket.on('connect', () => {
    console.log('Conectado al servidor (Móvil) con ID:', socket.id);
});

// Ejemplo para enviar un evento al pulsar un botón (ajusta el selector)
const botonLanzar = document.querySelector('.lavado-button'); // Ajusta este selector
if (botonLanzar) {
    botonLanzar.addEventListener('click', () => {
        console.log('Móvil: Enviando evento "lanzar"');
        socket.emit('lanzar'); // Envía el evento 'lanzar'
    });
}

// Ejemplo para recibir un evento desde el servidor
socket.on('actualizarPantallaMobile', (data) => {
    console.log('Móvil: Recibido evento desde servidor:', data);
    // Hacer algo en la pantalla del móvil
});

socket.on('disconnect', () => {
    console.log('Desconectado del servidor (Móvil)');
});

const verMasLink = document.getElementById('ver-mas-categorias');

if (verMasLink) {
  verMasLink.addEventListener('click', (event) => {
    event.preventDefault(); // Evita la navegación normal del enlace

    console.log('📱 Click en "ver más". Solicitando cambio de display y navegando...');

    // 1. Pide a la pantalla del servidor que cambie
    socket.emit('requestDisplayChange', { targetPage: '/display/categories' });

    // 2. Navega en el propio móvil
    window.location.href = verMasLink.href; // Usa el href original del enlace
  });
} else {
    console.error("No se encontró el enlace 'ver-mas-categorias'");
}