const API_URL = import.meta.env.VITE_API_URL;
const grid = document.getElementById('productos-grid');
const filtroMarca = document.getElementById('marca');
const filtroProposito = document.getElementById('proposito');
const cantidadProductos = document.getElementById('cantidad');
const loader = document.getElementById('loader');
const btnVerCarrito = document.getElementById('ver-carrito');
const modalCarrito = document.getElementById('modal-carrito');
const cerrarModalCarrito = document.getElementById('cerrar-modal-carrito');
const carritoListado = document.getElementById('carrito-listado');
const btnCotizarPDF = document.getElementById('cotizar-pdf');
const carritoCantidad = document.getElementById('carrito-cantidad');
// Eliminar importación de jsPDF y logoBase64
// import jsPDF from 'jspdf';
// const logoBase64 = undefined;

// Inicializar AOS
import AOS from 'aos';
import 'aos/dist/aos.css';
AOS.init({ duration: 600, once: false });

// Refrescar AOS tras mostrar/ocultar modales
function openModal(modal) {
  modal.style.display = 'flex';
  modal.classList.remove('fade-out');
  modal.classList.add('fade-in');
  if (window.AOS) setTimeout(() => AOS.refreshHard(), 10);
}
function closeModal(modal) {
  modal.classList.remove('fade-in');
  modal.classList.add('fade-out');
  setTimeout(() => { modal.style.display = 'none'; if (window.AOS) AOS.refreshHard(); }, 350);
}

async function obtenerProductos() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('No se pudo obtener productos');
    return await res.json();
  } catch (e) {
    showToast('Error al obtener productos');
    return [];
  }
}

function llenarFiltros(productos) {
  const marcas = new Set();
  const propositos = new Set();

  productos.forEach(p => {
    marcas.add(p.marca);
    propositos.add(p.proposito);
  });

  [...marcas].forEach(m => {
    const option = document.createElement('option');
    option.value = m;
    option.textContent = m;
    filtroMarca.appendChild(option);
  });

  [...propositos].forEach(p => {
    const option = document.createElement('option');
    option.value = p;
    option.textContent = p;
    filtroProposito.appendChild(option);
  });
}

function mostrarProductos(productos) {
  grid.innerHTML = '';
  productos.forEach((p, idx) => {
    const card = document.createElement('div');
    card.className = 'producto';
    card.innerHTML = `
      <img src="${p.imagen_base64}" alt="${p.nombre}" />
      <h3>${p.nombre}</h3>
      <p>Marca: ${p.marca}</p>
      <p>Propósito: ${p.proposito}</p>
      <p>UNIDADES DISPONIBLES: ${p.cantidad}</p>
    `;
    card.addEventListener('click', () => mostrarModalProducto(p));
    grid.appendChild(card);
  });
}

// Modal y carrito
const modal = document.getElementById('modal-producto');
const modalInfo = document.getElementById('modal-info');
const cerrarModal = document.getElementById('cerrar-modal');
const inputCantidad = document.getElementById('modal-cantidad');
const btnAgregarCarrito = document.getElementById('agregar-carrito');

let productoActual = null;
let carrito = [];

