export class ApiResponse<T> {
  public readonly statusCode: number;
  public readonly data: T;
  public readonly message: string;
  public readonly success: boolean;

  constructor(statusCode: number, data: T, message: string) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }

  static success<T>(data: T, message: string, statusCode = 200): ApiResponse<T> {
    return new ApiResponse(statusCode, data, message);
  }

  static created<T>(data: T, message: string): ApiResponse<T> {
    return new ApiResponse(201, data, message);
  }

  static noContent(): ApiResponse<null> {
    return new ApiResponse(204, null, "No content");
  }
}
