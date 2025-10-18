import { AIService } from './ai.service';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'content' | 'analysis' | 'automation' | 'business' | 'development';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  nodes: WorkflowNode[];
  expectedOutputs: string[];
}

export interface WorkflowNode {
  id: string;
  type: 'ai_processor' | 'data_input' | 'data_output' | 'condition' | 'transform';
  name: string;
  config: {
    taskType?: string;
    prompt?: string;
    provider?: string;
    temperature?: number;
    maxTokens?: number;
    [key: string]: any;
  };
  position: { x: number; y: number };
  connections: string[];
}

export class AIWorkflowTemplates {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  // Get all available workflow templates
  getAvailableTemplates(): WorkflowTemplate[] {
    return [
      this.getContentCreationWorkflow(),
      this.getBusinessAnalysisWorkflow(),
      this.getCodeReviewWorkflow(),
      this.getCustomerFeedbackWorkflow(),
      this.getMultilingualTranslationWorkflow(),
      this.getDataInsightsWorkflow(),
      this.getDecisionMakingWorkflow(),
      this.getDocumentProcessingWorkflow()
    ];
  }

  // 1. Content Creation Workflow (Beginner) - Uses Gemini 2.5 Flash
  getContentCreationWorkflow(): WorkflowTemplate {
    return {
      id: 'content-creation',
      name: 'AI Content Creation Pipeline',
      description: 'Generate blog posts, social media content, and marketing copy using Gemini 2.5 Flash for high-quality content generation',
      category: 'content',
      difficulty: 'beginner',
      estimatedTime: '5-10 minutes',
      nodes: [
        {
          id: 'input-1',
          type: 'data_input',
          name: 'Topic Input',
          config: { placeholder: 'Enter topic (e.g., "AI in Healthcare")' },
          position: { x: 100, y: 100 },
          connections: ['ai-1']
        },
        {
          id: 'ai-1',
          type: 'ai_processor',
          name: 'Blog Post Generator',
          config: {
            taskType: 'content_generation',
            prompt: 'Write a comprehensive blog post about: {{input}}. Include an engaging introduction, 3 main sections with subheadings, and a conclusion. Make it SEO-friendly and around 800 words.',
            temperature: 0.7,
            maxTokens: 1000
          },
          position: { x: 300, y: 100 },
          connections: ['ai-2']
        },
        {
          id: 'ai-2',
          type: 'ai_processor',
          name: 'Social Media Snippets',
          config: {
            taskType: 'content_generation',
            prompt: 'Based on this blog post: {{ai-1.result}}, create 3 engaging social media posts: 1) LinkedIn post (professional), 2) Twitter thread (3 tweets), 3) Instagram caption with hashtags.',
            temperature: 0.8,
            maxTokens: 500
          },
          position: { x: 500, y: 100 },
          connections: ['output-1']
        },
        {
          id: 'output-1',
          type: 'data_output',
          name: 'Content Package',
          config: { format: 'markdown' },
          position: { x: 700, y: 100 },
          connections: []
        }
      ],
      expectedOutputs: ['Blog post (800 words)', 'LinkedIn post', 'Twitter thread', 'Instagram caption']
    };
  }

