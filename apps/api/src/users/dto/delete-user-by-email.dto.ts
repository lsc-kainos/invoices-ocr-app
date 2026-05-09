import { IsEmail, MaxLength } from 'class-validator';

export class DeleteUserByEmailDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;
}
