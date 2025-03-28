document.addEventListener("DOMContentLoaded", () => {
const usuarioActual = localStorage.getItem('loggedInUser');

if (!usuarioActual) {
  // Si no hay usuario, bloquear clics en corazones
  corazones.forEach(corazon => {
    corazon.addEventListener('click', () => {
      alert("Debes registrarte o iniciar sesión para guardar lavados como favoritos");
    });
  });
  return; // salir del script
}

if (usuarioActual) {
  const corazones = document.querySelectorAll('.heart');

  fetch('/favoritos')
    .then(res => res.json())
    .then(favoritosData => {
      let favoritos = favoritosData[usuarioActual] || [];

      corazones.forEach(corazon => {
        const lavadoCard = corazon.closest('.lavado');
        const nombreLavado = lavadoCard.querySelector('h2').textContent;

        // Pintar corazón si es favorito
        if (favoritos.some(lav => lav.nombre === nombreLavado)) {
          corazon.src = '../../../images/cora_relleno.svg';
          corazon.classList.add('activo');
        }

        corazon.addEventListener('click', () => {
          if (corazon.classList.contains('activo')) {
            corazon.classList.remove('activo');
            corazon.src = '../../../images/corazon.svg';
            favoritos = favoritos.filter(lav => lav.nombre !== nombreLavado);
          } else {
            corazon.classList.add('activo');
            corazon.src = '../../../images/cora_relleno.svg';
            const descripcion = lavadoCard.querySelector("p")?.textContent.trim() || "";
            const items = lavadoCard.querySelectorAll("ul li");
            const imagen = lavadoCard.querySelector("img.icon")?.getAttribute("src") || "";

            const infoLavado = {
              nombre: nombreLavado,
              descripcion,
              temperatura: items[0]?.textContent.split(":")[1]?.trim() || "",
              duracion: items[1]?.textContent.split(":")[1]?.trim() || "",
              centrifugado: items[2]?.textContent.split(":")[1]?.trim() || "",
              detergente: items[3]?.textContent.split(":")[1]?.trim() || "",
              imagen
            };

            favoritos.push(infoLavado);
          }

          // Guardar en el servidor
          fetch('/guardar-favoritos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario: usuarioActual, favoritos })
          })
          .then(res => res.text())
          .then(msg => console.log(msg))
          .catch(err => console.error(err));
        });
      });
    })
    .catch(err => console.error('Error cargando favoritos:', err));
}

// Selecciona todos los botones "EMPEZAR"
const botones = document.querySelectorAll(".lavado-button .button");

botones.forEach((boton) => {
  boton.addEventListener("click", () => {
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

    localStorage.setItem("lavadoSeleccionado", JSON.stringify(lavado));
    window.location.href = "empezar-lavado.html";
  });
});
});