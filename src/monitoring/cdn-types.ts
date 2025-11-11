/**
 * CDN Optimization Types and Interfaces
 * Comprehensive type definitions for CDN optimization system
 */

// Core CDN Configuration Types
export interface CDNConfiguration {
  provider: CDNProvider;
  cacheStrategy: CacheStrategy;
  performanceSettings: PerformanceSettings;
  geoSettings: GeoSettings;
  monitoring: MonitoringConfig;
}

export type CDNProvider = 'cloudflare' | 'fastly' | 'cloudfront' | 'akamai' | 'custom';

// Cache Strategy Types
export interface CacheStrategy {
  staticAssets: StaticAssetCacheConfig;
  apiResponses: APICacheConfig;
  dynamicContent: DynamicContentCacheConfig;
  edgeRules: EdgeCacheRule[];
  invalidation: InvalidationStrategy;
}

export interface StaticAssetCacheConfig {
  ttl: number; // Time to live in seconds
  browserTTL: number; // Browser cache TTL
  edgeTTL: number; // Edge cache TTL
  staleWhileRevalidate: number; // SWR duration
  compressible: boolean;
  brotliCompression: boolean;
  gzipCompression: boolean;
  varyHeaders: string[];
}

export interface APICacheConfig {
  ttl: number;
  edgeTTL: number;
  varyHeaders: string[];
  cacheKeyCustomization: CacheKeyRules;
  queryParameters: QueryParameterHandling;
  authorizedAccess: boolean;
}

export interface DynamicContentCacheConfig {
  enabled: boolean;
  ttl: number;
  edgeTTL: number;
  personalizedContent: PersonalizedContentConfig;
  geoTargeting: boolean;
  deviceTargeting: boolean;
  abTesting: ABTestingConfig;
}

export interface CacheKeyRules {
  includeHost: boolean;
  includeScheme: boolean;
  includeQueryString: boolean;
  customKeyParts: string[];
  keyNormalization: 'lowercase' | 'uppercase' | 'preserve';
}

export interface QueryParameterHandling {
  mode: 'all' | 'none' | 'whitelist' | 'blacklist';
  parameters: string[];
  sorted: boolean;
}

export interface PersonalizedContentConfig {
  enabled: boolean;
  cookieBased: boolean;
  headerBased: boolean;
  geoBased: boolean;
  deviceBased: boolean;
  maxVariations: number;
}

export interface ABTestingConfig {
  enabled: boolean;
  cookieName: string;
  variations: ABTestVariation[];
  trafficSplit: TrafficSplitConfig;
}

export interface ABTestVariation {
  id: string;
  name: string;
  weight: number; // 0-1
  cacheKey: string;
}

export interface TrafficSplitConfig {
  method: 'cookie' | 'geo' | 'random' | 'consistent';
  fallbackToControl: boolean;
}

export interface EdgeCacheRule {
  name: string;
  priority: number;
  condition: CacheCondition;
  action: CacheAction;
  enabled: boolean;
}

export interface CacheCondition {
  contentType?: string[];
  pathPattern?: string;
  headerMatches?: Record<string, string>;
  queryMatches?: Record<string, string>;
  geoMatches?: string[];
  deviceMatches?: string[];
  customExpression?: string;
}

export interface CacheAction {
  ttl: number;
  browserTTL?: number;
  edgeTTL?: number;
  bypassCache?: boolean;
  serveStale?: boolean;
  compress?: boolean;
  customHeaders?: Record<string, string>;
}

export interface InvalidationStrategy {
  automatic: AutomaticInvalidationConfig;
  manual: ManualInvalidationConfig;
  purgeStrategies: PurgeStrategy[];
}

export interface AutomaticInvalidationConfig {
  enabled: boolean;
  triggers: InvalidationTrigger[];
  batchInvalidations: boolean;
  maxBatchSize: number;
  batchDelay: number; // milliseconds
}

export interface InvalidationTrigger {
  type: 'content-change' | 'deploy' | 'schedule' | 'custom';
  conditions: Record<string, any>;
  patterns: string[];
  delay: number;
}

export interface ManualInvalidationConfig {
  allowedPatterns: string[];
  rateLimit: RateLimitConfig;
  authentication: AuthenticationConfig;
  auditLogging: boolean;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
}

export interface AuthenticationConfig {
  required: boolean;
  methods: ('api-key' | 'jwt' | 'ip-whitelist')[];
  allowedIPs: string[];
}

export interface PurgeStrategy {
  name: string;
  pattern: string;
  scope: 'url' | 'prefix' | 'tag' | 'all';
  recursive: boolean;
}

// Performance Settings Types
export interface PerformanceSettings {
  compression: CompressionConfig;
  minification: MinificationConfig;
  optimization: OptimizationConfig;
  delivery: DeliveryConfig;
}

export interface CompressionConfig {
  brotli: BrotliConfig;
  gzip: GzipConfig;
  earlyHints: boolean;
  serverPush: boolean;
}

