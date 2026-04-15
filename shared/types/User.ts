/**
 * Shared Types - User
 */

export enum UserRole {
    CLIENT = "CLIENT",
    ADMIN = "ADMIN",
    VENDEUR = "VENDEUR",
    LIVREUR = "LIVREUR"
}

export interface IUser {
  _id?: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserResponse {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface IAuthResponse {
  user: IUserResponse;
  token: string;
}
