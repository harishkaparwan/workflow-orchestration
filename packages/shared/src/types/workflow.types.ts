export type WorkflowType = 'Webhook' | 'Schedule' | 'Event' | 'Manual' | 'webhook' | 'schedule' | 'manual';

export interface Workflow {
  id: string;
  name: string;
  description: string;
  type: WorkflowType;
  enabled: boolean;
  webhookUrl?: string;
  schedule?: string;
  lastRun?: string | Date;
  lastDuration?: number;
  lastStatus?: 'success' | 'error' | 'running';
  createdAt: string;
  updatedAt: string;
}

export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  nodes?: unknown[];
  tags?: { id: string; name: string }[];
}
