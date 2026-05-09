import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { secretFingerprint } from './auth/util/secret-fingerprint';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Fingerprint pra comparar com o do web e provar igualdade do secret
  // sem expor o valor. Mesmo input → mesmo output em ambos os services.
  const fp = secretFingerprint(config.getOrThrow<string>('NEXTAUTH_SECRET'));
  logger.log(`NEXTAUTH_SECRET fingerprint: ${fp}`);

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
