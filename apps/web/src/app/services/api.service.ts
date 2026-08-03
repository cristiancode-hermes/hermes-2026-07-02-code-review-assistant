import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Repository {
  id: string;
  name: string;
  fullName: string;
  description: string;
  url: string;
  defaultBranch: string;
  language: string;
  stars: number;
  private: boolean;
  updatedAt: string;
  prCount?: number;
  issuesCount?: number;
}

export interface PullRequest {
  id: string;
  number: number;
  title: string;
  description: string;
  author: string;
  sourceBranch: string;
  targetBranch: string;
  status: 'open' | 'merged' | 'closed';
  createdAt: string;
  updatedAt: string;
  reviewStatus?: 'pending' | 'in_progress' | 'completed' | 'failed';
  scores?: ReviewScores;
}

export interface ReviewScores {
  style: number;
  bug: number;
  security: number;
  performance: number;
  overall: number;
}

export interface AgentProgress {
  agent: string;
  status: 'queued' | 'analyzing' | 'completed' | 'failed';
  progress: number;
  message?: string;
}

export interface Review {
  id: string;
  prId: string;
  prTitle: string;
  repositoryName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  scores?: ReviewScores;
  agents: AgentProgress[];
  findings: Finding[];
  summary: string;
  createdAt: string;
  completedAt?: string;
}

export interface Finding {
  id: string;
  fileId: string;
  fileName: string;
  line: number;
  column?: number;
  severity: 'critical' | 'major' | 'minor' | 'info';
  category: 'style' | 'bug' | 'security' | 'performance';
  title: string;
  description: string;
  suggestion: string;
  code?: string;
}

export interface DiffFile {
  id: string;
  fileName: string;
  oldFileName?: string;
  status: 'added' | 'modified' | 'removed';
  additions: number;
  deletions: number;
  hunks: DiffHunk[];
}

export interface DiffHunk {
  id: string;
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export interface DiffLine {
  type: 'context' | 'addition' | 'deletion';
  oldNumber: number | null;
  newNumber: number | null;
  content: string;
  hasFinding: boolean;
  findingId?: string;
}

export interface DashboardStats {
  totalRepositories: number;
  totalPullRequests: number;
  totalIssues: number;
  averageScore: number;
  recentReviews: Review[];
  scoreByCategory: { category: string; score: number }[];
  activityData: { date: string; reviews: number }[];
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly apiUrl = '/api';

  constructor(private http: HttpClient) {}

  // Dashboard
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/stats`);
  }

  // Repositories
  getRepositories(): Observable<Repository[]> {
    return this.http.get<Repository[]>(`${this.apiUrl}/repositories`);
  }

  getRepository(id: string): Observable<Repository> {
    return this.http.get<Repository>(`${this.apiUrl}/repositories/${id}`);
  }

  createRepository(data: Partial<Repository>): Observable<Repository> {
    return this.http.post<Repository>(
      `${this.apiUrl}/repositories`,
      data
    );
  }

  deleteRepository(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/repositories/${id}`);
  }

  // Pull Requests
  getPullRequests(
    repoId: string,
    params?: { status?: string; page?: number }
  ): Observable<PullRequest[]> {
    let httpParams = new HttpParams();
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.page) httpParams = httpParams.set('page', params.page);
    return this.http.get<PullRequest[]>(
      `${this.apiUrl}/repositories/${repoId}/prs`,
      { params: httpParams }
    );
  }

  getPullRequest(
    repoId: string,
    prId: string
  ): Observable<PullRequest> {
    return this.http.get<PullRequest>(
      `${this.apiUrl}/repositories/${repoId}/prs/${prId}`
    );
  }

  createPullRequest(
    repoId: string,
    data: Partial<PullRequest>
  ): Observable<PullRequest> {
    return this.http.post<PullRequest>(
      `${this.apiUrl}/repositories/${repoId}/prs`,
      data
    );
  }

  // Reviews
  getReview(
    repoId: string,
    prId: string
  ): Observable<Review> {
    return this.http.get<Review>(
      `${this.apiUrl}/repositories/${repoId}/prs/${prId}/review`
    );
  }

  triggerReview(repoId: string, prId: string): Observable<Review> {
    return this.http.post<Review>(
      `${this.apiUrl}/repositories/${repoId}/prs/${prId}/review`,
      {}
    );
  }

  getReviewProgress(
    repoId: string,
    prId: string
  ): Observable<AgentProgress[]> {
    return this.http.get<AgentProgress[]>(
      `${this.apiUrl}/repositories/${repoId}/prs/${prId}/review/progress`
    );
  }

  // Review History
  getReviewHistory(params?: {
    page?: number;
    limit?: number;
  }): Observable<Review[]> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page);
    if (params?.limit) httpParams = httpParams.set('limit', params.limit);
    return this.http.get<Review[]>(`${this.apiUrl}/reviews`, {
      params: httpParams,
    });
  }

  // Diff
  getDiff(
    repoId: string,
    prId: string,
    fileId: string
  ): Observable<DiffFile> {
    return this.http.get<DiffFile>(
      `${this.apiUrl}/repositories/${repoId}/prs/${prId}/diff/${fileId}`
    );
  }

  // Findings
  getFindings(
    repoId: string,
    prId: string,
    params?: {
      severity?: string;
      category?: string;
      file?: string;
    }
  ): Observable<Finding[]> {
    let httpParams = new HttpParams();
    if (params?.severity)
      httpParams = httpParams.set('severity', params.severity);
    if (params?.category)
      httpParams = httpParams.set('category', params.category);
    if (params?.file) httpParams = httpParams.set('file', params.file);
    return this.http.get<Finding[]>(
      `${this.apiUrl}/repositories/${repoId}/prs/${prId}/findings`,
      { params: httpParams }
    );
  }

  // Findings CSV export URL
  getFindingsExportUrl(
    repoId: string,
    prId: string,
    params?: { severity?: string; category?: string }
  ): string {
    const qp = new URLSearchParams();
    if (params?.severity) qp.set('severity', params.severity);
    if (params?.category) qp.set('category', params.category);
    const qs = qp.toString();
    return `${this.apiUrl}/repositories/${repoId}/prs/${prId}/findings/export${qs ? `?${qs}` : ''}`;
  }

  // User settings
  getSettings(): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(
      `${this.apiUrl}/user/settings`
    );
  }

  updateSettings(
    settings: Record<string, unknown>
  ): Observable<Record<string, unknown>> {
    return this.http.put<Record<string, unknown>>(
      `${this.apiUrl}/user/settings`,
      settings
    );
  }
}
