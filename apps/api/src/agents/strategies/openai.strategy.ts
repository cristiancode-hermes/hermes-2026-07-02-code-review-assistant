import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CodeAnalysisStrategy } from './code-analysis.strategy';
import { Finding } from '../types/finding.interface';

@Injectable()
export class OpenAIStrategy implements CodeAnalysisStrategy {
  name = 'openai';

  constructor(private configService: ConfigService) {}

  async analyze(fileText: string, filePath: string, context: any): Promise<Finding[]> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey || apiKey.startsWith('sk-you')) {
      // No API key configured - return empty
      return [];
    }

    // Placeholder for OpenAI integration
    // When API key is configured, this would call the OpenAI API
    return [];
  }
}
