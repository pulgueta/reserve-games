/**
 * Centralized, user-facing error strings thrown as `ConvexError` from functions
 * and read on the client via `getConvexErrorMessage`. Keeping them here means
 * copy lives in one place and stays consistent across the app.
 */
export const errorMessages = {
  unauthorized: "No tienes autorización para realizar esta acción.",
  forbidden: "No tienes permisos para acceder a esta sección.",
  notFound: (resource: string) => `No se encontró el recurso (${resource}).`,
  venueInactive: "Este espacio no está recibiendo reservas en este momento.",
  bookingInPast: "No puedes reservar una hora que ya pasó.",
  bookingOutsideHours: "El espacio no está abierto en el horario seleccionado.",
  rateLimitExceeded: `Has excedido el límite de solicitudes. Intenta después.`,
  slotTaken: "Ese horario ya está reservado. Elige otro.",
} as const;
