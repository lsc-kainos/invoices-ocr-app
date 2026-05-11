import { IsString, Matches } from 'class-validator';

export class TestLlmConfigDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9_\-.]+$/, { message: 'sampleFilename inválido' })
  sampleFilename!: string;
}
