(() => {
    const socket = io();
  

    
    socket.on('connect', () => socket.emit('registerDisplay'));
  
    // placeholder inicial
    document.querySelectorAll('.option .option-box')
            .forEach(box => box.textContent = 'Especifica un valor en el móvil');
  
    // cuando llegue un cambio, lo pintamos
    socket.on('updatePersonalizadoOption', ({category, value}) => {
      const box = document.querySelector(`.option.${category} .option-box`);
      box.textContent = value;
    });
  
    // cuando llegue el guardado, abrimos el popup
    socket.on('personalizadoSaved', () => {
        const popup = document.createElement('div');
        popup.className = 'popup-container';
        popup.innerHTML = `
          <div class="container">
            <span class="close-btn">&times;</span>
            <h2>¡Lavado personalizado guardado!</h2>
            <p class="textito">Puedes verlo en tu perfil.</p>
          </div>`;
        document.body.appendChild(popup);
      
        setTimeout(() => {
            socket.emit('requestDisplayChange', { targetPage: '/' });
          }, 500);
      });
      
  })();
  