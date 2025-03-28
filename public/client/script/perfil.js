fetch('/ultimos-lavados')
  .then(res => res.json())
  .then(lavados => {
    const contenedor = document.querySelector(".anteriores .categoria");
    contenedor.innerHTML = "";

    lavados.forEach(lavado => {
      const div = document.createElement("div");
      div.classList.add("categoria");
      div.innerHTML = `
        <img src="../../../images/${lavado.icon}" alt="${lavado.nombre}" />
        <div class="info">
          <p><strong>${lavado.nombre}</strong></p>
          <p>${lavado.temperatura}</p>
          <p>${lavado.duracion}</p>
          <p>${lavado.centrifugado}</p>
        </div>
      `;
      contenedor.appendChild(div);
    });
  });
