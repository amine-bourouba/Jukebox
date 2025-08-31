import { IsUUID } from 'class-validator';

export class FollowUserDto {
  @IsUUID()
  targetUserId!: string;
}
