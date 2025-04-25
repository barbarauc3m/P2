
    document.addEventListener('DOMContentLoaded', () => {
    // console.log("DOM Personalizado Cargado.");

    const socket = io(); // conectar al socket
    const usuarioActual = localStorage.getItem('loggedInUser');
    socket.on('connect', () => {});
    // emitir evento para cambiar de pagina en el server
    socket.emit('requestDisplayChange', { 
        targetPage: '/display/lavado-personalizado' 
    });


        // ****************+TODO ESTO ES PARA LO MANUAL, SIN VOZ**************
    // 1. Nivel de suciedad 
    document.querySelectorAll('.suciedad .dropdown-menu input[type=checkbox]').forEach(chk => {
        chk.addEventListener('change', e => {
            if (!e.target.checked) {
                return; // si lo desamarcamos, no hacemos nada
            }
            // desmarcar otros checkboxs cuando marco uno
            document.querySelectorAll('.suciedad .dropdown-menu input[type=checkbox]').forEach(otherChk => {
                if (otherChk !== e.target) {
                    otherChk.checked = false;
                }
            });
            const valor = e.target.parentElement.textContent.trim(); // texto del checkbox
            // emitimos el valor que ha seleccionado el user al server
            socket.emit('updatePersonalizadoOption', { 
                category: 'suciedad', 
                value: valor });
        });
    });

    // 2. Temperatura 
    const tempSlider = document.getElementById('temperatura');
    const tempValueSpan = document.getElementById('tempValue');
    if (tempSlider && tempValueSpan) {
        // actualizamos el span al mover slider
        tempSlider.addEventListener('input', () => {
            const value = tempSlider.value;
            tempValueSpan.textContent = value; // actualiza span
            const v = `${value}°C`;
            // emitimos el valor que ha seleccionado el user al server
            socket.emit('updatePersonalizadoOption', { 
                category: 'temperatura', 
                value: v });
        });
        // mostrar y emitir valor inicial
        tempValueSpan.textContent = tempSlider.value;
        // emitimos el valor inicial al server
        socket.emit('updatePersonalizadoOption', { 
            category: 'temperatura', 
            value: `${tempSlider.value}°C` 
        });
    }


    // 3. Centrifugado 
    document.querySelectorAll('.centrifugado .dropdown-menu input[type=checkbox]').forEach(chk => {
        chk.addEventListener('change', e => {
            if (!e.target.checked) return; // como antes, no hacemos nada si lo desmarcamos
            document.querySelectorAll('.centrifugado .dropdown-menu input[type=checkbox]').forEach(otherChk => {
                if (otherChk !== e.target) otherChk.checked = false; // desmarcamos los otros
            });
            const valor = e.target.parentElement.textContent.trim(); // texto del checkbox
            // emitimos el valor que ha seleccionado el user al server
            socket.emit('updatePersonalizadoOption', { 
                category: 'centrifugado',
                value: valor });
        });
    });

    // 4. Duración
    const durSlider = document.getElementById('duracion');
    const durValueSpan = document.getElementById('durValue'); // como antes, span para mostrar valor
    if (durSlider && durValueSpan) {
        // actualizamos span al mover slider
        durSlider.addEventListener('input', () => {
            const value = durSlider.value;
            durValueSpan.textContent = value; // actualiza span
            const v = `${value} min`;
            // emitimos el valor que ha seleccionado el user al server
            socket.emit('updatePersonalizadoOption', { 
                category: 'duracion', 
                value: v });
        });
        // mostrar y emitir valor inicial
        durValueSpan.textContent = durSlider.value;
        socket.emit('updatePersonalizadoOption', { 
            category: 'duracion', 
            value: `${durSlider.value} min` 
        });
    }


    // 5. Detergente
    const detSlider = document.getElementById('detergente');
    const detValueSpan = document.getElementById('detValue');
    // lo mismo de siempre
    if (detSlider && detValueSpan) {
        detSlider.addEventListener('input', () => {
            const value = detSlider.value;
            detValueSpan.textContent = value; 
            const v = `${value} ml`;
            socket.emit('updatePersonalizadoOption', { 
                category: 'detergente', 
                value: v });
        });
        detValueSpan.textContent = detSlider.value;
        socket.emit('updatePersonalizadoOption', { 
            category: 'detergente', 
            value: `${detSlider.value} ml` 
        });
    } 


    // 6. Tejido 
    document.querySelectorAll('.tejido .dropdown-menu input[type=checkbox]').forEach(chk => {
        chk.addEventListener('change', e => {
            if (!e.target.checked) return;
            document.querySelectorAll('.tejido .dropdown-menu input[type=checkbox]').forEach(otherChk => {
                if (otherChk !== e.target) otherChk.checked = false;
            });
            const valor = e.target.parentElement.textContent.trim();
            socket.emit('updatePersonalizadoOption', { 
                category: 'tejido', 
                value: valor });
        });
    });


    // ******VOZ BOMBA QUE TE RESPONDE EPICAMENTE********

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition; // Compatibilidad APIS uwu
    const recognition = SpeechRecognition ? new SpeechRecognition() : null;
    const synth = window.speechSynthesis;
    let vocesDisponibles = [];
    let ultimoPromptHablado = "";
    let estadoConversacion = "idle"; // idle, suciedad, temperatura, centrifugado, duracion, detergente, tejido, confirmar, finished
    let reintentando = false; // Flag para evitar bucles de error

    // palabras clave para los comandos de voz que puede decir el usuario
    const tempPalabras = {
        'veinte': 20, 'veinticinco': 25, 
        'treinta': 30, 'treinta y cinco': 35, 
        'cuarenta': 40, 'cuarenta y cinco': 45, 
        'cincuenta': 50, 'cincuenta y cinco': 55, 
        'sesenta': 60, 'sesenta y cinco': 65, 
        'setenta': 70, 'setenta y cinco': 75, 
        'ochenta': 80, 'ochenta y cinco': 85, 
        'noventa': 90
    };

    const duracionPalabras = { 
        'quince': 15, 
        'veinte': 20, 'veinticinco': 25, 
        'treinta': 30, 'treinta y cinco': 35, 
        'cuarenta': 40, 'cuarenta y cinco': 45,
        'cincuenta': 50, 'cincuenta y cinco': 55, 
        'sesenta': 60, 'una hora': 60, 'sesenta y cinco': 65, 'una hora y cinco': 65,
        'setenta': 70, 'una hora y diez': 70, 'setenta y cinco': 75, 'una hora y quince': 75, 'una hora y cuarto': 75,
        'ochenta': 80, 'una hora y veine': 80, 'ochenta y cinco': 85, 'una hora y veinticinco': 85,
        'noventa': 90, 'hora y media': 90, 'noventa y cinco': 95, 'una hora y treintaicinco': 90,
        'cien': 100, 'una hora y cuarenta': 100, 'ciento cinco': 105, 'una hora y tres cuartos': 105, 'una hora y cuarenta y cinco': 105,
        'ciento diez': 110, 'una hora y cincuenta': 110, 'ciento quince': 115, 'una hora y cuarenta y cinco': 115,
        'ciento veinte': 120, 'dos horas': 120
    };
    const detergentePalabras = { 
        'diez': 10, 'quince': 15, 
        'veinte': 20, 'veinticinco': 25, 
        'treinta': 30, 'treinta y cinco': 35, 
        'cuarenta': 40, 'cuarenta y cinco': 45, 
        'cincuenta': 50, 'cincuenta y cinco': 55, 
        'sesenta': 60, 'sesenta y cinco': 65, 
        'setenta': 70, 'setenta y cinco': 75, 
        'ochenta': 80, 'ochenta y cinco': 85, 
        'noventa': 90, 'noventa y cinco': 95, 
        'cien': 100
    };

    // FUNCIONES AUXILIARES DE VOZ
    // FUNCION PARA CHECKEAR QUE EL NAVEGADOR SOPORTA LA API DE VOZ
    function checkBrowserSupport() {
        let supported = true;
        if (!('speechSynthesis' in window)) { 
            console.error("❌ SpeechSynthesis no soportado."); 
            alert("Navegador no soporta hablar."); 
            supported = false; 
        }
        if (!recognition) { 
            console.error("❌ SpeechRecognition no soportado."); 
            alert("Navegador no soporta reconocer voz.");
            supported = false; 
        }
        return supported;
    }

    // FUNCION PARA CARGAR VOCES DISPONIBLES
    function cargarVoces() {
        vocesDisponibles = synth.getVoices();
        if (vocesDisponibles.length === 0 && synth.onvoiceschanged !== undefined) {
            synth.onvoiceschanged = () => vocesDisponibles = synth.getVoices();
        }
        // console.log(`Voces cargadas: ${vocesDisponibles.length}`);
    }

    // FUNCION PARA HABLAR (que te responda la maquinita)
    function hablar(texto, iniciarEscuchaDespues = true, onendCallback = null) {
        if (!synth || !texto) return;
        synth.cancel();
        if (recognition) { 
            recognition.stop(); 
        }

        ultimoPromptHablado = texto; // guardamos el último texto hablado
        const utterance = new SpeechSynthesisUtterance(texto); // utterance para hablar
        utterance.lang = 'es-ES'; // lenguaje (spanish pero se puede poner chino :0)
        const vozEsp = vocesDisponibles.find(voz => voz.lang === 'es-ES' || voz.lang.startsWith('es-')); // vocecita que repsonde en español
        if (vozEsp) {
            utterance.voice = vozEsp; // si hay voz en español, la usamos
        }
        else {
            console.warn("Voz es-ES no encontrada, usando default."); // si no hay usamos la default
        }   

        // configuración de eventos
        utterance.onend = () => {
            if (typeof onendCallback === 'function') {
                // pausa para que se escuche bien y no se solape con el reconocimiento
                setTimeout(onendCallback, 100);
            } else if (iniciarEscuchaDespues && recognition && estadoConversacion !== 'idle' && estadoConversacion !== 'finished') {
                recognition.start(); // iniciar escucha después de hablar
            } else {
                console.log("🎤 Escucha NO iniciada.");
            }
        };
        utterance.onerror = (e) => { 
            console.error('Error SpeechSynthesis:', e.error); // errorciño por si pasa algo
        };

        // console.log(` Hablando: "${texto.substring(0, 50)}..."`);
        setTimeout(() => synth.speak(utterance), 50); // pequeña pausa para que no se solape
    }

    // FUNCION PARA CONFIGURAR EL RECONOCIMIENTO DE VOZ
    function configurarReconocimiento() {
        if (!recognition) return;
        recognition.lang = 'es-ES'; // reconocemos español
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
            const comando = event.results[event.results.length - 1][0].transcript.toLowerCase().trim(); // ultimo resultado
            // console.log('Usuario dijo:', comando);
            reintentando = false;
            procesarComandoGeneral(comando); // procesar el comando
        };

        recognition.onerror = (event) => {
            console.error('Error reconocimiento:', event.error);
            if (reintentando) { // evitamos un bucle si el error persiste y dice que use las manitas que no vocaliza
                console.warn("Error persiste, deteniendo reintento.");
                hablar("Sigo sin poder entenderte. Intenta usar los controles manuales.", false);
                estadoConversacion = 'idle'; // reiniciamos flujo de la conversacion al inicio
                return;
            }
            if (event.error === 'no-speech') { // no se ha escuchado nada
                hablar("No he escuchado nada. ¿Puedes repetir?", true);
                reintentando = true;
            } else if (event.error === 'not-allowed') { // no se han dado permimsos para el uso del micrófono
                alert("Necesito permiso para usar el micrófono.");
                estadoConversacion = 'idle';
            } else { // otro tipo de error
                hablar("Ha ocurrido un error raro. Intentémoslo de nuevo.", false);
                setTimeout(repetirUltimoPrompt, 1500);
                reintentando = true;
            }
        };
        recognition.onend = () => { 
            console.log('Reconocimiento detenido.'); // pararsus
        };
    }

    // FUNCION PARA PROCESAR LOS COMANDOS GENERALES (repetir, salir, etc.)
    function procesarComandoGeneral(comando) {
        // 1. Ccomandos globales que pueden escucharse en cualquier momento
        if (comando === "repetir" || comando === "repite" || comando === "repetir último") { 
            repetirUltimoPrompt(); // si dice que repita repetimos el ultimo prompt
            return; 
        }
        if (comando === "empezar de nuevo" || comando === "reiniciar") { 
            reiniciarLavadoCompleto(); // empezamos de nuevo 
            return; 
        }
        if (comando === "salir" || comando === "volver al menú" || comando === "volver" ) { 
            salirPersonalizacion(); 
            return; 
        }

        // 2. Procesar según el estado
        // console.log(`Procesando comando "${comando}" en estado: ${estadoConversacion}`);
        switch (estadoConversacion) { // dependiendo en el paso que estemos de la conversacion pues procesamos un estado u otro
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

    // FUNCIONES PARA CADA PASO DE LA CONVERSACION

    // 1. SUCIEDAD
    function preguntarSuciedad() {
        estadoConversacion = 'suciedad';
        hablar("Para iniciar el personalizado de lavado, comienza diciendo el nivel de suciedad de tu ropa. Opción 1: ropa a penas usada. Opción 2: Ropa de uso diario. u Opción 3: Manchas visibles.", true);
    }

    function procesarSuciedad(comando) {
        let idCheckbox = null; 
        let opcionNum = null;
        const comandoLimpio = comando.replace(/ó/g, 'o').replace("uno", "1").replace("dos", "2").replace("tres", "3"); // normalizar
        // dependiendo de lo que diga el usuario, marcamos un checkbox u otro
        if (comandoLimpio.includes("opcion 1") || comandoLimpio.includes("uno") || comandoLimpio.includes("ropa a penas usada")) { 
            idCheckbox = "suciedad-op1"; 
            opcionNum = 1; }
        else if (comandoLimpio.includes("opcion 2") || comandoLimpio.includes("dos") || comandoLimpio.includes("ropa de uso diario")) { 
            idCheckbox = "suciedad-op2"; 
            opcionNum = 2; }
        else if (comandoLimpio.includes("opcion 3") || comandoLimpio.includes("tres") || comandoLimpio.includes("manchas visibles")) { 
            idCheckbox = "suciedad-op3"; 
            opcionNum = 3; }

        if (idCheckbox) {
            if (marcarCheckboxUnico(idCheckbox, '.suciedad input[type=checkbox]')) { // selecciona el checkbox
                hablar(`Opción ${opcionNum} seleccionada.`, false, preguntarTemperatura); // cuando acaba de decir la respuesta llama al siguiente paso
            } else { 
                errorAlActualizar("suciedad"); 
            }
        } else { 
            hablar("No entendí la opción. Por favor, di opción 1, 2 o 3.", true); 
        } // si no entendió nada
    }

    // 2. TEMPERATURA
    function preguntarTemperatura() {
        estadoConversacion = 'temperatura';
        hablar("Continuaremos con la temperatura. Dime un número entre 20 y 90 grados.", true);
    }

    function procesarTemperatura(comando) {
        let temp = null;
        const numeros = comando.match(/\d+/g);
        if (numeros && numeros.length > 0) { temp = parseInt(numeros[0], 10); }
        else {
            const comandoLimpio = comando.replace(/ grados/g, '').replace(/ centigrados/g, '').replace(/centígrados/g, '').trim(); // quitamos los grados
            for (const palabra in tempPalabras) { // para todas las palabras seleccionadas
                if (comandoLimpio.includes(palabra)) { // si la palabra está en el comando
                    temp = tempPalabras[palabra]; // asignamos 
                    break; 
                } 
            }
        }
        if (temp !== null) {
            if (temp >= 20 && temp <= 90) { // si esta dentro del rango
                const slider = document.getElementById('temperatura');
                const span = document.getElementById('tempValue');
                if (slider && span) {
                    slider.value = temp; span.textContent = temp;
                    slider.dispatchEvent(new Event('input', { bubbles: true })); // disparar el evento de input
                    hablar(`Perfecto, ${temp} grados configurado.`, false, preguntarCentrifugado); // next
                } else { 
                    errorAlActualizar("temperatura"); 
                }
            } else { 
                hablar(`La temperatura ${temp} está fuera del rango de 20 a 90. Dime otra.`, true); 
            }
        } else { 
            hablar("No entendí la temperatura. Di un número entre 20 y 90.", true); // no entendio ni papa
        }
    }

    // 3. CENTRIFUGADO (la misma logica que siempre ya ni pongo comentarios)
    function preguntarCentrifugado() {
        estadoConversacion = 'centrifugado';
        hablar("Ahora el centrifugado. ¿Quieres 600, 800 o 1200 revoluciones por minuto?", true);
    }

    function procesarCentrifugado(comando) {
        let idCheckbox = null; 
        let revoluciones = null;
        const comandoLimpio = comando.replace(/\s*revoluciones\s*(por|de)?\s*minuto/gi, '').replace('mil doscientos', '1200').replace('ochocientos', '800').replace('seiscientos', '600');
        if (comandoLimpio.includes("600") || comandoLimpio.includes("seiscientos") || comandoLimpio.includes("seiscientas")) { 
            idCheckbox = "centrifugado-600"; 
            revoluciones = 600; 
        }
        else if (comandoLimpio.includes("800") || comandoLimpio.includes("ochocientos") || comandoLimpio.includes("ochocientas")) { 
            idCheckbox = "centrifugado-800"; 
            revoluciones = 800; 
        }
        else if (comandoLimpio.includes("1200") || comandoLimpio.includes("mil doscientos") || comandoLimpio.includes("mil doscientas")) { 
            idCheckbox = "centrifugado-1200"; 
            revoluciones = 1200; 
        }

        if (idCheckbox) {
            if (marcarCheckboxUnico(idCheckbox, '.centrifugado input[type=checkbox]')) {
                hablar(`Trato hecho, ${revoluciones} revoluciones.`, false, preguntarDuracion); //  next
            } else { 
                errorAlActualizar("centrifugado"); 
            }
        } else {
            hablar("No reconocí las revoluciones. Di 600, 800 o 1200.", true); 
        }
    }

    // 4. DURACION
    function preguntarDuracion() {
        estadoConversacion = 'duracion';
        hablar("¿Cuánto tiempo quieres que dure? Puedes poner entre 15 y 120 minutos.", true);
    }

    function procesarDuracion(comando) {
        let duracion = null;
        const numeros = comando.match(/\d+/g);
        if (numeros && numeros.length > 0) { 
            duracion = parseInt(numeros[0], 10); 
        }
        else {
            const comandoLimpio = comando.replace(/ minutos?/g, '').replace(/ hora y media/g, 'hora y media').replace(/ una hora/g, 'una hora').replace(/ dos horas/g, 'dos horas').trim();
            for (const palabra in duracionPalabras) { 
                if (comandoLimpio.includes(palabra)) { 
                    duracion = duracionPalabras[palabra]; 
                    break; 
                } 
            }
        }
        if (duracion !== null) {
            const slider = document.getElementById('duracion'); 
            const span = document.getElementById('durValue');
            const min = slider ? parseInt(slider.min) : 15; 
            const max = slider ? parseInt(slider.max) : 120;
            if (duracion >= min && duracion <= max) {
                if (slider && span) {
                    slider.value = duracion; span.textContent = duracion;
                    slider.dispatchEvent(new Event('input', { bubbles: true }));
                    hablar(`De acuerdo, ${duracion} minutos.`, false, preguntarDetergente); // SIGUIENTEEE
                } else { 
                    errorAlActualizar("duración"); 
                }
            } else { 
                hablar(`La duración ${duracion} está fuera de rango (${min}-${max}). Dime otra.`, true); 
            }
        } else { 
            hablar("No entendí la duración. Di un número de minutos entre 15 y 120.", true); 
        }
    }

    // 5. DETERGENTE
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
                for (const palabra in detergentePalabras) { 
                    if (comandoLimpio.includes(palabra)) { 
                        detergente = detergentePalabras[palabra]; 
                        break; 
                    } 
                }
            }
            if (detergente !== null) {
                const slider = document.getElementById('detergente'); const span = document.getElementById('detValue');
                const min = slider ? parseInt(slider.min) : 10; const max = slider ? parseInt(slider.max) : 100;
                if (detergente >= min && detergente <= max) {
                    if (slider && span) {
                        slider.value = detergente; span.textContent = detergente;
                        slider.dispatchEvent(new Event('input', { bubbles: true }));
                        hablar(`Perfecto, ${detergente} mililitros.`, false, preguntarTejido);
                    } else { 
                        errorAlActualizar("detergente"); 
                    }
                } else { 
                    hablar(`La cantidad ${detergente} está fuera de rango (${min}-${max}). Dime otra.`, true); 
                }
            } else { 
                hablar("No entendí la cantidad. Di un número entre 10 y 100.", true); 
            }
    }

    // 6. TEJIDO POR ULTIMO
        function preguntarTejido() {
            estadoConversacion = 'tejido';
            hablar("Ya casi estamos. Dime el tipo de tejido: Algodón, Ropa Blanca, Color, Sintético, Lana o Mezcla.", true);
        }

        function procesarTejido(comando) {
            let idCheckbox = null; let tejidoNombre = null;
            const comandoLimpio = comando.toLowerCase().replace('ropa ', '').replace('de ', '').replace('colores', 'color');
            if (comandoLimpio.includes("algodon") || comandoLimpio.includes("algodón")) { 
                idCheckbox = "tejido-algodon"; 
                tejidoNombre = "Algodón"; 
            }
            else if (comandoLimpio.includes("blanca") || comandoLimpio.includes("blanco") || comandoLimpio.includes("blancas") || comandoLimpio.includes("blancos")) {  
                idCheckbox = "tejido-blanca"; 
                tejidoNombre = "Ropa Blanca";
             }
            else if (comandoLimpio.includes("color") || comandoLimpio.includes("colores") || comandoLimpio.includes("colorido") || comandoLimpio.includes("colorida")) {
                 idCheckbox = "tejido-color"; 
                 tejidoNombre = "Ropa de color"; 
                }
            else if (comandoLimpio.includes("sintetico") || comandoLimpio.includes("sintético") || comandoLimpio.includes("sinteticas") || comandoLimpio.includes("sintéticas") || comandoLimpio.includes("sinteticos") || comandoLimpio.includes("sintéticos")) { 
                idCheckbox = "tejido-sintetico"; 
                tejidoNombre = "Sintético"; 
            }
            else if (comandoLimpio.includes("lana") || comandoLimpio.includes("lanas") || comandoLimpio.includes("lanoso") || comandoLimpio.includes("lanosa")) { 
                idCheckbox = "tejido-lana"; 
                tejidoNombre = "Lana"; 
            }
            else if (comandoLimpio.includes("mezcla") || comandoLimpio.includes("mezclado") || comandoLimpio.includes("mezclada") || comandoLimpio.includes("mezclados") || comandoLimpio.includes("mezcladas")) { 
                idCheckbox = "tejido-mezcla"; 
                tejidoNombre = "Mezcla"; 
            }

            if (idCheckbox) {
                if (marcarCheckboxUnico(idCheckbox, '.tejido input[type=checkbox]')) {
                    hablar(`Has seleccionado ${tejidoNombre}.`, false, preguntarConfirmacion); // Llama al siguiente
                } else { 
                    errorAlActualizar("tejido");
                 }
            } else { 
                hablar("No reconocí el tejido. Elige Algodón, Ropa Blanca, Color, Sintético, Lana o Mezcla.", true); 
            }
        }

    // 7. CONFIRMACION
    function preguntarConfirmacion() {
        estadoConversacion = 'confirmar';
        hablar("Lavado configurado. ¿Deseas guardarlo? Di sí o no.", true);
    }

    function procesarConfirmacion(comando) {
            const comandoLimpio = comando.toLowerCase();
            if (comandoLimpio.includes("sí") || comandoLimpio.includes("si") || comandoLimpio.includes("guardar") || comandoLimpio.includes("guardar lavado") || comandoLimpio.includes("vale") || comandoLimpio.includes("ok") || comandoLimpio.includes("de acuerdo") || comandoLimpio.includes("perfecto")) {
                hablar("Guardando lavado", false);
                const saveButton = document.querySelector('.button-save');
                if (saveButton) {
                    saveButton.click(); // uun click en el botón guardar
                    estadoConversacion = 'finished';
                } else {
                    errorAlActualizar("botón guardar");
                    estadoConversacion = 'idle'; // reiniciamos flujo
                }
            } else if (comandoLimpio.includes("no") || comandoLimpio.includes("no guardar") || comandoLimpio.includes("no guardar lavado") || comandoLimpio.includes("no gracias") || comandoLimpio.includes("no quiero") || comandoLimpio.includes("no lo guardes")) {
                // Habla y LUEGO llama a salir
                hablar("De acuerdo, lavado no guardado. Volviendo al menú.", false, salirPersonalizacion);
                estadoConversacion = 'finished';
            } else {
                hablar("No entendí. Por favor, di sí o no.", true); // Repite confirmación
            }
    }

    // FUNCIONES GENERALES 
    // FUNCION PARA REPETIR EL ULTIMO PROMPT HABLADO
    function repetirUltimoPrompt() {
        if (ultimoPromptHablado && estadoConversacion !== 'idle' && estadoConversacion !== 'finished') {
            console.log("Repitiendo último prompt...");
            hablar(ultimoPromptHablado, true); // repite el ulitmo prompt
        } else {
            // console.log("Nada que repetir o estado inactivo.");
            hablar("No hay nada que repetir ahora.", false);
        }
    }

    // FUNCION PARA REINICIAR TODO
    function reiniciarLavadoCompleto() {
        console.log("Reiniciando personalización...");
        // reseteamos checkboxes
        document.querySelectorAll('.suciedad input, .centrifugado input, .tejido input').forEach(chk => {
            if(chk.checked) { 
                chk.checked = false; 
                chk.dispatchEvent(new Event('change', { bubbles: true })); 
            }
        });
        // Resetear sliders y disparar input
        const tempSlider = document.getElementById('temperatura'); 
        const tempSpan = document.getElementById('tempValue');
        if(tempSlider) { 
            tempSlider.value = tempSlider.defaultValue || 60; 
            if(tempSpan) tempSpan.textContent = tempSlider.value; 
            tempSlider.dispatchEvent(new Event('input', { bubbles: true })); 
        }
        const durSlider = document.getElementById('duracion'); 
        const durSpan = document.getElementById('durValue');
        if(durSlider) { 
            durSlider.value = durSlider.defaultValue || 60; 
            if(durSpan) durSpan.textContent = durSlider.value; 
            durSlider.dispatchEvent(new Event('input', { bubbles: true })); 
        }
        const detSlider = document.getElementById('detergente'); 
        const detSpan = document.getElementById('detValue');
        if(detSlider) { detSlider.value = detSlider.defaultValue || 50; 
            if(detSpan) {
                detSpan.textContent = detSlider.value; 
                detSlider.dispatchEvent(new Event('input', { bubbles: true }));
             }
            }

        // Habla confirmación y LUEGO reinicia
        hablar("Valores reseteados.", false, preguntarSuciedad);
    }

    // FUNCION PARA SALIR DE LA PERSONALIZACION
    function salirPersonalizacion() {
        // console.log("Saliendo de personalización...");
        hablar("Volviendo al inicio.", false); // habla pero no escucha si te arrepientes te jodes
        synth.cancel();
        if(recognition) { 
            recognition.stop();
         }
        estadoConversacion = 'idle';
        if (socket && socket.connected) { 
            socket.emit("requestDisplayChange", { 
                targetPage: "/" 
            });
        }
        setTimeout(() => { window.location.href = "/mobile"; }, 1000); 
    }

    // FUNCION PARA MARCAR UN CHECKBOX UNICO
    function marcarCheckboxUnico(idCheckbox, selectorGrupo) {
        const checkbox = document.getElementById(idCheckbox);
        if (checkbox) {
            document.querySelectorAll(selectorGrupo).forEach(otherChk => {
                if (otherChk.id !== idCheckbox && otherChk.checked) { // desmarcar los demás
                    otherChk.checked = false;
                    // change en los desmarcados también si es necesario para el socket
                    otherChk.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
            if (!checkbox.checked) { // marcar solo si no estaba marcado
                checkbox.checked = true;
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            }
            return true;
        } else { console.error(`Checkbox ID "${idCheckbox}" no encontrado.`); return false; }
    }

    // FUNCION PARA MANEJAR ERRORES AL ACTUALIZAR
    function errorAlActualizar(nombreCampo) {
        console.error(`Error: No se encontró el elemento del DOM para ${nombreCampo}.`);
        hablar(`Hubo un error interno al configurar ${nombreCampo}. Deteniendo proceso.`, false);
        estadoConversacion = 'idle'; // Detener el flujo
    }

    // FUNCION PARA INICIAR EL PROCESO DE VOZ COMPLETO
    function iniciarProcesoVoz() {
        if (!checkBrowserSupport()) return;
        //console.log("Iniciando proceso de voz completo...");
        cargarVoces();
        configurarReconocimiento();
        // Esperar antes de hablar
        setTimeout(preguntarSuciedad, 1500);
    }

    // boton que inicia voz
    const botonVoz = document.getElementById("boton-voz-personalizado");
    if (botonVoz) {
        botonVoz.addEventListener('click', iniciarProcesoVoz);
    } else { // si no hay boton, iniciamos automaticamente
        console.log("Iniciando voz automáticamente en 2.5 segundos...");
        setTimeout(iniciarProcesoVoz, 2500);
    }

    // --- Código Existente: Botón Guardar, Back, Home ---
    const saveButton = document.querySelector(".button-save");
    if (saveButton) {
        saveButton.addEventListener("click", () => {
            const usuario = localStorage.getItem("loggedInUser");
            if (!usuario) return alert("Debes iniciar sesión para guardar el lavado.");

            const obtenerSeleccionado = (clase) => { 
                const checks = [...document.querySelectorAll(`.${clase} input[type='checkbox']:checked`)];
                return checks.map(c => c.parentElement.textContent.trim()); 
            };
            const nivelSuciedad = obtenerSeleccionado("suciedad");
            const centrifugado = obtenerSeleccionado("centrifugado");
            const tejido = obtenerSeleccionado("tejido");
            const temperatura = document.getElementById("temperatura")?.value;
            const duracion = document.getElementById("duracion")?.value;
            const detergente = document.getElementById("detergente")?.value;

            let valido = true;
            if (!document.querySelector('.suciedad input[type=checkbox]:checked')) { 
                valido = false; 
                console.error("Validación Fallida: Suciedad"); 
            }
            if (!document.querySelector('.centrifugado input[type=checkbox]:checked')) { 
                valido = false; 
                console.error("Validación Fallida: Centrifugado");
            }
            if (!document.querySelector('.tejido input[type=checkbox]:checked')) { 
                valido = false; 
                console.error("Validación Fallida: Tejido");
            }
            if (!temperatura || !duracion || !detergente) { 
                valido = false; 
                console.error("Validación Fallida: Sliders");
            }


            if (!valido) {
                alert("Por favor selecciona una opción en cada categoría para guardar.");
                return;
            }

            // CREAR LAVADO PERSONALIZADO
            const lavadoPersonalizado = {
                usuario,
                nombre: `Personalizado ${nivelSuciedad[0]}`,
                nivelSuciedad: nivelSuciedad[0],
                temperatura: `${temperatura}°C`,
                centrifugado: centrifugado[0].match(/\d+\s*rpm/i) ? centrifugado[0].match(/\d+\s*rpm/i)[0] : centrifugado[0], 
                duracion: `${duracion} min`,
                detergente: `${detergente} ml`,
                tejido: tejido[0], 
                favorito: false
            };

            // console.log("Guardando lavado:", lavadoPersonalizado);
            fetch('/guardar-lavado-personalizado', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lavadoPersonalizado)
            })
            .then(res => { 
                if (!res.ok) throw new Error('Error servidor al guardar'); return res.text(); })
            .then(msg => {
                console.log("Respuesta Guardar:", msg);
                socket.emit('personalizadoSaved');
                setTimeout(() => { window.location.href = "/mobile"; }, 500);
            })
            .catch(err => { console.error(err); alert("Error al guardar lavado."); });
        });
    } else { console.error("Botón .button-save no encontrado!"); }


    const backBtn = document.getElementById("back-button");
    if (backBtn) backBtn.addEventListener("click", (e) => { e.preventDefault(); salirPersonalizacion(); }); // Reutilizar

    const homeBtn = document.getElementById("home-button"); // ID diferente al de la barra nav
    if (homeBtn) homeBtn.addEventListener("click", (e) => { e.preventDefault(); salirPersonalizacion(); }); // Reutilizar


    });

    // FUNCION PARA ABRIR LAS VENTANAS DE LOS JUEGOS
    function loadJuegos() {

        // console.log("Botón de mando pulsado");
        socket.emit("abrir-juegos"); 
        window.location.href = 'pantalla-carga.html';
    }