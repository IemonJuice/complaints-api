// apps/complaint-service/src/main.ts
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { ComplaintServiceModule } from './complaint-service.module';
import { AllExceptionsFilter } from '../../auth-service/src/filters/all-exception-filters';

async function bootstrap() {
  const rabbitmqUrl =
    process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
  const queue = process.env.RABBITMQ_QUEUE || 'complaint_queue';

  console.log('🚀 Starting Complaint Service...');
  console.log('📡 RabbitMQ URL:', rabbitmqUrl);
  console.log('📬 Queue:', queue);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ComplaintServiceModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [rabbitmqUrl],
        queue: queue,
        queueOptions: {
          durable: true,
        },
      },
    },
  );

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen();

  console.log('✅ Complaint Service is listening on queue:', queue);
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start Complaint Service:', err);
  process.exit(1);
});
