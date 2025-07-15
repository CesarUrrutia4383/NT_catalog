//CSS DE ESTILOS PARA LAS SECCIONES DE LAS PAGINAS
import "./css/normalize.css";
import "./css/variables.css";
import "./css/estilos.css";
import "./css/header.css";
import "./css/hero.css";
import "./css/caracteristicas.css";
import "./css/footer.css";
import "./css/marcas.css";
import "./css/contacto.css";
import "./css/mision-vision.css"
import "./css/catalog.css";

//FUNCIONES DE JAVASCRIPT
import "./js/video.js";
import "./js/slideshow.js";
import "./js/caracteristicas.js";
import "./js/aos_init.js"

//AOS PARA ANIMACIONES
import AOS from 'aos';
import 'aos/dist/aos.css';

AOS.init({
  duration: 1000,
  once: true
});

//EXPORT PARA VISUALIZACION LOCAL
export default {
  server: {
    host: true,  // esto equivale a 0.0.0.0, hace visible el servidor en la red local
    port: 3000,  // el puerto que uses
  },
};