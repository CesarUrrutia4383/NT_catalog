/*
  Modal help initializer
  - Binds header/footer ayuda links to open the help PDF modal
  - Loads /assets/pdf/ayuda.pdf into the iframe on demand
  - Sets download link href (or button onclick)
  - Clears iframe on close or overlay click
*/
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
