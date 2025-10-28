/**
 * Archivo de configuración para EmailJS.
 * Rellena los valores con los IDs que te provee EmailJS.
 * Nota de seguridad: los IDs de EmailJS (service_id, template_id y user_id/public key)
 * son considerados públicos cuando se usan en el front-end (EmailJS lo permite),
 * pero evita subir claves privadas o credenciales sensibles al repositorio si las tuvieras.
 *
 * Pasos rápidos:
 * 1) Regístrate en https://www.emailjs.com/ y crea un servicio (por ejemplo Gmail, SMTP, etc.).
 * 2) Crea una plantilla (template) para el correo y guarda su TEMPLATE_ID.
 * 3) Obtén tu USER_ID (public key) desde el panel de EmailJS.
 * 4) Sustituye los valores a continuación por los que obtuviste.
 */

// Ejemplo (reemplaza 'YOUR_...' por los valores reales):
export const EMAILJS_SERVICE_ID = 'service_lvju4xk';
export const EMAILJS_TEMPLATE_ID = 'template_7hgsvgo';
export const EMAILJS_USER_ID = 'mV774LXnqeooUF4m6';

// Si prefieres no guardar estas cadenas en el repo, puedes en su lugar
// inyectarlas como atributos data-... en el HTML (por ejemplo en <body>)
// y leerlas desde JS mediante document.body.dataset.emailjsServiceId etc.
