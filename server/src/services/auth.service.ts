import jwt, { SignOptions } from 'jsonwebtoken';
import { IUser } from '../models/user.model';
import { cacheService } from './cache.service';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry: string = '2h'; // Extended from 15m to 2h
  private readonly refreshTokenExpiry: string = '30d'; // Extended from 7d to 30d

  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'your-access-secret-key';
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
  }

  /**
   * Generate access and refresh token pair
   */
  generateTokens(user: IUser): TokenPair {
    const payload: TokenPayload = {
      userId: (user._id as any).toString(),
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry
    } as SignOptions);

    const refreshToken = jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry
    } as SignOptions);

    return { accessToken, refreshToken };
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, this.accessTokenSecret) as TokenPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, this.refreshTokenSecret) as TokenPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Blacklist a token (store in Redis)
   */
  async blacklistToken(token: string): Promise<void> {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await cacheService.set(`blacklist:${token}`, true, ttl);
        }
      }
    } catch (error) {
      console.error('Error blacklisting token:', error);
    }
  }

  /**
   * Check if token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const isBlacklisted = await cacheService.get(`blacklist:${token}`);
      return !!isBlacklisted;
    } catch (error) {
      console.error('Error checking token blacklist:', error);
      return false;
    }
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Generate API key
   */
  generateApiKey(): string {
    return `ak_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
  }

  /**
   * Hash API key for storage
   */
  hashApiKey(apiKey: string): string {
    return jwt.sign({ apiKey }, this.accessTokenSecret);
  }

  /**
   * Verify API key
   */
  verifyApiKey(hashedKey: string, providedKey: string): boolean {
    try {
      const decoded = jwt.verify(hashedKey, this.accessTokenSecret) as any;
      return decoded.apiKey === providedKey;
    } catch (error) {
      return false;
    }
  }

  /**
   * Cache user session data
   */
  async cacheUserSession(userId: string, sessionData: any): Promise<void> {
    await cacheService.set(`session:${userId}`, sessionData, 3600); // 1 hour
  }

  /**
   * Get cached user session
   */
  async getCachedUserSession(userId: string): Promise<any | null> {
    return await cacheService.get(`session:${userId}`);
  }

  /**
   * Clear user session cache
   */
  async clearUserSession(userId: string): Promise<void> {
    await cacheService.del(`session:${userId}`);
  }
}

export const authService = new AuthService();