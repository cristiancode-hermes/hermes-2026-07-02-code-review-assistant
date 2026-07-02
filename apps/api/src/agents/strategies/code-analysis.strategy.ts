import { Finding } from '../types/finding.interface';

export interface CodeAnalysisStrategy {
  name: string;
  analyze(fileText: string, filePath: string, context: any): Promise<Finding[]>;
}
