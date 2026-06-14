import { Injectable } from '@nestjs/common';
import { WorkflowService } from '../workflow/workflow.service';
import { formatUptime } from '@automation-hub/shared';

@Injectable()
export class DashboardService {
  private startTime = Date.now();

  constructor(private readonly workflowService: WorkflowService) {}

  async getStats() {
    const workflowStats = this.workflowService.getStats();
    const uptimeMs = Date.now() - this.startTime;

    return {
      apiStatus: 'Online',
      n8nStatus: await this.checkN8nStatus(),
      uptime: formatUptime(Math.floor(uptimeMs / 1000)),
      uptimeMs,
      ...workflowStats,
    };
  }

  private async checkN8nStatus(): Promise<string> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch('http://localhost:5678/healthz', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res.ok ? 'Online' : 'Degraded';
    } catch {
      return 'Offline';
    }
  }
}
