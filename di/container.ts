// di/container.ts
// Enterprise dependency injection container with browser-only services

import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types';
import { IAiService, AiService } from '../services/ai-service';
import { IWpService, WpService } from '../services/wp-service';
import { IAmazonService, AmazonService } from '../services/amazon-service';
import { ISerpApiService, SerpApiService } from '../services/serpapi-service';
import { ICacheService, LocalStorageCacheService } from '../services/cache-service';
import { ILoggerService, PinoLoggerService } from '../services/logger-service';

export const container = new Container({
  defaultScope: 'Singleton',
});

// Register services
container.bind<IAiService>(TYPES.AiService).to(AiService);
container.bind<IWpService>(TYPES.WpService).to(WpService);
container.bind<IAmazonService>(TYPES.AmazonService).to(AmazonService);
container.bind<ISerpApiService>(TYPES.SerpApiService).to(SerpApiService);
container.bind<ICacheService>(TYPES.CacheService).to(LocalStorageCacheService);
container.bind<ILoggerService>(TYPES.LoggerService).to(PinoLoggerService);

// Hooks for using services in React
export const useAiService = () => container.get<IAiService>(TYPES.AiService);
export const useWpService = () => container.get<IWpService>(TYPES.WpService);
export const useAmazonService = () => container.get<IAmazonService>(TYPES.AmazonService);
export const useSerpApiService = () => container.get<ISerpApiService>(TYPES.SerpApiService);
export const useCacheService = () => container.get<ICacheService>(TYPES.CacheService);
export const useLoggerService = () => container.get<ILoggerService>(TYPES.LoggerService);

export { TYPES };