function mostrarModalProducto(producto) {
  productoActual = producto;
  modalInfo.innerHTML = `
    <img src="${producto.imagen_base64}" alt="${producto.nombre}" />
    <h3>${producto.nombre}</h3>
    <p>Marca: ${producto.marca}</p>
    <p>Propósito: ${producto.proposito}</p>
    <p>UNIDADES DISPONIBLES: ${producto.cantidad}</p>
  `;
  // Generar controles de cantidad y botón
  const acciones = modalInfo.parentElement.querySelector('.modal-acciones');
  acciones.innerHTML = `
    <div class="cantidad-control" id="cantidad-control">
      <button type="button" class="cantidad-btn" id="btn-restar">-</button>
      <input type="number" id="modal-cantidad" min="1" value="1" max="${producto.cantidad}" />
      <button type="button" class="cantidad-btn" id="btn-sumar">+</button>
    </div>
    <button id="agregar-carrito">Agregar al carrito</button>
  `;
  // Asignar eventos a los controles
  document.getElementById('btn-restar').onclick = () => {
    const input = document.getElementById('modal-cantidad');
    let val = parseInt(input.value, 10) || 1;
    if (val > 1) input.value = val - 1;
  };
  document.getElementById('btn-sumar').onclick = () => {
    const input = document.getElementById('modal-cantidad');
    let val = parseInt(input.value, 10) || 1;
    if (val < producto.cantidad) input.value = val + 1;
  };
  document.getElementById('agregar-carrito').onclick = () => {
    const cantidad = parseInt(document.getElementById('modal-cantidad').value, 10);
    if (!productoActual || isNaN(cantidad) || cantidad < 1) return;
    if (cantidad > productoActual.cantidad) {
      showToast('No hay suficientes unidades disponibles.');
      return;
    }
    // Buscar si ya está en el carrito
    const idx = carrito.findIndex(item => item.id === productoActual.id);
    if (idx > -1) {
      carrito[idx].cantidad += cantidad;
    } else {
      carrito.push({ ...productoActual, cantidad });
    }
    closeModal(modal);
    actualizarCarritoCantidad();
    guardarCarrito();
  };
  modal.style.display = 'flex';
}

cerrarModal.addEventListener('click', () => {
  modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
  if (e.target === modal) modal.style.display = 'none';
});

btnAgregarCarrito.addEventListener('click', () => {
  const cantidad = parseInt(inputCantidad.value, 10);
  if (!productoActual || isNaN(cantidad) || cantidad < 1) return;
  if (cantidad > productoActual.cantidad) {
    showToast('No hay suficientes unidades disponibles.');
    return;
  }
  // Buscar si ya está en el carrito
  const idx = carrito.findIndex(item => item.id === productoActual.id);
  if (idx > -1) {
    carrito[idx].cantidad += cantidad;
  } else {
    carrito.push({ ...productoActual, cantidad });
  }
  modal.style.display = 'none';
  actualizarCarritoCantidad();
  guardarCarrito();
});

function actualizarCarritoCantidad() {
  const total = carrito.reduce((sum, item) => sum + item.cantidad, 0);
  carritoCantidad.textContent = total;
}

function mostrarCarrito() {
  if (carrito.length === 0) {
    carritoListado.innerHTML = '<p>El carrito está vacío.</p>';
  } else {
    let tabla = `<div class="carrito-table-responsive"><table class="carrito-table"><thead><tr><th>Producto</th><th>Marca</th><th>Propósito</th><th>Cantidad</th><th>Eliminar</th></tr></thead><tbody>`;
    tabla += carrito.map((item, idx) => `
      <tr>
        <td class="carrito-td-producto">${item.nombre}</td>
        <td class="carrito-td-marca">${item.marca}</td>
        <td class="carrito-td-proposito">${item.proposito}</td>
        <td class="carrito-td-cantidad">
          <div class="carrito-cantidad-control">
            <button class="restar-cantidad" data-idx="${idx}" aria-label="Restar">-</button>
            <input type="number" class="input-cantidad" data-idx="${idx}" min="1" max="${item.cantidad_disponible || 99}" value="${item.cantidad}" />
            <button class="sumar-cantidad" data-idx="${idx}" aria-label="Sumar">+</button>
          </div>
        </td>
        <td class="carrito-td-eliminar"><button class="eliminar-producto" data-idx="${idx}" aria-label="Eliminar">🗑️</button></td>
      </tr>
    `).join('');
    tabla += '</tbody></table></div>';
    carritoListado.innerHTML = tabla;
    // Eventos para editar cantidad y eliminar igual que antes...
    document.querySelectorAll('.restar-cantidad').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        if (carrito[idx].cantidad > 1) {
          carrito[idx].cantidad--;
          guardarCarrito();
          mostrarCarrito();
          actualizarCarritoCantidad();
        }
      });
    });
    document.querySelectorAll('.sumar-cantidad').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        const max = carrito[idx].cantidad_disponible || 99;
        if (carrito[idx].cantidad < max) {
          carrito[idx].cantidad++;
          guardarCarrito();
          mostrarCarrito();
          actualizarCarritoCantidad();
        }
      });
    });
    document.querySelectorAll('.input-cantidad').forEach(input => {
      input.addEventListener('change', () => {
        const idx = parseInt(input.getAttribute('data-idx'), 10);
        let val = parseInt(input.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        const max = carrito[idx].cantidad_disponible || 99;
        if (val > max) val = max;
        carrito[idx].cantidad = val;
        guardarCarrito();
        mostrarCarrito();
        actualizarCarritoCantidad();
      });
    });
    document.querySelectorAll('.eliminar-producto').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        carrito.splice(idx, 1);
        actualizarCarritoCantidad();
        guardarCarrito();
        mostrarCarrito();
      });
    });
  }
  actualizarBotonCotizar();
  validarCamposCotizacion();
  openModal(modalCarrito);
}

