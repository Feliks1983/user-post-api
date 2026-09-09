import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  statusCode: number;
  code: any;

  constructor(message: string, statusCode = 400, public details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error("Error:", {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code,
      ...(error.details && { details: error.details }),
    });
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: error.message,
    });
  }

  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      error: "Invalid token",
      code: "INVALID_TOKEN",
    });
  }

  if (error.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      error: "Token expired",
      code: "TOKEN_EXPIRED",
    });
  }

  res.status(500).json({
    success: false,
    error:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Internal server error",
    code: "INTERNAL_SERVER_ERROR",
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    code: "NOT_FOUND",
  });
};
