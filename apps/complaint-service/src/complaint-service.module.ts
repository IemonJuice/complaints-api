import { Module } from '@nestjs/common';
import { ComplaintServiceController } from './complaint-service.controller';
import { ComplaintServiceService } from './complaint-service.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Complaint } from './entities/complaint.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/complaint-service/.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mariadb',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get<string>('DB_USERNAME', 'user'),
        password: configService.get<string>('MYSQL_ROOT_PASSWORD', 'root'),
        database: configService.get<string>('DB_NAME', 'ecomplaint'),
        entities: [Complaint],
        synchronize: configService.get<boolean>('DB_SYNC', true),
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Complaint]),
  ],
  controllers: [ComplaintServiceController],
  providers: [ComplaintServiceService],
})
export class ComplaintServiceModule {}
