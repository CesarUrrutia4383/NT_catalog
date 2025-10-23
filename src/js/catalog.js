/**
 * @fileoverview Contiene la lógica para la página de catálogo de productos.
 * Maneja la obtención, filtrado y visualización de productos, así como el carrito de compras y generación de cotizaciones.
 * @author Neumatics Tool
 */

// Forzar URLs de producción en Vercel
const API_URL = 'https://nt-backapis.onrender.com/routes/productos';
const API_PDF_URL = 'https://nt-backapis.onrender.com/routes/quote';
console.log('API URLs de producción:', { API_URL, API_PDF_URL });
const grid = document.getElementById('productos-grid');
const filtroMarca = document.getElementById('marca');
const filtroProposito = document.getElementById('proposito');
const filtroTipo = document.getElementById('tipo');
const cantidadProductos = document.getElementById('cantidad');
const loader = document.getElementById('loader');
const btnVerCarrito = document.getElementById('ver-carrito');
const modalCarrito = document.getElementById('modal-carrito');
const cerrarModalCarrito = document.getElementById('cerrar-modal-carrito');
const carritoListado = document.getElementById('carrito-listado');
const btnCotizarPDF = document.getElementById('cotizar-pdf');
const carritoCantidad = document.getElementById('carrito-cantidad');

// Inicializa AOS para animaciones
import AOS from 'aos';
import 'aos/dist/aos.css';
AOS.init({ duration: 600, once: false });

/**
 * Valida si una URL es válida y pertenece a Cloudinary.
 * @param {string} url - La URL a validar.
 * @returns {boolean} - True si es una URL válida de Cloudinary, false en caso contrario.
 */
function isValidCloudinaryUrl(url) {
  if (!url) return false;
  
  const cloudinaryPattern = /^https:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\/.*$/;
  return cloudinaryPattern.test(url);
}

/**
 * Obtiene la URL de la imagen para un producto, con fallback a una imagen por defecto.
 * @param {object} producto - El objeto producto.
 * @returns {string} - La URL de la imagen.
 */
function getImageUrl(producto) {
  if (producto.imagen_url && isValidCloudinaryUrl(producto.imagen_url)) {
    console.log('Usando URL de Cloudinary:', producto.imagen_url);
    return producto.imagen_url;
  } else {
    console.log('Usando imagen por defecto para:', producto.nombre_producto || producto.nombre);
    return '/assets/img/logo3.png';
  }
}

/**
 * Abre un modal con animación de fade-in.
 * @param {HTMLElement} modal - El elemento modal a abrir.
 */
function openModal(modal) {
  modal.style.display = 'flex';
  modal.classList.remove('fade-out');
  modal.classList.add('fade-in');
  if (window.AOS) setTimeout(() => AOS.refreshHard(), 10);
}

/**
 * Cierra un modal con animación de fade-out.
 * @param {HTMLElement} modal - El elemento modal a cerrar.
 */
function closeModal(modal) {
  modal.classList.remove('fade-in');
  modal.classList.add('fade-out');
  setTimeout(() => { modal.style.display = 'none'; if (window.AOS) AOS.refreshHard(); }, 350);
}

/**
 * Obtiene los productos desde la API.
 * @returns {Promise<Array>} - Promesa que resuelve en un array de productos.
 */
async function obtenerProductos() {
  try {
    const res = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      mode: 'cors',
      credentials: 'omit'
    });
    if (!res.ok) throw new Error('No se pudo obtener productos');
    return await res.json();
  } catch (e) {
    console.error('Error al obtener productos:', e);
    showToast('Error al obtener productos');
    return [];
  }
}

/**
 * Llena los filtros de marca y propósito con los valores disponibles.
 * @param {Array} productos - Array de productos.
 */
