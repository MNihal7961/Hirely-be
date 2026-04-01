import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection, ConnectionStates } from 'mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { AiModelModule } from './ai-model/ai-model.module';
import { InterviewModule } from './interview/interview.module';

const mongoLogger = new Logger('MongoDB');

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        connectionFactory: (connection: Connection) => {
          const logConnected = () =>
            mongoLogger.verbose(
              `Connected to ${connection.host}/${connection.name}`,
            );

          // readyState 1 = already connected (fast on localhost)
          if (connection.readyState === ConnectionStates.connected) {
            logConnected();
          } else {
            connection.once('open', logConnected);
          }

          connection.on('disconnected', () =>
            mongoLogger.warn('Disconnected from MongoDB'),
          );
          connection.on('error', (err: Error) =>
            mongoLogger.error(`Connection error: ${err.message}`),
          );

          return connection;
        },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    AiModelModule,
    InterviewModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
