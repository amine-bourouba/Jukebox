import { IsString, IsOptional, IsArray, IsInt, IsBoolean } from 'class-validator';

export class CreateSongDto {
  @IsString()
  title!: string;

  @IsArray()
  artist!: string;

  @IsOptional()
  @IsString()
  album?: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  @IsInt()
  duration?: number;

  @IsOptional()
  @IsBoolean()
  explicit?: boolean;

  @IsString()
  filePath!: string;
}