function llenarFiltros(productos) {
  const marcas = new Set();
  const propositos = new Set();

  // Si el backend incluye el campo 'tipo' lo usamos para llenar las opciones dinámicamente
  const tipos = new Set();

  productos.forEach(p => {
    marcas.add(p.marca);
    propositos.add(p.proposito);
    if (p.tipo) tipos.add(p.tipo);
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

  // Llenar filtro tipo dinámicamente sólo si hay valores distintos en los datos.
  // Mantener las opciones estáticas añadidas en HTML pero asegurarnos de no duplicar.
  if (tipos.size > 0) {
    // eliminar opciones que no queremos (excepto la primera 'Todos')
    const existing = Array.from(filtroTipo.querySelectorAll('option')).map(o => o.value);
    tipos.forEach(t => {
      if (!existing.includes(t)) {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        filtroTipo.appendChild(opt);
      }
    });
  }
}

/**
 * Muestra los productos en el grid.
 * @param {Array} productos - Array de productos.
 */
function mostrarProductos(productos) {
  const existingProductCards = Array.from(grid.children);
  const newProductIds = new Set(productos.map(p => p.id)); // Asume que cada producto tiene un 'id' único

  // Eliminar productos que ya no existen en la nueva lista
  existingProductCards.forEach(card => {
    const productId = card.dataset.productId;
    if (productId && !newProductIds.has(productId)) {
      grid.removeChild(card);
    }
  });

  // Crear o actualizar productos
  productos.forEach(p => {
    let card = grid.querySelector(`[data-product-id="${p.id}"]`);

    if (card) {
      // Actualizar contenido de la tarjeta existente
      const imagen = getImageUrl(p);
      const newInnerHTML = `
        <img src="${imagen}" alt="${p.nombre_producto || p.nombre}"
             onerror="this.src='/assets/img/logo3.png'; console.log('Error cargando imagen:', this.src);" />
        <h3>${p.nombre_producto || p.nombre}</h3>
        <p><b>Marca:</b> ${p.marca}</p>
      `;
      // Solo actualizar innerHTML si el contenido ha cambiado para evitar redibujados innecesarios
      if (card.innerHTML.trim() !== newInnerHTML.trim()) {
        card.innerHTML = newInnerHTML;
      }
      // Asegurarse de que el event listener siga funcionando (aunque ya debería estar)
      card.onclick = () => mostrarModalProducto(p);
    } else {
      // Crear nueva tarjeta si no existe
      card = document.createElement('div');
      card.className = 'producto';
      card.dataset.productId = p.id; // Añadir un data-attribute para identificar el producto
      card.setAttribute('data-aos', 'fade-up');
      card.setAttribute('data-aos-delay', '50');
      const imagen = getImageUrl(p);
      card.innerHTML = `
        <img src="${imagen}" alt="${p.nombre_producto || p.nombre}"
             onerror="this.src='/assets/img/logo3.png'; console.log('Error cargando imagen:', this.src);" />
        <h3>${p.nombre_producto || p.nombre}</h3>
        <p><b>Marca:</b> ${p.marca}</p>
      `;
      card.addEventListener('click', () => mostrarModalProducto(p));
      grid.appendChild(card);
    }
  });
  // Después de manipular el DOM de productos, refrescar AOS para recalcular posiciones
  try {
    if (window.AOS && typeof window.AOS.refresh === 'function') {
      // refresh es suficientemente liviano y permite que las animaciones vuelvan a reproducirse
      window.AOS.refresh();
    }
  } catch (e) {
    console.warn('AOS refresh falló:', e);
  }
}

// Variables para modal y carrito
const modal = document.getElementById('modal-producto');
const modalInfo = document.getElementById('modal-info');
const cerrarModal = document.getElementById('cerrar-modal');
const inputCantidad = document.getElementById('modal-cantidad');
const btnAgregarCarrito = document.getElementById('agregar-carrito');

let productoActual = null;
let carrito = [];

/**
 * Muestra el modal con la información del producto.
 * @param {object} producto - El objeto producto.
 */
function mostrarModalProducto(producto) {
  productoActual = producto;
  
  console.log('Producto en modal:', {
    nombre: producto.nombre_producto || producto.nombre,
    imagen_url: producto.imagen_url,
    tiene_imagen: !!producto.imagen_url,
    es_url_valida: isValidCloudinaryUrl(producto.imagen_url)
  });
  
  const imagen = getImageUrl(producto);
  modalInfo.innerHTML = `
    <h3 class="modal-producto-titulo">${producto.nombre_producto || producto.nombre}</h3>
    <div class="modal-producto-layout">
      <div class="modal-producto-imagen">
        <img src="${imagen}" alt="${producto.nombre_producto || producto.nombre}"
             onerror="this.src='/assets/img/logo3.png'; console.log('Error cargando imagen en modal:', this.src);" />
      </div>
      <div class="modal-producto-info">

        <div class="info-item">
          <span class="info-label">Marca:</span>
          <span class="info-value">${producto.marca}</span>
        </div>

        <div class="info-item">
          <span class="info-label">Propósito:</span>
          <span class="info-value">${producto.proposito}</span>
        </div>

        ${producto.info ? `
        <div class="info-item info-descripcion">
          <span class="info-label">Descripción:</span>
          <span class="info-value">${producto.info}</span>
        </div>
        ` : ''}
      </div>
    </div>
  `;
  
  const acciones = modalInfo.parentElement.querySelector('.modal-acciones');
  acciones.innerHTML = `
    <div class="cantidad-control" id="cantidad-control">
      <button type="button" class="cantidad-btn" id="btn-restar">-</button>
      <input type="number" id="modal-cantidad" min="1" value="1" max="${producto.existencias || producto.cantidad}" />
      <button type="button" class="cantidad-btn" id="btn-sumar">+</button>
    </div>
    <button id="agregar-carrito">Agregar al carrito</button>
  `;
  
  document.getElementById('btn-restar').onclick = () => {
    const input = document.getElementById('modal-cantidad');
    let val = parseInt(input.value, 10) || 1;
    if (val > 1) input.value = val - 1;
  };
  document.getElementById('btn-sumar').onclick = () => {
    const input = document.getElementById('modal-cantidad');
    let val = parseInt(input.value, 10) || 1;
    if (val < (producto.existencias || producto.cantidad)) input.value = val + 1;
  };
  document.getElementById('agregar-carrito').onclick = () => {
    const cantidad = parseInt(document.getElementById('modal-cantidad').value, 10);
    if (!productoActual || isNaN(cantidad) || cantidad < 1) return;
    if (cantidad > (productoActual.existencias || productoActual.cantidad)) {
      showToast('No hay suficientes unidades disponibles.');
      return;
    }
    
    const idx = carrito.findIndex(item => item.id === productoActual.id);
    if (idx > -1) {
      carrito[idx].cantidad += cantidad;
    } else {
      const nuevoItem = { 
        ...productoActual, 
        cantidad,
        stock_disponible: productoActual.existencias || productoActual.cantidad || productoActual.cantidad_disponible || 0
      };
      console.log('Agregando producto al carrito:', nuevoItem);
      carrito.push(nuevoItem);
    }
    closeModal(modal);
    actualizarCarritoCantidad();
    guardarCarrito();
    mostrarNotificacionProducto(productoActual, cantidad);
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
      if (cantidad > (productoActual.existencias || productoActual.cantidad)) {
    showToast('No hay suficientes unidades disponibles.');
    return;
  }
  
  const idx = carrito.findIndex(item => item.id === productoActual.id);
  if (idx > -1) {
    carrito[idx].cantidad += cantidad;
  } else {
    const nuevoItem = { 
      ...productoActual, 
      cantidad,
      stock_disponible: productoActual.existencias || productoActual.cantidad || productoActual.cantidad_disponible || 0
    };
    console.log('Agregando producto al carrito (btn):', nuevoItem);
    carrito.push(nuevoItem);
  }
  modal.style.display = 'none';
  actualizarCarritoCantidad();
  guardarCarrito();
  mostrarNotificacionProducto(productoActual, cantidad);
});

/**
 * Actualiza el indicador de cantidad en el carrito.
 */
function actualizarCarritoCantidad() {
  const total = carrito.reduce((sum, item) => sum + item.cantidad, 0);
  carritoCantidad.textContent = total;
}

/**
 * Muestra el modal del carrito de compras.
 */
function mostrarCarrito() {
  if (carrito.length === 0) {
    carritoListado.innerHTML = '<p>El carrito está vacío.</p>';
  } else {
    let tabla = `<div class="carrito-table-responsive"><table class="carrito-table"><thead><tr><th>Producto</th><th>Marca</th><th>Propósito</th><th>Cantidad</th><th>Eliminar</th></tr></thead><tbody>`;
    tabla += carrito.map((item, idx) => `
      <tr>
        <td class="carrito-td-producto">
          ${item.nombre_producto || item.nombre}
        </td>
        <td class="carrito-td-marca">${item.marca}</td>
        <td class="carrito-td-proposito">${item.proposito}</td>
        <td class="carrito-td-cantidad">
          <div class="carrito-cantidad-control">
            <button class="restar-cantidad" data-idx="${idx}" aria-label="Restar">-</button>
            <input type="number" class="input-cantidad" data-idx="${idx}" min="1" max="${item.existencias || item.cantidad}" value="${item.cantidad}" />
            <button class="sumar-cantidad" data-idx="${idx}" aria-label="Sumar">+</button>
          </div>
        </td>
        <td class="carrito-td-eliminar"><button class="eliminar-producto" data-idx="${idx}" aria-label="Eliminar">🗑️</button></td>
      </tr>
    `).join('');
    tabla += '</tbody></table></div>';
    carritoListado.innerHTML = tabla;
    
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
        const max = carrito[idx].stock_disponible || carrito[idx].existencias || carrito[idx].cantidad_disponible || 99;
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
        const max = carrito[idx].stock_disponible || carrito[idx].existencias || carrito[idx].cantidad_disponible || 99;
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

/**
 * Actualiza el estado del botón de cotizar según el contenido del carrito.
 */
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

btnVerCarrito.addEventListener('click', () => {
  mostrarCarrito();
  // Restablecer campos
  const codigoPais = document.getElementById('codigo-pais');
  const telefonoInput = document.getElementById('telefono-cliente');
  const emailInput = document.getElementById('email-cliente');
  const tipoCotizacion = document.getElementById('tipo-cotizacion');
  const descripcionServicio = document.getElementById('grupo-descripcion-servicio');
  
  if (codigoPais) codigoPais.value = '52';
  if (telefonoInput) telefonoInput.value = '';
  if (emailInput) emailInput.value = '';
  
  // Sincronizar tipo de cotización con el filtro si hay uno seleccionado
  const filtroTipo = document.getElementById('tipo');
  if (filtroTipo && filtroTipo.value && tipoCotizacion) {
    tipoCotizacion.value = filtroTipo.value;
  }
  
  // Mostrar/ocultar descripción según el tipo
  if (tipoCotizacion && descripcionServicio) {
    descripcionServicio.style.display = tipoCotizacion.value === 'Servicio de mantenimiento' ? '' : 'none';
  }
  
  // ensure modal opens with the shared helper so overlay + box style apply
  openModal(modalCarrito);
});

// Manejar cambios en tipo de cotización
document.getElementById('tipo-cotizacion')?.addEventListener('change', (e) => {
  const descripcionServicio = document.getElementById('grupo-descripcion-servicio');
  if (descripcionServicio) {
    descripcionServicio.style.display = e.target.value === 'Servicio de mantenimiento' ? '' : 'none';
  }
});
cerrarModalCarrito.addEventListener('click', () => {
  closeModal(modalCarrito);
});
window.addEventListener('click', (e) => {
  if (e.target === modalCarrito) closeModal(modalCarrito);
});

btnAgregarCarrito.addEventListener('click', () => {
  actualizarCarritoCantidad();
});

/**
 * Guarda el carrito de compras en localStorage.
 */
function guardarCarrito() {
  localStorage.setItem('carrito', JSON.stringify(carrito));
}

/**
 * Carga el carrito de compras desde localStorage.
 */
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

cargarCarrito();
actualizarCarritoCantidad();
actualizarBotonCotizar();

const telefonoInput = document.getElementById('telefono-cliente');
const codigoPais = document.getElementById('codigo-pais');

const longitudesTelefono = {
  '52': 10, // México
  '1': 10,  // USA/Canadá
  '54': 10, // Argentina
  '57': 10, // Colombia
  '34': 9,  // España
  '55': 11, // Brasil
  '56': 9,  // Chile
  '591': 8, // Bolivia
  '507': 8, // Panamá
  '593': 9  // Ecuador
};

/**
 * Actualiza el atributo maxlength del input de teléfono según el país seleccionado.
 */
function actualizarMaxlength() {
  const codigo = codigoPais.value;
  telefonoInput.maxLength = longitudesTelefono[codigo] || 15; // 15 como fallback
}

telefonoInput.addEventListener('input', () => {
  telefonoInput.value = telefonoInput.value.replace(/\D/g, '');
});

codigoPais.addEventListener('change', () => {
  telefonoInput.value = ''; 
  actualizarMaxlength();
  validarCamposCotizacion();
});

actualizarMaxlength();

/**
 * Valida los campos del formulario de cotización y habilita/deshabilita el botón de cotizar.
 */
function validarCamposCotizacion() {
  const nombreInput = document.getElementById('nombre-cliente');
  const emailInput = document.getElementById('email-cliente');
  const tipoCotizacion = document.getElementById('tipo-cotizacion');
  const btn = document.getElementById('cotizar-pdf');
  
  // Validar nombre
  const nombreValido = nombreInput.value.trim().length > 0;
  
  // Validar email (opcional)
  const emailValue = emailInput.value.trim();
  const emailValido = !emailValue || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
  
  // Validar teléfono
  const codigo = codigoPais.value;
  const telefono = telefonoInput.value.trim();
  const longitudRequerida = longitudesTelefono[codigo] || 10;
  const telefonoValido = telefono.length === longitudRequerida;

  // Validar tipo de cotización
  const tipoValido = tipoCotizacion.value !== '';
  
  // Habilitar/deshabilitar botón según validación
  const todosLosCamposValidos = nombreValido && emailValido && telefonoValido && tipoValido;
  
  if (todosLosCamposValidos) {
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
  } else {
    btn.disabled = true;
    btn.style.opacity = '0.6';
    btn.style.cursor = 'not-allowed';
  }
}

['input', 'change'].forEach(evt => {
  document.getElementById('nombre-cliente').addEventListener(evt, validarCamposCotizacion);
  document.getElementById('telefono-cliente').addEventListener(evt, validarCamposCotizacion);
  const codigoPais = document.getElementById('codigo-pais');
  if (codigoPais) codigoPais.addEventListener(evt, validarCamposCotizacion);
});

let isSubmitting = false;

btnCotizarPDF.addEventListener('click', async (e) => {
  if (isSubmitting) return; // Prevent double submission
  isSubmitting = true;
  btnCotizarPDF.disabled = true;
  btnCotizarPDF.textContent = 'Generando cotización...';

  const nombreInput = document.getElementById('nombre-cliente');
  const telefonoInput = document.getElementById('telefono-cliente');
  const codigoPais = document.getElementById('codigo-pais');
  const servicioSelect = document.getElementById('servicio-solicitado');
  const descripcionServicio = document.getElementById('descripcion-servicio');
  const servicio = servicioSelect ? servicioSelect.value : 'venta';
  let telefono = telefonoInput.value.trim().replace(/\D/g, '');
  let codigo = codigoPais ? codigoPais.value : '52';
  
  const emailInput = document.getElementById('email-cliente');
  const emailValue = emailInput.value.trim();
  if (!nombreInput.value.trim() || 
      (emailValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) ||
      (codigo === '52' ? telefono.length !== 10 : (telefono.length < 7 || telefono.length > 15))) {
    e.preventDefault();
    validarCamposCotizacion();
    return;
  }
  
  // Ya no requerimos productos en el carrito
  const tipoCotizacion = document.getElementById('tipo-cotizacion');
  if (!tipoCotizacion.value) {
    showToast('Por favor seleccione el tipo de cotización.');
    return;
  }
  
  let descripcion = '';
  if (servicio === 'servicio') {
    descripcion = descripcionServicio ? descripcionServicio.value.trim() : '';
    if (!descripcion) {
      if (descripcionServicio) {
        descripcionServicio.focus();
        descripcionServicio.style.borderColor = 'red';
        setTimeout(() => descripcionServicio.style.borderColor = '', 1200);
      }
      showToast('Por favor, describe brevemente el servicio que necesitas.');
      return;
    }
  }
  
  const nombreCliente = nombreInput.value.trim();
  const telefonoCliente = `+${codigo} ${telefono}`;
  
  let destinoCorreo = [];
  if (servicio === 'compra') destinoCorreo = ['cesar_urrutia_dev4383@proton.me'];
  else if (servicio === 'renta') destinoCorreo = ['cesar_urrutia_dev4383@proton.me'];
  else if (servicio === 'servicio de mantenimiento') destinoCorreo = ['cesar_urrutia_dev4383@proton.me'];

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
  
  let disponibilidadOk = true;
  console.log('Verificando disponibilidad del carrito:', carrito);
  for (const item of carrito) {
    const stockDisponible = item.stock_disponible || item.existencias || item.cantidad_disponible || item.cantidad || 0;
    console.log(`Producto: ${item.nombre_producto || item.nombre}, Cantidad solicitada: ${item.cantidad}, Stock disponible: ${stockDisponible}`);
    if (item.cantidad > stockDisponible) {
      console.log('❌ Stock insuficiente');
      disponibilidadOk = false;
      break;
    }
  }
  console.log('Disponibilidad OK:', disponibilidadOk);
  if (!disponibilidadOk) {
    showToast('Uno o más productos no tienen suficiente disponibilidad.');
    return;
  }
  
  try {
    // Paso 1: Generar el PDF primero
    console.log('Iniciando generación de PDF...');
    const carritoParaEnviar = carrito.map(item => ({
      id: item.id,
      nombre: item.nombre_producto || item.nombre,
      marca: item.marca,
      proposito: item.proposito,
      cantidad: item.cantidad
    }));

    // Usar directamente la URL de producción
    const pdfUrl = 'https://nt-backapis.onrender.com/routes/quote?descargar=1';
    console.log('URL para generar PDF (producción):', pdfUrl);
    
  const emailCliente = document.getElementById('email-cliente').value.trim();
  const tipoCotizacion = document.getElementById('tipo-cotizacion').value;
  
  const requestData = {
    carrito: carritoParaEnviar,
    nombre: nombreCliente,
    telefono: telefonoCliente,
    email: emailCliente,
    tipo_cotizacion: tipoCotizacion,
    servicio,
    destinoCorreo,
    descripcion
  };    console.log('Datos a enviar:', requestData);

    const pdfResponse = await fetch(pdfUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/pdf',
        'Access-Control-Allow-Origin': '*'
      },
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'omit',
      redirect: 'follow',
      body: JSON.stringify(requestData)
    });

    if (!pdfResponse.ok) {
      const errorData = await pdfResponse.text();
      console.error('Error en la respuesta del PDF:', errorData);
      throw new Error('No se pudo generar el PDF');
    }

    console.log('PDF generado correctamente, obteniendo blob...');
    const pdfBlob = await pdfResponse.blob();
    const url = URL.createObjectURL(pdfBlob);
    
    // Mostrar el PDF en el modal
    const modalPDF = document.getElementById('modal-pdf');
    const iframePDF = document.getElementById('iframe-pdf');
    const btnDescargarPDF = document.getElementById('descargar-pdf');
    
    console.log('Mostrando PDF en el modal...');
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
    
    enviarCotizacionBackend({ carrito: carritoParaEnviar, nombre: nombreCliente, telefono: telefonoCliente, servicio, destinoCorreo, descripcion })
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al enviar la cotización');
        }
        const data = await response.json();
        
        setTimeout(() => {
          if (data.success) {
            showToast(data.message, 5500);
            carrito = [];
            guardarCarrito();
            actualizarCarritoCantidad();
            mostrarCarrito();
            nombreInput.value = '';
            telefonoInput.value = '';
            if (descripcionServicio) descripcionServicio.value = '';
          } else {
            showToast('Error: ' + data.message);
          }
          isSubmitting = false;
          btnCotizarPDF.disabled = false;
          btnCotizarPDF.textContent = 'Cotizar';
        }, 300);
      })
      .catch((error) => {
        console.error('Error al enviar cotización:', error);
        showToast(`Error al enviar la cotización: ${error.message}`);
        isSubmitting = false;
        btnCotizarPDF.disabled = false;
        btnCotizarPDF.textContent = 'Cotizar';
      });
    closeModal(modalCarrito);
  } catch (err) {
    showToast('No se pudo generar la previsualización del PDF.');
    isSubmitting = false;
    btnCotizarPDF.disabled = false;
    btnCotizarPDF.textContent = 'Cotizar';
  }
});

