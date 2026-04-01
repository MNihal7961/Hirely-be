import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiModelService {
  private readonly logger = new Logger(AiModelService.name);
  private readonly openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async askAI(messages: any) {
    try {
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        throw new HttpException('Invalid messages format', 400);
      }

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
      });

      const content = response.choices[0].message?.content;

      if (!content || !content.trim()) {
        throw new HttpException('No content returned from AI', 500);
      }
      return content;
    } catch (error: any) {
      this.logger.error(`Error in askAI`, error);
      throw new Error(`Failed to ask AI: ${error}`);
    }
  }
}
