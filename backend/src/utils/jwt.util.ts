import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  role: string;
}

export class JwtUtil {
  static generateAccessToken(userId: string, role: string): string {
    return jwt.sign(
      { userId, role } as TokenPayload,
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRY || '15m' }
    );
  }

  static generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
    );
  }

  static verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
  }

  static verifyRefreshToken(token: string): { userId: string } {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string };
  }
}
