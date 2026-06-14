declare module 'n8n-workflow' {
  export interface INodeProperties {
    displayName: string;
    name: string;
    type: string;
    default: any;
    description?: string;
    options?: Array<{ name: string; value: string; description?: string; action?: string }>;
    noDataExpression?: boolean;
    required?: boolean;
    displayOptions?: any;
  }

  export interface INodeTypeDescription {
    displayName: string;
    name: string;
    icon?: string;
    group: string[];
    version: number;
    description: string;
    defaults: {
      name: string;
      color?: string;
    };
    inputs: string[];
    outputs: string[];
    properties: INodeProperties[];
  }

  export interface INodeType {
    description: INodeTypeDescription;
  }
}
