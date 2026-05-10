import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsObject,
} from 'class-validator';
import { LlmConfigKey } from '@prisma/client';

export class CreateLlmConfigDto {
  @IsEnum(LlmConfigKey)
  key!: LlmConfigKey;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  model!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(32_000)
  prompt!: string;

  @IsObject()
  @IsOptional()
  params?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  @MaxLength(2_000)
  notes?: string;
}
