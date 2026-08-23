import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcrypt';

import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../generated/prisma/enums.js';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const prisma = app.get(PrismaService);

    const company = await prisma.company.findUnique({
      where: {
        slug: 'empresa-demo',
      },
    });

    if (!company) {
      throw new Error(
        'No se encontró la empresa con slug empresa-demo.',
      );
    }

    const users = [
      {
        email: process.env.OWNER_EMAIL,
        password: process.env.OWNER_PASSWORD,
        fullName: 'Owner SISREC',
        role: UserRole.OWNER,
      },
      {
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        fullName: 'Administrador SISREC',
        role: UserRole.ADMIN,
      },
      {
        email: process.env.USER_EMAIL,
        password: process.env.USER_PASSWORD,
        fullName: 'Usuario Consulta',
        role: UserRole.USER,
      },
    ];

    for (const item of users) {
      if (!item.email || !item.password) {
        throw new Error(
          `Faltan credenciales para el rol ${item.role}.`,
        );
      }

      const passwordHash = await bcrypt.hash(
        item.password,
        12,
      );

      await prisma.user.upsert({
        where: {
          companyId_email: {
            companyId: company.id,
            email: item.email,
          },
        },

        update: {
          passwordHash,
          fullName: item.fullName,
          role: item.role,
          isActive: true,
        },

        create: {
          companyId: company.id,
          email: item.email,
          passwordHash,
          fullName: item.fullName,
          role: item.role,
          isActive: true,
        },
      });

      console.log(
        `${item.role} creado/actualizado: ${item.email}`,
      );
    }
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});