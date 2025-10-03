/**
 * @fileoverview Punto de entrada principal de la aplicación.
 * Importa todos los archivos CSS y JavaScript necesarios.
 * También inicializa la librería AOS para animaciones al hacer scroll.
 */

// CSS DE ESTILOS PARA LAS SECCIONES DE LAS PAGINAS
import "./css/normalize.css";
import "./css/variables.css";
import "./css/estilos.css";
import "./css/hero.css";
import "./css/contacto.css";
import "./css/catalog.css";
import "./css/marcas.css";
import "./css/header.css";
import "./css/footer.css";
import "./css/variables.css";
import "./css/normalize.css";
import "./css/responsive.css";

// FUNCIONES DE JAVASCRIPT
import "./js/video.js";
import "./js/slideshow.js";
import "./js/caracteristicas.js";
import "./js/aos_init.js";
import "./js/catalog.js";

// AOS PARA ANIMACIONES
import AOS from 'aos';
import 'aos/dist/aos.css';

/**
 * @description Inicializa la librería AOS con una duración de 1000ms y ejecuta la animación solo una vez.
 * @see https://github.com/michalsnik/aos
 */
AOS.init({
  duration: 1000,
  once: true
});

/**
 * @description Directiva de seguridad para prevenir la inspección de código.
 * Deshabilita el menú contextual derecho y atajos de teclado para herramientas de desarrollador.
 */

// Deshabilitar menú contextual derecho
document.addEventListener('contextmenu', function(e) {
  e.preventDefault();
});

// Deshabilitar atajos de teclado para herramientas de desarrollador
document.addEventListener('keydown', function(e) {
  // F12
  if (e.keyCode === 123) {
    e.preventDefault();
  }
  // Ctrl+Shift+I (Inspeccionar elemento)
  if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
    e.preventDefault();
  }
  // Ctrl+U (Ver fuente)
  if (e.ctrlKey && e.keyCode === 85) {
    e.preventDefault();
  }
  // Ctrl+Shift+C (Inspeccionar elemento alternativo)
  if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
    e.preventDefault();
  }
  // Ctrl+Shift+J (Consola)
  if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
    e.preventDefault();
  }
});

/**
 * @description Exporta la configuración del servidor para desarrollo local.
 * Hace visible el servidor en la red local en el puerto 3000.
 */
export default {
  server: {
    host: true,  // esto equivale a 0.0.0.0, hace visible el servidor en la red local
    port: 3000,  // el puerto que uses
  },
};
