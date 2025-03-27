const usuarioActual = localStorage.getItem('loggedInUser');
const usuarios = JSON.parse(localStorage.getItem('usuarios')) || {};

if (usuarioActual && usuarios[usuarioActual]) {
  const corazones = document.querySelectorAll('.heart');
  const userData = usuarios[usuarioActual];

  // Aseguramos que tenga el array de favoritos
  if (!userData.favoritos) {
    userData.favoritos = [];
  }

  corazones.forEach(corazon => {
    const lavadoCard = corazon.closest('.lavado');
    const nombreLavado = lavadoCard.querySelector('h2').textContent;

    // Si ya es favorito, pintamos el corazón lleno
    if (userData.favoritos.includes(nombreLavado)) {
      corazon.src = '../../../images/cora_relleno.svg';
      corazon.classList.add('activo');
    }

    // Evento para marcar/desmarcar favorito
    corazon.addEventListener('click', () => {
      const favoritos = userData.favoritos;

      if (corazon.classList.contains('activo')) {
        corazon.classList.remove('activo');
        corazon.src = '../../../images/corazon.svg';
        userData.favoritos = favoritos.filter(nombre => nombre !== nombreLavado);
      } else {
        corazon.classList.add('activo');
        corazon.src = '../../../images/cora_relleno.svg';
        userData.favoritos.push(nombreLavado);
      }

      // Guardar cambios en localStorage
      usuarios[usuarioActual] = userData;
      localStorage.setItem('usuarios', JSON.stringify(usuarios));
    });
  });
}