/**
 * Filtra los productos según la marca y propósito seleccionados.
 * @param {Array} productos - Array de productos.
 * @param {boolean} [actualizarURL=true] - Indica si se debe actualizar la URL con los parámetros de filtro.
 */
function filtrar(productos, actualizarURL = true) {
  const marca = filtroMarca.value;
  const proposito = filtroProposito.value;
  const tipo = filtroTipo ? filtroTipo.value : '';

  if (actualizarURL) {
    const params = new URLSearchParams(window.location.search);
    if (marca) {
      params.set('marca', marca);
    } else {
      params.delete('marca');
    }
    if (proposito) {
      params.set('proposito', proposito);
    } else {
      params.delete('proposito');
    }
    if (tipo) {
      params.set('tipo', tipo);
    } else {
      params.delete('tipo');
    }
    history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
  }

  const filtrados = productos.filter(p =>
    (marca === '' || p.marca === marca) &&
    (proposito === '' || p.proposito === proposito) &&
    (tipo === '' || (p.tipo && p.tipo === tipo))
  );

  // Actualizar opciones de filtros dependientes: cuando hay una marca seleccionada,
  // los otros selects deben mostrar sólo opciones que existen para esa marca.
  actualizarFiltrosDependientes(productos, marca);

  mostrarProductos(filtrados);
}

