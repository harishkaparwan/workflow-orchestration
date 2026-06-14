import { Injectable } from '@nestjs/common';


import { Workflow, WorkflowType } from '@automation-hub/shared';

@Injectable()
export class WorkflowService {
  private workflows: Map<string, Workflow> = new Map();

  findAll(): Workflow[] {
    return Array.from(this.workflows.values()).sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  findOne(id: string): Workflow | undefined {
    return this.workflows.get(id);
  }

  create(data: Partial<Workflow>): Workflow {
    const id = this.generateId();
    const now = new Date().toISOString();
    const workflow: Workflow = {
      id,
      name: data.name || 'Untitled Workflow',
      description: data.description || '',
      type: data.type || 'manual',
      webhookUrl: data.webhookUrl || '',
      schedule: data.schedule || '',
      enabled: data.enabled ?? true,
      createdAt: now,
      updatedAt: now,
    };
    this.workflows.set(id, workflow);
    return workflow;
  }

  update(id: string, data: Partial<Workflow>): Workflow | undefined {
    const existing = this.workflows.get(id);
    if (!existing) return undefined;

    const updated: Workflow = {
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    this.workflows.set(id, updated);
    return updated;
  }

  remove(id: string): boolean {
    return this.workflows.delete(id);
  }

  getStats() {
    const all = this.findAll();
    return {
      totalWorkflows: all.length,
      activeWorkflows: all.filter((w) => w.enabled).length,
      webhookWorkflows: all.filter((w) => w.type === 'webhook').length,
      scheduleWorkflows: all.filter((w) => w.type === 'schedule').length,
    };
  }

  private generateId(): string {
    return `wf_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
  }
}
