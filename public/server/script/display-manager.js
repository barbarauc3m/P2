const socketDisplayManager = io(); // conexion socket

socketDisplayManager.on('connect', () => {});

socketDisplayManager.on('changeDisplay', (data) => {
  // console.log(`changeDisplay para: ${data.targetPage}`);

  // guardamos el userId si existe
  if (data.userId) {
    sessionStorage.setItem('currentDisplayUserId', data.userId);
  }

  // cerramos juego si se solicita volver al inicio
  if (data.targetPage === '/') {
    const gameContainer = document.getElementById('game-display-container');
    if (gameContainer) {
      gameContainer.style.display = 'none';
      gameContainer.innerHTML = '';
    }
  }

  // redirigimos
  if (window.location.pathname !== data.targetPage) {
    window.location.href = data.targetPage;
  }
});

// JUEGOS
// cargar juego
socketDisplayManager.on('loadGameOnDisplay', (data) => {
  // console.log(`Cargando juego: ${data.gameName}`);
  
  const gameContainer = document.getElementById('game-container') || createGameContainer();
  
  gameContainer.innerHTML = `
    <iframe src="${data.gameFile}" 
            style="width:100%;height:100%;border:none;">
    </iframe>
  `;
  
  gameContainer.style.display = 'block';
});

// cerrar juego
socketDisplayManager.on('closeGameDisplay', () => {
  const gameContainer = document.getElementById('game-container');
  if (gameContainer) {
      gameContainer.style.display = 'none';
      gameContainer.innerHTML = '';
      // console.log('juego cerrado');
  }
});

// mover cliente al menú
socketDisplayManager.on('moverCienteAlMenu', () => {  
  // console.log('cliente vuelve al menú');
  //window.location.href = './juegos.html';
  socket.broadcast.emit('moverCienteAlMenu'); 
}); 

// redirigir a juegos
socketDisplayManager.on("redirigir-a-juegos", () => {  
  // console.log("redirigiendo a juegos");
  window.location.href = "/pantalla-carga-server.html"; 
});

// FUNCION PARA CREAR EL CONTENEDOR DEL JUEGO
function createGameContainer() {
  const container = document.createElement('div');
  container.id = 'game-display-container';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.zIndex = '1000';
  container.style.backgroundColor = '#f0f0f0';
  document.body.appendChild(container);
  return container;
}

// NOTIFICACIONES
socketDisplayManager.on('serverNotification', (data) => {
  // console.log(` Notificación recibida:`, data);
  displayNotification(data.message, data.type); // función para mostrarla
});

// FUNCION PARA MOSTRAR LA NOTIFICACION
function displayNotification(message, type = 'info') {
  const container = document.getElementById('server-notification-container') || document.body;

  const notificationDiv = document.createElement('div');
  notificationDiv.className = `server-notification ${type}`;
  notificationDiv.textContent = message;

  container.appendChild(notificationDiv);

  // transicion fade-in
  setTimeout(() => { notificationDiv.style.opacity = '1'; }, 10); 

  // transicion fade-out y eliminar después de unos segundos
  setTimeout(() => {
      notificationDiv.style.opacity = '0';
      setTimeout(() => {
          if (notificationDiv.parentNode) {
               notificationDiv.parentNode.removeChild(notificationDiv);
          }
      }, 500); 
  }, 4000); 
}

// para animar los juegos si inclinas el móvil a un lado o a otro
socketDisplayManager.on("expandir-juego1", () => {  
  console.log("Expandir juego1 recibido");
  const card1 = document.getElementById('card1');
  const card2 = document.getElementById('card2');
  
  card1.style.transition = 'transform 0.3s ease-in-out';
  card2.style.transition = 'transform 0.3s ease-in-out';
  
  card2.style.transform = 'scale(0.95)';
  card1.style.transform = 'scale(1.05)';
});

socketDisplayManager.on("expandir-juego2", () => {  
  console.log("Expandir juego2 recibido");
  const card1 = document.getElementById('card1');
  const card2 = document.getElementById('card2');
  
  card1.style.transition = 'transform 0.3s ease-in-out';
  card2.style.transition = 'transform 0.3s ease-in-out';
  
  card1.style.transform = 'scale(0.95)';
  card2.style.transform = 'scale(1.05)';
});
