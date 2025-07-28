# Corrección: Problema de Validación de Stock

## Problema Identificado

Al intentar generar una cotización, el sistema mostraba el error "Uno o más productos no tienen suficiente disponibilidad" a pesar de que había suficientes unidades disponibles.

## Causa del Problema

El problema estaba en la lógica de validación de stock durante la generación de cotizaciones:

1. **Al agregar productos al carrito**: Se guardaba la información del producto pero no se preservaba correctamente el stock disponible
2. **En la validación de cotización**: Se buscaba `cantidad_disponible` que no existía en los items del carrito
3. **Falta de compatibilidad**: No se manejaba correctamente la transición entre diferentes nombres de campos de stock

## Solución Implementada

### 1. Preservar Stock Disponible al Agregar al Carrito

```javascript
// Antes
carrito.push({ ...productoActual, cantidad });

// Después
carrito.push({ 
  ...productoActual, 
  cantidad,
  stock_disponible: productoActual.existencias || productoActual.cantidad || productoActual.cantidad_disponible || 0
});
```

### 2. Mejorar Validación de Stock en Cotización

```javascript
// Antes
const stockDisponible = item.existencias || item.cantidad_disponible || 0;

// Después
const stockDisponible = item.stock_disponible || item.existencias || item.cantidad_disponible || item.cantidad || 0;
```

### 3. Actualizar Controles de Cantidad en Carrito

```javascript
// En los botones de sumar/restar cantidad
const max = carrito[idx].stock_disponible || carrito[idx].existencias || carrito[idx].cantidad_disponible || 99;
```

### 4. Agregar Debug para Monitoreo

Se agregaron logs de consola para monitorear:
- Datos del producto al agregar al carrito
- Verificación de disponibilidad durante cotización
- Valores de stock disponible vs cantidad solicitada

## Archivos Modificados

- `src/js/catalog.js`: Lógica principal de carrito y validaciones

## Funcionalidades Corregidas

- ✅ Agregar productos al carrito preservando stock disponible
- ✅ Validación correcta de disponibilidad en cotizaciones
- ✅ Controles de cantidad respetando stock real
- ✅ Compatibilidad con diferentes nombres de campos de stock
- ✅ Debug para monitoreo de datos

## Pruebas Recomendadas

1. Agregar productos al carrito
2. Verificar en consola que se guarde `stock_disponible`
3. Intentar generar cotización
4. Verificar que no aparezcan errores de stock insuficiente
5. Probar con diferentes cantidades hasta el límite de stock 