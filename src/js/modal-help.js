/*
  Inicializador robusto del modal de ayuda
  - Asegura que exista un único modal (lo inyecta si falta)
  - Adjunta oyentes después de que el DOM esté listo
  - Maneja la apertura/cierre desde cualquier página (enlaces en encabezado/pie de página)
  - Bloquea el desplazamiento del cuerpo cuando el modal está abierto y lo restaura al cerrar
  - Vuelve a consultar los elementos del modal en tiempo de ejecución para evitar referencias obsoletas
*/

const HELP_PDF_PATH = '/assets/pdf/ayuda.pdf';

/**
 * Asegura que el modal de ayuda exista en el DOM.
 * Si no existe, lo crea e inyecta junto con sus estilos.
 * @returns {Promise<void>} Promesa que se resuelve cuando el modal está listo.
 */
function ensureHelpModal() {
  return new Promise((resolve) => {
    // Agregar estilos base si no existen
    if (!document.getElementById('modal-help-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'modal-help-styles';
      styleSheet.textContent = `
        .modal-producto {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          display: none;
          align-items: center !important;
          justify-content: center !important;
          background-color: rgba(0,0,0,0.45) !important;
          z-index: 4000 !important;
          padding: 24px !important;
          overflow: hidden !important;
          width: 100vw !important;
          height: 100vh !important;
        }

        .modal-producto.fade-in {
          display: flex !important;
          opacity: 1 !important;
          visibility: visible !important;
        }

        .modal-producto.fade-out {
          opacity: 0 !important;
          transition: opacity .25s ease-out !important;
        }

        .modal-producto .modal-contenido {
          position: relative !important;
          max-width: 980px !important;
          width: 96vw !important;
          max-height: 90vh !important;
          background: #fafafa !important;
          border-radius: 12px !important;
          border: 4px solid #ff8f1c !important;
          box-shadow: 0 12px 36px rgba(0,0,0,0.18) !important;
          padding: 0 !important;
          display: flex !important;
          flex-direction: column !important;
        }
      `;
      document.head.appendChild(styleSheet);
    }

    // Comprobar si el modal ya existe
    if (document.getElementById('modal-pdf')) {
      resolve();
      return;
    }

    const modalHTML = `
      <div id="modal-pdf" class="modal-producto" style="display:none;">
        <div class="modal-contenido">
          <span class="modal-cerrar" id="cerrar-modal-pdf" style="position:absolute;top:18px;right:24px;font-size:2.2rem;z-index:3100;cursor:pointer;background:#fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.10);padding:0.2em 0.5em;border:2px solid #ff8f1c;">&times;</span>
          <iframe id="iframe-pdf" style="width:100%;height:80vh;border:none;display:block;"></iframe>
          <div style="text-align:right;padding:1rem; background:#fff;">
            <a id="descargar-pdf" download style="background:#ff8f1c;color:#fff;border:none;border-radius:8px;padding:0.6rem 1.5rem;font-size:1.1rem;font-weight:bold;cursor:pointer;text-decoration:none;">Descargar PDF</a>
          </div>
        </div>
      </div>
    `;

    // Asegurar que el body exista antes de agregar el modal
    if (document.body) {
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      resolve();
    } else {
      // Si el body aún no existe, esperar por él
      const observer = new MutationObserver((mutations, obs) => {
        if (document.body) {
          document.body.insertAdjacentHTML('beforeend', modalHTML);
          obs.disconnect();
          resolve();
        }
      });

      observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    }
  });
}

/**
 * Bloquea el desplazamiento del cuerpo de la página.
 */
function lockBodyScroll() {
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
}

/**
 * Desbloquea el desplazamiento del cuerpo de la página.
 */
function unlockBodyScroll() {
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
}

/**
 * Abre el modal de ayuda cargando el PDF correspondiente.
 * @param {Event} e - El evento que disparó la acción.
 */
function openHelpModal(e) {
  if (e && e.preventDefault) e.preventDefault();
  // Asegurar que el modal existe (inyectarlo si falta)
  ensureHelpModal();

  // Abrir el modal de ayuda PDF (comportamiento consistente)
  const modal = document.getElementById('modal-pdf');
  const iframe = document.getElementById('iframe-pdf');
  const descargar = document.getElementById('descargar-pdf');
  const cerrar = document.getElementById('cerrar-modal-pdf');

  if (iframe) {
    // Establecer src solo al abrir para evitar problemas de precarga
    iframe.src = HELP_PDF_PATH;
  }

  if (descargar) {
    descargar.href = HELP_PDF_PATH;
    descargar.onclick = () => { window.open(HELP_PDF_PATH, '_blank'); };
  }

  if (modal) {
    modal.style.display = 'flex';
    modal.classList.remove('fade-out');
    modal.classList.add('fade-in');
    lockBodyScroll();
  }

  // Adjuntar/refrescar manejadores de cierre
  if (cerrar) {
    cerrar.onclick = function (evt) {
      evt.stopPropagation();
      closeHelpModal();
    };
  }

  // Cerrar al hacer clic en la superposición (overlay)
  if (modal) {
    modal.onclick = function (evt) {
      if (evt.target === modal) closeHelpModal();
    };
  }
}

/**
 * Cierra el modal de ayuda.
 */
function closeHelpModal() {
  const modal = document.getElementById('modal-pdf');
  const iframe = document.getElementById('iframe-pdf');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('fade-in');
    modal.classList.add('fade-out');
  }
  if (iframe) iframe.src = '';
  unlockBodyScroll();
}

/**
 * Inicializa los enlaces de ayuda y eventos globales.
 */
function initHelpBindings() {
  ensureHelpModal();

  const helpLinks = document.querySelectorAll('[id^="link-ayuda"]');
  helpLinks.forEach(link => {
    if (!link) return;
    // Asegurar oyente único
    link.removeEventListener('click', openHelpModal);
    link.addEventListener('click', openHelpModal);
  });

  // Asegurar botón de cierre (en caso de que el modal ya existiera en el DOM)
  const cerrar = document.getElementById('cerrar-modal-pdf');
  if (cerrar) cerrar.onclick = (e) => { e.stopPropagation(); closeHelpModal(); };

  // Permitir cerrar con tecla ESC
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeHelpModal();
  });
}

// Inicializar cuando el DOM esté listo y el modal exista
async function init() {
  await ensureHelpModal(); // Esperar a que el modal exista
  initHelpBindings();     // Luego adjuntar los listeners
}

// Función para adjuntar manejadores a los enlaces de ayuda
function attachHelpLinkHandlers() {
  const helpLinks = document.querySelectorAll('[id^="link-ayuda"]');
  helpLinks.forEach(link => {
    if (!link.dataset.helpHandlerAttached) {
      link.addEventListener('click', openHelpModal);
      link.dataset.helpHandlerAttached = 'true';
    }
  });
}

// Ejecutar inicialización
function tryInit() {
  init().then(() => {
    attachHelpLinkHandlers();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', tryInit);
} else {
  tryInit();
}

// Observar también enlaces de ayuda agregados dinámicamente
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length) {
      attachHelpLinkHandlers();
    }
  }
});

// Comenzar a observar una vez que el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
} else {
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

export { init as initHelpModal };

export default {};
