import { Readable } from 'stream';

// Simple CSV parser implementation
class SimpleCSVParser {
  static parse(csvText: string, delimiter = ','): any[] {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return [];
    
    const headers = this.parseLine(lines[0], delimiter);
    const results: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseLine(lines[i], delimiter);
      const row: any = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index]?.trim() || '';
      });
      results.push(row);
    }
    
    return results;
  }
  
  static stringify(data: any[], delimiter = ','): string {
    if (!Array.isArray(data) || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvLines = [headers.join(delimiter)];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header] || '';
        return typeof value === 'string' && value.includes(delimiter) 
          ? `"${value.replace(/"/g, '""')}"` 
          : String(value);
      });
      csvLines.push(values.join(delimiter));
    }
    
    return csvLines.join('\n');
  }
  
  private static parseLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }
}

// Simple XML builder implementation
class SimpleXMLBuilder {
  static build(data: any, rootElement = 'root'): string {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<${rootElement}>\n${this.objectToXML(data, 1)}</${rootElement}>`;
  }
  
  private static objectToXML(obj: any, indent = 0): string {
    const spaces = '  '.repeat(indent);
    let xml = '';
    
    if (Array.isArray(obj)) {
      for (const item of obj) {
        xml += `${spaces}<item>\n${this.objectToXML(item, indent + 1)}${spaces}</item>\n`;
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
          xml += `${spaces}<${key}>\n${this.objectToXML(value, indent + 1)}${spaces}</${key}>\n`;
        } else {
          xml += `${spaces}<${key}>${this.escapeXML(String(value))}</${key}>\n`;
        }
      }
    } else {
      xml += `${spaces}${this.escapeXML(String(obj))}\n`;
    }
    
    return xml;
  }
  
  private static escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

export interface DataTransformConfig {
  inputFormat: 'json' | 'csv' | 'xml' | 'text' | 'raw';
  outputFormat: 'json' | 'csv' | 'xml' | 'text';
  operations: TransformOperation[];
  settings?: {
    csvDelimiter?: string;
    csvHeaders?: string[];
    xmlRootElement?: string;
    preserveTypes?: boolean;
    nullHandling?: 'keep' | 'remove' | 'convert';
  };
}

export interface TransformOperation {
  type: 'extract' | 'map' | 'filter' | 'calculate' | 'group' | 'sort' | 'join' | 'split' | 'aggregate';
  config: any;
}

export interface FieldMapping {
  source: string;
  target: string;
  transform?: string; // JavaScript expression or function name
  defaultValue?: any;
}

export interface TransformResult {
  success: boolean;
  data?: any;
  format: string;
  recordCount?: number;
  operations: string[];
  error?: string;
  logs: string[];
}

export class DataTransformationService {
  private transformFunctions: Map<string, Function> = new Map();

  constructor() {
    this.initializeBuiltInFunctions();
  }

  /**
   * Main transformation method
   */
  async transformData(
    inputData: any,
    config: DataTransformConfig
  ): Promise<TransformResult> {
    const logs: string[] = [];
    let currentData = inputData;

    try {
      logs.push(`Starting transformation: ${config.inputFormat} → ${config.outputFormat}`);

      // Step 1: Parse input data
      currentData = await this.parseInputData(currentData, config.inputFormat, config.settings);
      logs.push(`Parsed ${config.inputFormat} data: ${Array.isArray(currentData) ? currentData.length : 1} records`);

      // Step 2: Apply transformation operations
      for (let i = 0; i < config.operations.length; i++) {
        const operation = config.operations[i];
        logs.push(`Applying operation ${i + 1}: ${operation.type}`);
        
        currentData = await this.applyOperation(currentData, operation);
        
        const count = Array.isArray(currentData) ? currentData.length : 1;
        logs.push(`Operation ${operation.type} complete: ${count} records`);
      }

      // Step 3: Format output
      const formattedData = await this.formatOutputData(currentData, config.outputFormat, config.settings);
      logs.push(`Formatted to ${config.outputFormat}`);

      return {
        success: true,
        data: formattedData,
        format: config.outputFormat,
        recordCount: Array.isArray(currentData) ? currentData.length : 1,
        operations: config.operations.map(op => op.type),
        logs
      };

    } catch (error) {
      return {
        success: false,
        format: config.outputFormat,
        operations: config.operations.map(op => op.type),
        error: error instanceof Error ? error.message : String(error),
        logs
      };
    }
  }

  /**
   * Parse input data based on format
   */
  private async parseInputData(data: any, format: string, settings?: any): Promise<any> {
    switch (format) {
      case 'json':
        return typeof data === 'string' ? JSON.parse(data) : data;

      case 'csv':
        return await this.parseCSV(data, settings);

      case 'xml':
        return await this.parseXML(data, settings);

      case 'text':
        return { text: String(data) };

      case 'raw':
      default:
        return data;
    }
  }

  /**
   * Parse CSV data
   */
  private async parseCSV(data: string, settings?: any): Promise<any[]> {
    const delimiter = settings?.csvDelimiter || ',';
    return SimpleCSVParser.parse(data, delimiter);
  }

  /**
   * Parse XML data
   */
  private async parseXML(data: string, settings?: any): Promise<any> {
    // Simple XML parsing - convert to JSON-like structure
    try {
      // For now, return a simple parsed structure
      // In production, you might want to use a proper XML parser
      return { xmlData: data };
    } catch (error: any) {
      throw new Error(`XML parsing failed: ${error.message}`);
    }
  }

  /**
   * Apply a single transformation operation
   */
  private async applyOperation(data: any, operation: TransformOperation): Promise<any> {
    switch (operation.type) {
      case 'extract':
        return this.extractFields(data, operation.config);

      case 'map':
        return this.mapFields(data, operation.config);

      case 'filter':
        return this.filterRecords(data, operation.config);

      case 'calculate':
        return this.calculateFields(data, operation.config);

      case 'group':
        return this.groupRecords(data, operation.config);

      case 'sort':
        return this.sortRecords(data, operation.config);

      case 'join':
        return this.joinDatasets(data, operation.config);

      case 'split':
        return this.splitFields(data, operation.config);

      case 'aggregate':
        return this.aggregateRecords(data, operation.config);

      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  /**
   * Extract specific fields from records
   */
  private extractFields(data: any, config: { fields: string[] }): any {
    if (!Array.isArray(data)) {
      data = [data];
    }

    return data.map((record: any) => {
      const extracted: any = {};
      for (const field of config.fields) {
        if (field.includes('.')) {
          // Handle nested fields
          extracted[field] = this.getNestedValue(record, field);
        } else {
          extracted[field] = record[field];
        }
      }
      return extracted;
    });
  }

  /**
   * Map fields from source to target with transformations
   */
  private mapFields(data: any, config: { mappings: FieldMapping[] }): any {
    if (!Array.isArray(data)) {
      data = [data];
    }

    return data.map((record: any) => {
      const mapped: any = {};
      
      for (const mapping of config.mappings) {
        let value = this.getNestedValue(record, mapping.source);
        
        // Apply transformation if specified
        if (mapping.transform && value !== undefined) {
          value = this.applyTransformFunction(value, mapping.transform, record);
        }
        
        // Use default value if source value is undefined
        if (value === undefined && mapping.defaultValue !== undefined) {
          value = mapping.defaultValue;
        }
        
        this.setNestedValue(mapped, mapping.target, value);
      }
      
      return mapped;
    });
  }

  /**
   * Filter records based on conditions
   */
  private filterRecords(data: any, config: { 
    conditions: Array<{
      field: string;
      operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'starts_with' | 'exists';
      value?: any;
    }> 
  }): any {
    if (!Array.isArray(data)) {
      return data;
    }

    return data.filter((record: any) => {
      return config.conditions.every(condition => {
        const fieldValue = this.getNestedValue(record, condition.field);
        
        switch (condition.operator) {
          case 'equals':
            return fieldValue === condition.value;
          case 'not_equals':
            return fieldValue !== condition.value;
          case 'greater_than':
            return fieldValue > condition.value;
          case 'less_than':
            return fieldValue < condition.value;
          case 'contains':
            return String(fieldValue).includes(String(condition.value));
          case 'starts_with':
            return String(fieldValue).startsWith(String(condition.value));
          case 'exists':
            return fieldValue !== undefined && fieldValue !== null;
          default:
            return true;
        }
      });
    });
  }

  /**
   * Calculate new fields based on expressions
   */
  private calculateFields(data: any, config: {
    calculations: Array<{
      field: string;
      expression: string;
      type?: 'number' | 'string' | 'boolean' | 'date';
    }>
  }): any {
    if (!Array.isArray(data)) {
      data = [data];
    }

    return data.map((record: any) => {
      const result = { ...record };
      
      for (const calc of config.calculations) {
        try {
          const value = this.evaluateExpression(calc.expression, record);
          result[calc.field] = this.convertType(value, calc.type);
        } catch (error) {
          console.warn(`Calculation failed for field ${calc.field}:`, error);
          result[calc.field] = null;
        }
      }
      
      return result;
    });
  }

  /**
   * Group records by specified fields
   */
  private groupRecords(data: any, config: {
    groupBy: string[];
    aggregations?: Array<{
      field: string;
      operation: 'sum' | 'avg' | 'count' | 'min' | 'max';
      alias?: string;
    }>;
  }): any {
    if (!Array.isArray(data)) {
      return data;
    }

    const groups = new Map<string, any[]>();
    
    // Group records
    for (const record of data) {
      const groupKey = config.groupBy
        .map(field => this.getNestedValue(record, field))
        .join('|');
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(record);
    }

    // Apply aggregations
    const result: any[] = [];
    for (const [groupKey, records] of groups) {
      const groupRecord: any = {};
      
      // Add group fields
      config.groupBy.forEach((field, index) => {
        groupRecord[field] = groupKey.split('|')[index];
      });
      
      // Add aggregations
      if (config.aggregations) {
        for (const agg of config.aggregations) {
          const fieldName = agg.alias || `${agg.operation}_${agg.field}`;
          groupRecord[fieldName] = this.calculateAggregation(records, agg.field, agg.operation);
        }
      }
      
      groupRecord._count = records.length;
      result.push(groupRecord);
    }

    return result;
  }

  /**
   * Sort records by specified fields
   */
  private sortRecords(data: any, config: {
    sortBy: Array<{
      field: string;
      direction: 'asc' | 'desc';
    }>
  }): any {
    if (!Array.isArray(data)) {
      return data;
    }

    return data.sort((a, b) => {
      for (const sort of config.sortBy) {
        const aValue = this.getNestedValue(a, sort.field);
        const bValue = this.getNestedValue(b, sort.field);
        
        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        else if (aValue > bValue) comparison = 1;
        
        if (sort.direction === 'desc') comparison *= -1;
        
        if (comparison !== 0) return comparison;
      }
      return 0;
    });
  }

  /**
   * Join two datasets
   */
  private joinDatasets(data: any, config: {
    joinWith: any[];
    joinKey: string;
    joinType: 'inner' | 'left' | 'right' | 'full';
  }): any {
    if (!Array.isArray(data)) {
      data = [data];
    }

    const result: any[] = [];
    const rightMap = new Map();
    
    // Index the right dataset
    for (const rightRecord of config.joinWith) {
      const key = this.getNestedValue(rightRecord, config.joinKey);
      if (!rightMap.has(key)) {
        rightMap.set(key, []);
      }
      rightMap.get(key).push(rightRecord);
    }

    // Perform join
    for (const leftRecord of data) {
      const key = this.getNestedValue(leftRecord, config.joinKey);
      const rightRecords = rightMap.get(key) || [];
      
      if (rightRecords.length > 0) {
        for (const rightRecord of rightRecords) {
          result.push({ ...leftRecord, ...rightRecord });
        }
      } else if (config.joinType === 'left' || config.joinType === 'full') {
        result.push(leftRecord);
      }
    }

    return result;
  }

  /**
   * Split fields based on delimiters
   */
  private splitFields(data: any, config: {
    splits: Array<{
      field: string;
      delimiter: string;
      targetFields: string[];
    }>
  }): any {
    if (!Array.isArray(data)) {
      data = [data];
    }

    return data.map((record: any) => {
      const result = { ...record };
      
      for (const split of config.splits) {
        const value = this.getNestedValue(record, split.field);
        if (typeof value === 'string') {
          const parts = value.split(split.delimiter);
          split.targetFields.forEach((targetField, index) => {
            result[targetField] = parts[index] || null;
          });
        }
      }
      
      return result;
    });
  }

  /**
   * Aggregate all records into summary statistics
   */
  private aggregateRecords(data: any, config: {
    aggregations: Array<{
      field: string;
      operation: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'distinct';
      alias?: string;
    }>
  }): any {
    if (!Array.isArray(data)) {
      data = [data];
    }

    const result: any = {};
    
    for (const agg of config.aggregations) {
      const fieldName = agg.alias || `${agg.operation}_${agg.field}`;
      result[fieldName] = this.calculateAggregation(data, agg.field, agg.operation);
    }
    
    result._total_records = data.length;
    return result;
  }

  /**
   * Format output data based on target format
   */
  private async formatOutputData(data: any, format: string, settings?: any): Promise<any> {
    switch (format) {
      case 'json':
        return data;

      case 'csv':
        return await this.formatToCSV(data, settings);

      case 'xml':
        return await this.formatToXML(data, settings);

      case 'text':
        return this.formatToText(data);

      default:
        return data;
    }
  }

  /**
   * Format data to CSV
   */
  private async formatToCSV(data: any, settings?: any): Promise<string> {
    if (!Array.isArray(data)) {
      data = [data];
    }

    const delimiter = settings?.csvDelimiter || ',';
    return SimpleCSVParser.stringify(data, delimiter);
  }

  /**
   * Format data to XML
   */
  private async formatToXML(data: any, settings?: any): Promise<string> {
    const rootElement = settings?.xmlRootElement || 'root';
    return SimpleXMLBuilder.build(data, rootElement);
  }

  /**
   * Format data to text
   */
  private formatToText(data: any): string {
    if (typeof data === 'string') return data;
    if (typeof data === 'object') return JSON.stringify(data, null, 2);
    return String(data);
  }

  // Utility methods
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  private applyTransformFunction(value: any, transform: string, record: any): any {
    // Built-in transform functions
    if (this.transformFunctions.has(transform)) {
      return this.transformFunctions.get(transform)!(value, record);
    }

    // Simple expression evaluation
    try {
      return this.evaluateExpression(transform.replace('value', JSON.stringify(value)), record);
    } catch {
      return value;
    }
  }

  private evaluateExpression(expression: string, context: any): any {
    // Simple and safe expression evaluator
    // Replace field references with actual values
    let processedExpression = expression;
    
    for (const [key, value] of Object.entries(context)) {
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      processedExpression = processedExpression.replace(regex, JSON.stringify(value));
    }

    // Only allow safe operations
    if (!/^[\d\s+\-*/()\.,'"]+$/.test(processedExpression.replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, ''))) {
      throw new Error('Unsafe expression');
    }

    try {
      return Function(`"use strict"; return (${processedExpression})`)();
    } catch {
      throw new Error('Invalid expression');
    }
  }

  private convertType(value: any, type?: string): any {
    if (!type) return value;

    switch (type) {
      case 'number':
        return Number(value);
      case 'string':
        return String(value);
      case 'boolean':
        return Boolean(value);
      case 'date':
        return new Date(value);
      default:
        return value;
    }
  }

  private calculateAggregation(records: any[], field: string, operation: string): any {
    const values = records
      .map(record => this.getNestedValue(record, field))
      .filter(value => value !== undefined && value !== null);

    switch (operation) {
      case 'sum':
        return values.reduce((sum, value) => sum + Number(value), 0);
      case 'avg':
        return values.length > 0 ? values.reduce((sum, value) => sum + Number(value), 0) / values.length : 0;
      case 'count':
        return values.length;
      case 'min':
        return values.length > 0 ? Math.min(...values.map(Number)) : null;
      case 'max':
        return values.length > 0 ? Math.max(...values.map(Number)) : null;
      case 'distinct':
        return [...new Set(values)].length;
      default:
        return null;
    }
  }

  private initializeBuiltInFunctions(): void {
    this.transformFunctions.set('uppercase', (value: string) => value.toUpperCase());
    this.transformFunctions.set('lowercase', (value: string) => value.toLowerCase());
    this.transformFunctions.set('trim', (value: string) => value.trim());
    this.transformFunctions.set('reverse', (value: string) => value.split('').reverse().join(''));
    this.transformFunctions.set('length', (value: string) => value.length);
    this.transformFunctions.set('now', () => new Date().toISOString());
    this.transformFunctions.set('uuid', () => require('uuid').v4());
  }

  /**
   * Get available transform functions
   */
  getAvailableTransforms(): string[] {
    return Array.from(this.transformFunctions.keys());
  }

  /**
   * Add custom transform function
   */
  addTransformFunction(name: string, func: Function): void {
    this.transformFunctions.set(name, func);
  }
}