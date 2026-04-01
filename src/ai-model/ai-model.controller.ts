import { Controller } from '@nestjs/common';
import { AiModelService } from './ai-model.service';

@Controller('ai-model')
export class AiModelController {
  constructor(private readonly aiModelService: AiModelService) {}
}
