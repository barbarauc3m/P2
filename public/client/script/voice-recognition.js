// voice-recognition.js
class VoiceRecognition {
    constructor(socket) {
        this.socket = socket;
        this.recognition = null;
        this.isActive = false;
        this.init();
    }

    init() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn("API de reconocimiento de voz no soportada en este navegador");
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = 'es-ES';

        this.recognition.onresult = (event) => {
            const last = event.results.length - 1;
            const transcript = event.results[last][0].transcript.trim().toLowerCase();

            console.log(transcript);
            
            if (transcript.includes("reanudar")) {
                console.log("Comando de voz 'Reanudar' detectado");
                voiceControl.stop();
                this.socket.emit('juego2-reanudar');
            }
        };

        this.recognition.onerror = (event) => {
            console.error("Error en reconocimiento:", event.error);
        };

        this.recognition.onend = () => {
            if (this.isActive) {
                this.start();
            }
        };
    }

    start() {
        if (!this.recognition) return;
        
        try {
            this.isActive = true;
            this.recognition.start();
            console.log("Reconocimiento de voz activado");
        } catch (error) {
            console.error("Error al iniciar:", error);
        }
    }

    stop() {
        if (!this.recognition) return;
        
        this.isActive = false;
        this.recognition.stop();
        console.log("Reconocimiento de voz detenido");
    }

    toggle(activate) {
        activate ? this.start() : this.stop();
    }
}

// Exportación para usar en otros archivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VoiceRecognition; // Para Node/CommonJS
} else {
    window.VoiceRecognition = VoiceRecognition; // Para navegador
}