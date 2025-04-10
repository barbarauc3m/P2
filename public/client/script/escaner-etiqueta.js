// --- script/escaner-etiqueta.js ---
const MODEL_URL = '/client/tfjs_graph_model_final/model.json';
const IMG_SIZE = 128; // Tamaño de imagen esperado por el modelo (128x128)
const NUM_CLASSES = 13; // Número de clases de símbolos
const CLASS_NAMES = ['lavado_30', 'lavado_40', 'lavado_50', 'lavado_60', 'lavado_70', 'lavado_95', 'lavado_a_mano', 'lavado_delicado', 'lavado_muy_delicado', 'lavado_no', 'lavado_normal', 'lejia_no', 'lejia_si']; // ¡EN EL MISMO ORDEN QUE AL ENTRENAR!
const PREDICTION_THRESHOLD = 0.5; // Umbral para considerar una predicción como positiva

// Categorías para interpretación (¡REVISA QUE LOS ÍNDICES SEAN CORRECTOS!)
// Asegúrate de que estos índices corresponden a la posición en CLASS_NAMES
const CATEGORIAS = {
    "Temperatura/Metodo": { indices: [0, 1, 2, 3, 4, 5, 6, 9] }, // lavado_30..95, a_mano, no
    "Delicadeza": { indices: [7, 8, 10] },                      // delicado, muy_delicado, normal
    "Lejia": { indices: [11, 12] }                             // no, si
};

let model; // Variable global para el modelo cargado
let stream; // Variable global para el stream de la cámara

// Obtener elementos del HTML
const video = document.getElementById('video');
const canvas = document.getElementById('canvas'); // Canvas oculto para procesar el frame
const snapButton = document.getElementById('snap');
const resultOutput = document.getElementById('resultado'); // El tag <pre> para mostrar texto

// --- 1. Cargar el Modelo Asíncronamente ---
async function loadModel() {
  resultOutput.textContent = 'Cargando modelo (formato grafo)...';
  console.log('Cargando modelo (formato grafo)...');
  try {
      model = await tf.loadGraphModel(MODEL_URL); // ¡GraphModel!
      console.log('Modelo Graph cargado con éxito.');
      resultOutput.textContent = 'Modelo cargado. Iniciando cámara...';
      await startCamera();
  } catch (error) {
      console.error('Error al cargar el modelo graph:', error);
      resultOutput.textContent = 'Error al cargar el modelo graph. Revisa la consola.';
      snapButton.disabled = true;
  }
}

