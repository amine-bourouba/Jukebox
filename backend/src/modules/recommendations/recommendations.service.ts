import { Injectable } from '@nestjs/common';

@Injectable()
export class RecommendationsService {
  getRecommendations(userId: string) {
    return { recommendations: [`Recommended for user ${userId}`] };
  }
}
