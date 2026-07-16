import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
@ApiOperation({
  summary: 'Iniciar sesión',
  description: 'Valida las credenciales del usuario y retorna un token JWT.',
})
@ApiBody({
  type: LoginDto,
  examples: {
    admin: {
      summary: 'Usuario administrador demo',
      value: {
        email: 'admin@sisrec.com',
        password: '123456',
      },
    },
  },
})
@ApiResponse({
  status: 201,
  description: 'Login exitoso. Retorna accessToken y datos básicos del usuario.',
})
@ApiResponse({
  status: 401,
  description: 'Credenciales inválidas o empresa inactiva.',
})
async login(@Body() loginDto: LoginDto) {
  return this.authService.login(loginDto);
}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener usuario autenticado',
    description: 'Retorna la información del usuario a partir del token JWT.',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario autenticado obtenido correctamente.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido, vencido o no enviado.',
  })
  async me(@CurrentUser() user: unknown) {
    return user;
  }
}