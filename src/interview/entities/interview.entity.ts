import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type InterviewDocument = HydratedDocument<Interview>;

export enum InterviewMode {
  HR = 'HR',
  TECHNICAL = 'Technical',
}

export enum InterviewStatus {
  INCOMPLETE = 'incomplete',
  COMPLETE = 'complete',
}

@Schema({ _id: false })
export class InterviewQuestion {
  @Prop({ required: true })
  question: string;

  @Prop({ required: true })
  difficulty: string;

  @Prop({ required: true, default: 0 })
  timeLimit: number;

  @Prop({ type: String, default: null })
  answer: string | null;

  @Prop({ type: String, default: null })
  feedback: string | null;

  @Prop({ default: 0 })
  score: number;

  @Prop({ default: 0 })
  confidence: number;

  @Prop({ default: 0 })
  communication: number;

  @Prop({ default: 0 })
  correctness: number;
}

export const InterviewQuestionSchema =
  SchemaFactory.createForClass(InterviewQuestion);

@Schema({ timestamps: true })
export class Interview {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  role: string;

  @Prop({ required: true })
  experience: string;

  @Prop({ required: true })
  resumeText: string;

  @Prop({ required: true, enum: InterviewMode })
  mode: InterviewMode;

  @Prop({ enum: InterviewStatus, default: InterviewStatus.INCOMPLETE })
  status: InterviewStatus;

  @Prop({ default: 0 })
  finalScore: number;

  @Prop({ type: [InterviewQuestionSchema], default: [] })
  questions: InterviewQuestion[];
}

export const InterviewSchema = SchemaFactory.createForClass(Interview);
