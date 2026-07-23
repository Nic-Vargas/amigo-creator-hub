import { Controller, ForbiddenException, Post } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('init')
  async initUser() {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException(
        'Este endpoint no está disponible en producción.',
      );
    }

    return this.usersService.createInitialUser();
  }
  /*@Post('change-admin-password')
  changeAdminPassword() {
    return this.usersService.changeAdminPassword();
  }*/
}