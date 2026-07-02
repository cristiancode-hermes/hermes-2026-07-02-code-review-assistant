export interface Finding {
  file: string;
  line: number;
  column?: number;
  severity: 'critical' | 'major' | 'minor' | 'info';
  category: string;
  message: string;
  suggestion?: string;
  ruleId?: string;
}