  // 2. Business Analysis Workflow (Intermediate) - Uses GLM-4.5-Air + Kimi
  getBusinessAnalysisWorkflow(): WorkflowTemplate {
    return {
      id: 'business-analysis',
      name: 'Strategic Business Analysis',
      description: 'Analyze business scenarios using GLM-4.5-Air for math/reasoning and Kimi for long-context analysis',
      category: 'business',
      difficulty: 'intermediate',
      estimatedTime: '10-15 minutes',
      nodes: [
        {
          id: 'input-1',
          type: 'data_input',
          name: 'Business Scenario',
          config: { placeholder: 'Describe your business situation, metrics, and challenges' },
          position: { x: 100, y: 100 },
          connections: ['ai-1', 'ai-2']
        },
        {
          id: 'ai-1',
          type: 'ai_processor',
          name: 'Financial Analysis',
          config: {
            taskType: 'math_reasoning',
            prompt: 'Analyze the financial aspects of this business scenario: {{input}}. Calculate key metrics like ROI, growth rates, break-even points, and provide quantitative insights.',
            temperature: 0.3,
            maxTokens: 800
          },
          position: { x: 300, y: 50 },
          connections: ['ai-3']
        },
        {
          id: 'ai-2',
          type: 'ai_processor',
          name: 'Strategic Context Analysis',
          config: {
            taskType: 'long_context',
            prompt: 'Provide a comprehensive strategic analysis of this business scenario: {{input}}. Consider market dynamics, competitive landscape, risks, opportunities, and long-term implications.',
            temperature: 0.5,
            maxTokens: 1200
          },
          position: { x: 300, y: 150 },
          connections: ['ai-3']
        },
        {
          id: 'ai-3',
          type: 'ai_processor',
          name: 'Recommendation Engine',
          config: {
            taskType: 'content_generation',
            prompt: 'Based on this financial analysis: {{ai-1.result}} and strategic analysis: {{ai-2.result}}, provide 3 specific, actionable recommendations with priority levels and implementation timelines.',
            temperature: 0.4,
            maxTokens: 600
          },
          position: { x: 500, y: 100 },
          connections: ['output-1']
        },
        {
          id: 'output-1',
          type: 'data_output',
          name: 'Business Report',
          config: { format: 'structured_report' },
          position: { x: 700, y: 100 },
          connections: []
        }
      ],
      expectedOutputs: ['Financial metrics analysis', 'Strategic insights', 'Prioritized recommendations', 'Implementation roadmap']
    };
  }

  // 3. Code Review Workflow (Advanced) - Uses Qwen + Groq
  getCodeReviewWorkflow(): WorkflowTemplate {
    return {
      id: 'code-review',
      name: 'AI-Powered Code Review',
      description: 'Comprehensive code analysis using Qwen for code generation and Groq for quick decisions',
      category: 'development',
      difficulty: 'advanced',
      estimatedTime: '15-20 minutes',
      nodes: [
        {
          id: 'input-1',
          type: 'data_input',
          name: 'Code Input',
          config: { placeholder: 'Paste your code here for review' },
          position: { x: 100, y: 100 },
          connections: ['ai-1', 'ai-2', 'ai-3']
        },
        {
          id: 'ai-1',
          type: 'ai_processor',
          name: 'Code Quality Analysis',
          config: {
            taskType: 'code_generation',
            prompt: 'Review this code for quality, best practices, and potential improvements: {{input}}. Focus on: 1) Code structure and organization, 2) Performance optimizations, 3) Security vulnerabilities, 4) Maintainability.',
            temperature: 0.2,
            maxTokens: 800
          },
          position: { x: 300, y: 50 },
          connections: ['ai-4']
        },
        {
          id: 'ai-2',
          type: 'ai_processor',
          name: 'Bug Detection',
          config: {
            taskType: 'quick_decision',
            prompt: 'Scan this code for potential bugs, logic errors, and edge cases: {{input}}. Provide a quick assessment with severity levels.',
            temperature: 0.1,
            maxTokens: 400
          },
          position: { x: 300, y: 100 },
          connections: ['ai-4']
        },
        {
          id: 'ai-3',
          type: 'ai_processor',
          name: 'Documentation Review',
          config: {
            taskType: 'content_generation',
            prompt: 'Evaluate the documentation and comments in this code: {{input}}. Suggest improvements for clarity and completeness.',
            temperature: 0.3,
            maxTokens: 400
          },
          position: { x: 300, y: 150 },
          connections: ['ai-4']
        },
        {
          id: 'ai-4',
          type: 'ai_processor',
          name: 'Refactoring Suggestions',
          config: {
            taskType: 'code_generation',
            prompt: 'Based on quality analysis: {{ai-1.result}}, bug detection: {{ai-2.result}}, and documentation review: {{ai-3.result}}, provide specific refactoring suggestions with improved code examples.',
            temperature: 0.3,
            maxTokens: 1000
          },
          position: { x: 500, y: 100 },
          connections: ['output-1']
        },
        {
          id: 'output-1',
          type: 'data_output',
          name: 'Code Review Report',
          config: { format: 'code_review' },
          position: { x: 700, y: 100 },
          connections: []
        }
      ],
      expectedOutputs: ['Quality assessment', 'Bug report', 'Documentation suggestions', 'Refactored code examples']
    };
  }

