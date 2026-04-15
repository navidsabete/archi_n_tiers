import { Request, Response } from 'express';
import type { IUserResponse } from '@ligue-sportive/shared';
import { UserRepository } from '../repositories/UserRepository';
import { toUserResponse } from '../repositories/mappers';

export class UserController {
  static async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await UserRepository.findAll();
      const userResponses: IUserResponse[] = users.map(toUserResponse);
      res.status(200).json(userResponses);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await UserRepository.findById(id);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const userResponse: IUserResponse = toUserResponse(user);

      res.status(200).json(userResponse);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }

  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { firstName, lastName, role } = req.body;

      const user = await UserRepository.updateById(id, { firstName, lastName, role });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const userResponse: IUserResponse = toUserResponse(user);

      res.status(200).json(userResponse);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user' });
    }
  }

  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await UserRepository.deleteById(id);

      if (!deleted) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }
}
