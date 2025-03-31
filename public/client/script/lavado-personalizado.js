const usuarioActual = localStorage.getItem('loggedInUser');

document.addEventListener("DOMContentLoaded", function () {
    const favButton = document.getElementById("favButton");
    const favKey = "lavadoPersonalizadoFavorito";


    // Actualizar icono según estado
    function actualizarIconoFavorito(esFavorito) {
        if (esFavorito) {
            favButton.src = "../../../images/cora_relleno.svg";
        } else {
            favButton.src = "../../../images/cora_blanco.svg";
        }
    }


    // Manejar clic en botón de favoritos
    favButton.addEventListener("click", function () {
        if (!usuarioActual) {
            alert("Debes iniciar sesión para guardar favoritos.");
            return;
        }

        if (usuarioActual) {
            const esFavorito = localStorage.getItem(favKey) === "true";
            localStorage.setItem(favKey, !esFavorito);
            actualizarIconoFavorito(!esFavorito);
        }
    
    });




    document.querySelector(".button-save").addEventListener("click", () => {
        const usuario = localStorage.getItem("loggedInUser");
        if (!usuario) return alert("Debes iniciar sesión para guardar el lavado.");
      
        // Validaciones
        const obtenerSeleccionado = (clase) => {
            const checks = [...document.querySelectorAll(`.${clase} .dropdown-menu input[type='checkbox']:checked`)];
            return checks.map(c => c.parentElement.textContent.trim());
          };
          
          const nivelSuciedad = obtenerSeleccionado("suciedad");
          const centrifugado = obtenerSeleccionado("centrifugado");
          const tejido = obtenerSeleccionado("tejido");
          
          const temperatura = document.getElementById("temperatura").value;
          const duracion = document.getElementById("duracion").value;
          const detergente = document.getElementById("detergente").value;
          
        const esFavorito = document.getElementById("favButton").classList.contains("activo");
      
        if (!nivelSuciedad.length || !centrifugado.length || !tejido.length) {
            alert("Por favor selecciona al menos una opción en cada campo.");
            return;
          }
          
          const lavadoPersonalizado = {
            usuario, 
            nivelSuciedad: nivelSuciedad[0],
            temperatura: `${temperatura}°C`,
            centrifugado: centrifugado[0],
            duracion: `${duracion} min`,
            detergente: `${detergente} ml`,
            tejido,
            favorito: esFavorito
          };
      
        // Enviar al backend
        fetch('/guardar-lavado-personalizado', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lavadoPersonalizado)
          })
          .then(res => res.text())
          .then(msg => {
            alert(msg);
            window.location.href = "/index.html";
          })
          .catch(err => {
            console.error(err);
            alert("Error al guardar el lavado personalizado.");
          });
      });
      
});