export interface BrotliConfig {
  enabled: boolean;
  quality: number; // 1-11
  windowSize: number;
  blockSize: number;
}

export interface GzipConfig {
  enabled: boolean;
  level: number; // 1-9
  windowSize: number;
  memoryLevel: number;
}

export interface MinificationConfig {
  html: MinifyConfig;
  css: MinifyConfig;
  javascript: MinifyConfig;
  json: MinifyConfig;
}

export interface MinifyConfig {
  enabled: boolean;
  removeComments: boolean;
  removeWhitespace: boolean;
  shortenNames: boolean;
  removeUnusedCode: boolean;
}

export interface OptimizationConfig {
  imageOptimization: ImageOptimizationConfig;
  fontOptimization: FontOptimizationConfig;
  codeSplitting: CodeSplittingConfig;
  lazyLoading: LazyLoadingConfig;
}

export interface ImageOptimizationConfig {
  enabled: boolean;
  webpConversion: boolean;
  avifConversion: boolean;
  quality: number; // 1-100
  progressive: boolean;
  responsiveImages: boolean;
  formatDetection: boolean;
}

export interface FontOptimizationConfig {
  enabled: boolean;
  preloading: boolean;
  subsetting: boolean;
  displaySwap: boolean;
  formatConversion: boolean;
}

export interface CodeSplittingConfig {
  enabled: boolean;
  vendorChunks: boolean;
  routeChunks: boolean;
  dynamicImports: boolean;
  maxSize: number; // bytes
}

export interface LazyLoadingConfig {
  images: boolean;
  iframes: boolean;
  videos: boolean;
  components: boolean;
  threshold: number; // pixels
}

export interface DeliveryConfig {
  http2: boolean;
  http3: boolean;
  tlsVersion: '1.2' | '1.3' | 'both';
  certificateOptimization: boolean;
  connectionReuse: boolean;
  keepAliveTimeout: number;
}

// Geographic Settings Types
export interface GeoSettings {
  distribution: GeoDistributionConfig;
  routing: GeoRoutingConfig;
  performance: GeoPerformanceConfig;
  compliance: GeoComplianceConfig;
}

export interface GeoDistributionConfig {
  strategy: 'global' | 'regional' | 'hybrid';
  edgeLocations: EdgeLocation[];
  primaryRegions: string[];
  backupRegions: string[];
  failoverEnabled: boolean;
}

export interface EdgeLocation {
  id: string;
  region: string;
  city: string;
  country: string;
  continent: string;
  latitude: number;
  longitude: number;
  capacity: number;
  isActive: boolean;
}

export interface GeoRoutingConfig {
  algorithm: 'latency-based' | 'geographic' | 'weighted' | 'custom';
  latencyThreshold: number; // milliseconds
  healthChecks: HealthCheckConfig;
  trafficDistribution: TrafficDistributionConfig;
}

export interface HealthCheckConfig {
  enabled: boolean;
  interval: number; // seconds
  timeout: number; // seconds
  retries: number;
  protocol: 'HTTP' | 'HTTPS' | 'TCP';
  path: string;
  expectedStatus: number[];
}

export interface TrafficDistributionConfig {
  method: 'round-robin' | 'weighted' | 'least-connections' | 'response-time';
  weights: Record<string, number>;
  stickySessions: boolean;
  sessionAffinity: 'cookie' | 'ip' | 'header';
}

export interface GeoPerformanceConfig {
  optimization: boolean;
  regionalCaching: boolean;
  edgeComputing: boolean;
  tcpOptimization: boolean;
  routeOptimization: boolean;
}

export interface GeoComplianceConfig {
  dataResidency: DataResidencyConfig;
  gdprCompliance: GDPRConfig;
  regionalRegulations: RegionalRegulationConfig[];
}

export interface DataResidencyConfig {
  enabled: boolean;
  restrictedRegions: string[];
  allowedRegions: string[];
  fallbackRegion: string;
  strictMode: boolean;
}

export interface GDPRConfig {
  enabled: boolean;
  cookieConsent: boolean;
  dataAnonymization: boolean;
  rightToErasure: boolean;
  dataPortability: boolean;
}

export interface RegionalRegulationConfig {
  region: string;
  regulation: string;
  requirements: string[];
  restrictions: string[];
}

// Monitoring Config Types
export interface MonitoringConfig {
  enabled: boolean;
  metricsInterval: number; // milliseconds
  retentionPeriod: number; // days
  alerting: AlertingConfig;
  dashboards: DashboardConfig[];
  analytics: AnalyticsConfig;
}

export interface AlertingConfig {
  enabled: boolean;
  channels: AlertChannel[];
  thresholds: AlertThreshold[];
  escalation: EscalationConfig;
  suppression: SuppressionConfig;
}

export interface AlertChannel {
  type: 'email' | 'slack' | 'webhook' | 'pagerduty' | 'custom';
  config: Record<string, any>;
  enabled: boolean;
}