// --- 2. Iniciar la Cámara ---
async function startCamera() {
    // Detener stream previo si existe
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    console.log('Iniciando cámara...');
    try {
        // Pedir acceso a la cámara trasera preferiblemente
        const constraints = {
            audio: false,
            video: {
                facingMode: 'environment', // 'user' para cámara frontal
                // Podrías añadir constraints de resolución si lo necesitas
                // width: { ideal: 1280 },
                // height: { ideal: 720 }
            }
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        video.play(); // Reproducir el video

        // Esperar a que el video tenga dimensiones para habilitar el botón
        video.onloadedmetadata = () => {
            console.log('Cámara iniciada:', video.videoWidth, 'x', video.videoHeight);
            resultOutput.textContent = 'Cámara lista. Apunta a la etiqueta y pulsa Capturar.';
            snapButton.disabled = false; // Habilitar botón AHORA
        };

    } catch (err) {
        console.error("Error al acceder a la cámara: ", err);
        resultOutput.textContent = `Error al acceder a la cámara: ${err.message}.\nAsegúrate de dar permiso en el navegador.`;
        snapButton.disabled = true;
    }
}

// --- 3. Evento del Botón Capturar ---
snapButton.addEventListener('click', async () => {
    if (!model) {
        resultOutput.textContent = 'Error: El modelo no está cargado.';
        return;
    }
    if (!stream || !video.srcObject || video.paused || video.ended) {
         resultOutput.textContent = 'Error: La cámara no está activa.';
         return;
    }

    resultOutput.textContent = 'Capturando y procesando...';
    console.log('Capturando frame...');

    // Ajustar tamaño del canvas al del video actual para capturar el frame
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    // Dibujar el frame actual del video en el canvas oculto
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // --- Preprocesamiento y Predicción (usando tf.tidy para limpiar memoria) ---
    try {
         const { probabilities, interpreted } = tf.tidy(() => {
            // Convertir el contenido del canvas a Tensor
            const imgTensor = tf.browser.fromPixels(canvas);

            // Redimensionar a 128x128
            const resizedTensor = imgTensor.resizeNearestNeighbor([IMG_SIZE, IMG_SIZE]);

            // Convertir a float
            const floatTensor = resizedTensor.toFloat();

            // Preprocesamiento: Escalar píxeles a [-1, 1] (¡VERIFICAR!)
            const processedTensor = floatTensor.div(tf.scalar(127.5)).sub(tf.scalar(1.0));

            // Añadir dimensión de batch [1, 128, 128, 3]
            const batchedTensor = processedTensor.expandDims(0);

            // Realizar predicción
            console.log('Realizando predicción...');
            const predictionTensor = model.execute(batchedTensor); // ¡Execute!
            // Obtener el array de probabilidades (síncrono para simplificar)
            const probabilitiesArray = predictionTensor.dataSync();

            console.log('Probabilidades Sigmoid:', probabilitiesArray);

             // Interpretar Resultados
            const interpretedResults = interpretPredictions(probabilitiesArray);

            // Devolver resultados como arrays normales para sacarlos de tf.tidy
            return {probabilities: Array.from(probabilitiesArray), interpreted: interpretedResults};
        });

        displayResults(probabilities, interpreted); // Mostrar resultados

    } catch(error) {
         console.error("Error durante la predicción:", error);
         resultOutput.textContent = `Error durante la predicción: ${error.message}`;
    }
});

// --- 4. Interpretar Predicciones ---
// --- 4. Interpretar Predicciones (CORREGIDA) ---
function interpretPredictions(predictions) {
  let interpreted = {};
  console.log('\nInterpretación por Categorías:');

  for (const [categoria, data] of Object.entries(CATEGORIAS)) {
      const indicesCat = data.indices;
      let maxProb = -1; // Variable declarada con P mayúscula
      let predictedClassIndex = -1;

      // Encontrar el símbolo más probable DENTRO de la categoría
      for (const index of indicesCat) {
          // Comprobación de seguridad por si los índices no son válidos
          if (index >= 0 && index < predictions.length) {
               if (predictions[index] > maxProb) { // Usando maxProb
                  maxProb = predictions[index];   // Asignando a maxProb
                  predictedClassIndex = index;
              }
          } else {
               console.warn(`Índice ${index} fuera de rango para la categoría ${categoria}`);
          }
      }

      // Asignar resultado si se encontró un índice válido
      if (predictedClassIndex !== -1) {
          const nombreClaseGanadora = CLASS_NAMES[predictedClassIndex];
          // Solo considerar la predicción si supera el umbral
          if (maxProb >= PREDICTION_THRESHOLD) { // Usando maxProb
              console.log(`- ${categoria}: ${nombreClaseGanadora} (Prob: ${maxProb.toFixed(3)})`); // Usando maxProb
              interpreted[categoria] = { symbol: nombreClaseGanadora, probability: maxProb }; // Usando maxProb
          } else {
              // ¡CORREGIDO AQUÍ! Usar maxProb con P mayúscula
              console.log(`- ${categoria}: No detectado (Prob máx: ${maxProb.toFixed(3)} < ${PREDICTION_THRESHOLD})`); 
              interpreted[categoria] = { symbol: "No detectado", probability: maxProb }; // Usando maxProb
          }
      } else {
           console.log(`- ${categoria}: No se encontraron clases válidas.`);
           interpreted[categoria] = { symbol: "Error/Vacío", probability: 0 };
      }
  }
  console.log('\nObjeto Interpretado:', interpreted);
  return interpreted;
}

// --- 5. Mostrar Resultados en Popup (¡MODIFICADO!) ---
function displayResults(probabilities, interpreted) {
  // 1. Construir el mensaje para el popup
  let alertMessage = 'Instrucciones de Lavado Detectadas:\n\n'; // Título y saltos de línea

  for(const [cat, result] of Object.entries(interpreted)) {
      // Añadir cada resultado interpretado al mensaje
      alertMessage += `${cat}: ${result.symbol} (Confianza: ${(result.probability * 100).toFixed(1)}%)\n`;
  }

  // 2. Mostrar el popup con el mensaje
  alert(alertMessage);

  // 3. (Opcional) Actualizar el <pre> para indicar que se completó
  resultOutput.textContent = 'Predicción completada. Resultados mostrados.';

  // 4. (Opcional) Mantener los detalles en la consola para depuración
  console.log('\n--- Probabilidades Detalladas (Solo Consola) ---');
   for(let i=0; i < probabilities.length; i++) {
       console.log(`${CLASS_NAMES[i]}: ${probabilities[i].toFixed(4)}`);
   }
}

// --- Iniciar Carga del Modelo al cargar la página ---
loadModel();