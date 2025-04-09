// public/server/script/display-manager.js
// Este script se puede incluir en todas las páginas del servidor (index, categorias, etc.)
const socketDisplayManager = io(); // Puede necesitar conexión separada o reusar una global

socketDisplayManager.on('connect', () => {
  console.log('🖥️ Display Manager Conectado:', socketDisplayManager.id);
});

socketDisplayManager.on('changeDisplay', (data) => {
  console.log(`🖥️ Recibido 'changeDisplay' para: ${data.targetPage}`);

  // Guarda el userId recibido en sessionStorage
  if (data.userId) {
      sessionStorage.setItem('currentDisplayUserId', data.userId);
      console.log(`🖥️ Guardado userId en sessionStorage: ${data.userId}`);
  } else {
      // Si no viene userId (o es null), quizás limpiar el sessionStorage? Opcional.
      sessionStorage.removeItem('currentDisplayUserId');
      console.log(`🖥️ No se recibió userId, limpiado de sessionStorage.`);
  }

  if (window.location.pathname !== data.targetPage) {
    console.log(`🖥️ Navegando a ${data.targetPage}`);
    window.location.href = data.targetPage; // Cambia la página actual
  } else {
    console.log(`🖥️ Ya estamos en ${data.targetPage}, no se navega.`);
  }
});

socketDisplayManager.on('disconnect', () => {
    console.log('🖥️ Display Manager Desconectado');
});