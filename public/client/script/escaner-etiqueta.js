const MODEL_URL = '/client/tfjs_from_saved_model/model.json'; // modelo entrenado de IA en python para reconocer los simbolos de las etiquetiñas
const IMG_SIZE  = 380; // tamaño de la imagen
const PREDICTION_THRESHOLD = 0.5; // la accuracy minima para considerar que un simbolo ha sido detectado

// CLASES DE SIMBOLOS A DETECTAR
const CLASS_NAMES = [
  'lavado_30','lavado_40','lavado_50','lavado_60','lavado_70','lavado_95',
  'lavado_a_mano','lavado_delicado','lavado_muy_delicado','lavado_no','lavado_normal',
  'lejia_no','lejia_si'
];

// CATEGORÍAS DE SIMBOLOS
const SYMBOL_TO_CATEGORY = {
    'lavado_30': 'Temperatura', 'lavado_40': 'Temperatura', 'lavado_50': 'Temperatura',
    'lavado_60': 'Temperatura', 'lavado_70': 'Temperatura', 'lavado_95': 'Temperatura',
    'lavado_a_mano': 'Delicadeza', 'lavado_delicado': 'Delicadeza', 'lavado_muy_delicado': 'Delicadeza',
    'lavado_no': 'Delicadeza', 'lavado_normal': 'Delicadeza',
    'lejia_no': 'Lejía', 'lejia_si': 'Lejía'
};


// variables globales
let model, stream;
const video        = document.getElementById('video');
const canvas       = document.getElementById('canvas');
const snapButton   = document.getElementById('snap');
const resultOutput = document.getElementById('resultado');
const scanText = document.querySelector('.scan-text'); 


// FUNCION PARA CARGAR EL MODELO
async function loadModel() {
    resultOutput.textContent = 'Cargando modelo…';
    try {
        // console.log(`Cargando modelo desde: ${MODEL_URL}`);
        //model = await tf.loadLayersModel(MODEL_URL); <- NO LO QUITEIS QUE ANTES ERA LAYERS MODEL
        model = await tf.loadGraphModel(MODEL_URL); 
        // console.log('Modelo cargado:', model);
        tf.tidy(() => {
             model.predict(tf.zeros([1, IMG_SIZE, IMG_SIZE, 3])); // calienta el modelo (fuego)
        });
        // console.log('Modelo calentado.');
        resultOutput.textContent = 'Modelo cargado. Iniciando cámara…';
        await startCamera(); // iniciar cámara
    } catch (e) {
        console.error('Error cargando modelo:', e);
        resultOutput.textContent = 'Error cargando modelo.';
        snapButton.disabled = true;
    }
}

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

// FUNCION PARA DETECTAR EL SIMBOLO
snapButton.addEventListener('click', async () => {
  if (!model) {
    resultOutput.textContent = 'Modelo no cargado.';
    return;
  }
  // hacemos foto "capturamos" el video
  canvas.width  = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  resultOutput.textContent = 'Procesando…';

  const imgTensor = tf.tidy(() => {
    // 1. preprocesar la imagen
    // console.log(`Preprocesando: ${canvas.width}x${canvas.height} -> ${IMG_SIZE}x${IMG_SIZE}`);
    const tensor = tf.browser.fromPixels(canvas)
        .resizeNearestNeighbor([IMG_SIZE, IMG_SIZE]) // IMG_SIZE (380)
        .toFloat(); 
    return tensor.expandDims(0); 
});

// console.log('Tensor de entrada creado:', imgTensor.shape, imgTensor.dtype);

try {
    // 2. realizar la predicción
    console.time('Predicción'); // medimos el tiempo que tarda en hacer la predicción
    predictionTensor = model.predict(imgTensor);
    console.timeEnd('Predicción');

    // verificamos el tipo de tensor devuelto
    if (Array.isArray(predictionTensor)) {
         console.warn("El modelo devolvió un array, se usará el primer elemento. Verifica la conversión.");
         predictionTensor = predictionTensor[0];
    }
    // console.log('Tensor de predicción recibido:', predictionTensor.shape, predictionTensor.dtype);

    // 3. extraemos datos asíncrono es mejor
    const probabilities = await predictionTensor.data();
    console.log('Probabilidades crudas:', probabilities);

    // 4. interpretams resultados 
    const interpreted = interpretSingleOutput(probabilities);
    console.log('Resultados interpretados:', interpreted);

    // 5. print resultados
    handleScanResult(interpreted);

} catch (e) {
    console.error('Error en la predicción:', e);
    resultOutput.textContent = 'Error en la predicción.';
} finally {
    // 6. liberamos tensores 
    imgTensor.dispose();
    if (predictionTensor) {
         if (Array.isArray(predictionTensor)) {
             predictionTensor.forEach(t => t.dispose());
         } else {
             predictionTensor.dispose();
         }
    }
    // console.log('Tensores liberados.');
}
});

// FUNCION PARA INTERPRETAR LOS RESULTADOS
function interpretSingleOutput(probabilities) {
    // probabilities: un array de 13 elementos con valores entre 0 y 1

    const detectedSymbols = [];
    for (let i = 0; i < probabilities.length; i++) {
        if (probabilities[i] >= PREDICTION_THRESHOLD) {
            // añadimos el símbolo detectado y su probabilidad
            detectedSymbols.push({
                name: CLASS_NAMES[i],
                probability: probabilities[i]
            });
        }
    }

    // ordenamos por probabilidad descendente
    detectedSymbols.sort((a, b) => b.probability - a.probability);

    // agrupamos finalmente por categoría
    const categorizedOutput = {
        'Temperatura': 'No detectado',
        'Delicadeza': 'No detectado',
        'Lejía': 'No detectado'
    };

    // inicializamos el mejor simbolo por categoría
    const bestMatchPerCategory = { 
        'Temperatura': { probability: -1 },
        'Delicadeza': { probability: -1 },
        'Lejía': { probability: -1 }
    };


    // recorremos los símbolos detectados y los agrupamos por categoría
    for (const symbol of detectedSymbols) {
        const category = SYMBOL_TO_CATEGORY[symbol.name];
        if (category) {
             // nos quedamos con el simbolo con mayor probabilidad por categoría
             if(symbol.probability > bestMatchPerCategory[category].probability) {
                 bestMatchPerCategory[category] = symbol;
                 categorizedOutput[category] = `${symbol.name} (${symbol.probability.toFixed(2)})`;
             } else if (categorizedOutput[category] === 'No detectado'){
                bestMatchPerCategory[category] = symbol;
                categorizedOutput[category] = `${symbol.name} (${symbol.probability.toFixed(2)})`;
             }
        }
    }

     // la mejor predicción o no detectado para cada categoría
     return categorizedOutput;
}

function handleScanResult(interpreted) {
    // console.log("Resultado interpretado a guardar:", interpreted);

    // guardamos en sessionStorage para que la otra página lo recoja
    sessionStorage.setItem('ultimoResultadoScan', JSON.stringify({
        type: 'etiqueta',
        data: interpreted 
    }));
    // console.log("Resultado guardado en sessionStorage.");

    // volvemos a la página de inicio
    window.location.href = 'empezar-lavado.html';
}

loadModel(); // Cargar el modelo al iniciar