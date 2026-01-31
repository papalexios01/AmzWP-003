import { z } from 'zod';

export const AmazonRegionSchema = z.enum([
  'us-east-1', 'us-west-2', 'eu-west-1', 'eu-central-1', 
  'ap-northeast-1', 'ap-southeast-1', 'ap-southeast-2'
]);

export const BoxStyleSchema = z.enum(['TACTICAL_LINK', 'ELITE_BENTO', 'PREMIUM', 'MINIMAL']);

export const AIProviderSchema = z.enum(['gemini', 'openai', 'anthropic', 'groq', 'openrouter']);

export const AppConfigSchema = z.object({
  // Amazon
  amazonTag: z.string().regex(/^\w+-\d{2}$/, 'Invalid Amazon tag format (e.g., mytag-20)').default(''),
  amazonAccessKey: z.string().min(20, 'Access key too short').max(20, 'Access key too long').default(''),
  amazonSecretKey: z.string().min(40, 'Secret key too short').default(''),
  amazonRegion: AmazonRegionSchema.default('us-east-1'),
  
  // WordPress
  wpUrl: z.string().url('Must be a valid URL').regex(/\/wp-json\/v2$/, 'Must end with /wp-json/v2').default(''),
  wpUser: z.string().min(1, 'Username required').default(''),
  wpAppPassword: z.string().regex(/^\w{4} \w{4} \w{4} \w{4}$/, 'Invalid app password format').default(''),
  
  // SerpAPI
  serpApiKey: z.string().min(32, 'API key too short').default(''),
  
  // AI
  aiProvider: AIProviderSchema.default('gemini'),
  aiModel: z.string().default('gemini-2.0-flash'),
  geminiApiKey: z.string().default(''),
  openaiApiKey: z.string().default(''),
  anthropicApiKey: z.string().default(''),
  groqApiKey: z.string().default(''),
  openrouterApiKey: z.string().default(''),
  customModel: z.string().default(''),
  
  // Processing
  autoPublishThreshold: z.number().min(0).max(100).default(85),
  concurrencyLimit: z.number().min(1).max(20).default(5),
  
  // Features
  enableSchema: z.boolean().default(true),
  enableStickyBar: z.boolean().default(true),
  boxStyle: BoxStyleSchema.default('ELITE_BENTO'),
});

export const BlogPostSchema = z.object({
  id: z.number(),
  title: z.string(),
  url: z.string().url(),
  postType: z.enum(['post', 'page', 'custom']).default('post'),
  priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  monetizationStatus: z.enum(['monetized', 'opportunity', 'none']).default('opportunity'),
  modified: z.string().optional(),
});

export const SitemapStateSchema = z.object({
  url: z.string(),
  posts: z.array(BlogPostSchema).default([]),
  lastFetched: z.number().optional(),
});

export const ProductDetailsSchema = z.object({
  id: z.string(),
  asin: z.string().regex(/^[A-Z0-9]{10}$/i, 'Invalid ASIN format'),
  title: z.string().min(1),
  price: z.string().default('$XX.XX'),
  imageUrl: z.string().url().default('https://via.placeholder.com/300'),
  rating: z.number().min(0).max(5).default(4.5),
  reviewCount: z.number().min(0).default(1000),
  brand: z.string().default(''),
  category: z.string().default('General'),
  prime: z.boolean().default(true),
  verdict: z.string().optional(),
  evidenceClaims: z.array(z.string()).default([]),
  faqs: z.array(z.object({ question: z.string(), answer: z.string() })).default([]),
  specs: z.record(z.string()).default({}),
  insertionIndex: z.number().default(1),
  deploymentMode: z.enum(['TACTICAL_LINK', 'ELITE_BENTO', 'PREMIUM', 'MINIMAL']).default('ELITE_BENTO'),
});

// Export types
export type ValidatedAppConfig = z.infer<typeof AppConfigSchema>;
export type ValidatedBlogPost = z.infer<typeof BlogPostSchema>;
export type ValidatedSitemapState = z.infer<typeof SitemapStateSchema>;
export type ValidatedProductDetails = z.infer<typeof ProductDetailsSchema>;
