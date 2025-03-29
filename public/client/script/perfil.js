document.addEventListener("DOMContentLoaded", () => {
  const usuario = localStorage.getItem("loggedInUser");
  if (!usuario) return;

  // Actualizar nombre en el header
  document.querySelector(".username").textContent = usuario;

  // ===============================
  // MOSTRAR LOS ÚLTIMOS 3 LAVADOS
  // ===============================
  fetch(`/lavados/${usuario}`)
  .then(res => res.json())
  .then(lavados => {
    const ultimosTres = lavados.slice(0, 3);
    const contenedor = document.querySelector(".categoria-list");
    contenedor.innerHTML = "";

    ultimosTres.forEach((lavado, index) => {
      const div = document.createElement("div");
      div.classList.add("categoria");
      if (index === 2) div.classList.add("eco");
      div.innerHTML = `
        <img src="${lavado.imagen}" alt="${lavado.nombre}" />
        <div class="info">
          <p><strong>${lavado.nombre || 'No definido'}</strong></p>
          <p>Temperatura: ${lavado.temperatura || 'No definido'}</p>
          <p>Duración: ${lavado.duracion || 'No definido'}</p>
          <p>Centrifugado: ${lavado.centrifugado || 'No definido'}</p>
        </div>
      `;
      contenedor.appendChild(div);
    });

    // 🔥 Mover aquí las funciones y el eventListener
    const categorias = document.querySelectorAll(".categoria");

    function handleHover(indexHovered) {
      categorias.forEach((el, idx) => {
        el.classList.remove("mover-izquierda", "mover-derecha");

        if (indexHovered === 0) {
          if (idx > indexHovered) el.classList.add("mover-derecha");
        } else if (indexHovered === 1) {
          if (idx > indexHovered) el.classList.add("mover-derecha");
        } else if (indexHovered === 2) {
          if (idx < indexHovered) el.classList.add("mover-izquierda");
        }
      });
    }

    function handleLeave() {
      categorias.forEach(el =>
        el.classList.remove("mover-izquierda", "mover-derecha")
      );
    }

    categorias.forEach((categoria, index) => {
      categoria.addEventListener("mouseenter", () => handleHover(index));
      categoria.addEventListener("mouseleave", handleLeave);
    });

    document.querySelector(".stats-info span").textContent = lavados.length;
  });



  // ===============================
  // MOSTRAR ÚLTIMO FAVORITO
  // ===============================
  fetch("/favoritos")
    .then(res => res.json())
    .then(data => {
      const favoritos = data[usuario] || [];
      if (favoritos.length === 0) return;

      const ultimo = favoritos.at(-1);
      if (!ultimo) return;

      document.querySelector(".lavado-box-none").classList.add("none");

      const favBox = document.querySelector(".lavado-box");
      const favDiv = document.createElement("div");
      favDiv.classList.add("lavado-sombra");
      favDiv.innerHTML = `
        <div class="sombra sombra-50"></div>
        <div class="sombra sombra-20"></div>
        <div class="lavado">
          <div class="lavado-header">
            <p class="lavado-text">
              <strong>${ultimo.nombre}</strong><br>
              ${ultimo.descripcion || "Sin descripción"}
            </p>
            <div class="lavado-button">
              <button class="button-lav">Empezar</button>
            </div>
          </div>
        </div>
      `;
      favBox.appendChild(favDiv);

      // Actualiza número de favoritos
      document.querySelector(".stats-info span:last-of-type").textContent = favoritos.length;
    });
});