  // 4. Customer Feedback Analysis (Intermediate) - Uses HuggingFace + Gemini
  getCustomerFeedbackWorkflow(): WorkflowTemplate {
    return {
      id: 'customer-feedback',
      name: 'Customer Feedback Intelligence',
      description: 'Analyze customer feedback using HuggingFace for sentiment analysis and Gemini for insights generation',
      category: 'analysis',
      difficulty: 'intermediate',
      estimatedTime: '8-12 minutes',
      nodes: [
        {
          id: 'input-1',
          type: 'data_input',
          name: 'Customer Reviews',
          config: { placeholder: 'Paste customer feedback, reviews, or survey responses' },
          position: { x: 100, y: 100 },
          connections: ['ai-1', 'transform-1']
        },
        {
          id: 'transform-1',
          type: 'transform',
          name: 'Text Preprocessing',
          config: { operation: 'split_by_lines' },
          position: { x: 250, y: 150 },
          connections: ['ai-1']
        },
        {
          id: 'ai-1',
          type: 'ai_processor',
          name: 'Sentiment Analysis',
          config: {
            taskType: 'sentiment_analysis',
            prompt: '{{input}}',
            temperature: 0.1,
            maxTokens: 100
          },
          position: { x: 400, y: 100 },
          connections: ['ai-2']
        },
        {
          id: 'ai-2',
          type: 'ai_processor',
          name: 'Insight Generation',
          config: {
            taskType: 'data_extraction',
            prompt: 'Analyze this customer feedback and sentiment data: {{ai-1.result}}. Extract key themes, pain points, and improvement opportunities. Categorize feedback into: Product Issues, Service Quality, Feature Requests, and Positive Highlights.',
            temperature: 0.5,
            maxTokens: 800
          },
          position: { x: 600, y: 100 },
          connections: ['ai-3']
        },
        {
          id: 'ai-3',
          type: 'ai_processor',
          name: 'Action Plan Generator',
          config: {
            taskType: 'content_generation',
            prompt: 'Based on these customer insights: {{ai-2.result}}, create a prioritized action plan with: 1) Immediate fixes (1-2 weeks), 2) Short-term improvements (1-3 months), 3) Long-term strategic changes (3-12 months).',
            temperature: 0.4,
            maxTokens: 600
          },
          position: { x: 800, y: 100 },
          connections: ['output-1']
        },
        {
          id: 'output-1',
          type: 'data_output',
          name: 'Customer Intelligence Report',
          config: { format: 'dashboard' },
          position: { x: 1000, y: 100 },
          connections: []
        }
      ],
      expectedOutputs: ['Sentiment scores', 'Key themes', 'Issue categories', 'Prioritized action plan']
    };
  }

  // 5. Multilingual Translation Workflow (Beginner) - Uses Qwen
  getMultilingualTranslationWorkflow(): WorkflowTemplate {
    return {
      id: 'multilingual-translation',
      name: 'Global Content Localization',
      description: 'Translate and localize content for multiple markets using Qwen for multilingual tasks',
      category: 'content',
      difficulty: 'beginner',
      estimatedTime: '5-8 minutes',
      nodes: [
        {
          id: 'input-1',
          type: 'data_input',
          name: 'Source Content',
          config: { placeholder: 'Enter content to translate and localize' },
          position: { x: 100, y: 100 },
          connections: ['ai-1', 'ai-2', 'ai-3']
        },
        {
          id: 'ai-1',
          type: 'ai_processor',
          name: 'Chinese Translation',
          config: {
            taskType: 'multilingual_tasks',
            prompt: 'Translate this content to simplified Chinese, ensuring cultural appropriateness and natural language flow: {{input}}',
            temperature: 0.3,
            maxTokens: 800
          },
          position: { x: 300, y: 50 },
          connections: ['output-1']
        },
        {
          id: 'ai-2',
          type: 'ai_processor',
          name: 'Spanish Translation',
          config: {
            taskType: 'multilingual_tasks',
            prompt: 'Translate this content to Latin American Spanish, adapting for regional preferences: {{input}}',
            temperature: 0.3,
            maxTokens: 800
          },
          position: { x: 300, y: 100 },
          connections: ['output-1']
        },
        {
          id: 'ai-3',
          type: 'ai_processor',
          name: 'French Translation',
          config: {
            taskType: 'multilingual_tasks',
            prompt: 'Translate this content to French, maintaining professional tone and cultural sensitivity: {{input}}',
            temperature: 0.3,
            maxTokens: 800
          },
          position: { x: 300, y: 150 },
          connections: ['output-1']
        },
        {
          id: 'output-1',
          type: 'data_output',
          name: 'Localized Content Package',
          config: { format: 'multilingual_bundle' },
          position: { x: 500, y: 100 },
          connections: []
        }
      ],
      expectedOutputs: ['Chinese translation', 'Spanish translation', 'French translation', 'Cultural notes']
    };
  }

