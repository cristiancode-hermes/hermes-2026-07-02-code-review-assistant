export interface AgentStatus {
  agentName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  findingsCount?: number;
  error?: string;
}
