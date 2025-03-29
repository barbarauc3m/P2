const categorias = document.querySelectorAll(".categoria");

function handleHover(indexHovered) {
  categorias.forEach((el, idx) => {
    el.classList.remove("mover-izquierda", "mover-derecha");

    if (indexHovered === 0) {
      // Si es la primera, mueve las siguientes a la derecha
      if (idx > indexHovered) {
        el.classList.add("mover-derecha");
      }
    } else if (indexHovered === 1) {
      // Si es la del centro, solo mueve la de la derecha
      if (idx > indexHovered) {
        el.classList.add("mover-derecha");
      }
      // La primera (índice 0) se queda sin moverse
    } else if (indexHovered === 2) {
      // Si es la última, mueve las anteriores a la izquierda
      if (idx < indexHovered) {
        el.classList.add("mover-izquierda");
      }
    }
  });
}

function handleLeave() {
  categorias.forEach(el => {
    el.classList.remove("mover-izquierda", "mover-derecha");
  });
}

categorias.forEach((categoria, index) => {
  categoria.addEventListener("mouseenter", () => handleHover(index));
  categoria.addEventListener("mouseleave", handleLeave);
});

