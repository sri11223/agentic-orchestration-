import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { HfInference } from '@huggingface/inference';
import axios from 'axios';

export interface AIRequest {
  provider: 'gemini' | 'groq' | 'huggingface' | 'qwen' | 'glm4' | 'kimi';
  model?: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse {
  text: string;
  tokensUsed: number;
  cost: number;
  model: string;
  provider: string;
}

interface AITask {
  type: string;
  prompt: string;
  context?: any;
  options?: any;
}

interface ProcessingResponse {
  result: string;
  provider: string;
  confidence?: number;
  tokens?: number;
}

type TaskType = 'quick_decision' | 'real_time_chat' | 'simple_classification' | 
                'content_generation' | 'text_analysis' | 'data_extraction' | 
                'summarization' | 'sentiment_analysis' | 'translation' | 
                'code_generation' | 'math_reasoning' | 'multilingual_tasks' | 
                'long_context' | 'chinese_tasks';

export class AIService {
  private gemini: GoogleGenerativeAI | null = null;
  private groq: Groq | null = null;
  private hf: HfInference | null = null;
  
  private quotaTracker = {
    gemini: { daily: 0, limit: 1500 },
    groq: { daily: 0, limit: 10000 },
    huggingface: { daily: 0, limit: 1000 },
    qwen: { daily: 0, limit: 1000 },
    glm4: { daily: 0, limit: 1000 },
    kimi: { daily: 0, limit: 1000 }
  };

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    try {
      if (process.env.GOOGLE_AI_API_KEY) {
        this.gemini = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
        console.log('✅ Gemini initialized');
      }
      
      if (process.env.GROQ_API_KEY) {
        this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        console.log('✅ Groq initialized');
      }
      
      if (process.env.HUGGINGFACE_API_KEY) {
        this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
        console.log('✅ HuggingFace initialized');
      }
      
      console.log('🤖 AI Service initialized with available providers');
    } catch (error) {
      console.warn('⚠️ Some AI providers not initialized:', error);
    }
  }

  // Smart task routing based on task type
  private getOptimalProvider(taskType: string): string {
    const routing: Record<TaskType, string> = {
      'quick_decision': 'groq',           // Fast decisions -> Groq (speed)
      'real_time_chat': 'groq',           // Real-time -> Groq (speed)  
      'simple_classification': 'groq',    // Classification -> Groq (fast)
      'content_generation': 'gemini',     // Content -> Gemini (quality)
      'text_analysis': 'gemini',          // Analysis -> Gemini (accuracy)
      'data_extraction': 'gemini',        // Extraction -> Gemini (precision)
      'summarization': 'huggingface',     // Summarization -> HF (specialized)
      'sentiment_analysis': 'huggingface', // Sentiment -> HF (specialized)
      'translation': 'qwen',              // Translation -> Qwen (multilingual)
      'code_generation': 'qwen',          // Coding -> Qwen (code specialist)
      'math_reasoning': 'glm4',           // Math -> GLM-4 (reasoning)
      'multilingual_tasks': 'qwen',       // Multilingual -> Qwen (language expert)
      'long_context': 'kimi',             // Long context -> Kimi (large context)
      'chinese_tasks': 'qwen'             // Chinese -> Qwen (native)
    };
    
    return routing[taskType as TaskType] || 'gemini';
  }

