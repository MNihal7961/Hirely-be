import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { InterviewService } from './interview.service';

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
}
