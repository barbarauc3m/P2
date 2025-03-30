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

    cargarEstadoFavorito();
});