  // Main AI processing method for workflow nodes
  async processNode(node: any, data: any): Promise<ProcessingResponse> {
    const task: AITask = {
      type: node.data?.taskType || 'content_generation',
      prompt: node.data?.prompt || 'Process this data',
      context: data,
      options: node.data?.options || {}
    };

    const provider = this.getOptimalProvider(task.type);
    
    try {
      return await this.executeWithProvider(task, provider);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`🔄 Provider ${provider} failed, trying fallback:`, errorMessage);
      return await this.executeWithFallback(task, provider);
    }
  }

  // Execute task with specific provider
  private async executeWithProvider(task: AITask, provider: string): Promise<ProcessingResponse> {
    if (!this.checkQuota(provider)) {
      throw new Error(`Quota exceeded for provider: ${provider}`);
    }

    switch (provider) {
      case 'gemini':
        return await this.executeWithGemini(task);
      case 'groq':
        return await this.executeWithGroq(task);
      case 'huggingface':
        return await this.executeWithHuggingFace(task);
      case 'qwen':
        return await this.executeWithQwen(task);
      case 'glm4':
        return await this.executeWithGLM4(task);
      case 'kimi':
        return await this.executeWithKimi(task);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  // Gemini implementation (Google AI Studio - FREE)
  private async executeWithGemini(task: AITask): Promise<ProcessingResponse> {
    if (!this.gemini) {
      throw new Error('Gemini not initialized - add GOOGLE_AI_API_KEY to .env');
    }

    const model = this.gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = this.buildPrompt(task);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    this.updateQuota('gemini', 1);

    return {
      result: text,
      provider: 'gemini',
      confidence: 0.9,
      tokens: text.length / 4 // Rough token estimate
    };
  }

  // Groq implementation (FREE with high speed)
  private async executeWithGroq(task: AITask): Promise<ProcessingResponse> {
    if (!this.groq) {
      throw new Error('Groq not initialized - add GROQ_API_KEY to .env');
    }

    const completion = await this.groq.chat.completions.create({
      messages: [
        { role: 'user', content: this.buildPrompt(task) }
      ],
      model: 'llama-3.1-8b-instant',
      max_tokens: 1024,
      temperature: 0.7
    });

    this.updateQuota('groq', 1);

    const result = completion.choices[0]?.message?.content || '';
    
    return {
      result,
      provider: 'groq',
      confidence: 0.85,
      tokens: completion.usage?.total_tokens || 0
    };
  }

  // Hugging Face implementation (FREE specialized models)
  private async executeWithHuggingFace(task: AITask): Promise<ProcessingResponse> {
    if (!this.hf) {
      throw new Error('Hugging Face not initialized - add HUGGINGFACE_API_KEY to .env');
    }

    let result: any;
    
    try {
      switch (task.type) {
        case 'sentiment_analysis':
          result = await this.hf.textClassification({
            model: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
            inputs: task.prompt
          });
          result = `Sentiment: ${result[0].label} (${Math.round(result[0].score * 100)}% confidence)`;
          break;
        case 'summarization':
          result = await this.hf.summarization({
            model: 'facebook/bart-large-cnn',
            inputs: task.prompt,
            parameters: { max_length: 100 }
          });
          result = result.summary_text;
          break;
        case 'question_answering':
          // For Q&A, expect context in task options
          const context = task.options?.context || task.prompt;
          const question = task.options?.question || 'What is this about?';
          result = await this.hf.questionAnswering({
            model: 'deepset/roberta-base-squad2',
            inputs: { question, context }
          });
          result = result.answer;
          break;
        default:
          // Use summarization as default for general text processing
          result = await this.hf.summarization({
            model: 'facebook/bart-large-cnn',
            inputs: task.prompt,
            parameters: { max_length: 100 }
          });
          result = result.summary_text;
      }

      this.updateQuota('huggingface', 1);

      return {
        result: typeof result === 'string' ? result : JSON.stringify(result),
        provider: 'huggingface',
        confidence: 0.8,
        tokens: 50
      };
    } catch (error) {
      throw new Error(`HuggingFace API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Qwen implementation via OpenRouter (FREE - qwen/qwen-2.5-72b-instruct:free)
  private async executeWithQwen(task: AITask): Promise<ProcessingResponse> {
    if (!process.env.OPENROUTER_API_KEY) {
      console.log('ℹ️ Qwen running in simulation mode (no OpenRouter key)');
      return {
        result: `[Qwen Simulation] Processing "${task.prompt}" - Qwen would provide multilingual coding assistance here.`,
        provider: 'qwen-simulation',
        confidence: 0.75,
        tokens: 100
      };
    }

    try {
      const axios = (await import('axios')).default;
      
      const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: 'qwen/qwen-2.5-72b-instruct:free',
        messages: [
          { role: 'user', content: this.buildPrompt(task) }
        ],
        max_tokens: 800,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://agentic-orchestration.app',
          'X-Title': 'Agentic Orchestration Builder'
        },
        timeout: 20000
      });

      const text = response.data.choices[0]?.message?.content || 'No response';
      this.updateQuota('qwen', 1);

      return {
        result: text,
        provider: 'qwen',
        confidence: 0.9,
        tokens: response.data.usage?.total_tokens || 100
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Qwen (OpenRouter) API error: ${errorMessage}`);
    }
  }

  // GLM-4 implementation via OpenRouter (FREE - z-ai/glm-4.5-air:free)
  private async executeWithGLM4(task: AITask): Promise<ProcessingResponse> {
    if (!process.env.OPENROUTER_API_KEY) {
      console.log('ℹ️ GLM-4 running in simulation mode (no OpenRouter key)');
      return {
        result: `[GLM-4 Simulation] Processing "${task.prompt}" - GLM-4 would provide advanced reasoning here.`,
        provider: 'glm4-simulation',
        confidence: 0.75,
        tokens: 100
      };
    }

    try {
      const axios = (await import('axios')).default;
      
      const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: 'z-ai/glm-4.5-air:free',
        messages: [
          { role: 'user', content: this.buildPrompt(task) }
        ],
        max_tokens: 500,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://agentic-orchestration.app',
          'X-Title': 'Agentic Orchestration Builder'
        },
        timeout: 15000
      });

      const text = response.data.choices[0]?.message?.content || 'No response';
      this.updateQuota('glm4', 1);

      return {
        result: text,
        provider: 'glm4',
        confidence: 0.9,
        tokens: response.data.usage?.total_tokens || 100
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`GLM-4 (OpenRouter) API error: ${errorMessage}`);
    }
  }

  // Kimi implementation via OpenRouter (FREE - moonshotai/kimi-k2:free)
  private async executeWithKimi(task: AITask): Promise<ProcessingResponse> {
    if (!process.env.OPENROUTER_API_KEY) {
      console.log('ℹ️ Kimi running in simulation mode (no OpenRouter key)');
      return {
        result: `[Kimi Simulation] Processing "${task.prompt}" - Kimi would provide long-context analysis here.`,
        provider: 'kimi-simulation',
        confidence: 0.75,
        tokens: 100
      };
    }

    try {
      const axios = (await import('axios')).default;
      
      const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: 'moonshotai/kimi-dev-72b:free',
        messages: [
          { role: 'user', content: this.buildPrompt(task) }
        ],
        max_tokens: 1000,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://agentic-orchestration.app',
          'X-Title': 'Agentic Orchestration Builder'
        },
        timeout: 20000
      });

      const text = response.data.choices[0]?.message?.content || 'No response';
      this.updateQuota('kimi', 1);

      return {
        result: text,
        provider: 'kimi',
        confidence: 0.9,
        tokens: response.data.usage?.total_tokens || 100
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Kimi (OpenRouter) API error: ${errorMessage}`);
    }
  }

  // Fallback execution with provider chain
  private async executeWithFallback(task: AITask, failedProvider: string): Promise<ProcessingResponse> {
    const fallbackChains: Record<string, string[]> = {
      'gemini': ['groq', 'huggingface', 'qwen'],
      'groq': ['gemini', 'qwen', 'glm4'],
      'huggingface': ['gemini', 'groq', 'qwen'],
      'qwen': ['groq', 'gemini', 'glm4'],
      'glm4': ['qwen', 'groq', 'gemini'],
      'kimi': ['gemini', 'qwen', 'groq']
    };

    const fallbacks = fallbackChains[failedProvider] || ['gemini'];
    
    for (const provider of fallbacks) {
      try {
        if (this.checkQuota(provider)) {
          return await this.executeWithProvider(task, provider);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`Fallback provider ${provider} also failed:`, errorMessage);
        continue;
      }
    }
    
    throw new Error('All AI providers failed');
  }

  // Build contextual prompt
  private buildPrompt(task: AITask): string {
    let prompt = task.prompt;
    
    if (task.context) {
      prompt += `\n\nContext: ${JSON.stringify(task.context, null, 2)}`;
    }
    
    if (task.options) {
      prompt += `\n\nOptions: ${JSON.stringify(task.options, null, 2)}`;
    }
    
    return prompt;
  }

  // Quota management
  private checkQuota(provider: string): boolean {
    const quotaKey = provider as keyof typeof this.quotaTracker;
    const quota = this.quotaTracker[quotaKey];
    return quota ? quota.daily < quota.limit : false;
  }

  private updateQuota(provider: string, tokens: number) {
    const quotaKey = provider as keyof typeof this.quotaTracker;
    const quota = this.quotaTracker[quotaKey];
    if (quota) {
      quota.daily += tokens;
    }
  }

  // Legacy methods for compatibility
  async generateResponse(request: AIRequest): Promise<AIResponse> {
    try {
      const task: AITask = {
        type: 'content_generation',
        prompt: request.prompt,
        options: {
          temperature: request.temperature,
          maxTokens: request.maxTokens
        }
      };

      const response = await this.executeWithProvider(task, request.provider);
      
      return {
        text: response.result,
        tokensUsed: response.tokens || 0,
        cost: 0, // All free providers
        model: request.model || 'default',
        provider: response.provider
      };
    } catch (error) {
      console.error('AI generation error:', error);
      throw new Error(`AI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzeDecision(context: any, options: string[]): Promise<any> {
    const task: AITask = {
      type: 'quick_decision',
      prompt: `Analyze this decision context and recommend the best option: ${JSON.stringify(context)}. Options: ${options.join(', ')}`,
      options: { type: 'decision_analysis' }
    };

    const response = await this.processNode({ data: { taskType: 'quick_decision' } }, task);
    
    return {
      recommendation: options[0],
      confidence: response.confidence || 0.8,
      reasoning: response.result,
      provider: response.provider
    };
  }
}