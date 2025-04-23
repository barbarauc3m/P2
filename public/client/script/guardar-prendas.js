// conectamos el socket de escaner-etiqueta y escaner-color
socket.on('connect', () => {});


let resultadoScanActual = null; // varoable global para almacenar el resultado del escaneo actual
const DARK_L_THRESHOLD = 35;  // % de Luminosidad por debajo = Oscuro
const LIGHT_L_THRESHOLD = 75; // % de Luminosidad por encima = Claro


// FUNCION PARA OBTENER EL NOMBRE DEL SIMBOLO
// separa el string por espacios y returnea el primer elemento ej. lavado_40 (0.95) -> lavado_40
function getSymbolName(detectedString) {
    if (!detectedString || typeof detectedString !== 'string' || detectedString === 'No detectado') {
        return null;
    }
    
    const parts = detectedString.split(' ');  
    return parts[0];
}

// FUNCION PARA COMPROBAR LA COMPATIBILIDAD 
function checkCompatibility(scanResult, lavado) {
    if (!lavado) return { compatible: false, razon: "Error: No se encontró el lavado seleccionado." };

    // console.log("Comprobando compatibilidad:", scanResult, "con Lavado:", lavado);

    // COMPATIBILIDAD ETIQUETA
    if (scanResult.type === 'etiqueta') {
        const simbolosDetectados = scanResult.data; // Ej: {'Temperatura': 'lavado_40 (0.95)', 'Delicadeza': 'lavado_delicado (0.88)', ...}
        let razonesIncompatibilidad = [];

        // 1. comprobar No Lavar
        const tempSymbolName = getSymbolName(simbolosDetectados['Temperatura']);
        if (tempSymbolName === 'lavado_no') {
            razonesIncompatibilidad.push("La etiqueta indica 'No Lavar'.");
            return { compatible: false, razon: razonesIncompatibilidad.join(' ') };
        }

        // 2. comprobar Temperatura
        const tempLavado = parseInt(lavado.temperatura);
        if (tempSymbolName && tempSymbolName.startsWith('lavado_') && !tempSymbolName.includes('mano') && tempSymbolName !== 'lavado_no' && tempSymbolName !== 'lavado_normal') {
            try {
                 const tempMaxSimbolo = parseInt(tempSymbolName.split('_')[1]);
                 if (!isNaN(tempLavado) && !isNaN(tempMaxSimbolo) && tempLavado > tempMaxSimbolo) {
                     razonesIncompatibilidad.push(`Temperatura del lavado (${tempLavado}°) supera la máxima de la etiqueta (${tempMaxSimbolo}°).`);
                 }
            } catch (e) {
                 console.error("Error parseando temperatura del símbolo:", tempSymbolName, e);
            }
        }
        // Comprobar si el símbolo es lavado_a_mano y el nombre del lavado no es lavado a mano
        if (tempSymbolName === 'lavado_a_mano') {
             console.warn("Advertencia: Etiqueta indica lavado a mano, programa seleccionado no lo es explícitamente.");
        }


        // 3. comprobar Lejía ***NO IMPLEMENTADO AUN EN NUESTRO MODELO, YA QUE AHORA NO HAY NIGNUNA OPCION DE METER LEJIA EN EL LAVADO***
        // aunque no este implementado lo dejamos aqui para que se vea como se implementaria
        const lejiaSymbolName = getSymbolName(simbolosDetectados['Lejía']);
        const usaLejiaLavado = lavado.detergente?.toLowerCase().includes('lejía') || lavado.detergente?.toLowerCase().includes('bleach');

        if (lejiaSymbolName === 'lejia_no' && usaLejiaLavado) {
            razonesIncompatibilidad.push("La etiqueta indica 'No usar Lejía', pero el lavado parece incluirla.");
        }
        if (lejiaSymbolName === 'lejia_si' && !usaLejiaLavado) {
            console.log("Info: Etiqueta permite lejía, pero el lavado no la incluye.");
        }

        // 4. comprobar delicadeza vs centrifugado
        const delicadezaSymbolName = getSymbolName(simbolosDetectados['Delicadeza']);

        const rpmLavadoStr = lavado.centrifugado; // RPM del lavado
        let rpmLavado = NaN;

        if (rpmLavadoStr !== undefined && rpmLavadoStr !== null) {
            // quitamos rpm al final y lo convertimos a int ej. '800 rpm' -> 800
            rpmLavado = parseInt(String(rpmLavadoStr).replace(/[^0-9]/g, ''), 10);
        }

        // console.log(`Check Delicadeza: Simbolo='${delicadezaSymbolName}', RPM Lavado='${rpmLavadoStr}' (parsed as ${rpmLavado})`);

        // realizamso el check si son validos los valores
        if (delicadezaSymbolName && !isNaN(rpmLavado)) {
            const maxRpmPermitidoDelicado = 700; // para lavados delicados y muy delicados

            // Lista de símbolos que requieren centrifugado bajo
            const simbolosDelicados = ['lavado_delicado', 'lavado_muy_delicado', 'lavado_a_mano'];

            if (simbolosDelicados.includes(delicadezaSymbolName)) {
                // si el simbolo es delicado o muy delicado
                // comprobamos si el RPM del lavado es mayor que el permitido
                if (rpmLavado > maxRpmPermitidoDelicado) {
                    // dep
                    razonesIncompatibilidad.push(`Centrifugado (${rpmLavado} RPM) es demasiado alto para etiqueta '${delicadezaSymbolName}' (máx ${maxRpmPermitidoDelicado} RPM).`);
                }
            }
            // lavado normal es compatible con todo
            else if (delicadezaSymbolName === 'lavado_normal') {
                 // console.log("Símbolo 'lavado_normal' detectado, compatible con cualquier RPM.");
            }
        } 


        // RESULTADO FINAL POPUP
        if (razonesIncompatibilidad.length > 0) {
            return { compatible: false, razon: razonesIncompatibilidad.join(' ') };
        } else {
             const algunSimboloUtil = tempSymbolName || getSymbolName(simbolosDetectados['Delicadeza']) || lejiaSymbolName;
             if (!algunSimboloUtil || algunSimboloUtil === 'No detectado') {
                  return { compatible: true, razon: "No se detectaron símbolos claros, compatibilidad asumida." };
             }
            return { compatible: true, razon: "Símbolos de etiqueta parecen compatibles." };
        }
    }
    // COMPATIBILIDAD DE COLOR
    else if (scanResult.type === 'color') {
        const colorData = scanResult.data;
        const L = parseFloat(colorData.L);
        let tipoColada = 'colores';

        // coger el "tipo de colada" del lavado aka que si es blancos, colores u oscuros
        if (lavado.tipoColada && ['blancos', 'colores', 'oscuros'].includes(lavado.tipoColada)) {
            tipoColada = lavado.tipoColada;
        }
        // para los lavados predeterminados lo cogemos del nombre del lavado
        else if (lavado.nombre === 'Lavado Ropa Blanca') tipoColada = 'blancos'; 
        else if (lavado.nombre === 'Lavado Ropa Oscura') tipoColada = 'oscuros';

        // para los lavados personalizados lo cogemos del tipo de tejido
        else if (lavado.tejido) {
            const tejidoSeleccionado = lavado.tejido.toLowerCase();
            if (tejidoSeleccionado === 'blanco') tipoColada = 'blancos';
            else if (tejidoSeleccionado === 'color') tipoColada = 'colores';
            else tipoColada = 'colores';
        } 
        // console.log("tipo colada", tipoColada);

        // comprobamos la compatibilidad de kolor
        if (tipoColada === 'blancos' && L < LIGHT_L_THRESHOLD) {
             return { compatible: false, razon: `Color ${colorData.hex} (${colorData.tone}) podría desteñir en lavado de Blancos.` };
        }
        if (tipoColada === 'oscuros' && L > DARK_L_THRESHOLD) {
             return { compatible: false, razon: `Color claro ${colorData.hex} (${colorData.tone}) podría mancharse en lavado de Oscuros.` };
        }
        if (tipoColada === 'colores' && (L < DARK_L_THRESHOLD || L > LIGHT_L_THRESHOLD)) {
            console.log(`Advertencia leve: Prenda (${colorData.hex} / ${colorData.tone}) es muy oscura/clara para 'Colores Mixtos'.`);
        }
        return { compatible: true, razon: `Color ${colorData.hex} (${colorData.tone}) parece compatible con lavado de tipo '${tipoColada}'.` };
    }
}