  // 6. Data Insights Workflow (Advanced) - Uses GLM-4 + Kimi
  getDataInsightsWorkflow(): WorkflowTemplate {
    return {
      id: 'data-insights',
      name: 'Advanced Data Analytics',
      description: 'Extract insights from data using GLM-4 for statistical calculations and Kimi for complex pattern analysis',
      category: 'analysis',
      difficulty: 'advanced',
      estimatedTime: '12-18 minutes',
      nodes: [
        {
          id: 'input-1',
          type: 'data_input',
          name: 'Dataset Input',
          config: { placeholder: 'Upload CSV data or paste structured data' },
          position: { x: 100, y: 100 },
          connections: ['transform-1']
        },
        {
          id: 'transform-1',
          type: 'transform',
          name: 'Data Validation',
          config: { operation: 'validate_structure' },
          position: { x: 250, y: 100 },
          connections: ['ai-1', 'ai-2']
        },
        {
          id: 'ai-1',
          type: 'ai_processor',
          name: 'Statistical Analysis',
          config: {
            taskType: 'math_reasoning',
            prompt: 'Perform statistical analysis on this dataset: {{transform-1.result}}. Calculate: mean, median, mode, standard deviation, correlations, and identify outliers.',
            temperature: 0.2,
            maxTokens: 800
          },
          position: { x: 400, y: 50 },
          connections: ['ai-3']
        },
        {
          id: 'ai-2',
          type: 'ai_processor',
          name: 'Pattern Recognition',
          config: {
            taskType: 'long_context',
            prompt: 'Analyze this dataset for patterns, trends, and anomalies: {{transform-1.result}}. Look for seasonal patterns, growth trends, and unusual data points that require attention.',
            temperature: 0.4,
            maxTokens: 1000
          },
          position: { x: 400, y: 150 },
          connections: ['ai-3']
        },
        {
          id: 'ai-3',
          type: 'ai_processor',
          name: 'Business Intelligence',
          config: {
            taskType: 'content_generation',
            prompt: 'Based on statistical analysis: {{ai-1.result}} and pattern recognition: {{ai-2.result}}, generate business intelligence insights with: 1) Key findings, 2) Predictive indicators, 3) Recommended actions, 4) Risk factors.',
            temperature: 0.5,
            maxTokens: 1000
          },
          position: { x: 600, y: 100 },
          connections: ['output-1']
        },
        {
          id: 'output-1',
          type: 'data_output',
          name: 'Analytics Dashboard',
          config: { format: 'analytics_report' },
          position: { x: 800, y: 100 },
          connections: []
        }
      ],
      expectedOutputs: ['Statistical summary', 'Trend analysis', 'Business insights', 'Predictive indicators']
    };
  }

