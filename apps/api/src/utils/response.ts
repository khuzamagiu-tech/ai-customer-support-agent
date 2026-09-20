export const createSuccessResponse = <T>(data: T) => ({
  success: true,
  data,
});

export const createErrorResponse = (message: string, details?: Record<string, unknown>) => ({
  success: false,
  error: message,
  ...(details ? { details } : {}),
});
