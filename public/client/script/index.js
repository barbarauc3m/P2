  const ecoCategoria = document.querySelector(".categoria.eco");
  const anteriores = document.querySelectorAll(".categoria-list .categoria:not(.eco)");

  ecoCategoria.addEventListener("mouseenter", () => {
    anteriores.forEach(el => el.classList.add("mover-izquierda"));
  });

  ecoCategoria.addEventListener("mouseleave", () => {
    anteriores.forEach(el => el.classList.remove("mover-izquierda"));
  });