// FUNCIONES PARA EL POPUP DE ESCNAEO
function mostrarPopupCompatibilidad(scanResult) {
    resultadoScanActual = scanResult; // guarda el resultado actual para usarlo en 'añadirPrendaConfirmada'

    const lavado = JSON.parse(localStorage.getItem('lavadoSeleccionado'));
    const compatibilidad = checkCompatibility(scanResult, lavado);

    const popup = document.getElementById("popup-compatibilidad");
    if (!popup) {
        console.error("Error: No se encuentra el elemento #popup-compatibilidad en el HTML.");
        return;
    }
    const titulo = popup.querySelector(".popup-titulo"); 
    const mensaje = popup.querySelector(".popup-mensaje");
    const razon = popup.querySelector(".popup-razon");

    // a ver si no van a existir AB
     if (!titulo || !mensaje || !razon) {
         console.error("Error: Faltan elementos .popup-titulo, .popup-mensaje o .popup-razon dentro de #popup-compatibilidad.");
         return;
     }

    // si la prenda es compatible o no
    // console.log("Compatibilidad:", compatibilidad);
    if (compatibilidad.compatible) {
        titulo.textContent = "¡PRENDA COMPATIBLE!"; // compatible uwu
        mensaje.textContent = "Esta prenda parece ser compatible con los ajustes del lavado seleccionado.";
        razon.textContent = `Detalle: ${compatibilidad.razon}`;
        titulo.style.color = "#28a745"; // verdecito el titulo
    } else {
        titulo.textContent = "¡PRENDA NO COMPATIBLE!"; // :(
        mensaje.textContent = "Cuidado, esta prenda podría dañarse o dañar otras con los ajustes seleccionados.";
        razon.textContent = `Razón: ${compatibilidad.razon}`;
        titulo.style.color = "#dc3545"; // rojo danger
    }

    popup.style.display = "flex"; // muestra el popup
}

