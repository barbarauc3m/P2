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


// Selecciona todos los botones "EMPEZAR"
const botones = document.querySelectorAll(".lavado-button .button");

botones.forEach((boton) => {
  boton.addEventListener("click", () => {
    // Encuentra el contenedor del lavado
    const card = boton.closest(".lavado-card");
    const section = boton.closest(".lavado");

    const nombre = section.querySelector("h2").textContent.trim();
    const descripcion = card.querySelector("p")?.textContent.trim() || "";
    const items = card.querySelectorAll("ul li");
    const imagen = card.querySelector("img.icon")?.getAttribute("src") || "";

    const lavado = {
      nombre,
      descripcion,
      temperatura: items[0]?.textContent.split(":")[1]?.trim() || "",
      duracion: items[1]?.textContent.split(":")[1]?.trim() || "",
      centrifugado: items[2]?.textContent.split(":")[1]?.trim() || "",
      detergente: items[3]?.textContent.split(":")[1]?.trim() || "",
      fechaInicio: new Date().toLocaleString("es-ES", {
        dateStyle: "short",
        timeStyle: "short"
      }),
      imagen
    };

    // Guardar en localStorage y redirigir
    localStorage.setItem("lavadoSeleccionado", JSON.stringify(lavado));
    window.location.href = "empezar-lavado.html";
  });
});
