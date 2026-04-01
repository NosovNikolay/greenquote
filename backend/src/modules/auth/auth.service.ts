import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { UserRow } from '../../database/schema';
import { UsersService } from '../users/users.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export interface AuthResponseDto {
  access_token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(
    fullName: string,
    email: string,
    password: string,
  ): Promise<AuthResponseDto> {
    const user = await this.usersService.createUser(fullName, email, password);
    return this.toAuthResponse(user);
  }

  async login(email: string, password: string): Promise<AuthResponseDto> {
    const user = await this.usersService.validateCredentials(email, password);
    return this.toAuthResponse(user);
  }

  private toAuthResponse(user: UserRow): AuthResponseDto {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }
}