export interface AlertThreshold {
  metric: string;
  operator: '>' | '<' | '=' | '>=' | '<=';
  value: number;
  duration: number; // seconds
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface EscalationConfig {
  enabled: boolean;
  levels: EscalationLevel[];
  maxEscalations: number;
  cooldownPeriod: number; // minutes
}

export interface EscalationLevel {
  level: number;
  delay: number; // minutes
  channels: string[];
  conditions: string[];
}

export interface SuppressionConfig {
  enabled: boolean;
  duration: number; // minutes
  conditions: string[];
  globalSuppression: boolean;
}

export interface DashboardConfig {
  name: string;
  type: 'overview' | 'performance' | 'geographic' | 'cost' | 'custom';
  widgets: WidgetConfig[];
  refreshInterval: number; // seconds
  sharing: SharingConfig;
}

export interface WidgetConfig {
  type: 'metric' | 'chart' | 'map' | 'table' | 'text';
  title: string;
  query: string;
  visualization: VisualizationConfig;
  size: WidgetSize;
  position: WidgetPosition;
}

export interface VisualizationConfig {
  chartType: 'line' | 'bar' | 'pie' | 'heatmap' | 'gauge';
  timeRange: string;
  aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count';
  filters: Record<string, any>;
}

export interface WidgetSize {
  width: number;
  height: number;
  unit: 'pixels' | 'grid';
}

export interface WidgetPosition {
  x: number;
  y: number;
  zIndex: number;
}

export interface SharingConfig {
  enabled: boolean;
  public: boolean;
  allowedUsers: string[];
  allowedRoles: string[];
  expiryDate?: Date;
}

export interface AnalyticsConfig {
  enabled: boolean;
  dataCollection: DataCollectionConfig;
  privacy: PrivacyConfig;
  reporting: ReportingConfig;
}

export interface DataCollectionConfig {
  metrics: string[];
  dimensions: string[];
  sampling: SamplingConfig;
  retention: RetentionConfig;
}

export interface SamplingConfig {
  enabled: boolean;
  rate: number; // 0-1
  method: 'random' | 'deterministic';
}

export interface RetentionConfig {
  raw: number; // days
  aggregated: number; // days
  archive: number; // days
}

export interface PrivacyConfig {
  anonymizeIPs: boolean;
  excludePersonalData: boolean;
  dataMinimization: boolean;
  consentRequired: boolean;
}

export interface ReportingConfig {
  schedules: ReportSchedule[];
  formats: ('pdf' | 'csv' | 'json' | 'html')[];
  recipients: string[];
  templates: ReportTemplate[];
}

export interface ReportSchedule {
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  enabled: boolean;
  recipients: string[];
  template: string;
  deliveryMethod: 'email' | 'webhook' | 'storage';
}

export interface ReportTemplate {
  name: string;
  sections: ReportSection[];
  branding: BrandingConfig;
}

export interface ReportSection {
  type: 'summary' | 'chart' | 'table' | 'text';
  title: string;
  query: string;
  visualization: VisualizationConfig;
}

export interface BrandingConfig {
  logo: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
}

// Performance Metrics Types
export interface PerformanceMetrics {
  totalRequests: number;
  totalBandwidthGB: number;
  avgLatency: number;
  p95Latency: number;
  p99Latency: number;
  errorRate: number;
  cacheHitRate: number;
  bandwidthSavings: number;
  availability: number;
  regions: RegionalMetrics[];
  timeRange: TimeRange;
}

export interface RegionalMetrics {
  region: string;
  requests: number;
  avgLatency: number;
  bandwidthGB: number;
  hitRate: number;
  availability: number;
  cost: number;
}

export interface TimeRange {
  start: Date;
  end: Date;
  granularity: 'minute' | 'hour' | 'day' | 'week' | 'month';
}

export interface GeoOptimization {
  currentDistribution: EdgeLocation[];
  recommendedDistribution: EdgeLocation[];
  regionalPerformance: RegionalPerformance[];
  costOptimization: CostOptimizationMetrics;
}

export interface RegionalPerformance {
  region: string;
  currentLatency: number;
  optimizedLatency: number;
  improvement: number;
  recommendation: string;
}

export interface CostOptimizationMetrics {
  currentCost: number;
  optimizedCost: number;
  savings: number;
  savingsPercentage: number;
  breakdown: CostBreakdown[];
}

export interface CostBreakdown {
  category: string;
  currentCost: number;
  optimizedCost: number;
  savings: number;
  percentage: number;
}

// Utility Types
export interface CDNOptimizationOptions {
  dryRun?: boolean;
  focusArea?: 'cache' | 'performance' | 'geography' | 'all';
  regions?: string[];
  budgetConstraints?: BudgetConstraints;
  complianceRequirements?: ComplianceRequirement[];
}

export interface BudgetConstraints {
  maxMonthlyCost: number;
  maxBandwidthGB: number;
  maxRequests: number;
  costPerRequest: number;
  costPerGB: number;
}

export interface ComplianceRequirement {
  type: 'gdpr' | 'ccpa' | 'hipaa' | 'pci' | 'custom';
  regions: string[];
  requirements: string[];
  restrictions: string[];
}
