import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@ligue-sportive/shared';
import type { IUserResponse } from '@ligue-sportive/shared';
import { UserRepository } from '../repositories/UserRepository';
import { toUserResponse } from '../repositories/mappers';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password || !firstName || !lastName) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const existingUser = await UserRepository.findByEmail(email);
      if (existingUser) {
        res.status(400).json({ error: 'Email already in use' });
        return;
      }

      const user = await UserRepository.create({
        email,
        password,
        firstName,
        lastName,
        role: email.endsWith('@admin.com') ? UserRole.ADMIN : UserRole.MEMBER,
      });

      const secret = process.env.JWT_SECRET || 'secret';
      const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
      const token = jwt.sign(
        { _id: user.id, email: user.email, role: user.role } as any,
        secret as string,
        { expiresIn } as any
      );

      const userResponse: IUserResponse = toUserResponse(user);

      res.status(201).json({ user: userResponse, token });
    } catch (error) {
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password required' });
        return;
      }

      const user = await UserRepository.findByEmail(email);
      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const isPasswordValid = await UserRepository.verifyPassword(user, password);
      if (!isPasswordValid) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const secret = process.env.JWT_SECRET || 'secret';
      const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
      const token = jwt.sign(
        { _id: user.id, email: user.email, role: user.role } as any,
        secret as string,
        { expiresIn } as any
      );

      const userResponse: IUserResponse = toUserResponse(user);

      res.status(200).json({ user: userResponse, token });
    } catch (error) {
      res.status(500).json({ error: 'Login failed' });
    }
  }
}