/**
 * Aplica los filtros desde los parámetros de la URL.
 */
function aplicarFiltrosDesdeURL() {
  const params = new URLSearchParams(window.location.search);
  const marca = params.get('marca');
  const proposito = params.get('proposito');
  const tipo = params.get('tipo');

  if (marca) {
    filtroMarca.value = marca;
  }
  if (proposito) {
    filtroProposito.value = proposito;
  }
  if (tipo && filtroTipo) {
    filtroTipo.value = tipo;
  }
}

/**
 * Actualiza las opciones de los filtros dependientes con base en la marca seleccionada.
 * Si no hay marca seleccionada, restaura todas las opciones previamente cargadas.
 * @param {Array} productos
 * @param {string} marcaSeleccionada
 */
function actualizarFiltrosDependientes(productos, marcaSeleccionada) {
  // Recolectar valores válidos para propósito y tipo según la marca seleccionada
  const propositosValidos = new Set();
  const tiposValidos = new Set();

  productos.forEach(p => {
    if (!marcaSeleccionada || p.marca === marcaSeleccionada) {
      if (p.proposito) propositosValidos.add(p.proposito);
      if (p.tipo) tiposValidos.add(p.tipo);
    }
  });

  // Función auxiliar para filtrar opciones de un select (mantener opción vacía)
  function filtrarSelect(selectEl, validSet) {
    const options = Array.from(selectEl.options);
    options.forEach((opt, idx) => {
      if (idx === 0) return; // mantener la opción 'Todos' / vacía
      if (!validSet.has(opt.value)) {
        opt.style.display = 'none';
      } else {
        opt.style.display = '';
      }
    });
    // Si la opción actualmente seleccionada quedó oculta, resetear al valor vacío
    if (selectEl.value && selectEl.querySelector(`option[value="${selectEl.value}"]`)?.style.display === 'none') {
      selectEl.value = '';
    }
  }

  filtrarSelect(filtroProposito, propositosValidos);
  if (filtroTipo) filtrarSelect(filtroTipo, tiposValidos);
}

