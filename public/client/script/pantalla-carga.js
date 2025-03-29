document.addEventListener("DOMContentLoaded", function () {
    setTimeout(() => {
        const pantallaCarga = document.querySelector(".pantalla-carga");
        pantallaCarga.classList.add("hidden");
        setTimeout(() => {
            window.location.href = "juegos.html";
        }, 200); // Espera la animación antes de redirigir
    }, 3000); // Cambia este valor para modificar el tiempo de espera
});
