import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AppException } from '../../common/exceptions/app.exception';
import type { UserRow } from '../../database/schema';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async createUser(
    fullName: string,
    email: string,
    password: string,
    role: 'user' | 'admin' = 'user',
  ): Promise<UserRow> {
    const existing = await this.usersRepository.findByEmail(email);
    if (existing) {
      throw AppException.conflict('Email is already registered');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    return this.usersRepository.create({
      email: email.toLowerCase(),
      fullName,
      passwordHash,
      role,
    });
  }

  async validateCredentials(email: string, password: string): Promise<UserRow> {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw AppException.unauthorized('Invalid email or password');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw AppException.unauthorized('Invalid email or password');
    }
    return user;
  }

  async findById(id: string): Promise<UserRow | null> {
    return this.usersRepository.findById(id);
  }
}
