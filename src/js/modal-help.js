/*
  Robust modal-help initializer
  - Ensures a single modal exists (injects if missing)
  - Attaches listeners after DOM ready
  - Handles opening/closing from any page (header/footer links)
  - Locks body scroll when modal is open and restores it on close
  - Re-queries modal elements at runtime to avoid stale refs
*/

const HELP_PDF_PATH = '/assets/pdf/ayuda.pdf';

function ensureHelpModal() {
  return new Promise((resolve) => {
    if (document.getElementById('modal-pdf')) {
      resolve();
      return;
    }

    const modalHTML = `
      <div id="modal-pdf" class="modal-producto" style="display:none; z-index:2000; background:rgba(0,0,0,0.7);">
        <div class="modal-contenido" style="max-width:980px; width:96vw; padding:0; background:#fff; display:flex; flex-direction:column;">
          <span class="modal-cerrar" id="cerrar-modal-pdf" style="position:absolute;top:18px;right:24px;font-size:2.2rem;z-index:3100;cursor:pointer;background:#fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.10);padding:0.2em 0.5em;border:2px solid #ff8f1c;">&times;</span>
          <iframe id="iframe-pdf" style="width:100%;height:80vh;border:none;display:block;"></iframe>
          <div style="text-align:right;padding:1rem; background:#fff;">
            <a id="descargar-pdf" download style="background:#ff8f1c;color:#fff;border:none;border-radius:8px;padding:0.6rem 1.5rem;font-size:1.1rem;font-weight:bold;cursor:pointer;text-decoration:none;">Descargar PDF</a>
          </div>
        </div>
      </div>
    `;

    // Ensure body exists before adding modal
    if (document.body) {
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      resolve();
    } else {
      // If body doesn't exist yet, wait for it
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

function lockBodyScroll() {
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
}

function unlockBodyScroll() {
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
}

function openHelpModal(e) {
  if (e && e.preventDefault) e.preventDefault();
  ensureHelpModal();

  const modal = document.getElementById('modal-pdf');
  const iframe = document.getElementById('iframe-pdf');
  const descargar = document.getElementById('descargar-pdf');
  const cerrar = document.getElementById('cerrar-modal-pdf');

  if (iframe) {
    // set src only when opening to avoid preloading issues
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

  // attach/refresh close handlers
  if (cerrar) {
    cerrar.onclick = function(evt) {
      evt.stopPropagation();
      closeHelpModal();
    };
  }

  // clicking overlay closes
  if (modal) {
    modal.onclick = function(evt) {
      if (evt.target === modal) closeHelpModal();
    };
  }
}

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

function initHelpBindings() {
  ensureHelpModal();

  const linkAyudaHeader = document.getElementById('link-ayuda-header');
  const linkAyudaFooter = document.getElementById('link-ayuda-footer');

  [linkAyudaHeader, linkAyudaFooter].forEach(link => {
    if (!link) return;
    // ensure single listener
    link.removeEventListener('click', openHelpModal);
    link.addEventListener('click', openHelpModal);
  });

  // ensure close button (in case modal existed in DOM already)
  const cerrar = document.getElementById('cerrar-modal-pdf');
  if (cerrar) cerrar.onclick = (e) => { e.stopPropagation(); closeHelpModal(); };

  // also allow ESC to close
  window.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeHelpModal();
  });
}

// Initialize when DOM is ready and modal exists
async function init() {
  await ensureHelpModal(); // Esperar a que el modal exista
  initHelpBindings();     // Luego adjuntar los listeners
}

// Function to attach help link handlers
function attachHelpLinkHandlers() {
  const helpLinks = document.querySelectorAll('[id^="link-ayuda"]');
  helpLinks.forEach(link => {
    if (!link.dataset.helpHandlerAttached) {
      link.addEventListener('click', openHelpModal);
      link.dataset.helpHandlerAttached = 'true';
    }
  });
}

// Run initialization
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

// Also watch for dynamically added help links
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length) {
      attachHelpLinkHandlers();
    }
  }
});

// Start observing once DOM is ready
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
