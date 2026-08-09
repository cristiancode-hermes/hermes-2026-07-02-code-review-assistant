import { Inject, Injectable } from '@nestjs/common';
import { CodeAnalysisStrategy } from '../strategies/code-analysis.strategy';
import { Finding } from '../types/finding.interface';

@Injectable()
export class PerformanceAgent {
  constructor(@Inject('CodeAnalysisStrategy') private strategy: CodeAnalysisStrategy) {}

  async analyze(fileText: string, filePath: string, context: any): Promise<Finding[]> {
    const findings = await this.strategy.analyze(fileText, filePath, context);
    return findings.filter((f) => f.category === 'performance');
  }
}
