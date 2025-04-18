// --- script/escaner-etiqueta.js ---

// Asegúrate de incluir en tu HTML:
// <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js"></script>

const MODEL_URL = '/client/tfjs_from_saved_model/model.json';
const IMG_SIZE  = 380;
const PREDICTION_THRESHOLD = 0.5;

const CLASS_NAMES = [
  'lavado_30','lavado_40','lavado_50','lavado_60','lavado_70','lavado_95',
  'lavado_a_mano','lavado_delicado','lavado_muy_delicado','lavado_no','lavado_normal',
  'lejia_no','lejia_si'
];

const SYMBOL_TO_CATEGORY = {
    'lavado_30': 'Temperatura', 'lavado_40': 'Temperatura', 'lavado_50': 'Temperatura',
    'lavado_60': 'Temperatura', 'lavado_70': 'Temperatura', 'lavado_95': 'Temperatura',
    'lavado_a_mano': 'Delicadeza', 'lavado_delicado': 'Delicadeza', 'lavado_muy_delicado': 'Delicadeza',
    'lavado_no': 'Delicadeza', 'lavado_normal': 'Delicadeza',
    'lejia_no': 'Lejía', 'lejia_si': 'Lejía'
};



let model, stream;
const video        = document.getElementById('video');
const canvas       = document.getElementById('canvas');
const snapButton   = document.getElementById('snap');
const resultOutput = document.getElementById('resultado');

async function loadModel() {
    resultOutput.textContent = 'Cargando modelo…';
    try {
        console.log(`Cargando modelo desde: ${MODEL_URL}`);
        //model = await tf.loadLayersModel(MODEL_URL);
        model = await tf.loadGraphModel(MODEL_URL); 
        console.log('Modelo cargado:', model);
        // Calentamiento opcional del modelo (puede mejorar rendimiento de la primera predicción)
        tf.tidy(() => {
             model.predict(tf.zeros([1, IMG_SIZE, IMG_SIZE, 3]));
        });
        console.log('Modelo calentado.');
        resultOutput.textContent = 'Modelo cargado. Iniciando cámara…';
        await startCamera();
    } catch (e) {
        console.error('Error cargando modelo:', e);
        resultOutput.textContent = 'Error cargando modelo.';
        snapButton.disabled = true;
    }
}

async function startCamera() {
  if (stream) stream.getTracks().forEach(t => t.stop());
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode:'environment' }, audio:false });
    video.srcObject = stream;
    await video.play();
    snapButton.disabled = false;
    resultOutput.textContent = 'Cámara lista. Pulsa Capturar.';
  } catch (e) {
    console.error('Error accediendo a la cámara:', e);
    resultOutput.textContent = 'Error accediendo a la cámara.';
    snapButton.disabled = true;
  }
}

snapButton.addEventListener('click', async () => {
  if (!model) {
    resultOutput.textContent = 'Modelo no cargado.';
    return;
  }
  // Capturar frame en canvas
  canvas.width  = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  resultOutput.textContent = 'Procesando…';

  // 1) Preprocesamiento dentro de tf.tidy (síncrono)
  const imgTensor = tf.tidy(() => {
    // 1) Preprocesamiento: Debe coincidir EXACTAMENTE con Python
    console.log(`Preprocesando: ${canvas.width}x${canvas.height} -> ${IMG_SIZE}x${IMG_SIZE}`);
    const tensor = tf.browser.fromPixels(canvas)
        .resizeNearestNeighbor([IMG_SIZE, IMG_SIZE]) // <<< USA IMG_SIZE (380)
        .toFloat(); // <<< Convertir a float32. Asume [0, 255] si no hubo otra normalización en Python

    // Normalización (SOLO si se hizo en Python antes del base_model):
    // Si Python usó [-1, 1]: .div(tf.scalar(127.5)).sub(tf.scalar(1.0))
    // Si Python usó [0, 1]: .div(tf.scalar(255.0))
    // Si Python no normalizó (usó [0, 255]): NO AÑADIR NADA MÁS AQUÍ

    return tensor.expandDims(0); // Añadir dimensión de batch: [1, 380, 380, 3]
});

console.log('Tensor de entrada creado:', imgTensor.shape, imgTensor.dtype);

try {
    // 2) Predicción (puede ser asíncrona internamente)
    console.time('Predicción'); // Medir tiempo
    predictionTensor = model.predict(imgTensor);
    console.timeEnd('Predicción');

    // Verificar la salida (debería ser un único tensor)
    if (Array.isArray(predictionTensor)) {
         console.warn("El modelo devolvió un array, se usará el primer elemento. Verifica la conversión.");
         predictionTensor = predictionTensor[0];
    }
    console.log('Tensor de predicción recibido:', predictionTensor.shape, predictionTensor.dtype); // Esperado: [1, 13]

    // 3) Extraer datos (asíncrono es mejor)
    const probabilities = await predictionTensor.data(); // Obtiene Float32Array
    console.log('Probabilidades crudas:', probabilities);

    // 4) Interpretar resultados (nueva lógica)
    const interpreted = interpretSingleOutput(probabilities);
    console.log('Resultados interpretados:', interpreted);

    // 5) Mostrar resultados
    displayResults(interpreted);

} catch (e) {
    console.error('Error en la predicción:', e);
    resultOutput.textContent = 'Error en la predicción.';
} finally {
    // 6) Liberar tensores SIEMPRE
    imgTensor.dispose();
    if (predictionTensor) {
        // Si es un array (inesperado), liberar todos
         if (Array.isArray(predictionTensor)) {
             predictionTensor.forEach(t => t.dispose());
         } else {
             predictionTensor.dispose();
         }
    }
    console.log('Tensores liberados.');
}
});

