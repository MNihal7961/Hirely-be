import { Module } from '@nestjs/common';
import { InterviewService } from './interview.service';
import { InterviewController } from './interview.controller';
import { AiModelModule } from 'src/ai-model/ai-model.module';
import { UserModule } from 'src/user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Interview, InterviewSchema } from './entities/interview.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Interview.name, schema: InterviewSchema },
    ]),
    AiModelModule,
    UserModule,
  ],
  controllers: [InterviewController],
  providers: [InterviewService],
})
export class InterviewModule {}
