import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  // Swagger Documentation Setup (Lab 4)
  const config = new DocumentBuilder()
    .setTitle('Propellant Impulse API')
    .setDescription(
      'REST API веб-сервиса базы данных видов топлива ЯРД и расчета удельного импульса. Сессионная аутентификация через куки и Redis.',
    )
    .setVersion('1.0')
    .addCookieAuth('sessionId', {
      type: 'apiKey',
      in: 'cookie',
      name: 'sessionId',
      description: 'Сессионная кука авторизации (устанавливается сервером при POST /api/auth/login)',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Propellant Impulse Backend is running on: http://localhost:${port}/propellants/feed`);
  console.log(`Swagger UI is available at: http://localhost:${port}/api`);
}
bootstrap();
