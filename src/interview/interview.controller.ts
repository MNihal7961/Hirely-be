import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Body,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { InterviewService } from './interview.service';
import { Request } from 'express';
import { InterviewMode } from './entities/interview.entity';

interface UploadedFile {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
}

@Controller('interview')
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  @Post('analyze')
  @UseInterceptors(
    FileInterceptor('resume', {
      storage: diskStorage({
        destination: './public/resumes',
        filename: (_req, file, cb) => {
          cb(null, `resume${extname(file?.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowed = ['.pdf', '.doc', '.docx'];
        if (!allowed.includes(extname(file.originalname).toLowerCase())) {
          return cb(
            new BadRequestException('Only PDF and Word documents are allowed'),
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async analyzeResume(@UploadedFile() file: UploadedFile) {
    if (!file) {
      throw new BadRequestException('Resume file is required');
    }
    return this.interviewService.analyzeResume(file);
  }

  @Post('start')
  async startInterview(@Req() req: Request, @Body() body: any) {
    const { userId } = req.user as { userId: string; email: string };
    const { role, experience, mode, resumeText, projects, skills } = body;

    if (
      !role ||
      experience ||
      mode ||
      resumeText ||
      !Array.isArray(projects) ||
      !Array.isArray(skills)
    ) {
      throw new BadRequestException('Required parameters are missing');
    }

    return await this.interviewService.startInterview(
      userId,
      role,
      experience,
      mode as InterviewMode,
      resumeText,
      projects || [],
      skills || [],
    );
  }

  @Post('answer')
  async answerQuestion(@Body() body: any) {
    const { interviewId, questionIndex, answer, timeTaken } = body;
    if (!interviewId || !questionIndex || !timeTaken || !answer) {
      throw new BadRequestException('Required parameters are missing');
    }
    return await this.interviewService.submitAnswer(
      interviewId,
      Number(questionIndex),
      answer,
      Number(timeTaken),
    );
  }

  @Post('finish')
  async finishInterview(@Body() body: any) {
    const { interviewId } = body;
    if (!interviewId) {
      throw new BadRequestException('Interview id is missing');
    }
    return await this.interviewService.finishInterview(interviewId);
  }
}
