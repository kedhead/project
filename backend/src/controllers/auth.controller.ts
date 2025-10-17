import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import {
  authService,
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,
} from '../services/auth.service';
import { logger } from '../utils/logger.util';
import { ApiResponse } from '../types/api.types';

export class AuthController {
  async register(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Validate request body
      const validated = RegisterSchema.parse(req.body);

      // Register user
      const result = await authService.register(validated);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Registration failed:', error);
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
        code: 'REGISTRATION_FAILED',
      };
      res.status(400).json(response);
    }
  }

  async login(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Validate request body
      const validated = LoginSchema.parse(req.body);

      // Login user
      const result = await authService.login(validated);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      logger.error('Login failed:', error);
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
        code: 'LOGIN_FAILED',
      };
      res.status(401).json(response);
    }
  }

  async refresh(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Validate request body
      const validated = RefreshTokenSchema.parse(req.body);

      // Refresh token
      const result = await authService.refreshAccessToken(validated);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      logger.error('Token refresh failed:', error);
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed',
        code: 'TOKEN_REFRESH_FAILED',
      };
      res.status(401).json(response);
    }
  }

  async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      const response: ApiResponse = {
        success: true,
        data: { message: 'Logged out successfully' },
      };

      res.json(response);
    } catch (error) {
      logger.error('Logout failed:', error);
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed',
        code: 'LOGOUT_FAILED',
      };
      res.status(400).json(response);
    }
  }

  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        const response: ApiResponse = {
          success: false,
          error: 'User not authenticated',
          code: 'UNAUTHORIZED',
        };
        res.status(401).json(response);
        return;
      }

      const user = await authService.getProfile(req.user.userId);

      const response: ApiResponse = {
        success: true,
        data: user,
      };

      res.json(response);
    } catch (error) {
      logger.error('Get profile failed:', error);
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get profile',
        code: 'GET_PROFILE_FAILED',
      };
      res.status(400).json(response);
    }
  }
}

export const authController = new AuthController();