window.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('fade-in');
});

/**
 * Envía la cotización al backend.
 * @param {object} data - Datos de la cotización.
 * @returns {Promise<Response>} - Respuesta del fetch.
 */
function enviarCotizacionBackend({carrito, nombre, telefono, servicio, destinoCorreo, descripcion}) {
  const carritoSimplificado = carrito.map(item => ({ 
    id: item.id, 
    nombre: item.nombre_producto || item.nombre, 
    marca: item.marca, 
    proposito: item.proposito, 
    cantidad: item.cantidad 
  }));

  const data = {
    carrito: carritoSimplificado,
    nombre,
    telefono,
    servicio,
    destinoCorreo,
    descripcion: descripcion || ''
  };

  console.log('Enviando datos al backend:', data);

  return fetch('https://nt-backapis.onrender.com/routes/quote', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'omit',
    redirect: 'follow',
    body: JSON.stringify(data)
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  loader.style.display = 'block';
  grid.style.display = 'none';
  const productos = await obtenerProductos();
  llenarFiltros(productos);
  aplicarFiltrosDesdeURL();
  filtrar(productos, false);
  loader.style.display = 'none';
  grid.style.display = '';

  filtroMarca.addEventListener('change', () => filtrar(productos));
  filtroProposito.addEventListener('change', () => filtrar(productos));
  if (filtroTipo) filtroTipo.addEventListener('change', () => filtrar(productos));
});