  // 7. Quick Decision Making Workflow (Beginner) - Uses Groq
  getDecisionMakingWorkflow(): WorkflowTemplate {
    return {
      id: 'quick-decision',
      name: 'Rapid Decision Support',
      description: 'Get quick, data-driven decisions using Groq for ultra-fast processing and multiple AI perspectives',
      category: 'business',
      difficulty: 'beginner',
      estimatedTime: '3-5 minutes',
      nodes: [
        {
          id: 'input-1',
          type: 'data_input',
          name: 'Decision Context',
          config: { placeholder: 'Describe the decision you need to make and available options' },
          position: { x: 100, y: 100 },
          connections: ['ai-1', 'ai-2', 'ai-3']
        },
        {
          id: 'ai-1',
          type: 'ai_processor',
          name: 'Pros & Cons Analysis',
          config: {
            taskType: 'quick_decision',
            prompt: 'Analyze this decision scenario: {{input}}. List pros and cons for each option clearly and concisely.',
            temperature: 0.3,
            maxTokens: 400
          },
          position: { x: 300, y: 50 },
          connections: ['ai-4']
        },
        {
          id: 'ai-2',
          type: 'ai_processor',
          name: 'Risk Assessment',
          config: {
            taskType: 'quick_decision',
            prompt: 'Assess the risks for this decision: {{input}}. Rate each option by risk level (Low/Medium/High) and explain key risk factors.',
            temperature: 0.2,
            maxTokens: 300
          },
          position: { x: 300, y: 100 },
          connections: ['ai-4']
        },
        {
          id: 'ai-3',
          type: 'ai_processor',
          name: 'Impact Analysis',
          config: {
            taskType: 'quick_decision',
            prompt: 'Evaluate the potential impact of this decision: {{input}}. Consider short-term and long-term consequences.',
            temperature: 0.3,
            maxTokens: 350
          },
          position: { x: 300, y: 150 },
          connections: ['ai-4']
        },
        {
          id: 'ai-4',
          type: 'ai_processor',
          name: 'Final Recommendation',
          config: {
            taskType: 'quick_decision',
            prompt: 'Based on pros/cons: {{ai-1.result}}, risks: {{ai-2.result}}, and impact: {{ai-3.result}}, provide a clear recommendation with reasoning.',
            temperature: 0.4,
            maxTokens: 300
          },
          position: { x: 500, y: 100 },
          connections: ['output-1']
        },
        {
          id: 'output-1',
          type: 'data_output',
          name: 'Decision Brief',
          config: { format: 'executive_summary' },
          position: { x: 700, y: 100 },
          connections: []
        }
      ],
      expectedOutputs: ['Pros & cons matrix', 'Risk assessment', 'Impact evaluation', 'Clear recommendation']
    };
  }

  // 8. Document Processing Workflow (Intermediate) - Uses HuggingFace + Gemini
  getDocumentProcessingWorkflow(): WorkflowTemplate {
    return {
      id: 'document-processing',
      name: 'Intelligent Document Analysis',
      description: 'Process and analyze documents using HuggingFace for text analysis and Gemini for comprehensive insights',
      category: 'automation',
      difficulty: 'intermediate',
      estimatedTime: '10-15 minutes',
      nodes: [
        {
          id: 'input-1',
          type: 'data_input',
          name: 'Document Input',
          config: { placeholder: 'Paste document text or upload file content' },
          position: { x: 100, y: 100 },
          connections: ['ai-1', 'ai-2']
        },
        {
          id: 'ai-1',
          type: 'ai_processor',
          name: 'Document Summarization',
          config: {
            taskType: 'summarization',
            prompt: 'Create a comprehensive summary of this document: {{input}}. Include: executive summary, key points, main arguments, and conclusions.',
            temperature: 0.3,
            maxTokens: 600
          },
          position: { x: 300, y: 50 },
          connections: ['ai-3']
        },
        {
          id: 'ai-2',
          type: 'ai_processor',
          name: 'Key Information Extraction',
          config: {
            taskType: 'data_extraction',
            prompt: 'Extract key information from this document: {{input}}. Identify: important dates, names, numbers, decisions, action items, and deadlines.',
            temperature: 0.2,
            maxTokens: 500
          },
          position: { x: 300, y: 150 },
          connections: ['ai-3']
        },
        {
          id: 'ai-3',
          type: 'ai_processor',
          name: 'Content Analysis',
          config: {
            taskType: 'text_analysis',
            prompt: 'Analyze the content based on summary: {{ai-1.result}} and extracted information: {{ai-2.result}}. Provide: document classification, tone analysis, and content quality assessment.',
            temperature: 0.4,
            maxTokens: 500
          },
          position: { x: 500, y: 100 },
          connections: ['ai-4']
        },
        {
          id: 'ai-4',
          type: 'ai_processor',
          name: 'Actionable Insights',
          config: {
            taskType: 'content_generation',
            prompt: 'Based on the document analysis: {{ai-3.result}}, generate actionable insights including: follow-up questions, recommended actions, potential concerns, and next steps.',
            temperature: 0.5,
            maxTokens: 600
          },
          position: { x: 700, y: 100 },
          connections: ['output-1']
        },
        {
          id: 'output-1',
          type: 'data_output',
          name: 'Document Intelligence Report',
          config: { format: 'document_analysis' },
          position: { x: 900, y: 100 },
          connections: []
        }
      ],
      expectedOutputs: ['Executive summary', 'Key information list', 'Content analysis', 'Action recommendations']
    };
  }

