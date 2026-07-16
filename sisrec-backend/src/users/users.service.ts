import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createInitialUser() {
    const password = await bcrypt.hash('123456', 10);

    const company = await this.prisma.company.upsert({
      where: { slug: 'empresa-demo' },
      update: {},
      create: {
        name: 'Empresa Demo',
        slug: 'empresa-demo',
      },
    });

    const user = await this.prisma.user.upsert({
      where: {
        companyId_email: {
          companyId: company.id,
          email: 'admin@sisrec.com',
        },
      },
      update: {},
      create: {
        companyId: company.id,
        email: 'admin@sisrec.com',
        passwordHash: password,
        fullName: 'Administrador',
        role: 'ADMIN',
      },
    });

    return {
      email: user.email,
      password: '123456',
    };
  }
  async findByEmail(email: string) {
  return this.prisma.user.findFirst({
    where: {
      email,
      isActive: true,
    },
    include: {
      company: true,
    },
  });
}
}