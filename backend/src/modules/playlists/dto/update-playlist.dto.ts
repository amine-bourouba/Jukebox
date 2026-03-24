import { IsString, IsOptional } from 'class-validator';

export class UpdatePlaylistDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