function actualizarBotonCotizar() {
  const btn = document.getElementById('cotizar-pdf');
  if (!carrito || carrito.length === 0) {
    btn.disabled = true;
    btn.style.opacity = '0.6';
    btn.style.cursor = 'not-allowed';
  } else {
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
  }
}

// Al abrir el modal del carrito, si el input de teléfono está vacío, poner el combo en México y el input vacío
btnVerCarrito.addEventListener('click', () => {
  mostrarCarrito();
  const codigoPais = document.getElementById('codigo-pais');
  const telefonoInput = document.getElementById('telefono-cliente');
  if (codigoPais) codigoPais.value = '52';
  if (telefonoInput) telefonoInput.value = '';
  modalCarrito.classList.add('fade-in');
  setTimeout(() => modalCarrito.classList.remove('fade-in'), 700);
});
cerrarModalCarrito.addEventListener('click', () => {
  modalCarrito.style.display = 'none';
});
window.addEventListener('click', (e) => {
  if (e.target === modalCarrito) modalCarrito.style.display = 'none';
});

// Actualizar contador cada vez que se agrega al carrito
btnAgregarCarrito.addEventListener('click', () => {
  actualizarCarritoCantidad();
});

// Inicializar contador al cargar
function guardarCarrito() {
  localStorage.setItem('carrito', JSON.stringify(carrito));
}
function cargarCarrito() {
  const data = localStorage.getItem('carrito');
  if (data) {
    try {
      carrito = JSON.parse(data);
    } catch (e) {
      carrito = [];
    }
  }
}
// Cargar carrito al iniciar
cargarCarrito();
actualizarCarritoCantidad();
actualizarBotonCotizar();

function validarCamposCotizacion() {
  const nombreInput = document.getElementById('nombre-cliente');
  const telefonoInput = document.getElementById('telefono-cliente');
  const codigoPais = document.getElementById('codigo-pais');
  const btn = document.getElementById('cotizar-pdf');
  const nombreValido = nombreInput.value.trim().length > 0;
  let telefono = telefonoInput.value.trim();
  let codigo = codigoPais ? codigoPais.value : '52';
  let telefonoValido = false;
  // Solo dígitos
  telefono = telefono.replace(/\D/g, '');
  if (codigo === '52') {
    telefonoValido = telefono.length === 10;
  } else {
    telefonoValido = telefono.length >= 7 && telefono.length <= 15;
  }
  if (nombreValido && telefonoValido) {
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
  } else {
    btn.disabled = true;
    btn.style.opacity = '0.6';
    btn.style.cursor = 'not-allowed';
  }
}

// Validar en tiempo real
['input', 'change'].forEach(evt => {
  document.getElementById('nombre-cliente').addEventListener(evt, validarCamposCotizacion);
  document.getElementById('telefono-cliente').addEventListener(evt, validarCamposCotizacion);
  const codigoPais = document.getElementById('codigo-pais');
  if (codigoPais) codigoPais.addEventListener(evt, validarCamposCotizacion);
});