/**
 * Muestra una notificación tipo toast.
 * @param {string} msg - Mensaje a mostrar.
 * @param {number} [duration=5500] - Duración del toast en milisegundos.
 */
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

/**
 * Actualiza el catálogo automáticamente cada 30 segundos.
 */
setInterval(() => {
  actualizarCatalogo();
}, 30000); // 30,000 ms = 30 segundos

/**
 * Obtiene los productos y actualiza el catálogo.
 */
async function actualizarCatalogo() {
  const marcaActual = filtroMarca.value;
  const propositoActual = filtroProposito.value;

  const productos = await obtenerProductos();
  
  filtroMarca.innerHTML = '<option value="">Todas</option>';
  filtroProposito.innerHTML = '<option value="">Todos</option>';
  if (filtroTipo) {
    // preservar las opciones estáticas (primera opción) y reiniciar las demás
    const primera = filtroTipo.querySelector('option');
    filtroTipo.innerHTML = primera ? primera.outerHTML : '<option value="">Todos</option>';
  }
  llenarFiltros(productos);

  filtroMarca.value = marcaActual;
  filtroProposito.value = propositoActual;

  filtrar(productos, false);
  // Refrescar AOS luego de actualizar el listado dinámico
  if (window.AOS && typeof window.AOS.refresh === 'function') window.AOS.refresh();
}

