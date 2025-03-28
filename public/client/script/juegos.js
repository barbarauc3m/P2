// juegos.js
function loadGame(gameTitle, gameDescription) {
    // Guardar la información del juego seleccionado en el almacenamiento local
    localStorage.setItem('gameTitle', gameTitle);
    localStorage.setItem('gameDescription', gameDescription);
    
    // Redirigir a la pantalla de juego
    window.location.href = 'jugando.html';
}

document.addEventListener("DOMContentLoaded", function () {
    const titleElement = document.getElementById("game-title");
    const descriptionElement = document.getElementById("game-description");
    
    if (titleElement && descriptionElement) {
        // Cargar la información del juego desde el almacenamiento local
        titleElement.textContent = localStorage.getItem("gameTitle") || "Juego";
        descriptionElement.textContent = localStorage.getItem("gameDescription") || "Descripción del juego.";
    }

    // Botón para salir
    document.getElementById("exit-button").addEventListener("click", function () {
        window.location.href = "juegos.html";
    });

    // Botón para pausar (simulación de pausa)
    document.getElementById("pause-button").addEventListener("click", function () {
        alert("Juego pausado");
    });

    // Botón para reiniciar (simulación de reinicio)
    document.getElementById("restart-button").addEventListener("click", function () {
        alert("Juego reiniciado");
    });
});
