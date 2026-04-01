import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { AiModelService } from 'src/ai-model/ai-model.service';
import * as fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { UserService } from 'src/user/user.service';
import { Interview, InterviewMode } from './entities/interview.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

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

  constructor(
    @InjectModel(Interview.name) private interviewModel: Model<Interview>,
    private readonly aiModelService: AiModelService,
    private readonly userService: UserService,
  ) {}

  async saveInterview(
    userId: Types.ObjectId,
    role: string,
    experience: string,
    mode: InterviewMode,
    resumeText: string,
    questionArray: string[],
  ) {
    const interview = new Interview();
    interview.userId = userId;
    interview.role = role;
    interview.experience = experience;
    interview.resumeText = resumeText;
    interview.mode = mode;
    interview.questions = questionArray.map((q, index) => ({
      question: q,
      difficulty: ['easy', 'easy', 'medium', 'medium', 'hard'][index],
      timeLimit: [60, 60, 90, 90, 120][index],
      answer: null,
      feedback: null,
      score: 0,
      confidence: 0,
      communication: 0,
      correctness: 0,
    }));

    return await this.interviewModel.create(interview);
  }

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

      const cleanedResponse = aiResponse
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```\s*$/, '')
        .trim();
      const parsedAIResponse = JSON.parse(cleanedResponse);
      return {
        resumeText: resumeText,
        role: parsedAIResponse.role || 'NA',
        experience: parsedAIResponse.experience || 'Fresher',
        projects: parsedAIResponse.projects || [],
        skills: parsedAIResponse.skills || [],
      };
    } catch (error) {
      this.logger.error(`Error in analyzeResume`, error);
      throw new Error(`Failed to analyze resume: ${error}`);
    }
  }

  async startInterview(
    userId: string,
    role: string,
    experience: string,
    mode: InterviewMode,
    resumeText: string,
    projects: string[],
    skills: string[],
  ) {
    try {
      const user = await this.userService.getUserById(userId);
      if (!user) {
        throw new NotFoundException('No user found while starting interview');
      }
      if (user.credits < 50) {
        throw new ForbiddenException(
          'Not enough credits, minmum 50 credits required',
        );
      }

      const skillsText = skills.length > 0 ? skills.join(', ') : 'None';
      const projectsText = projects.length > 0 ? projects.join(', ') : 'None';

      const userPrompt = `
      Role:${role}
      Experience:${experience}
      InterviewMode:${mode}
      Projects:${projectsText}
      Skills:${skillsText}
      Resume:${resumeText}
      `;

      const messages = [
        {
          role: 'system',
          content: `
          You are a real human interviewer conducting a professional interview.

          Speak in simple, natural English as if you are directly talking to the candidate.

          Generate exactly 5 interview questions.

          Strict Rules:
          - Each question must contain between 15 and 25 words.
          - Each question must be a simple complete sentence.
          - Do NOT number them.
          - Do NOT add extra explanations.
          - Do NOT add extra text before or after.
          - One question per line only.
          - Keep language simple and conversational.
          _ Questions must feel practical and realistic.

          Difficulty Progression:
          Question 1 → easy
          Question 2 → easy
          Question 3 → medium
          Question 4 → medium
          Question 5 → hard

          Make questions based on the candiadte's role, experience, projects, skills and resume details.
          `,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ];

      const aiResponse = await this.aiModelService.askAI(messages);

      if (!aiResponse) {
        throw new Error('failed to generate interview using AI Model');
      }

      const questionsArray = aiResponse
        .split('\n')
        .map((q) => q?.trim())
        .filter((q) => q.length > 0)
        .slice(0, 5);

      if (!questionsArray || questionsArray.length === 0) {
        throw new Error('Questions are empty from AI response');
      }

      user.credits -= 50;
      await this.userService.updateUser(user._id.toString(), {
        credits: user.credits,
      });

      const interview = await this.saveInterview(
        user._id,
        role,
        experience,
        mode,
        resumeText,
        questionsArray,
      );

      return interview;
    } catch (error: any) {
      this.logger.error('Error while starting interview', error);
      throw new Error(`Failed to start interview: ${error}`);
    }
  }

  async submitAnswer() {}
}