function interpretSingleOutput(probabilities) {
    // probabilities: un array (Float32Array) de 13 elementos con valores entre 0 y 1

    const detectedSymbols = [];
    for (let i = 0; i < probabilities.length; i++) {
        if (probabilities[i] >= PREDICTION_THRESHOLD) {
            // Añadir el símbolo detectado y su probabilidad
            detectedSymbols.push({
                name: CLASS_NAMES[i],
                probability: probabilities[i]
            });
        }
    }

    // Ordenar por probabilidad descendente (opcional, pero puede ser útil)
    detectedSymbols.sort((a, b) => b.probability - a.probability);

    // Agrupar por categoría final
    const categorizedOutput = {
        'Temperatura': 'No detectado',
        'Delicadeza': 'No detectado',
        'Lejía': 'No detectado'
    };
    const bestMatchPerCategory = { // Para almacenar la mejor probabilidad por categoría
        'Temperatura': { probability: -1 },
        'Delicadeza': { probability: -1 },
        'Lejía': { probability: -1 }
    };


    for (const symbol of detectedSymbols) {
        const category = SYMBOL_TO_CATEGORY[symbol.name];
        if (category) {
             // Quedarse con el de mayor probabilidad dentro de la categoría
             if(symbol.probability > bestMatchPerCategory[category].probability) {
                 bestMatchPerCategory[category] = symbol;
                 categorizedOutput[category] = `${symbol.name} (${symbol.probability.toFixed(2)})`;
             } else if (categorizedOutput[category] === 'No detectado'){
                // Caso borde si el umbral es bajo y hay varios con prob < -1 (no debería pasar)
                bestMatchPerCategory[category] = symbol;
                categorizedOutput[category] = `${symbol.name} (${symbol.probability.toFixed(2)})`;
             }
        }
    }

     // Devolver un objeto con la mejor predicción (o 'No detectado') para cada categoría
     return categorizedOutput;


    // Alternativa: devolver todos los detectados agrupados
    /*
    const categorizedAll = {'Temperatura': [], 'Delicadeza': [], 'Lejía': []};
    for (const symbol of detectedSymbols) {
        const category = SYMBOL_TO_CATEGORY[symbol.name];
        if (category) {
            categorizedAll[category].push(`${symbol.name} (${symbol.probability.toFixed(2)})`);
        }
    }
     // Unir los símbolos detectados por categoría o poner 'No detectado'
     for (const cat in categorizedAll) {
         categorizedAll[cat] = categorizedAll[cat].length > 0 ? categorizedAll[cat].join(', ') : 'No detectado';
     }
     return categorizedAll;
     */

}

function displayResults(interpreted) {
    // Construir mensaje con la nueva estructura de 'interpreted'
    const message =
        `Temperatura: ${interpreted['Temperatura']}\n` +
        `Delicadeza:  ${interpreted['Delicadeza']}\n` +
        `Lejía:       ${interpreted['Lejía']}`;

    // Mostrar alerta (o actualizar un elemento en la página)
    alert(message);
    resultOutput.textContent = message.replace(/\n/g, '<br>'); // Mostrar en página también

    // Guardar en sessionStorage y redirigir (sin cambios aquí)
    sessionStorage.setItem('ultimoResultadoScan', JSON.stringify({
        type: 'etiqueta',
        data: interpreted // Guardar el objeto interpretado
    }));
    // Descomenta la redirección si la necesitas habilitada
    // window.location.href = 'empezar-lavado.html';
}

// --- Inicialización ---
// Ignora el 404 de favicon.ico; no afecta al script
loadModel(); // Cargar el modelo al iniciar