export class ApiError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const success = (data: unknown, message = 'Success') => ({
  success: true,
  message,
  data,
});
