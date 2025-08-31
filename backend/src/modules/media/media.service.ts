import { Injectable } from '@nestjs/common';

@Injectable()
export class MediaService {
  getMediaById(id: string) {
    return { id, url: `https://media.example.com/${id}` };
  }
}
