/**
 * SourceDrop - licencia/freemium.
 *
 * Aquí se centraliza la lógica de acceso Pro para que el resto de la extensión
 * no tenga que conocer cómo se obtiene o verifica una licencia.
 *
 * Para pruebas locales:
 *   cambia DEV_FORCE_PRO a true.
 *
 * Integración futura con ExtensionPay:
 *   1. Instalar/usar el SDK oficial de ExtensionPay dentro de la extensión,
 *      siguiendo sus instrucciones actuales para MV3.
 *   2. Inicializar ExtensionPay en este módulo, no en cada vista.
 *   3. Sustituir la constante de desarrollo por una comprobación de licencia
 *      persistida/verificada por ExtensionPay.
 *   4. No guardar secretos ni confiar en una bandera editable por el usuario
 *      como mecanismo real de cobro.
 *
 * Este MVP NO carga ningún servicio externo y NO implementa pagos.
 */

export const FREE_CLIP_LIMIT = 100;

// Solo para desarrollo local. Debe ser false en una versión de producción.
export const DEV_FORCE_PRO = false;

export function isPro() {
  return DEV_FORCE_PRO;
}
