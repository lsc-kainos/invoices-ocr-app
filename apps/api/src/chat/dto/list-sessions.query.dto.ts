import { Type } from 'class-transformer';
import { IsInt, Max, Min, IsOptional } from 'class-validator';

export class ListSessionsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 50;
}
