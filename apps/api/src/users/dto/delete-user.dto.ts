import { IsEmail, MaxLength } from 'class-validator';

export class DeleteUserDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;
}
