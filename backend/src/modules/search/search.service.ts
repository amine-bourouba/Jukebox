import { Injectable } from '@nestjs/common';

@Injectable()
export class SearchService {
  search(q: string) {
    return { results: [`Result for ${q}`] };
  }
}
