import { IsString, IsOptional } from 'class-validator';

export class CreatePlaylistDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  songId?: string;
}