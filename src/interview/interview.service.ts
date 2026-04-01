import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { AiModelService } from 'src/ai-model/ai-model.service';
import * as fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

interface UploadedFile {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
}

@Injectable()
export class InterviewService {
  private readonly logger = new Logger(InterviewService.name);

  constructor(private readonly aiModelService: AiModelService) {}

  async analyzeResume(file: UploadedFile) {
    try {
      const fileBuffer = await fs.promises.readFile(file.path);
      const uint8Array = new Uint8Array(fileBuffer);
      const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;

      let resumeText = '';
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        resumeText += `\n${pageText}`;
      }

      resumeText = resumeText.replace(/\s+/g, ' ').trim();

      const resumeExtractMessage = [
        {
          role: 'system',
          content: `
            Extract structured data from resume.

            Return  strictly JSON:

            {
                "role": "string",
                "experience": "string",
                "projects: ["project1", "project2"],
                "skills": ["skill1", "skill2"]
            }
            `,
        },
        {
          role: 'user',
          content: resumeText,
        },
      ];

      const aiResponse = await this.aiModelService.askAI(resumeExtractMessage);

      fs.unlink(file.path, (err) => {
        if (err) {
          this.logger.error(`Failed to delete file ${file.path}`, err);
        } else {
          this.logger.log(`Deleted file ${file.path}`);
        }
      });

      const parsedAIResponse = JSON.parse(aiResponse);
      return {
        role: parsedAIResponse.role,
        experience: parsedAIResponse.experience,
        projects: parsedAIResponse.projects,
        skills: parsedAIResponse.skills,
      };
    } catch (error) {
      this.logger.error(`Error in analyzeResume`, error);
      throw new Error(`Failed to analyze resume: ${error}`);
    }
  }
}
