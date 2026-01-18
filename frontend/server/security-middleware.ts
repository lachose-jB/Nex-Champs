import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { logAuditEvent, logSecurityEvent } from "./security";

/**
 * Security Middleware - Protects the application against common attacks
 */

/**
 * Rate limiting middleware
 */
export const createRateLimiter = (windowMs: number = 15 * 60 * 1000, max: number = 100) => {
  return rateLimit({
    windowMs,
    max,
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === "/health";
    },
    handler: async (req, res) => {
      // Log rate limit exceeded event
      await logSecurityEvent({
        eventType: "rate_limit_exceeded",
        ipAddress: req.ip,
        description: `Rate limit exceeded for ${req.path}`,
        timestamp: Date.now(),
      });

      res.status(429).json({
        error: "Too many requests",
        retryAfter: (req as any).rateLimit?.resetTime,
      });
    },
  });
};

/**
 * Helmet middleware for security headers
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:", "wss:"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: "deny" },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
});

/**
 * CORS middleware
 */
export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin || "")) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
};

/**
 * Request validation middleware
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /(<script|javascript:|onerror=|onclick=)/i, // XSS patterns
    /(union|select|insert|update|delete|drop|create|alter)/i, // SQL injection patterns
    /\.\.\//g, // Path traversal
  ];

  const bodyString = JSON.stringify(req.body);
  const queryString = JSON.stringify(req.query);

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(bodyString) || pattern.test(queryString)) {
      logSecurityEvent({
        eventType: "suspicious_activity",
        ipAddress: req.ip,
        description: `Suspicious pattern detected in request to ${req.path}`,
        timestamp: Date.now(),
      });

      return res.status(400).json({
        error: "Invalid request",
      });
    }
  }

  next();
};

/**
 * Authentication middleware
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  const token = authHeader.substring(7);

  // Token validation would be done here
  // For now, just pass through
  next();
};

/**
 * Audit logging middleware
 */
export const auditLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;

  res.send = function (data) {
    // Log the request
    logAuditEvent({
      action: `${req.method} ${req.path}`,
      resource: req.path,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      status: res.statusCode < 400 ? "success" : "failure",
      severity: res.statusCode >= 500 ? "high" : "low",
      timestamp: Date.now(),
    });

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Request size limit middleware
 */
export const requestSizeLimit = (maxSize: string = "10mb") => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.get("content-length") || "0", 10);
    const maxBytes = parseMaxSize(maxSize);

    if (contentLength > maxBytes) {
      return res.status(413).json({
        error: "Request entity too large",
      });
    }

    next();
  };
};

/**
 * Parse max size string to bytes
 */
function parseMaxSize(size: string): number {
  const units: Record<string, number> = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  const match = size.toLowerCase().match(/^(\d+)(b|kb|mb|gb)?$/);
  if (!match) return 10 * 1024 * 1024; // Default 10MB

  const value = parseInt(match[1], 10);
  const unit = match[2] || "b";

  return value * (units[unit] || 1);
}

/**
 * CSRF protection middleware
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Only check for state-changing requests
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const csrfToken = req.headers["x-csrf-token"] as string;
  const sessionCsrfToken = (req as any).session?.csrfToken;

  if (!csrfToken || csrfToken !== sessionCsrfToken) {
    logSecurityEvent({
      eventType: "suspicious_activity",
      ipAddress: req.ip,
      description: "CSRF token validation failed",
      timestamp: Date.now(),
    });

    return res.status(403).json({
      error: "CSRF token validation failed",
    });
  }

  next();
};

/**
 * Account lockout middleware
 */
export const accountLockoutMiddleware = (maxAttempts: number = 5, lockoutDuration: number = 15 * 60 * 1000) => {
  const failedAttempts = new Map<string, { count: number; timestamp: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();

    const attempt = failedAttempts.get(key);

    if (attempt && now - attempt.timestamp < lockoutDuration && attempt.count >= maxAttempts) {
      logSecurityEvent({
        eventType: "account_locked",
        ipAddress: req.ip,
        description: `Account locked due to too many failed attempts`,
        timestamp: now,
      });

      return res.status(429).json({
        error: "Account temporarily locked",
        retryAfter: Math.ceil((lockoutDuration - (now - attempt.timestamp)) / 1000),
      });
    }

    // Reset counter if lockout period has passed
    if (attempt && now - attempt.timestamp > lockoutDuration) {
      failedAttempts.delete(key);
    }

    next();
  };
};
