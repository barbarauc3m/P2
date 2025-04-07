let model;

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const snapBtn = document.getElementById('snap');
const resultado = document.getElementById('resultado');

// Cargar el modelo al iniciar
window.addEventListener('DOMContentLoaded', async () => {
  console.log('🔄 Cargando modelo...');
  try {
      console.log(window.location.origin + '/client/modelo_tfjs/model.json');
      model = await tf.loadLayersModel(window.location.origin + '/client/modelo_tfjs/model.json');
      // Asegurar que el modelo tenga la forma de entrada correcta
      if (!model.inputs[0].shape) {
          model.inputs[0].shape = [null, 64, 64, 3];
      }
      
      console.log('✅ Modelo cargado');
      snapBtn.disabled = false;
  } catch (error) {
      console.error('Error al cargar el modelo:', error);
  }
});
// Activar la cámara
navigator.mediaDevices.getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
    video.play();
  })
  .catch((err) => {
    console.error('Error al acceder a la cámara:', err);
    alert('No se pudo acceder a la cámara: ' + err.message);
  });

  snapBtn.addEventListener('click', async () => {
    if (!model) {
      alert('Modelo no cargado aún');
      return;
    }
  
    const context = canvas.getContext('2d');
    canvas.width = 64;
    canvas.height = 64;
    context.drawImage(video, 0, 0, 64, 64);
  
    const tensor = tf.tidy(() =>
      tf.browser
        .fromPixels(canvas)
        .toFloat()
        .div(255)
        .expandDims(0)
    );
  
    try {
      const prediction = model.predict({ conv2d_input: tensor }); // ❗ SIN nombre, solo el tensor
      const probabilities = await prediction.data();
      const predictedIndex = probabilities.indexOf(Math.max(...probabilities));
  
      const classNames = [
        "lavado_30", "lavado_40", "lavado_50", "lavado_60", "lavado_70",
        "lavado_95", "lavado_a_mano", "lavado_delicado", "lavado_muy_delicado",
        "lavado_no", "lavado_normal", "lejia_no", "lejia_si"
      ];
      const predictedClass = classNames[predictedIndex];
      resultado.textContent = `🧠 Predicción: ${predictedClass}`;
    } catch (error) {
      console.error("❌ Error en la predicción:", error);
    }
  });
  