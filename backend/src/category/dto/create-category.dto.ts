import { IsOptional, IsString, Length, MaxLength } from 'class-validator';
export class CreateCategoryDto {
  @IsString()
  @Length(2, 80)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string;
}