// FUNCION PARA CERRAR EL POPUP
function cerrarPopupCompatibilidad() {
    const popup = document.getElementById("popup-compatibilidad");
    if (popup) {
        popup.style.display = "none"; // cerrao
    }
    resultadoScanActual = null;
}

// FUNCION PARA AÑADIR UNA PRENDA AL LAVADO
function anadirPrendaConfirmada() {
    if (!resultadoScanActual) {
        console.error("No hay resultado de escaneo para añadir.");
        cerrarPopupCompatibilidad();
        return;
    }

    const lavadoJSON = localStorage.getItem('lavadoSeleccionado');
    if (!lavadoJSON) {
        console.error("No se encontró 'lavadoSeleccionado' en localStorage.");
        cerrarPopupCompatibilidad();
        return;
    }

    const lavado = JSON.parse(lavadoJSON);

    // inicializamos array de prendas escaneadas 
    if (!Array.isArray(lavado.prendasEscaneadas)) {
        lavado.prendasEscaneadas = [];
    }

    // indice para cad prenda
    const index = lavado.prendasEscaneadas.length + 1;
    const nuevaPrenda = {
        id: `prenda${index}`,
        scanType: resultadoScanActual.type, // etiqueta o color
        scanData: resultadoScanActual.data // color hexadecimal o los símbolos de las etiquetas
    };

    lavado.prendasEscaneadas.push(nuevaPrenda);

    // guardamos el lavado ACTUALIZADO de vuelta en localStorage
    localStorage.setItem('lavadoSeleccionado', JSON.stringify(lavado));

    // console.log("Prenda añadida al lavado:", nuevaPrenda);
    alert("Prenda añadida al lavado actual.");

    // MOSTRAMOS LAS PRENDAS AÑADIDAS ESTO VA FUEGO
    socket.emit('updateServerDisplay', JSON.parse(localStorage.getItem('lavadoSeleccionado')));


    cerrarPopupCompatibilidad();
}

function cancelarAnadirPrenda() {
    // console.log("prenda no <añadida");
    cerrarPopupCompatibilidad(); m
}



document.addEventListener('DOMContentLoaded', () => {
    // comprobamos si hay algun escaneo guardado en sessionStorage
    const resultadoJSON = sessionStorage.getItem('ultimoResultadoScan');
    if (resultadoJSON) {
        sessionStorage.removeItem('ultimoResultadoScan'); // fuera para limpiar
        const scanResult = JSON.parse(resultadoJSON);
        // console.log("Resultado de escaneo recuperado de sessionStorage:", scanResult);
        setTimeout(() => mostrarPopupCompatibilidad(scanResult), 150); // esperamos un poco para mostrar el popup
    }

    // botones del popup de compatibilidad
    const btnAnadir = document.getElementById('btn-anadir-prenda');
    const btnCancelar = document.getElementById('btn-cancelar-prenda');

    if (btnAnadir) {
        btnAnadir.addEventListener('click', anadirPrendaConfirmada);
    }
    if (btnCancelar) {
        btnCancelar.addEventListener('click', cancelarAnadirPrenda);
    }


     // cerrar popup haciendo clic fuera 
     const popupCompatibilidad = document.getElementById("popup-compatibilidad");
     if (popupCompatibilidad) {
         popupCompatibilidad.addEventListener('click', function(event) {
             if (event.target === popupCompatibilidad) {
                 cancelarAnadirPrenda();
             }
         });
     }

});