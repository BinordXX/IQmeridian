import { BadRequestException, Injectable } from '@nestjs/common';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';

const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_OPTIONS = {
  N: 16384,
  r: 8,
  p: 1,
};

type ScryptOptions = typeof SCRYPT_OPTIONS;

@Injectable()
export class PasswordService {
  async hashPassword(password: string): Promise<string> {
    this.assertPasswordStrength(password);

    const salt = randomBytes(16).toString('base64url');
    const key = await this.scryptWithOptions(
      this.withPepper(password),
      salt,
      SCRYPT_KEY_LENGTH,
      SCRYPT_OPTIONS,
    );

    return [
      'scrypt',
      SCRYPT_OPTIONS.N,
      SCRYPT_OPTIONS.r,
      SCRYPT_OPTIONS.p,
      salt,
      key.toString('base64url'),
    ].join('$');
  }

  async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    const parts = storedHash.split('$');

    if (parts.length !== 6 || parts[0] !== 'scrypt') {
      return false;
    }

    const nValue = parts[1];
    const rValue = parts[2];
    const pValue = parts[3];
    const salt = parts[4];
    const expectedKey = parts[5];

    if (!nValue || !rValue || !pValue || !salt || !expectedKey) {
      return false;
    }

    const expected = Buffer.from(expectedKey, 'base64url');
    const key = await this.scryptWithOptions(
      this.withPepper(password),
      salt,
      expected.length,
      {
        N: Number(nValue),
        r: Number(rValue),
        p: Number(pValue),
      },
    );

    if (key.length !== expected.length) {
      return false;
    }

    return timingSafeEqual(key, expected);
  }

  assertPasswordStrength(password: string) {
    if (password.length < 12) {
      throw new BadRequestException(
        'Password must be at least 12 characters long.',
      );
    }

    if (password.length > 128) {
      throw new BadRequestException('Password must not exceed 128 characters.');
    }

    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);

    if (!hasLowercase || !hasUppercase || !hasNumber || !hasSymbol) {
      throw new BadRequestException(
        'Password must contain uppercase, lowercase, number, and symbol characters.',
      );
    }
  }

  private scryptWithOptions(
    password: string,
    salt: string,
    keyLength: number,
    options: ScryptOptions,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const scrypt = scryptCallback as unknown as (
        password: string,
        salt: string,
        keyLength: number,
        options: ScryptOptions,
        callback: (error: Error | null, derivedKey: Buffer) => void,
      ) => void;

      scrypt(password, salt, keyLength, options, (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(derivedKey);
      });
    });
  }

  private withPepper(password: string) {
    const pepper = process.env.PASSWORD_PEPPER;

    if (!pepper) {
      return password;
    }

    return `${pepper}:${password}`;
  }
}
