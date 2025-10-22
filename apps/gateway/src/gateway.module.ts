// apps/gateway/src/gateway.module.ts
import { Module, OnModuleInit, OnApplicationBootstrap, Logger, Inject } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport, ClientProxy } from '@nestjs/microservices';
import {
  AUTH_SERVICE_RABITTMQ,
  COMPLAINT_SERVICE_RABITTMQ,
} from '../../../common/contstants';
import { ApiGatewayController } from './controllers/auth-gateway.controller';
import { JwtAuthGuard } from '../../auth-service/src/guards/jwt.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '1d'),
        },
      }),
      inject: [ConfigService],
    }),
    ClientsModule.registerAsync([
      {
        name: AUTH_SERVICE_RABITTMQ,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const rabbitmqUrl = configService.get<string>('RABBITMQ_URL');
          const queue = configService.get<string>('RABBITMQ_AUTH_QUEUE', 'auth_queue');

          console.log('🔧 [AUTH CLIENT CONFIG]');
          console.log('  URL:', rabbitmqUrl);
          console.log('  Queue:', queue);

          return {
            transport: Transport.RMQ,
            options: {
              urls: [rabbitmqUrl],
              queue: queue,
              queueOptions: {
                durable: true,
              },
              noAck: false,
              prefetchCount: 1,
            },
          };
        },
        inject: [ConfigService],
      },
      {
        name: COMPLAINT_SERVICE_RABITTMQ,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const rabbitmqUrl = configService.get<string>('RABBITMQ_URL');
          const queue = configService.get<string>('RABBITMQ_COMPLAINT_QUEUE', 'complaint_queue');

          console.log('🔧 [COMPLAINT CLIENT CONFIG]');
          console.log('  URL:', rabbitmqUrl);
          console.log('  Queue:', queue);

          return {
            transport: Transport.RMQ,
            options: {
              urls: [rabbitmqUrl],
              queue: queue,
              queueOptions: {
                durable: true,
              },
              noAck: false,
              prefetchCount: 1,
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [ApiGatewayController],
  providers: [JwtAuthGuard, RolesGuard],
})
export class GatewayModule implements OnModuleInit, OnApplicationBootstrap {
  private readonly logger = new Logger(GatewayModule.name);

  constructor(
    @Inject(AUTH_SERVICE_RABITTMQ) private authClient: ClientProxy,
    @Inject(COMPLAINT_SERVICE_RABITTMQ) private complaintClient: ClientProxy,
  ) {
    this.logger.log('🏗️ GatewayModule constructor called');
  }

  async onModuleInit() {
    this.logger.log('⚙️ onModuleInit called - connecting to RabbitMQ...');

    // Auth Client
    try {
      this.logger.log('🔌 Attempting to connect AUTH client...');
      await this.authClient.connect();
      this.logger.log('✅ AUTH client connected successfully');
    } catch (error) {
      this.logger.error('❌ AUTH client connection failed:', error.message);
      this.logger.error('Stack:', error.stack);
    }

    // Complaint Client
    try {
      this.logger.log('🔌 Attempting to connect COMPLAINT client...');
      await this.complaintClient.connect();
      this.logger.log('✅ COMPLAINT client connected successfully');
    } catch (error) {
      this.logger.error('❌ COMPLAINT client connection failed:', error.message);
      this.logger.error('Stack:', error.stack);
    }
  }

  async onApplicationBootstrap() {
    this.logger.log('🚀 onApplicationBootstrap called');

    // Тест ping для Auth Service
    try {
      this.logger.log('🏓 Testing AUTH service ping...');
      const result = await this.authClient.send({ cmd: 'ping' }, {}).toPromise();
      this.logger.log('✅ AUTH service ping response:', result);
    } catch (error) {
      this.logger.error('❌ AUTH service ping failed:', error.message);
    }

    // Тест ping для Complaint Service
    try {
      this.logger.log('🏓 Testing COMPLAINT service ping...');
      const result = await this.complaintClient.send({ cmd: 'ping' }, {}).toPromise();
      this.logger.log('✅ COMPLAINT service ping response:', result);
    } catch (error) {
      this.logger.error('❌ COMPLAINT service ping failed:', error.message);
    }
  }
}