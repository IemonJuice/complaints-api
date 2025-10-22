// apps/gateway/src/main.ts
import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './gateway.module';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Gateway');

  logger.log('🚀 Starting Gateway...');

  const app = await NestFactory.create(GatewayModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  app.enableCors({
    origin: '*',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`✅ Gateway is running on port ${port}`);
  logger.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(
    `🔗 RabbitMQ URL: ${process.env.RABBITMQ_URL ? '✓ Set' : '✗ Not set'}`,
  );
  logger.log(
    `📬 Auth Queue: ${process.env.RABBITMQ_AUTH_QUEUE || 'auth_queue'}`,
  );
  logger.log(
    `📬 Complaint Queue: ${process.env.RABBITMQ_COMPLAINT_QUEUE || 'complaint_queue'}`,
  );
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start Gateway:', error);
  process.exit(1);
});
