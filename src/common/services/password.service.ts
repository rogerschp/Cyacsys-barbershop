import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { IPasswordHasher } from '../interfaces/password-hasher.interface';
const SALT_ROUNDS = 10;
@Injectable()
export class PasswordService implements IPasswordHasher {
    async hash(plainPassword: string): Promise<string> {
        return bcrypt.hash(plainPassword, SALT_ROUNDS);
    }
    async compare(plainPassword: string, hash: string): Promise<boolean> {
        return bcrypt.compare(plainPassword, hash);
    }
}
