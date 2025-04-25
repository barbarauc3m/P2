// Script para lavado-personalizado.html

// Asegúrate de que este código se ejecuta después de que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM Personalizado Cargado.");

  // --- Código Existente: Conexión Socket, obtener usuario ---
  const socket = io();
  const usuarioActual = localStorage.getItem('loggedInUser');
  socket.on('connect', () => { console.log("🔌 Socket conectado"); });
  socket.on('connect_error', (err) => { console.error("🔌 Error Socket:", err); });
  // Emitir cambio de display al cargar la página
  socket.emit('requestDisplayChange', { targetPage: '/display/lavado-personalizado' });
  // ---------------------------------------------------------


  // --- Código Existente: Listeners para interacción MANUAL (Checkboxes, Sliders) ---
  console.log("Configurando listeners manuales...");

  // 1. Nivel de suciedad (Manual)
  document.querySelectorAll('.suciedad .dropdown-menu input[type=checkbox]').forEach(chk => {
      chk.addEventListener('change', e => {
          if (!e.target.checked) {
               // Si se desmarca, quizás no hacer nada o resetear? Por ahora solo actúa al marcar.
               // Si es radio-like, desmarcar no debería ser posible manualmente sin JS extra.
              return;
          }
          // Desmarcar otros checkboxes en el mismo grupo
           document.querySelectorAll('.suciedad .dropdown-menu input[type=checkbox]').forEach(otherChk => {
               if (otherChk !== e.target) otherChk.checked = false;
           });
          const valor = e.target.parentElement.textContent.trim();
          console.log("Manual -> Suciedad:", valor);
          socket.emit('updatePersonalizadoOption', { category: 'suciedad', value: valor });
      });
  });

  // 2. Temperatura (Manual)
  const tempSlider = document.getElementById('temperatura');
  const tempValueSpan = document.getElementById('tempValue'); // Span para mostrar valor
  if (tempSlider && tempValueSpan) {
      // Actualizar span al mover slider
      tempSlider.addEventListener('input', () => {
          const value = tempSlider.value;
          tempValueSpan.textContent = value; // Actualiza el número en el span
          const v = `${value}°C`;
          socket.emit('updatePersonalizadoOption', { category: 'temperatura', value: v });
      });
      // Mostrar y emitir valor inicial
      tempValueSpan.textContent = tempSlider.value;
      socket.emit('updatePersonalizadoOption', { category: 'temperatura', value: `${tempSlider.value}°C` });
  } else { console.warn("Slider/Span de Temperatura no encontrado"); }


  // 3. Centrifugado (Manual)
  document.querySelectorAll('.centrifugado .dropdown-menu input[type=checkbox]').forEach(chk => {
       chk.addEventListener('change', e => {
           if (!e.target.checked) return;
           document.querySelectorAll('.centrifugado .dropdown-menu input[type=checkbox]').forEach(otherChk => {
               if (otherChk !== e.target) otherChk.checked = false;
           });
           const valor = e.target.parentElement.textContent.trim();
           console.log("Manual -> Centrifugado:", valor);
           socket.emit('updatePersonalizadoOption', { category: 'centrifugado', value: valor });
       });
  });

  // 4. Duración (Manual)
  const durSlider = document.getElementById('duracion');
  const durValueSpan = document.getElementById('durValue'); // Span para mostrar valor
  if (durSlider && durValueSpan) {
       // Actualizar span al mover slider
      durSlider.addEventListener('input', () => {
          const value = durSlider.value;
          durValueSpan.textContent = value; // Actualiza el número en el span
          const v = `${value} min`;
          socket.emit('updatePersonalizadoOption', { category: 'duracion', value: v });
      });
      // Mostrar y emitir valor inicial
      durValueSpan.textContent = durSlider.value;
      socket.emit('updatePersonalizadoOption', { category: 'duracion', value: `${durSlider.value} min` });
  } else { console.warn("Slider/Span de Duración no encontrado"); }


  // 5. Detergente (Manual)
  const detSlider = document.getElementById('detergente');
  const detValueSpan = document.getElementById('detValue'); // Span para mostrar valor
   if (detSlider && detValueSpan) {
      // Actualizar span al mover slider
      detSlider.addEventListener('input', () => {
          const value = detSlider.value;
          detValueSpan.textContent = value; // Actualiza el número en el span
          const v = `${value} ml`;
          socket.emit('updatePersonalizadoOption', { category: 'detergente', value: v });
      });
       // Mostrar y emitir valor inicial
       detValueSpan.textContent = detSlider.value;
       socket.emit('updatePersonalizadoOption', { category: 'detergente', value: `${detSlider.value} ml` });
   } else { console.warn("Slider/Span de Detergente no encontrado"); }


  // 6. Tejido (Manual)
  document.querySelectorAll('.tejido .dropdown-menu input[type=checkbox]').forEach(chk => {
       chk.addEventListener('change', e => {
           if (!e.target.checked) return;
           // Si solo puede haber uno marcado:
           document.querySelectorAll('.tejido .dropdown-menu input[type=checkbox]').forEach(otherChk => {
               if (otherChk !== e.target) otherChk.checked = false;
           });
           const valor = e.target.parentElement.textContent.trim();
            console.log("Manual -> Tejido:", valor);
           socket.emit('updatePersonalizadoOption', { category: 'tejido', value: valor });
       });
  });
  console.log("Listeners manuales configurados.");
  // --- FIN Listeners Manuales ---


  // ============================================================
  // --- INICIO: LÓGICA DE VOZ CONVERSACIONAL ---
  // ============================================================
  console.log("Configurando lógica de voz...");

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;
  const synth = window.speechSynthesis;
  let vocesDisponibles = [];
  let ultimoPromptHablado = "";
  let estadoConversacion = "idle"; // idle, suciedad, temperatura, centrifugado, duracion, detergente, tejido, confirmar, finished
  let reintentando = false; // Flag para evitar bucles de error

  // --- Mapas de Palabras Clave ---
  const tempPalabras = { /* ... (como en respuesta anterior) ... */
      'veinte': 20, 'veinticinco': 25, 'treinta': 30, 'treinta y cinco': 35, 'cuarenta': 40, 'cuarenta y cinco': 45, 'cincuenta': 50, 'cincuenta y cinco': 55, 'sesenta': 60, 'sesenta y cinco': 65, 'setenta': 70, 'setenta y cinco': 75, 'ochenta': 80, 'ochenta y cinco': 85, 'noventa': 90
  };
  const duracionPalabras = { /* ... (como en respuesta anterior) ... */
      'quince': 15, 'veinte': 20, 'veinticinco': 25, 'treinta': 30, 'treinta y cinco': 35, 'cuarenta': 40, 'cuarenta y cinco': 45, 'cincuenta': 50, 'cincuenta y cinco': 55, 'sesenta': 60, 'una hora': 60, 'setenta y cinco': 75, 'noventa': 90, 'hora y media': 90, 'cien': 100, 'ciento cinco': 105, 'ciento diez': 110, 'ciento quince': 115, 'ciento veinte': 120, 'dos horas': 120
  };
  const detergentePalabras = { /* ... (como en respuesta anterior) ... */
      'diez': 10, 'quince': 15, 'veinte': 20, 'veinticinco': 25, 'treinta': 30, 'treinta y cinco': 35, 'cuarenta': 40, 'cuarenta y cinco': 45, 'cincuenta': 50, 'cincuenta y cinco': 55, 'sesenta': 60, 'sesenta y cinco': 65, 'setenta': 70, 'setenta y cinco': 75, 'ochenta': 80, 'ochenta y cinco': 85, 'noventa': 90, 'noventa y cinco': 95, 'cien': 100
  };
  // --- Fin Mapas ---

  // --- Funciones Auxiliares de Voz ---
  function checkBrowserSupport() {
      let supported = true;
      if (!('speechSynthesis' in window)) { console.error("❌ SpeechSynthesis no soportado."); alert("Navegador no soporta hablar."); supported = false; }
      if (!recognition) { console.error("❌ SpeechRecognition no soportado."); alert("Navegador no soporta reconocer voz."); supported = false; }
      return supported;
  }

  function cargarVoces() {
      vocesDisponibles = synth.getVoices();
      if (vocesDisponibles.length === 0 && synth.onvoiceschanged !== undefined) {
          synth.onvoiceschanged = () => vocesDisponibles = synth.getVoices();
      }
      console.log(`Voces cargadas: ${vocesDisponibles.length}`);
  }

  // --- Función Hablar (MODIFICADA con callback) ---
  function hablar(texto, iniciarEscuchaDespues = true, onendCallback = null) {
      if (!synth || !texto) return;
      synth.cancel();
      if (recognition) { try { recognition.stop(); } catch(e) {} }

      ultimoPromptHablado = texto;
      const utterance = new SpeechSynthesisUtterance(texto);
      utterance.lang = 'es-ES';
      const vozEsp = vocesDisponibles.find(voz => voz.lang === 'es-ES' || voz.lang.startsWith('es-')); // Más flexible
      if (vozEsp) utterance.voice = vozEsp;
      else console.warn("Voz es-ES no encontrada, usando default.");

      utterance.onend = () => {
          console.log(`🗣️ Fin habla: "${texto.substring(0, 30)}..."`);
          if (typeof onendCallback === 'function') {
              console.log("-> Ejecutando callback onend específico.");
              // Pequeña pausa antes del callback para que no se pise con el final del habla
              setTimeout(onendCallback, 100);
          } else if (iniciarEscuchaDespues && recognition && estadoConversacion !== 'idle' && estadoConversacion !== 'finished') {
               console.log("🎤 Iniciando escucha (no había callback)...");
               try { recognition.start(); } catch (e) { console.warn("Warn: recognition.start() error:", e.message); }
          } else {
               console.log("🎤 Escucha NO iniciada.");
          }
      };
      utterance.onerror = (e) => { console.error('Error SpeechSynthesis:', e.error); };

      console.log(`🗣️ Hablando: "${texto.substring(0, 50)}..."`);
      setTimeout(() => synth.speak(utterance), 50);
  }

  // --- Configuración del Reconocimiento ---
  function configurarReconocimiento() {
      if (!recognition) return;
      recognition.lang = 'es-ES';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
          const comando = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
          console.log('👂 Usuario dijo:', comando);
          reintentando = false;
          procesarComandoGeneral(comando);
      };

      recognition.onerror = (event) => {
          console.error('Error reconocimiento:', event.error);
          if (reintentando) { // Evitar bucle si el error persiste
               console.warn("Error persiste, deteniendo reintento.");
               hablar("Sigo sin poder entenderte. Intenta usar los controles manuales.", false);
               estadoConversacion = 'idle';
               return;
          }
           if (event.error === 'no-speech') {
               hablar("No he escuchado nada. ¿Puedes repetir?", true);
               reintentando = true;
          } else if (event.error === 'not-allowed') {
               alert("Necesito permiso para usar el micrófono.");
               estadoConversacion = 'idle'; // Detener flujo
          } else {
               hablar("Ha ocurrido un error raro. Intentémoslo de nuevo.", false);
               setTimeout(repetirUltimoPrompt, 1500);
               reintentando = true;
          }
      };
      recognition.onend = () => { console.log('Reconocimiento detenido.'); };
      console.log("Reconocimiento configurado.");
  }

  // --- Procesador General de Comandos ---
  function procesarComandoGeneral(comando) {
      // 1. Comandos de Control Global (más flexibles)
      if (comando === "repetir") { repetirUltimoPrompt(); return; }
      if (comando === "empezar de nuevo") { reiniciarLavadoCompleto(); return; }
      if (comando === "salir" || comando === "volver al menú") { salirPersonalizacion(); return; }

      // 2. Procesar según el estado
      console.log(`Procesando comando "${comando}" en estado: ${estadoConversacion}`);
      switch (estadoConversacion) {
          case 'suciedad': procesarSuciedad(comando); break;
          case 'temperatura': procesarTemperatura(comando); break;
          case 'centrifugado': procesarCentrifugado(comando); break;
          case 'duracion': procesarDuracion(comando); break;
          case 'detergente': procesarDetergente(comando); break;
          case 'tejido': procesarTejido(comando); break;
          case 'confirmar': procesarConfirmacion(comando); break;
          default: console.log("Estado inactivo, comando ignorado.");
      }
  }

  // --- Funciones para cada Paso (`preguntar<Paso>` y `procesar<Paso>`) ---

  function preguntarSuciedad() {
      estadoConversacion = 'suciedad';
      hablar("Para iniciar el personalizado de lavado, comienza diciendo el nivel de suciedad de tu ropa. Opción 1: ropa a penas usada. Opción 2: Ropa de uso diario. u Opción 3: Manchas visibles.", true);
  }

  function procesarSuciedad(comando) {
      let idCheckbox = null; let opcionNum = null;
      const comandoLimpio = comando.replace(/ó/g, 'o').replace("uno", "1").replace("dos", "2").replace("tres", "3");
      if (comandoLimpio.includes("opcion 1")) { idCheckbox = "suciedad-op1"; opcionNum = 1; }
      else if (comandoLimpio.includes("opcion 2")) { idCheckbox = "suciedad-op2"; opcionNum = 2; }
      else if (comandoLimpio.includes("opcion 3")) { idCheckbox = "suciedad-op3"; opcionNum = 3; }

      if (idCheckbox) {
          if (marcarCheckboxUnico(idCheckbox, '.suciedad input[type=checkbox]')) { // Selector más simple
               hablar(`Opción ${opcionNum} seleccionada.`, false, preguntarTemperatura); // Llama al siguiente al terminar
          } else { errorAlActualizar("suciedad"); }
      } else { hablar("No entendí la opción. Por favor, di opción 1, 2 o 3.", true); }
  }

  function preguntarTemperatura() {
      estadoConversacion = 'temperatura';
      hablar("Continuaremos con la temperatura. Dime un número entre 20 y 90 grados.", true);
  }

  function procesarTemperatura(comando) {
      let temp = null;
      const numeros = comando.match(/\d+/g);
      if (numeros && numeros.length > 0) { temp = parseInt(numeros[0], 10); }
      else {
           const comandoLimpio = comando.replace(/ grados/g, '').replace(/ centigrados/g, '').replace(/centígrados/g, '').trim();
           for (const palabra in tempPalabras) { if (comandoLimpio.includes(palabra)) { temp = tempPalabras[palabra]; break; } }
      }
      if (temp !== null) {
          if (temp >= 20 && temp <= 90) {
              const slider = document.getElementById('temperatura');
              const span = document.getElementById('tempValue');
              if (slider && span) {
                  slider.value = temp; span.textContent = temp;
                  slider.dispatchEvent(new Event('input', { bubbles: true }));
                  hablar(`Perfecto, ${temp} grados configurado.`, false, preguntarCentrifugado); // Llama al siguiente
              } else { errorAlActualizar("temperatura"); }
          } else { hablar(`La temperatura ${temp} está fuera del rango de 20 a 90. Dime otra.`, true); }
      } else { hablar("No entendí la temperatura. Di un número entre 20 y 90.", true); }
  }

   function preguntarCentrifugado() {
      estadoConversacion = 'centrifugado';
      hablar("Ahora el centrifugado. ¿Quieres 600, 800 o 1200 revoluciones por minuto?", true);
   }

  function procesarCentrifugado(comando) {
       let idCheckbox = null; let revoluciones = null;
       const comandoLimpio = comando.replace(/\s*revoluciones\s*(por|de)?\s*minuto/gi, '').replace('mil doscientos', '1200').replace('ochocientos', '800').replace('seiscientos', '600');
       if (comandoLimpio.includes("600")) { idCheckbox = "centrifugado-600"; revoluciones = 600; }
       else if (comandoLimpio.includes("800")) { idCheckbox = "centrifugado-800"; revoluciones = 800; }
       else if (comandoLimpio.includes("1200")) { idCheckbox = "centrifugado-1200"; revoluciones = 1200; }

      if (idCheckbox) {
          if (marcarCheckboxUnico(idCheckbox, '.centrifugado input[type=checkbox]')) {
               hablar(`Trato hecho, ${revoluciones} revoluciones.`, false, preguntarDuracion); // Llama al siguiente
          } else { errorAlActualizar("centrifugado"); }
      } else { hablar("No reconocí las revoluciones. Di 600, 800 o 1200.", true); }
  }

   function preguntarDuracion() {
       estadoConversacion = 'duracion';
       hablar("¿Cuánto tiempo quieres que dure? Entre 15 y 120 minutos.", true);
   }

   function procesarDuracion(comando) {
       let duracion = null;
       const numeros = comando.match(/\d+/g);
       if (numeros && numeros.length > 0) { duracion = parseInt(numeros[0], 10); }
       else {
           const comandoLimpio = comando.replace(/ minutos?/g, '').replace(/ hora y media/g, 'hora y media').replace(/ una hora/g, 'una hora').replace(/ dos horas/g, 'dos horas').trim();
           for (const palabra in duracionPalabras) { if (comandoLimpio.includes(palabra)) { duracion = duracionPalabras[palabra]; break; } }
       }
       if (duracion !== null) {
           const slider = document.getElementById('duracion'); const span = document.getElementById('durValue');
           const min = slider ? parseInt(slider.min) : 15; const max = slider ? parseInt(slider.max) : 120;
           if (duracion >= min && duracion <= max) {
               if (slider && span) {
                   slider.value = duracion; span.textContent = duracion;
                   slider.dispatchEvent(new Event('input', { bubbles: true }));
                   hablar(`De acuerdo, ${duracion} minutos.`, false, preguntarDetergente); // Llama al siguiente
               } else { errorAlActualizar("duración"); }
           } else { hablar(`La duración ${duracion} está fuera de rango (${min}-${max}). Dime otra.`, true); }
       } else { hablar("No entendí la duración. Di un número de minutos entre 15 y 120.", true); }
   }

   function preguntarDetergente() {
       estadoConversacion = 'detergente';
       hablar("¿Cuánto detergente usamos? Entre 10 y 100 mililitros.", true);
   }

   function procesarDetergente(comando) {
        let detergente = null;
        const numeros = comando.match(/\d+/g);
        if (numeros && numeros.length > 0) { detergente = parseInt(numeros[0], 10); }
        else {
            const comandoLimpio = comando.replace(/ ml/g, '').replace(/ mililitros?/g, '').trim();
            for (const palabra in detergentePalabras) { if (comandoLimpio.includes(palabra)) { detergente = detergentePalabras[palabra]; break; } }
        }
        if (detergente !== null) {
            const slider = document.getElementById('detergente'); const span = document.getElementById('detValue');
            const min = slider ? parseInt(slider.min) : 10; const max = slider ? parseInt(slider.max) : 100;
            if (detergente >= min && detergente <= max) {
                if (slider && span) {
                    slider.value = detergente; span.textContent = detergente;
                    slider.dispatchEvent(new Event('input', { bubbles: true }));
                    hablar(`Perfecto, ${detergente} mililitros.`, false, preguntarTejido); // Llama al siguiente
                } else { errorAlActualizar("detergente"); }
            } else { hablar(`La cantidad ${detergente} está fuera de rango (${min}-${max}). Dime otra.`, true); }
        } else { hablar("No entendí la cantidad. Di un número entre 10 y 100.", true); }
   }

    function preguntarTejido() {
        estadoConversacion = 'tejido';
         hablar("Ya casi estamos. Dime el tipo de tejido: Algodón, Ropa Blanca, Color, Sintético, Lana o Mezcla.", true);
    }

    function procesarTejido(comando) {
        let idCheckbox = null; let tejidoNombre = null;
        const comandoLimpio = comando.toLowerCase().replace('ropa ', '').replace('de ', '').replace('colores', 'color');
        if (comandoLimpio.includes("algodon") || comandoLimpio.includes("algodón")) { idCheckbox = "tejido-algodon"; tejidoNombre = "Algodón"; }
        else if (comandoLimpio.includes("blanca")) { idCheckbox = "tejido-blanca"; tejidoNombre = "Ropa Blanca"; }
        else if (comandoLimpio.includes("color")) { idCheckbox = "tejido-color"; tejidoNombre = "Ropa de color"; }
        else if (comandoLimpio.includes("sintetico") || comandoLimpio.includes("sintético")) { idCheckbox = "tejido-sintetico"; tejidoNombre = "Sintético"; }
        else if (comandoLimpio.includes("lana")) { idCheckbox = "tejido-lana"; tejidoNombre = "Lana"; }
        else if (comandoLimpio.includes("mezcla")) { idCheckbox = "tejido-mezcla"; tejidoNombre = "Mezcla"; }

         if (idCheckbox) {
             if (marcarCheckboxUnico(idCheckbox, '.tejido input[type=checkbox]')) {
                  hablar(`Has seleccionado ${tejidoNombre}.`, false, preguntarConfirmacion); // Llama al siguiente
             } else { errorAlActualizar("tejido"); }
         } else { hablar("No reconocí el tejido. Elige Algodón, Ropa Blanca, Color, Sintético, Lana o Mezcla.", true); }
    }

   function preguntarConfirmacion() {
       estadoConversacion = 'confirmar';
       hablar("Lavado configurado. ¿Deseas guardarlo? Di sí o no.", true);
   }

   function procesarConfirmacion(comando) {
        const comandoLimpio = comando.toLowerCase();
        if (comandoLimpio.includes("sí") || comandoLimpio.includes("si")) {
            hablar("Guardando lavado...", false); // Sin callback, el click se encarga
            const saveButton = document.querySelector('.button-save');
            if (saveButton) {
                saveButton.click();
                estadoConversacion = 'finished';
            } else { errorAlActualizar("botón guardar"); estadoConversacion = 'idle'; }
        } else if (comandoLimpio.includes("no")) {
             // Habla y LUEGO llama a salir
             hablar("De acuerdo, lavado no guardado. Volviendo al menú.", false, salirPersonalizacion);
             estadoConversacion = 'finished';
        } else {
             hablar("No entendí. Por favor, di sí o no.", true); // Repite confirmación
        }
   }

  // --- Funciones de Control ---
  function repetirUltimoPrompt() {
      if (ultimoPromptHablado && estadoConversacion !== 'idle' && estadoConversacion !== 'finished') {
          console.log("Repitiendo último prompt...");
          hablar(ultimoPromptHablado, true); // Repite y escucha de nuevo
      } else {
          console.log("Nada que repetir o estado inactivo.");
          hablar("No hay nada que repetir ahora.", false);
      }
  }

  function reiniciarLavadoCompleto() {
      console.log("Reiniciando personalización...");
      // Resetear checkboxes y disparar change para limpiar socket/UI
      document.querySelectorAll('.suciedad input, .centrifugado input, .tejido input').forEach(chk => {
          if(chk.checked) { chk.checked = false; chk.dispatchEvent(new Event('change', { bubbles: true })); }
      });
      // Resetear sliders y disparar input
      const tempSlider = document.getElementById('temperatura'); const tempSpan = document.getElementById('tempValue');
      if(tempSlider) { tempSlider.value = tempSlider.defaultValue || 60; if(tempSpan) tempSpan.textContent = tempSlider.value; tempSlider.dispatchEvent(new Event('input', { bubbles: true })); }
      const durSlider = document.getElementById('duracion'); const durSpan = document.getElementById('durValue');
      if(durSlider) { durSlider.value = durSlider.defaultValue || 60; if(durSpan) durSpan.textContent = durSlider.value; durSlider.dispatchEvent(new Event('input', { bubbles: true })); }
      const detSlider = document.getElementById('detergente'); const detSpan = document.getElementById('detValue');
      if(detSlider) { detSlider.value = detSlider.defaultValue || 50; if(detSpan) detSpan.textContent = detSlider.value; detSlider.dispatchEvent(new Event('input', { bubbles: true })); }

      // Habla confirmación y LUEGO reinicia
      hablar("Valores reseteados.", false, preguntarSuciedad);
  }

  function salirPersonalizacion() {
      console.log("Saliendo de personalización...");
      hablar("Volviendo al inicio.", false); // Habla pero no escucha ni hace callback
      synth.cancel();
      if(recognition) { try { recognition.stop(); } catch(e){} }
      estadoConversacion = 'idle';
      if (socket && socket.connected) { socket.emit("requestDisplayChange", { targetPage: "/" }); }
      // Esperar un poco para que termine de hablar antes de redirigir
      setTimeout(() => { window.location.href = "/mobile"; }, 1000); // O index.html
  }

  // --- Funciones Auxiliares ---
  function marcarCheckboxUnico(idCheckbox, selectorGrupo) {
      const checkbox = document.getElementById(idCheckbox);
      if (checkbox) {
          document.querySelectorAll(selectorGrupo).forEach(otherChk => {
              if (otherChk.id !== idCheckbox && otherChk.checked) { // Desmarcar solo si estaba marcado
                  otherChk.checked = false;
                   // Disparar change en los desmarcados también si es necesario para el socket
                   otherChk.dispatchEvent(new Event('change', { bubbles: true }));
              }
          });
          if (!checkbox.checked) { // Marcar solo si no estaba marcado
               checkbox.checked = true;
               checkbox.dispatchEvent(new Event('change', { bubbles: true }));
          }
          return true;
      } else { console.error(`Checkbox ID "${idCheckbox}" no encontrado.`); return false; }
  }

  function errorAlActualizar(nombreCampo) {
      console.error(`Error: No se encontró el elemento del DOM para ${nombreCampo}.`);
      hablar(`Hubo un error interno al configurar ${nombreCampo}. Deteniendo proceso.`, false);
      estadoConversacion = 'idle'; // Detener el flujo
  }

  // --- Inicio de la Interacción por Voz ---
  function iniciarProcesoVoz() {
     if (!checkBrowserSupport()) return;
     console.log("🎤 Iniciando proceso de voz completo...");
     cargarVoces();
     configurarReconocimiento();
     // Esperar antes de hablar
     setTimeout(preguntarSuciedad, 1500);
  }

  // --- Disparador ---
  const botonVoz = document.getElementById("boton-voz-personalizado");
  if (botonVoz) {
      botonVoz.addEventListener('click', iniciarProcesoVoz);
      console.log("🎤 Botón para activar voz encontrado. Listener añadido.");
  } else {
      console.warn("Botón #boton-voz-personalizado NO encontrado. La voz NO se iniciará automáticamente.");
      // DESCOMENTA SI QUIERES INICIO AUTOMÁTICO:
      // console.log("Iniciando voz automáticamente en 2.5 segundos...");
      // setTimeout(iniciarProcesoVoz, 2500);
  }

  // ============================================================
  // --- FIN: LÓGICA DE VOZ CONVERSACIONAL ---
  // ============================================================


  // --- Código Existente: Botón Guardar, Back, Home ---
  const saveButton = document.querySelector(".button-save");
   if (saveButton) {
      saveButton.addEventListener("click", () => {
          const usuario = localStorage.getItem("loggedInUser");
          if (!usuario) return alert("Debes iniciar sesión para guardar el lavado.");

          const obtenerSeleccionado = (clase) => { /* ... tu función ... */
              const checks = [...document.querySelectorAll(`.${clase} input[type='checkbox']:checked`)];
              // Asegurarse que los IDs son correctos si el selector es por clase padre
               // O mejor, seleccionar por ID directamente si es posible
              // EJ: const check1 = document.getElementById('suciedad-op1'); etc.
              // Para obtener el texto, quizás es mejor tener el valor en un 'data-value' o en el 'value' del input
              // return checks.map(c => c.value || c.parentElement.textContent.trim()); // Preferir value si existe
               return checks.map(c => c.parentElement.textContent.trim()); // Mantener el tuyo por ahora
           };
          const nivelSuciedad = obtenerSeleccionado("suciedad");
          const centrifugado = obtenerSeleccionado("centrifugado");
          const tejido = obtenerSeleccionado("tejido");
          const temperatura = document.getElementById("temperatura")?.value;
          const duracion = document.getElementById("duracion")?.value;
          const detergente = document.getElementById("detergente")?.value;

          // Rehacer validación con los IDs/elementos correctos
           let valido = true;
           if (!document.querySelector('.suciedad input[type=checkbox]:checked')) { valido = false; console.error("Validación Fallida: Suciedad"); }
           if (!document.querySelector('.centrifugado input[type=checkbox]:checked')) { valido = false; console.error("Validación Fallida: Centrifugado");}
           if (!document.querySelector('.tejido input[type=checkbox]:checked')) { valido = false; console.error("Validación Fallida: Tejido");}
           // Sliders deberían tener valor por defecto, pero chequear por si acaso
           if (!temperatura || !duracion || !detergente) { valido = false; console.error("Validación Fallida: Sliders");}


          if (!valido) {
              alert("Por favor selecciona una opción en cada categoría para guardar.");
              return;
           }

          // Crear objeto lavado (asumiendo que obtenerSeleccionado funciona o se ajusta)
           const lavadoPersonalizado = {
               usuario,
               nombre: `Personalizado ${nivelSuciedad[0]}`, // Nombre simple
               nivelSuciedad: nivelSuciedad[0],
               temperatura: `${temperatura}°C`,
               centrifugado: centrifugado[0].match(/\d+\s*rpm/i) ? centrifugado[0].match(/\d+\s*rpm/i)[0] : centrifugado[0], // Extraer solo valor numérico si es posible
               duracion: `${duracion} min`,
               detergente: `${detergente} ml`,
               tejido: tejido[0], // Asume selección única
               favorito: false
           };

           console.log("Guardando lavado:", lavadoPersonalizado);
          fetch('/guardar-lavado-personalizado', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(lavadoPersonalizado)
           })
          .then(res => { if (!res.ok) throw new Error('Error servidor al guardar'); return res.text(); })
          .then(msg => {
              console.log("Respuesta Guardar:", msg);
              socket.emit('personalizadoSaved');
              // Ya no hablamos aquí, procesarConfirmacion lo hace si se usó voz
              setTimeout(() => { window.location.href = "/mobile"; }, 500); // Redirigir
           })
          .catch(err => { console.error(err); alert("Error al guardar lavado."); });
      });
   } else { console.error("Botón .button-save no encontrado!"); }


  const backBtn = document.getElementById("back-button");
  if (backBtn) backBtn.addEventListener("click", (e) => { e.preventDefault(); salirPersonalizacion(); }); // Reutilizar

  const homeBtn = document.getElementById("home-button"); // ID diferente al de la barra nav
  if (homeBtn) homeBtn.addEventListener("click", (e) => { e.preventDefault(); salirPersonalizacion(); }); // Reutilizar


}); // FIN DOMContentLoaded

// --- Función loadJuegos (si es relevante en esta página) ---
function loadJuegos() { /* ... */ }