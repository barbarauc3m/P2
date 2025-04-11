// public/server/script/display-manager.js
const socketDisplayManager = io();

socketDisplayManager.on('connect', () => {
  console.log('🖥️ Display Manager Conectado:', socketDisplayManager.id);
});

socketDisplayManager.on('changeDisplay', (data) => {
  console.log(`🖥️ Recibido 'changeDisplay' para: ${data.targetPage}`);

  // Guarda el userId si existe
  if (data.userId) {
    sessionStorage.setItem('currentDisplayUserId', data.userId);
  }

  // Cerrar juego si se solicita volver al inicio
  if (data.targetPage === '/') {
    const gameContainer = document.getElementById('game-display-container');
    if (gameContainer) {
      gameContainer.style.display = 'none';
      gameContainer.innerHTML = '';
    }
  }

  // Redirigir si es necesario
  if (window.location.pathname !== data.targetPage) {
    window.location.href = data.targetPage;
  }
});

// Manejo específico para juegos
socketDisplayManager.on('loadGameOnDisplay', (data) => {
  console.log(`🖥️ Cargando juego: ${data.gameName}`);
  
  const gameContainer = document.getElementById('game-display-container') || createGameContainer();
  
  gameContainer.innerHTML = `
    <iframe src="${data.gameFile}" 
            style="width:100%;height:100%;border:none;">
    </iframe>
  `;
  
  gameContainer.style.display = 'block';
});

socketDisplayManager.on('closeGameDisplay', () => {
  const gameContainer = document.getElementById('game-container');
  if (gameContainer) {
      gameContainer.style.display = 'none';
      gameContainer.innerHTML = '';
      console.log('🖥️ Juego cerrado por solicitud del móvil');
  }
});

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