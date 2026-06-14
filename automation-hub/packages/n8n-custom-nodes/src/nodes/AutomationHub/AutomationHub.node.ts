import { INodeType, INodeTypeDescription } from 'n8n-workflow';

export class AutomationHub implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Automation Hub',
    name: 'automationHub',
    icon: 'fa:bolt',
    group: ['transform'],
    version: 1,
    description: 'Interact with Automation Hub API',
    defaults: {
      name: 'Automation Hub',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Get Workflows',
            value: 'getWorkflows',
            description: 'Get all workflows from Automation Hub',
            action: 'Get all workflows',
          },
        ],
        default: 'getWorkflows',
      },
    ],
  };
}