const servicioSelect = document.getElementById('servicio-solicitado');
const grupoDescripcionServicio = document.getElementById('grupo-descripcion-servicio');
const descripcionServicio = document.getElementById('descripcion-servicio');
if (servicioSelect) {
  servicioSelect.addEventListener('change', () => {
    if (servicioSelect.value === 'servicio') {
      grupoDescripcionServicio.style.display = '';
    } else {
      grupoDescripcionServicio.style.display = 'none';
      descripcionServicio.value = '';
    }
  });
}

cerrarModalCarrito.addEventListener('click', () => {
  modalCarrito.style.display = 'none';
  if (descripcionServicio) descripcionServicio.value = '';
});

/**
 * Muestra una notificación cuando un producto es agregado al carrito.
 * @param {object} producto - El objeto producto.
 * @param {number} cantidad - La cantidad agregada.
 */
function mostrarNotificacionProducto(producto, cantidad) {
  let notificacion = document.querySelector('.notificacion-carrito');
  if (!notificacion) {
    notificacion = document.createElement('div');
    notificacion.className = 'notificacion-carrito';
    document.body.appendChild(notificacion);
  }

  notificacion.innerHTML = `
    <div class="icono">✅</div>
    <div class="texto">¡${cantidad} ${cantidad === 1 ? 'unidad' : 'unidades'} de "${producto.nombre_producto || producto.nombre}" agregada${cantidad === 1 ? '' : 's'} al carrito!</div>
  `;

  setTimeout(() => {
    notificacion.classList.add('mostrar');
  }, 100);

  setTimeout(() => {
    notificacion.classList.remove('mostrar');
  }, 3000);
}