  // Execute a workflow template with actual AI processing
  async executeWorkflowTemplate(templateId: string, inputs: Record<string, any>): Promise<any> {
    const template = this.getAvailableTemplates().find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Workflow template not found: ${templateId}`);
    }

    console.log(`🚀 Executing workflow: ${template.name}`);
    console.log(`📝 Description: ${template.description}`);
    console.log(`⏱️  Estimated time: ${template.estimatedTime}\n`);
    
    const results: Record<string, any> = {};
    
    // Process nodes in dependency order
    const processedNodes = new Set<string>();
    const nodesToProcess = [...template.nodes];

    while (nodesToProcess.length > 0) {
      const readyNodes = nodesToProcess.filter(node => {
        // Check if all dependencies are processed
        return node.connections.every(connId => processedNodes.has(connId)) ||
               node.type === 'data_input';
      });

      if (readyNodes.length === 0) {
        throw new Error('Circular dependency detected in workflow');
      }

      for (const node of readyNodes) {
        await this.processWorkflowNode(node, inputs, results);
        processedNodes.add(node.id);
        nodesToProcess.splice(nodesToProcess.indexOf(node), 1);
      }
    }

    return {
      templateId,
      templateName: template.name,
      category: template.category,
      difficulty: template.difficulty,
      results,
      executionTime: new Date().toISOString(),
      success: true
    };
  }

  private async processWorkflowNode(
    node: WorkflowNode,
    inputs: Record<string, any>,
    results: Record<string, any>
  ): Promise<void> {
    console.log(`  📍 Processing node: ${node.name}`);

    switch (node.type) {
      case 'data_input':
        results[node.id] = inputs[node.id] || inputs.default || '';
        break;

      case 'ai_processor':
        // Build prompt with variable substitution
        let prompt = node.config.prompt || '';
        
        // Replace input variables
        prompt = prompt.replace(/\{\{input\}\}/g, results['input-1'] || inputs.default || '');
        
        // Replace node result variables
        prompt = prompt.replace(/\{\{([^}]+)\.result\}\}/g, (match, nodeId) => {
          return results[nodeId] || '';
        });

        // Execute AI processing
        const aiResult = await this.aiService.processNode({
          id: node.id,
          data: {
            taskType: node.config.taskType,
            prompt: prompt,
            temperature: node.config.temperature,
            maxTokens: node.config.maxTokens
          }
        }, {});

        results[node.id] = aiResult.result;
        console.log(`    ✅ ${aiResult.provider} - ${aiResult.result.substring(0, 80)}...`);
        break;

      case 'transform':
        // Simple data transformation
        const inputData = results['input-1'] || inputs.default || '';
        if (node.config.operation === 'split_by_lines') {
          results[node.id] = inputData.split('\n').filter((line: string) => line.trim());
        } else if (node.config.operation === 'validate_structure') {
          results[node.id] = inputData; // Pass through for now
        } else {
          results[node.id] = inputData;
        }
        break;

      case 'data_output':
        // Format output based on configuration
        results[node.id] = {
          format: node.config.format,
          data: node.connections.map(connId => results[connId]),
          timestamp: new Date().toISOString()
        };
        break;

      default:
        results[node.id] = `[${node.type}] ${node.name} processed`;
    }
  }

  // Get template summary for dashboard
  getTemplateSummary(): any {
    const templates = this.getAvailableTemplates();
    return {
      total: templates.length,
      byCategory: {
        content: templates.filter(t => t.category === 'content').length,
        analysis: templates.filter(t => t.category === 'analysis').length,
        automation: templates.filter(t => t.category === 'automation').length,
        business: templates.filter(t => t.category === 'business').length,
        development: templates.filter(t => t.category === 'development').length
      },
      byDifficulty: {
        beginner: templates.filter(t => t.difficulty === 'beginner').length,
        intermediate: templates.filter(t => t.difficulty === 'intermediate').length,
        advanced: templates.filter(t => t.difficulty === 'advanced').length
      },
      aiProviders: ['Gemini 2.5 Flash', 'Groq Llama 3.1', 'HuggingFace', 'GLM-4.5-Air', 'Kimi Dev 72B', 'Qwen 2.5 72B'],
      features: [
        'Smart AI provider routing',
        'Multi-step workflows',
        'Real-time processing',
        'Enterprise-grade reliability',
        'Free API integration',
        'Scalable architecture'
      ]
    };
  }
}