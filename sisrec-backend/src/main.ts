import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  DocumentBuilder,
  SwaggerModule,
} from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const productionOrigins = (process.env.FRONTEND_URL ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  const developmentOrigins = [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'https://sisrec-backend.onrender.com',
    'https://sisrec.onrender.com',
  ];

  const allowedOrigins = [
    ...productionOrigins,
    ...(process.env.NODE_ENV === 'production'
      ? []
      : developmentOrigins),
  ];

  app.enableCors({
  origin: (
    origin: string | undefined,
    callback: (
      error: Error | null,
      allow?: boolean,
    ) => void,
  ) => {
    // Permite solicitudes sin Origin, como Postman,
    // curl y algunas llamadas internas.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(
      new Error(
        `Origin no autorizado por CORS: ${origin}`,
      ),
      false,
    );
  },
  credentials: true,
});

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('SISREC API')
    .setDescription(
      'API backend para gestión de cartera, recobros y movimientos financieros.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(
    app,
    swaggerConfig,
  );

  SwaggerModule.setup('api', app, document);

  const port = Number(process.env.PORT) || 3000;

  await app.listen(port, '0.0.0.0');

  console.log(`SISREC API ejecutándose en el puerto ${port}`);
  console.log('Orígenes CORS autorizados:', allowedOrigins);
}

bootstrap();