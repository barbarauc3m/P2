document.addEventListener("DOMContentLoaded", () => {
  const usuario = localStorage.getItem("loggedInUser");
  if (!usuario) return;

  // Mostrar nombre del usuario
  document.querySelector(".username").textContent = usuario;

  // =========================
  // LAVADOS COMPLETADOS
  // =========================
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

      // Actualizar contador de lavados completados
      document.querySelector(".completados").textContent = lavados.length;

      // Hover animaciones
      const categorias = document.querySelectorAll(".categoria");

      categorias.forEach((categoria, index) => {
        categoria.addEventListener("mouseenter", () => handleHover(index));
        categoria.addEventListener("mouseleave", handleLeave);
      });

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
    });

  // =========================
  // LAVADOS FAVORITOS
  // =========================
  fetch(`/api/users/${usuario}/favoritos`)
  .then(res => res.json())
    .then(favoritos => {
      document.querySelector(".favoritos").textContent = favoritos.length;

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
            <img src="${ultimo.imagen}" alt="${ultimo.nombre}" class="ult-lavado-icono"/>
            <div class="lavado-text">
              <h3>${ultimo.nombre}</h3><br>
              <p>${ultimo.descripcion}</p>
              <div class="lavado-button">
                <button class="button-lav">Empezar</button>
              </div>
            </div>
          </div>
        </div>
      `;
      favBox.appendChild(favDiv);
    });
});
