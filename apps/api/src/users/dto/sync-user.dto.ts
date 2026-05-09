import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class SyncUserDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  avatar?: string;
}
