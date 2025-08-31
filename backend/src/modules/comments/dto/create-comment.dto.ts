import { IsString, IsUUID, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateCommentDto {
  @IsUUID()
    songId!: string;

  @IsString()
    content!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}
