import { v4 as uuidv4 } from 'uuid';
import { EventBus } from '../engine/event-bus';

export interface FormField {
  id: string;
  name: string;
  type: 'text' | 'email' | 'number' | 'date' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'file';
  label: string;
  placeholder?: string;
  required: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
    accept?: string; // For file inputs
  };
  options?: Array<{ value: string; label: string }>; // For select, radio
  defaultValue?: any;
  description?: string;
}

export interface FormConfig {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  settings: {
    submitButtonText: string;
    successMessage: string;
    redirectUrl?: string;
    allowMultipleSubmissions: boolean;
    requireCaptcha: boolean;
    emailNotifications: {
      enabled: boolean;
      recipients: string[];
      subject: string;
      template?: string;
    };
    webhookUrl?: string;
    styling?: {
      theme: 'default' | 'minimal' | 'modern' | 'dark';
      primaryColor?: string;
      customCSS?: string;
    };
  };
  workflowIntegration?: {
    workflowId: string;
    triggerOnSubmit: boolean;
    passSubmissionData: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface FormSubmission {
  id: string;
  formId: string;
  data: Record<string, any>;
  submittedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  validationErrors?: Array<{
    field: string;
    message: string;
  }>;
  processed: boolean;
  workflowExecutionId?: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
  sanitizedData: Record<string, any>;
}

export class FormBuilderService {
  private forms: Map<string, FormConfig> = new Map();
  private submissions: Map<string, FormSubmission[]> = new Map();
  private eventBus: EventBus;

  constructor() {
    this.eventBus = EventBus.getInstance();
  }

  /**
   * Create a new form
   */
  async createForm(formData: Omit<FormConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<FormConfig> {
    const form: FormConfig = {
      ...formData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.forms.set(form.id, form);
    
    // Emit form created event
    this.eventBus.emitEvent('form:created', {
      formId: form.id,
      title: form.title
    });

    return form;
  }

  /**
   * Update an existing form
   */
  async updateForm(formId: string, updates: Partial<FormConfig>): Promise<FormConfig> {
    const existingForm = this.forms.get(formId);
    if (!existingForm) {
      throw new Error(`Form with ID ${formId} not found`);
    }

    const updatedForm: FormConfig = {
      ...existingForm,
      ...updates,
      id: formId, // Ensure ID doesn't change
      updatedAt: new Date()
    };

    this.forms.set(formId, updatedForm);
    
    this.eventBus.emitEvent('form:updated', {
      formId,
      changes: Object.keys(updates)
    });

    return updatedForm;
  }

  /**
   * Get form by ID
   */
  async getForm(formId: string): Promise<FormConfig | null> {
    return this.forms.get(formId) || null;
  }

  /**
   * Get all forms
   */
  async getAllForms(): Promise<FormConfig[]> {
    return Array.from(this.forms.values());
  }

  /**
   * Delete a form
   */
  async deleteForm(formId: string): Promise<boolean> {
    const deleted = this.forms.delete(formId);
    if (deleted) {
      // Also delete submissions
      this.submissions.delete(formId);
      
      this.eventBus.emitEvent('form:deleted', { formId });
    }
    return deleted;
  }

  /**
   * Submit form data with validation
   */
  async submitForm(
    formId: string, 
    submissionData: Record<string, any>,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<{
    success: boolean;
    submissionId?: string;
    errors?: Array<{ field: string; message: string }>;
    message: string;
  }> {
    const form = await this.getForm(formId);
    if (!form) {
      return {
        success: false,
        message: 'Form not found'
      };
    }

    if (!form.isActive) {
      return {
        success: false,
        message: 'Form is not currently accepting submissions'
      };
    }

    // Validate submission data
    const validation = await this.validateSubmission(form, submissionData);
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
        message: 'Validation failed'
      };
    }

    // Create submission record
    const submission: FormSubmission = {
      id: uuidv4(),
      formId,
      data: validation.sanitizedData,
      submittedAt: new Date(),
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      processed: false
    };

    // Store submission
    if (!this.submissions.has(formId)) {
      this.submissions.set(formId, []);
    }
    this.submissions.get(formId)!.push(submission);

    // Process submission
    await this.processSubmission(form, submission);

    return {
      success: true,
      submissionId: submission.id,
      message: form.settings.successMessage
    };
  }

  /**
   * Validate form submission data
   */
  private async validateSubmission(form: FormConfig, data: Record<string, any>): Promise<FormValidationResult> {
    const errors: Array<{ field: string; message: string }> = [];
    const sanitizedData: Record<string, any> = {};

    for (const field of form.fields) {
      const value = data[field.name];
      
      // Check required fields
      if (field.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field: field.name,
          message: `${field.label} is required`
        });
        continue;
      }

      // Skip validation for optional empty fields
      if (!field.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // Type-specific validation
      switch (field.type) {
        case 'email':
          if (value && !this.isValidEmail(value)) {
            errors.push({
              field: field.name,
              message: `${field.label} must be a valid email address`
            });
          }
          break;

        case 'number':
          const numValue = parseFloat(value);
          if (value && isNaN(numValue)) {
            errors.push({
              field: field.name,
              message: `${field.label} must be a valid number`
            });
          } else if (field.validation?.min !== undefined && numValue < field.validation.min) {
            errors.push({
              field: field.name,
              message: `${field.label} must be at least ${field.validation.min}`
            });
          } else if (field.validation?.max !== undefined && numValue > field.validation.max) {
            errors.push({
              field: field.name,
              message: `${field.label} must be at most ${field.validation.max}`
            });
          }
          break;

        case 'text':
        case 'textarea':
          if (value && typeof value === 'string') {
            if (field.validation?.minLength && value.length < field.validation.minLength) {
              errors.push({
                field: field.name,
                message: `${field.label} must be at least ${field.validation.minLength} characters`
              });
            }
            if (field.validation?.maxLength && value.length > field.validation.maxLength) {
              errors.push({
                field: field.name,
                message: `${field.label} must be at most ${field.validation.maxLength} characters`
              });
            }
            if (field.validation?.pattern && !new RegExp(field.validation.pattern).test(value)) {
              errors.push({
                field: field.name,
                message: `${field.label} format is invalid`
              });
            }
          }
          break;

        case 'select':
        case 'radio':
          if (value && field.options && !field.options.some(opt => opt.value === value)) {
            errors.push({
              field: field.name,
              message: `${field.label} contains an invalid option`
            });
          }
          break;

        case 'checkbox':
          // Checkbox validation (if needed)
          break;

        case 'date':
          if (value && !this.isValidDate(value)) {
            errors.push({
              field: field.name,
              message: `${field.label} must be a valid date`
            });
          }
          break;
      }

      // Add sanitized value
      sanitizedData[field.name] = this.sanitizeValue(value, field.type);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData
    };
  }

  /**
   * Process form submission (notifications, workflows, webhooks)
   */
  private async processSubmission(form: FormConfig, submission: FormSubmission): Promise<void> {
    try {
      // Send email notifications
      if (form.settings.emailNotifications.enabled) {
        await this.sendEmailNotification(form, submission);
      }

      // Trigger webhook
      if (form.settings.webhookUrl) {
        await this.sendWebhook(form, submission);
      }

      // Trigger workflow
      if (form.workflowIntegration?.triggerOnSubmit) {
        await this.triggerWorkflow(form, submission);
      }

      // Mark as processed
      submission.processed = true;

      this.eventBus.emitEvent('form:submission_processed', {
        formId: form.id,
        submissionId: submission.id
      });

    } catch (error) {
      console.error('Error processing form submission:', error);
      
      this.eventBus.emitEvent('form:submission_error', {
        formId: form.id,
        submissionId: submission.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Send email notification for form submission
   */
  private async sendEmailNotification(form: FormConfig, submission: FormSubmission): Promise<void> {
    const emailData = {
      to: form.settings.emailNotifications.recipients.join(','),
      subject: form.settings.emailNotifications.subject || `New submission for ${form.title}`,
      body: this.generateEmailTemplate(form, submission),
      isHtml: true
    };

    this.eventBus.emitEvent('email:send', emailData);
  }

  /**
   * Generate email template for form submission
   */
  private generateEmailTemplate(form: FormConfig, submission: FormSubmission): string {
    if (form.settings.emailNotifications.template) {
      // Use custom template with variable substitution
      return this.replaceTemplateVariables(form.settings.emailNotifications.template, {
        formTitle: form.title,
        submissionId: submission.id,
        submittedAt: submission.submittedAt.toISOString(),
        data: submission.data
      });
    }

    // Default template
    let html = `
      <h2>New Form Submission: ${form.title}</h2>
      <p><strong>Submitted at:</strong> ${submission.submittedAt.toLocaleString()}</p>
      <p><strong>Submission ID:</strong> ${submission.id}</p>
      <hr>
      <h3>Form Data:</h3>
      <table style="border-collapse: collapse; width: 100%;">
    `;

    for (const field of form.fields) {
      const value = submission.data[field.name];
      if (value !== undefined && value !== null && value !== '') {
        html += `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background-color: #f9f9f9;"><strong>${field.label}</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${this.formatValueForEmail(value)}</td>
          </tr>
        `;
      }
    }

    html += '</table>';
    return html;
  }

  /**
   * Send webhook for form submission
   */
  private async sendWebhook(form: FormConfig, submission: FormSubmission): Promise<void> {
    const webhookData = {
      event: 'form_submission',
      formId: form.id,
      formTitle: form.title,
      submissionId: submission.id,
      submittedAt: submission.submittedAt.toISOString(),
      data: submission.data
    };

    this.eventBus.emitEvent('webhook:send', {
      url: form.settings.webhookUrl,
      method: 'POST',
      data: webhookData
    });
  }

  /**
   * Trigger workflow execution
   */
  private async triggerWorkflow(form: FormConfig, submission: FormSubmission): Promise<void> {
    if (!form.workflowIntegration?.workflowId) return;

    const workflowData = form.workflowIntegration.passSubmissionData ? {
      formSubmission: {
        formId: form.id,
        formTitle: form.title,
        submissionId: submission.id,
        submittedAt: submission.submittedAt.toISOString(),
        data: submission.data
      }
    } : {};

    this.eventBus.emitEvent('workflow:execute', {
      workflowId: form.workflowIntegration.workflowId,
      triggerData: workflowData
    });
  }

  /**
   * Get form submissions
   */
  async getFormSubmissions(formId: string, limit = 100, offset = 0): Promise<{
    submissions: FormSubmission[];
    total: number;
  }> {
    const allSubmissions = this.submissions.get(formId) || [];
    const submissions = allSubmissions
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
      .slice(offset, offset + limit);

    return {
      submissions,
      total: allSubmissions.length
    };
  }

  /**
   * Generate form HTML for embedding
   */
  generateFormHTML(formId: string, baseUrl: string): string {
    const form = this.forms.get(formId);
    if (!form) {
      throw new Error(`Form with ID ${formId} not found`);
    }

    let html = `
      <form id="form-${formId}" action="${baseUrl}/api/forms/${formId}/submit" method="POST" class="dynamic-form">
        <h2>${form.title}</h2>
    `;

    if (form.description) {
      html += `<p class="form-description">${form.description}</p>`;
    }

    for (const field of form.fields) {
      html += this.generateFieldHTML(field);
    }

    html += `
        <button type="submit" class="submit-btn">${form.settings.submitButtonText}</button>
      </form>
      
      <style>
        .dynamic-form { max-width: 600px; margin: 0 auto; padding: 20px; }
        .form-field { margin-bottom: 20px; }
        .form-label { display: block; margin-bottom: 5px; font-weight: bold; }
        .form-input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
        .submit-btn { background: #007cba; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; }
        .required::after { content: "*"; color: red; }
      </style>
    `;

    return html;
  }

  /**
   * Generate HTML for individual form field
   */
  private generateFieldHTML(field: FormField): string {
    const required = field.required ? 'required' : '';
    const placeholder = field.placeholder ? `placeholder="${field.placeholder}"` : '';
    
    let html = `
      <div class="form-field">
        <label for="${field.name}" class="form-label ${field.required ? 'required' : ''}">${field.label}</label>
    `;

    switch (field.type) {
      case 'textarea':
        html += `<textarea id="${field.name}" name="${field.name}" class="form-input" ${placeholder} ${required}></textarea>`;
        break;
      
      case 'select':
        html += `<select id="${field.name}" name="${field.name}" class="form-input" ${required}>`;
        if (!field.required) {
          html += '<option value="">-- Select an option --</option>';
        }
        for (const option of field.options || []) {
          html += `<option value="${option.value}">${option.label}</option>`;
        }
        html += '</select>';
        break;
      
      case 'radio':
        for (const option of field.options || []) {
          html += `
            <div class="radio-option">
              <input type="radio" id="${field.name}_${option.value}" name="${field.name}" value="${option.value}" ${required}>
              <label for="${field.name}_${option.value}">${option.label}</label>
            </div>
          `;
        }
        break;
      
      case 'checkbox':
        html += `<input type="checkbox" id="${field.name}" name="${field.name}" value="true" ${required}>`;
        break;
      
      default:
        html += `<input type="${field.type}" id="${field.name}" name="${field.name}" class="form-input" ${placeholder} ${required}>`;
    }

    if (field.description) {
      html += `<small class="field-description">${field.description}</small>`;
    }

    html += '</div>';
    return html;
  }

  // Utility methods
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  private sanitizeValue(value: any, type: string): any {
    if (value === null || value === undefined) return value;
    
    switch (type) {
      case 'number':
        return parseFloat(value);
      case 'checkbox':
        return Boolean(value);
      default:
        return String(value).trim();
    }
  }

  private formatValueForEmail(value: any): string {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }

  private replaceTemplateVariables(template: string, variables: Record<string, any>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, String(value));
    }
    return result;
  }
}