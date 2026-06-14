import { Injectable, Logger } from '@nestjs/common';

import { N8nWorkflow } from '@automation-hub/shared';

@Injectable()
export class N8nService {
  private readonly logger = new Logger(N8nService.name);
  private readonly n8nBaseUrl =
    process.env.N8N_BASE_URL || 'http://localhost:5678';
  private apiKey: string = process.env.N8N_API_KEY || '';

  setApiKey(key: string) {
    this.apiKey = key;
    this.logger.log('n8n API key updated');
  }

  getApiKey(): string {
    return this.apiKey;
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (this.apiKey) {
      headers['X-N8N-API-KEY'] = this.apiKey;
    }
    return headers;
  }

  async getWorkflows(): Promise<N8nWorkflow[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${this.n8nBaseUrl}/api/v1/workflows`, {
        signal: controller.signal,
        headers: this.buildHeaders(),
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        this.logger.warn(`n8n API returned ${res.status}`);
        return [];
      }

      const data = await res.json();
      // n8n returns { data: [...] } for paginated endpoints
      return (data.data || data) as N8nWorkflow[];
    } catch (error) {
      this.logger.warn(`Failed to fetch n8n workflows: ${error.message}`);
      return [];
    }
  }

  async getWorkflowCount(): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    const workflows = await this.getWorkflows();
    return {
      total: workflows.length,
      active: workflows.filter((w) => w.active).length,
      inactive: workflows.filter((w) => !w.active).length,
    };
  }

  async runWorkflow(workflowId: string): Promise<any> {
    try {
      const res = await fetch(`${this.n8nBaseUrl}/api/v1/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: this.buildHeaders(),
      });
      if (!res.ok) {
        throw new Error(`n8n API returned ${res.status}`);
      }
      return await res.json();
    } catch (error) {
      this.logger.error(`Failed to run workflow ${workflowId}: ${error.message}`);
      throw error;
    }
  }

  async callWebhook(path: string, payload: any): Promise<any> {
    try {
      const res = await fetch(`${this.n8nBaseUrl}/webhook/${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`n8n webhook returned ${res.status}`);
      }
      return await res.json();
    } catch (error) {
      this.logger.error(`Failed to call webhook ${path}: ${error.message}`);
      throw error;
    }
  }

  async getExecutions(): Promise<any[]> {
    try {
      const res = await fetch(`${this.n8nBaseUrl}/api/v1/executions?limit=10`, {
        headers: this.buildHeaders(),
      });
      if (!res.ok) {
        this.logger.warn(`n8n API returned ${res.status}`);
        return [];
      }
      const data = await res.json();
      return data.data || [];
    } catch (error) {
      this.logger.warn(`Failed to fetch n8n executions: ${error.message}`);
      return [];
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${this.n8nBaseUrl}/healthz`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  }
}