// Preparar evento para cotizar PDF (implementación siguiente paso)
btnCotizarPDF.addEventListener('click', async (e) => {
  const nombreInput = document.getElementById('nombre-cliente');
  const telefonoInput = document.getElementById('telefono-cliente');
  const codigoPais = document.getElementById('codigo-pais');
  const servicioSelect = document.getElementById('servicio-solicitado');
  const servicio = servicioSelect ? servicioSelect.value : 'venta';
  let telefono = telefonoInput.value.trim().replace(/\D/g, '');
  let codigo = codigoPais ? codigoPais.value : '52';
  if (!nombreInput.value.trim() || (codigo === '52' ? telefono.length !== 10 : (telefono.length < 7 || telefono.length > 15))) {
    e.preventDefault();
    validarCamposCotizacion();
    return;
  }
  if (!carrito || carrito.length === 0) {
    showToast('No hay productos en el carrito para cotizar.');
    return;
  }
  const nombreCliente = nombreInput.value.trim();
  const telefonoCliente = `+${codigo} ${telefono}`;
  // Definir el destino del correo según el servicio
  let destinoCorreo = [];
  if (servicio === 'venta') destinoCorreo = ['ventas@neumaticstools.com'];
  else if (servicio === 'renta') destinoCorreo = ['rentas@neumaticstools.com', 'admin@neumaticstools.com'];
  else if (servicio === 'servicio') destinoCorreo = ['servicio@neumaticstools.com', 'soporte@neumaticstools.com'];

  let error = false;
  if (!nombreCliente) {
    nombreInput.focus();
    nombreInput.style.borderColor = 'red';
    setTimeout(() => nombreInput.style.borderColor = '', 1200);
    error = true;
  }
  if ((codigo === '52' && telefono.length !== 10) || (codigo !== '52' && (telefono.length < 7 || telefono.length > 15))) {
    telefonoInput.focus();
    telefonoInput.style.borderColor = 'red';
    setTimeout(() => telefonoInput.style.borderColor = '', 1200);
    error = true;
  }
  if (error) return;
  // Simular verificación de disponibilidad (puedes reemplazar por fetch a backend)
  let disponibilidadOk = true;
  for (const item of carrito) {
    if (item.cantidad > item.cantidad_disponible) {
      disponibilidadOk = false;
      break;
    }
  }
  if (!disponibilidadOk) {
    showToast('Uno o más productos no tienen suficiente disponibilidad.');
    return;
  }
  // Mostrar PDF generado por el backend en un modal
  try {
    const API_PDF_DOWNLOAD = import.meta.env.VITE_API_PDF_DOWNLOAD;
    const response = await fetch(`${API_PDF_DOWNLOAD}?descargar=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ carrito, nombre: nombreCliente, telefono: telefonoCliente, servicio, destinoCorreo })
    });
    if (!response.ok) throw new Error('No se pudo generar el PDF');
    const pdfBlob = await response.blob();
    const url = URL.createObjectURL(pdfBlob);
    const modalPDF = document.getElementById('modal-pdf');
    const iframePDF = document.getElementById('iframe-pdf');
    const btnDescargarPDF = document.getElementById('descargar-pdf');
    iframePDF.src = url;
    openModal(modalPDF);
    btnDescargarPDF.onclick = () => {
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cotizacion.pdf';
      a.click();
    };
    document.getElementById('cerrar-modal-pdf').onclick = () => {
      closeModal(modalPDF);
      iframePDF.src = '';
      URL.revokeObjectURL(url);
    };
    // Después de mostrar el PDF, enviar la cotización por correo
    enviarCotizacionBackend({ carrito, nombre: nombreCliente, telefono: telefonoCliente, servicio, destinoCorreo })
      .then(() => {
        setTimeout(() => {
          showToast('Cotización generada y enviada. La empresa se pondrá en contacto contigo.', 5500);
          // Reiniciar carrito
          carrito = [];
          guardarCarrito();
          actualizarCarritoCantidad();
          mostrarCarrito();
          nombreInput.value = '';
          telefonoInput.value = '';
        }, 300);
      })
      .catch(() => {
        showToast('Error al enviar la cotización. Intenta de nuevo más tarde.');
      });
    closeModal(modalCarrito);
  } catch (err) {
    showToast('No se pudo generar la previsualización del PDF.');
  }
});

function filtrar(productos) {
  const marca = filtroMarca.value;
  const proposito = filtroProposito.value;

  const filtrados = productos.filter(p =>
    (marca === '' || p.marca === marca) &&
    (proposito === '' || p.proposito === proposito)
  );

  mostrarProductos(filtrados);
}

// Animación fade-in para la página
window.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('fade-in');
  btnLogin.style.display = '';
});

function enviarCotizacionBackend({carrito, nombre, telefono, servicio, destinoCorreo}) {
  return fetch(import.meta.env.VITE_API_PDF, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      carrito,
      nombre,
      telefono,
      servicio,
      destinoCorreo
    })
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  loader.style.display = 'block';
  grid.style.display = 'none';
  const productos = await obtenerProductos();
  llenarFiltros(productos);
  mostrarProductos(productos);
  loader.style.display = 'none';
  grid.style.display = '';

  filtroMarca.addEventListener('change', () => filtrar(productos));
  filtroProposito.addEventListener('change', () => filtrar(productos));
});

function showToast(msg, duration = 5500) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-30px) scale(0.95)';
    setTimeout(() => container.removeChild(toast), 400);
  }, duration);
}

// --- Autenticación y administración ---
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const modalLogin = document.getElementById('modal-login');
const cerrarModalLogin = document.getElementById('cerrar-modal-login');
const formLogin = document.getElementById('form-login');
const loginError = document.getElementById('login-error');

let usuarioAutenticado = false;

async function verificarRedLocal() {
  try {
    const res = await fetch('/usuarios/login', { method: 'OPTIONS' });
    console.log('OPTIONS /usuarios/login status:', res.status);
    if (res.status === 200) {
      btnLogin.style.display = '';
      console.log('Botón de login mostrado');
    } else {
      console.log('No se muestra el botón, status:', res.status);
    }
  } catch (e) {
    console.log('Error en fetch OPTIONS /usuarios/login', e);
  }
}
btnLogin.addEventListener('click', (e) => {
  e.preventDefault();
  modalLogin.style.display = 'flex';
});
cerrarModalLogin.addEventListener('click', () => {
  modalLogin.style.display = 'none';
  loginError.style.display = 'none';
});

// Cambia login/logout a URL absoluta y credentials: 'include'
formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nombre = document.getElementById('login-nombre').value;
  const contrasena = document.getElementById('login-contrasena').value;
  try {
    const res = await fetch('http://localhost:4000/usuarios/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ nombre, contrasena })
    });
    const data = await res.json();
    if (res.ok) {
      usuarioAutenticado = true;
      btnLogin.style.display = 'none';
      btnLogout.style.display = '';
      modalLogin.style.display = 'none';
      loginError.style.display = 'none';
      mostrarAdmin();
    } else {
      loginError.textContent = data.message || 'Error de autenticación';
      loginError.style.display = '';
    }
  } catch (err) {
    loginError.textContent = 'Error de red';
    loginError.style.display = '';
  }
});

btnLogout.addEventListener('click', async (e) => {
  e.preventDefault();
  await fetch('http://localhost:4000/usuarios/logout', { credentials: 'include' });
  usuarioAutenticado = false;
  btnLogin.style.display = '';
  btnLogout.style.display = 'none';
  ocultarAdmin();
});

// Eliminar panel de administración y CRUD de productos/usuarios
// Eliminar funciones mostrarAdmin, ocultarAdmin, cargarUsuariosAdmin, cargarProductosAdmin, y los formularios relacionados
// Eliminar eventos y código de edición/eliminación/agregado de productos y usuarios
// Mantener solo la lógica de mostrar productos y actualizar el catálogo

// Mantener funciones:
// - obtenerProductos
// - llenarFiltros
// - mostrarProductos
// - actualizarCatalogo
// - showToast
// - lógica de carrito y cotización

// Actualización automática del catálogo cada 30 segundos
setInterval(() => {
  actualizarCatalogo();
}, 30000); // 30,000 ms = 30 segundos
