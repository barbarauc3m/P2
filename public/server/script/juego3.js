
document.addEventListener("DOMContentLoaded", function() {
    document.querySelector(".start-button").addEventListener("click", function() {
        document.querySelector(".game-title").style.display = "none";
        document.querySelector(".game-start-container").style.display = "none";
        document.querySelector(".game-container").style.display = "block";

        // Asegúrate de usar 'url("ruta")' para la imagen de fondo
        document.body.style.backgroundImage = 'url("../../../images/garden2.jpg")';

        // Opcional: Ajustes adicionales para que la imagen se vea bien
        document.body.style.backgroundSize = "cover"; // Cubre todo el fondo
        document.body.style.backgroundPosition = "center"; // Centra la imagen
        document.body.style.backgroundRepeat = "no-repeat"; // Evita repetición
    });
});