import { injectable, inject } from 'inversify';
import { TYPES } from '../di/types';
import { ApiClient, apiClient } from '../lib/api-client';
import { ICacheService } from './cache-service';
import { ILoggerService } from './logger-service';
import { AppConfig, AIResponse, AIProvider } from '../types';

export interface IAiService {
  generateContent(prompt: string, systemPrompt?: string): Promise<AIResponse>;
  analyzeContent(title: string, content: string): Promise<AnalysisResult>;
}

export interface AnalysisResult {
  detectedProducts: Array<{ id: string; title: string; searchQuery: string; confidence: number }>;
  contentType: string;
  monetizationPotential: 'high' | 'medium' | 'low';
  keywords: string[];
}

@injectable()
export class AiService implements IAiService {
  constructor(
    @inject(TYPES.CacheService) private cache: ICacheService,
    @inject(TYPES.LoggerService) private logger: ILoggerService
  ) {}

  async generateContent(prompt: string, systemPrompt = 'You are a helpful assistant'): Promise<AIResponse> {
    const cacheKey = this.hashPrompt(prompt);
    const cached = await this.cache.get<AIResponse>(`ai:${cacheKey}`);
    
    if (cached) {
      this.logger.debug('AI cache hit', { cacheKey });
      return cached;
    }

    this.logger.info('Calling AI provider', { promptLength: prompt.length });
    
    // This would be connected to your existing AI provider logic
    // For now, it's a placeholder that uses the global config
    // In production, you'd import your existing AI logic from utils.ts
    throw new Error('AI service implementation uses config from your utils.ts. Use callAIProvider from utils.ts directly.');
  }

  async analyzeContent(title: string, content: string): Promise<AnalysisResult> {
    const cacheKey = this.hashContent(title, content);
    const cached = await this.cache.get<AnalysisResult>(`analysis:${cacheKey}`);
    
    if (cached) {
      this.logger.debug('Analysis cache hit', { cacheKey });
      return cached;
    }

    this.logger.info('Analyzing content', { title, contentLength: content.length });

    // Would use your existing AI analysis logic from utils.ts
    // Placeholder for DI pattern
    throw new Error('Analysis implementation uses config from your utils.ts. Use analyzeContentAndFindProduct from utils.ts directly.');
  }

  private hashPrompt(prompt: string): string {
    return this.simpleHash(prompt);
  }

  private hashContent(title: string, content: string): string {
    return this.simpleHash(`${title}:${content.slice(0, 500)}`);
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}
