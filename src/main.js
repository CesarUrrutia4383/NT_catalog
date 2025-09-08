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
 * @description Exporta la configuración del servidor para desarrollo local.
 * Hace visible el servidor en la red local en el puerto 3000.
 */
export default {
  server: {
    host: true,  // esto equivale a 0.0.0.0, hace visible el servidor en la red local
    port: 3000,  // el puerto que uses
  },
};
