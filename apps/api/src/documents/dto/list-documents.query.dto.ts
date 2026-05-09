import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsISO8601, IsOptional } from 'class-validator';
import { DocumentStatus } from '@prisma/client';

export class ListDocumentsQueryDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string'
      ? value
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : value,
  )
  @IsArray()
  @IsEnum(DocumentStatus, { each: true })
  status?: DocumentStatus[];

  @IsOptional()
  @IsISO8601()
  updatedSince?: string;
}
