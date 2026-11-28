/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Contrasenya d'accés per a l'alumnat en entrar a l'aplicació.
 */
export const STUDENT_ACCESS_PASSWORD = 'Macitec3';

/**
 * Enganxa aquí la URL de la teva aplicació web de Google Apps Script (acaba en /exec)
 * abans de pujar a GitHub, o configura la variable VITE_APPS_SCRIPT_URL a GitHub.
 * Exemple: 'https://script.google.com/macros/s/AKfycbx.../exec'
 */
export const DEFAULT_APPS_SCRIPT_URL: string =
  (import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined)?.trim() ||
  'https://script.google.com/macros/s/AKfycbx7G7WcJCRQ0STQyh_Ln8N1QRJw6GHcnR9PJhDoFGGCKX1DsdLxBQPCqlx-bFKaTJrl/exec';
