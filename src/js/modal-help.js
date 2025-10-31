/*
  Modal help initializer
  - Binds header/footer ayuda links to open the help PDF modal
  - Loads /assets/pdf/ayuda.pdf into the iframe on demand
  - Sets download link href (or button onclick)
  - Clears iframe on close or overlay click
*/

// Función para inyectar el modal de ayuda si no existe
function createHelpModal() {
  if (!document.getElementById('modal-pdf')) {
    const modalHTML = `
      <div id="modal-pdf" class="modal-producto" style="display:none; z-index:2000; background:rgba(0,0,0,0.7);">
        <div class="modal-contenido" style="max-width:900px; width:98vw; padding:0;" data-aos="fade-up" data-aos-delay="100">
          <span class="modal-cerrar" id="cerrar-modal-pdf" style="position:absolute;top:18px;right:24px;font-size:2.2rem;z-index:3100;cursor:pointer;background:#fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.10);padding:0.2em 0.5em 0.2em 0.5em;border:2px solid #ff8f1c;transition:background 0.2s,color 0.2s;">&times;</span>
          <iframe id="iframe-pdf" style="width:100%;height:80vh;border:none;display:block;"></iframe>
          <div style="text-align:right;padding:1rem;">
            <button id="descargar-pdf" style="background:#ff8f1c;color:#fff;border:none;border-radius:8px;padding:0.6rem 1.5rem;font-size:1.1rem;font-weight:bold;cursor:pointer;">Descargar PDF</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }
}

// Crear el modal si no existe
createHelpModal();

// Obtener referencias a los elementos
const linkAyudaHeader = document.getElementById('link-ayuda-header');
const linkAyudaFooter = document.getElementById('link-ayuda-footer');
const modalPdfEl = document.getElementById('modal-pdf');
const iframePdf = document.getElementById('iframe-pdf');
const descargarPdf = document.getElementById('descargar-pdf');
const cerrarPdf = document.getElementById('cerrar-modal-pdf');

function openAyudaModal(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (iframePdf) iframePdf.src = '/assets/pdf/ayuda.pdf';
  if (descargarPdf) {
    if (descargarPdf.tagName && descargarPdf.tagName.toLowerCase() === 'a') {
      descargarPdf.href = '/assets/pdf/ayuda.pdf';
    } else {
      descargarPdf.onclick = () => window.open('/assets/pdf/ayuda.pdf', '_blank');
    }
  }
  if (modalPdfEl) {
    modalPdfEl.style.display = 'flex';
    modalPdfEl.classList.remove('fade-out');
    modalPdfEl.classList.add('fade-in');
  }
}

[linkAyudaHeader, linkAyudaFooter].forEach(link => {
  if (!link) return;
  link.addEventListener('click', openAyudaModal);
});

if (cerrarPdf) {
  cerrarPdf.addEventListener('click', () => {
    if (modalPdfEl) modalPdfEl.style.display = 'none';
    if (iframePdf) iframePdf.src = '';
  });
}

window.addEventListener('click', function(e) {
  if (!modalPdfEl) return;
  if (e.target === modalPdfEl) {
    modalPdfEl.style.display = 'none';
    if (iframePdf) iframePdf.src = '';
  }
});

export default {};
