// di/types.ts
// Dependency injection tokens for enterprise service layer

export const TYPES = {
  // Services
  AiService: Symbol.for('AiService'),
  WpService: Symbol.for('WpService'),
  AmazonService: Symbol.for('AmazonService'),
  SerpApiService: Symbol.for('SerpApiService'),
  CacheService: Symbol.for('CacheService'),
  LoggerService: Symbol.for('LoggerService'),
  
  // Config
  AppConfig: Symbol.for('AppConfig'),
} as const;
