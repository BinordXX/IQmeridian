import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ContactService } from './contact.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { UpdateContactMessageStatusDto } from './dto/update-contact-message-status.dto';

type ContactAdminUser = {
  id: string;
  role: UserRole | string;
  email?: string | null;
  name?: string | null;
};

@Controller('contact-messages')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateContactMessageDto) {
    return this.contactService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('authenticated')
  @HttpCode(HttpStatus.CREATED)
  createAuthenticated(
    @CurrentUser() user: ContactAdminUser,
    @Body() dto: CreateContactMessageDto,
  ) {
    return this.contactService.createAuthenticated(user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin')
  listForAdmin(
    @CurrentUser() user: ContactAdminUser,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('query') query?: string,
    @Query('source') source?: string,
    @Query('status') status?: string,
  ) {
    return this.contactService.listForAdmin(user, {
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      query,
      source,
      status,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/:id')
  getForAdmin(@CurrentUser() user: ContactAdminUser, @Param('id') id: string) {
    return this.contactService.getForAdmin(user, id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/:id/status')
  updateStatusForAdmin(
    @CurrentUser() user: ContactAdminUser,
    @Param('id') id: string,
    @Body() dto: UpdateContactMessageStatusDto,
  ) {
    return this.contactService.updateStatusForAdmin(user, id, dto);
  }
}