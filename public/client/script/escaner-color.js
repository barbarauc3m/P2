
import { extractColors } from 'https://cdn.jsdelivr.net/npm/extract-colors@4.2.0/+esm'; // LIBRERIA PARA EXTRAER COLORES

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const snapButton = document.getElementById('snap');
const resultado = document.getElementById('resultado');
const scanText = document.querySelector('.scan-text'); 

// --- Constantes para Tono ---
const DARK_L_THRESHOLD = 35;  // % de Luminosidad por debajo = Oscuro
const LIGHT_L_THRESHOLD = 75; // % de Luminosidad por encima = Claro

// FUNCION PARA INICIAR LA CÁMARA 
async function startCamera() {
    // console.log("Iniciando cámara...");
        // acceso a la camarita
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" } // environment para trasera, user para delantera
        });
        video.srcObject = stream;

        // cargar los datos del video
        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            snapButton.disabled = false; // Habilitar el botón de captura
            scanText.textContent = "¡Cámara lista! Apunta a la prenda y pulsa Capturar.";
            // console.log(`Cámara lista. Resolución: ${video.videoWidth}x${video.videoHeight}`);
        };

        video.oncanplay = () => {
             // console.log("vídeo reproducir");
        };
}

// FUNCION PARA CAPTURAR LA FOTO Y ANALIZAR EL COLOR
async function captureAndAnalyze() {
    if (!video.srcObject || video.readyState < video.HAVE_METADATA) {
        alert("La cámara no está lista o activa.");
        return;
    }

    snapButton.disabled = true; // desabilitamos boton 
    scanText.textContent = "Capturando y analizando...";
    resultado.textContent = "Procesando...";

    // 1. Dibujar el frame actual del vídeo en el canvas oculto
    const context = canvas.getContext('2d');
    // Asegurarse que las dimensiones del canvas son las correctas justo antes de dibujar
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    console.log("Frame capturado en canvas.");

    // 2. Obtener la imagen del canvas como Data URL (formato Png por defecto)
    const imageDataUrl = canvas.toDataURL('image/png');


    // 3. Analizar colores usando la librería extractColors
        const options = {
            pixels: 128000,       
            distance: 0.18,         
            saturationDistance: 0.1,
            lightnessDistance: 0.1, 
            hueDistance: 0.05 
        };
        // console.log("Llamando a extractColors...");
        const colors = await extractColors(imageDataUrl, options);

        // console.log("Paleta Completa Detectada:", JSON.stringify(colors, null, 2));

        // console.log("extractColors completado. Colores detectados:", colors.length);

        if (colors && colors.length > 0) {
            // Tomamos el primer color como el más dominante
            const dominantColor = colors[0];
            const rgb = hexToRgb(dominantColor.hex);
            const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

            // Convertir HSL a valores más legibles
            const h = (hsl[0] * 360).toFixed(0); // Grados 0-360
            const s = (hsl[1] * 100).toFixed(0); // Porcentaje 0-100
            const l = (hsl[2] * 100).toFixed(0); // Porcentaje 0-100 (Luminosidad/Tono)

            // Determinar descripción del tono basada en Luminosidad (L)
            let toneDescription = "Tono Medio";
            if (l < DARK_L_THRESHOLD) {
                toneDescription = "Tono Oscuro";
            } else if (l > LIGHT_L_THRESHOLD) {
                toneDescription = "Tono Claro";
            }

            const resultadoParaGuardar = {
                type: 'color',
                data: {
                    hex: dominantColor.hex,
                    L: l, // Guardamos L como número 0-100
                    tone: toneDescription,
                    fullPalette: colors // Opcional: guardar toda la paleta por si acaso
                }
            };
            console.log('Resultado de color para guardar:', resultadoParaGuardar);

             // --- Guardar en sessionStorage y volver ---
            try {
                sessionStorage.setItem('ultimoResultadoScan', JSON.stringify(resultadoParaGuardar));
                console.log("Resultado guardado en sessionStorage.");
                // Volver a la página anterior (o a una específica)
                // window.history.back(); // Opción 1: Volver atrás
                window.location.href = 'empezar-lavado.html'; // Opción 2: Ir a página específica
            } catch (e) {
                console.error("Error al guardar en sessionStorage:", e);
                alert("Error al procesar el resultado. Vuelve manualmente e inténtalo de nuevo.");
            }

        } else {
            alert("No se pudieron detectar colores predominantes en la captura. Intenta con mejor luz o un enfoque más cercano.");
            resultado.textContent = "No se detectaron colores.";
            scanText.textContent = "No se detectaron colores. Intenta de nuevo.";
        }
}


// --- Funciones Auxiliares de Color (COPIAR AQUÍ) ---

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHsl(r, g, b){
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min){
        h = s = 0; // achromatic
    }else{
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    // Devolvemos H, S, L como valores entre 0 y 1
    return [h, s, l];
}

// --- Inicialización ---
// Intentar iniciar la cámara tan pronto como la página cargue
startCamera();

// Añadir el listener al botón de captura
snapButton.addEventListener('click', captureAndAnalyze);