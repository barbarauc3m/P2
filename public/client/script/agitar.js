/*no hay que usar una api?*/ 
let logCounter = 0;

// Umbral de agitación
const SHAKE_THRESHOLD = 2000; // Más alto = menos sensible
let lastUpdate = 0;
let x1 = 0, y1 = 0, z1 = 0;
let x2 = 0, y2 = 0, z2 = 0;

console.log("Script de detección de agitación iniciado. Umbral:", SHAKE_THRESHOLD);

// Función que se ejecuta al detectar movimiento
function handleShake() {
    console.log("¡Agitación detectada! Redirigiendo...");
    const overlay = document.getElementById("transition-overlay");
    overlay.style.transform = "scale(100)";

    setTimeout(() => {
        window.location.href = "../empezar-lavado.html";
    }, 200);  // tiene que coincidir con el css 0.8s 
};

// Captura el evento de movimiento
window.addEventListener('devicemotion', (e) => {
    console.log("Evento devicemotion disparado");
    
    const { accelerationIncludingGravity } = e;
    if (!accelerationIncludingGravity) {
        console.warn("No se detectaron datos de aceleración (acceso no permitido o dispositivo no compatible)");
        return;
    }

    const currentTime = Date.now();
    console.log(`Datos del acelerómetro: x=${accelerationIncludingGravity.x}, y=${accelerationIncludingGravity.y}, z=${accelerationIncludingGravity.z}`);

    if ((currentTime - lastUpdate) > 100) { // Controla la frecuencia de detección
        const diffTime = currentTime - lastUpdate;
        lastUpdate = currentTime;

        x2 = accelerationIncludingGravity.x;
        y2 = accelerationIncludingGravity.y;
        z2 = accelerationIncludingGravity.z;

        const speed = Math.abs(x1 + y1 + z1 - x2 - y2 - z2) / diffTime * 10000;
        console.log(`Velocidad calculada: ${speed.toFixed(2)} (Umbral: ${SHAKE_THRESHOLD})`);

        if (speed > SHAKE_THRESHOLD) {
            console.log("¡Umbral superado! Llamando a handleShake()");
            handleShake(); // ¡Agitación detectada!
        }

        x1 = x2;
        y1 = y2;
        z1 = z2;
    } else {
        logCounter++;
        if (logCounter % 100 === 0) { // Mostrar cada 100 eventos
            console.log("Esperando... (frecuencia alta)");
        }
    }
});

console.log("Escuchando eventos de movimiento...");