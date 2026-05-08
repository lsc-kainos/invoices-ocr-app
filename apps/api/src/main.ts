import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: config
      .getOrThrow<string>('ALLOWED_ORIGINS')
      .split(',')
      .map((s) => s.trim()),
    credentials: false,
  });

  const port = config.get<number>('PORT') ?? 3001;
  await app.listen(port);
  logger.log(`API running on http://localhost:${port}`);
}

void bootstrap();
