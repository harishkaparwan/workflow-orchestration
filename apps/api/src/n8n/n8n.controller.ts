import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { N8nService } from './n8n.service';

@Controller('n8n')
export class N8nController {
  constructor(private readonly n8nService: N8nService) {}

  @Get('workflows')
  async getWorkflows() {
    return this.n8nService.getWorkflows();
  }

  @Get('status')
  async getStatus() {
    const healthy = await this.n8nService.isHealthy();
    const counts = healthy
      ? await this.n8nService.getWorkflowCount()
      : { total: 0, active: 0, inactive: 0 };
    return {
      status: healthy ? 'Online' : 'Offline',
      hasApiKey: !!this.n8nService.getApiKey(),
      ...counts,
    };
  }

  @Get('executions')
  async getExecutions() {
    return this.n8nService.getExecutions();
  }

  @Post('workflows/:id/run')
  async runWorkflow(@Param('id') id: string) {
    return this.n8nService.runWorkflow(id);
  }

  @Post('webhook/:path')
  async callWebhook(@Param('path') path: string, @Body() body: any) {
    return this.n8nService.callWebhook(path, body);
  }

  @Post('api-key')
  setApiKey(@Body() body: { apiKey: string }) {
    this.n8nService.setApiKey(body.apiKey);
    return { success: true, message: 'API key updated' };
  }
}
