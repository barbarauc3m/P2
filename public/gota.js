function actualizarBarra(porcentaje) {
    const rendijas = document.querySelectorAll('.rendija');
    const gotaTexto = document.getElementById('porcentaje');
    gotaTexto.textContent = `${porcentaje}%`;
  
    rendijas.forEach((el, i) => {
      el.classList.toggle('activa', (i + 1) * 10 <= porcentaje);
    });
  }
  
  // Ejemplo de uso:
  actualizarBarra(70); // activa 7 rendijas y pone 70% en la gota
  