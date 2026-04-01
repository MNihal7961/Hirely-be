import { Module } from '@nestjs/common';
import { InterviewService } from './interview.service';
import { InterviewController } from './interview.controller';
import { AiModelModule } from 'src/ai-model/ai-model.module';

@Module({
  imports: [AiModelModule],
  controllers: [InterviewController],
  providers: [InterviewService],
})
export class InterviewModule {}
