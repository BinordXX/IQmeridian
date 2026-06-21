import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { AuthThrottleService } from './auth-throttle.service';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthThrottleService,
    PasswordService,
    TokenService,
    JwtAuthGuard,
  ],
  exports: [
    AuthService,
    AuthThrottleService,
    PasswordService,
    TokenService,
    JwtAuthGuard,
  ],
})
export class AuthModule {}
