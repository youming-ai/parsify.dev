/**
 * User Preference Management for Feedback System
 * Manages user preferences for feedback frequency, timing, and display options
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  UserFeedbackPreferences,
  FeedbackChannel,
  FeedbackTiming,
  FeedbackTopic,
  ToolFeedbackSettings,
  UserJourneyStage
} from '@/types/feedback';

export interface PreferenceManagerConfig {
  enabled: boolean;
  defaultPreferences: Partial<UserFeedbackPreferences>;
  storageKey: string;
  syncWithServer: boolean;
  encryptionEnabled: boolean;
  respectBrowserSettings: boolean;
  adaptiveFrequency: boolean;
  smartScheduling: boolean;
  contextAwareTriggers: boolean;
  privacyMode: boolean;
  gdprCompliant: boolean;
}

export interface PreferenceProfile {
  id: string;
  name: string;
  description: string;
  preferences: UserFeedbackPreferences;
  isDefault: boolean;
  isBuiltIn: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PreferenceSchedule {
  id: string;
  name: string;
  timing: FeedbackTiming[];
  frequency: 'minimal' | 'moderate' | 'frequent';
  maxPerDay: number;
  maxPerWeek: number;
  minIntervalHours: number;
  preferredTimesOfDay: string[];
  preferredDaysOfWeek: number[];
  cooldownPeriodHours: number;
  adaptiveEnabled: boolean;
}

export interface PreferenceRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  action: 'show' | 'hide' | 'modify' | 'delay';
  parameters: Record<string, any>;
  priority: number;
  enabled: boolean;
  createdAt: Date;
}

interface PreferenceManagerState {
  // Current preferences
  preferences: UserFeedbackPreferences;
  activeProfile: string;

  // Available profiles
  profiles: PreferenceProfile[];

  // Scheduling
  schedules: PreferenceSchedule[];
  activeSchedule: string;

  // Rules
  rules: PreferenceRule[];

  // State tracking
  lastInteraction: Date;
  totalInteractions: number;
  recentFeedback: Date[];
  frequencyHistory: Array<{
    date: Date;
    count: number;
    satisfaction?: number;
  }>;

  // Adaptive data
  userBehavior: {
    preferredTimes: string[];
    averageSessionLength: number;
    completionRate: number;
    satisfactionTrend: number[];
    responsePatterns: Record<string, number>;
  };

  // Privacy and consent
  consentGiven: boolean;
  consentVersion: string;
  dataRetentionDays: number;
  privacySettings: {
    anonymizeData: boolean;
    shareWithAnalytics: boolean;
    allowPersonalization: boolean;
    allowNotifications: boolean;
  };
}

interface PreferenceManagerActions {
  // Profile management
  setPreferences: (preferences: Partial<UserFeedbackPreferences>) => void;
  loadProfile: (profileId: string) => void;
  saveProfile: (name: string, description?: string) => PreferenceProfile;
  deleteProfile: (profileId: string) => void;
  setActiveProfile: (profileId: string) => void;

  // Preference updates
  updateFrequency: (frequency: 'never' | 'minimal' | 'moderate' | 'frequent') => void;
  updateChannels: (channels: FeedbackChannel[]) => void;
  updateTiming: (timing: FeedbackTiming[]) => void;
  updateTopics: (topics: FeedbackTopic[]) => void;
  optOut: () => void;
  optIn: () => void;

  // Scheduling
  setSchedule: (scheduleId: string) => void;
  createCustomSchedule: (schedule: Omit<PreferenceSchedule, 'id'>) => PreferenceSchedule;
  shouldShowFeedback: (context?: Record<string, any>) => boolean;
  getNextAvailableTime: (): Date | null;

  // Rules
  addRule: (rule: Omit<PreferenceRule, 'id' | 'createdAt'>) => void;
  removeRule: (ruleId: string) => void;
  updateRule: (ruleId: string, updates: Partial<PreferenceRule>) => void;
  evaluateRules: (context: Record<string, any>) => PreferenceRule[];

  // Adaptive learning
  recordInteraction: (type: string, context?: Record<string, any>) => void;
  recordFeedback: (satisfaction: number, context?: Record<string, any>) => void;
  updateAdaptivePreferences: () => void;

  // Privacy
  updateConsent: (given: boolean, version: string) => void;
  updatePrivacySettings: (settings: Partial<PreferenceManagerState['privacySettings']>) => void;
  exportData: () => string;
  importData: (data: string) => void;
  clearAllData: () => void;

  // Analytics
  getPreferenceAnalytics: () => PreferenceAnalytics;
}

export interface PreferenceAnalytics {
  totalProfiles: number;
  activeProfile: string;
  preferenceChanges: number;
  lastUpdated: Date;
  usagePatterns: {
    mostUsedChannels: FeedbackChannel[];
    preferredTiming: FeedbackTiming[];
    topicDistribution: Record<FeedbackTopic, number>;
  };
  effectiveness: {
    completionRate: number;
    satisfactionAverage: number;
    responseRate: number;
    optimalFrequency: string;
  };
  adaptiveInsights: {
    bestPerformingTimes: string[];
    userSegment: string;
    recommendations: string[];
  };
}

// Default preference profiles
const defaultProfiles: PreferenceProfile[] = [
  {
    id: 'minimal',
    name: 'Minimal Feedback',
    description: 'Only show feedback requests when absolutely necessary',
    preferences: {
      enabled: true,
      frequency: 'minimal',
      channels: ['toast'],
      timing: ['on_error'],
      topics: ['bug_report'],
      lastInteraction: new Date(),
      totalGiven: 0,
      optedOut: false,
      customSettings: {
        toolSpecificSettings: {},
      },
    },
    isDefault: false,
    isBuiltIn: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'balanced',
    name: 'Balanced Feedback',
    description: 'Reasonable amount of feedback requests at appropriate times',
    preferences: {
      enabled: true,
      frequency: 'moderate',
      channels: ['modal', 'inline'],
      timing: ['after_tool_use', 'on_session_end'],
      topics: ['satisfaction', 'usability', 'bug_report'],
      lastInteraction: new Date(),
      totalGiven: 0,
      optedOut: false,
      customSettings: {
        toolSpecificSettings: {},
      },
    },
    isDefault: true,
    isBuiltIn: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'enthusiastic',
    name: 'Enthusiastic Feedback',
    description: 'Regular feedback requests for engaged users',
    preferences: {
      enabled: true,
      frequency: 'frequent',
      channels: ['modal', 'inline', 'tooltip'],
      timing: ['after_tool_use', 'on_session_end', 'periodic', 'on_feature_discovery'],
      topics: ['satisfaction', 'usability', 'bug_report', 'feature_request'],
      lastInteraction: new Date(),
      totalGiven: 0,
      optedOut: false,
      customSettings: {
        toolSpecificSettings: {},
      },
    },
    isDefault: false,
    isBuiltIn: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Default schedules
const defaultSchedules: PreferenceSchedule[] = [
  {
    id: 'work_hours',
    name: 'Work Hours',
    timing: ['after_tool_use', 'on_error'],
    frequency: 'moderate',
    maxPerDay: 3,
    maxPerWeek: 10,
    minIntervalHours: 2,
    preferredTimesOfDay: ['09:00', '14:00', '17:00'],
    preferredDaysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
    cooldownPeriodHours: 24,
    adaptiveEnabled: true,
  },
  {
    id: 'weekend',
    name: 'Weekend',
    timing: ['periodic'],
    frequency: 'minimal',
    maxPerDay: 1,
    maxPerWeek: 3,
    minIntervalHours: 6,
    preferredTimesOfDay: ['11:00', '15:00'],
    preferredDaysOfWeek: [6, 0], // Saturday, Sunday
    cooldownPeriodHours: 48,
    adaptiveEnabled: true,
  },
];

export const useFeedbackPreferences = create<PreferenceManagerState & PreferenceManagerActions>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        preferences: {
          enabled: true,
          frequency: 'moderate',
          channels: ['modal', 'inline'],
          timing: ['after_tool_use', 'on_session_end'],
          topics: ['satisfaction', 'usability', 'bug_report'],
          lastInteraction: new Date(),
          totalGiven: 0,
          optedOut: false,
          customSettings: {
            toolSpecificSettings: {},
          },
        },
        activeProfile: 'balanced',
        profiles: defaultProfiles,
        schedules: defaultSchedules,
        activeSchedule: 'work_hours',
        rules: [],
        lastInteraction: new Date(),
        totalInteractions: 0,
        recentFeedback: [],
        frequencyHistory: [],
        userBehavior: {
          preferredTimes: [],
          averageSessionLength: 0,
          completionRate: 0,
          satisfactionTrend: [],
          responsePatterns: {},
        },
        consentGiven: false,
        consentVersion: '1.0',
        dataRetentionDays: 365,
        privacySettings: {
          anonymizeData: false,
          shareWithAnalytics: true,
          allowPersonalization: true,
          allowNotifications: true,
        },

        // Profile management
        setPreferences: (preferences) => set((state) => ({
          preferences: { ...state.preferences, ...preferences },
        })),

        loadProfile: (profileId) => set((state) => {
          const profile = state.profiles.find(p => p.id === profileId);
          if (profile) {
            return {
              preferences: profile.preferences,
              activeProfile: profileId,
            };
          }
          return state;
        }),

        saveProfile: (name, description) => {
          const state = get();
          const newProfile: PreferenceProfile = {
            id: `custom_${Date.now()}`,
            name,
            description: description || '',
            preferences: { ...state.preferences },
            isDefault: false,
            isBuiltIn: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          set((prevState) => ({
            profiles: [...prevState.profiles, newProfile],
          }));

          return newProfile;
        },

        deleteProfile: (profileId) => set((state) => ({
          profiles: state.profiles.filter(p => p.id !== profileId),
          activeProfile: state.activeProfile === profileId ? 'balanced' : state.activeProfile,
        })),

        setActiveProfile: (profileId) => set((state) => {
          const profile = state.profiles.find(p => p.id === profileId);
          return {
            preferences: profile ? profile.preferences : state.preferences,
            activeProfile: profileId,
          };
        }),

        // Preference updates
        updateFrequency: (frequency) => set((state) => ({
          preferences: { ...state.preferences, frequency },
        })),

        updateChannels: (channels) => set((state) => ({
          preferences: { ...state.preferences, channels },
        })),

        updateTiming: (timing) => set((state) => ({
          preferences: { ...state.preferences, timing },
        })),

        updateTopics: (topics) => set((state) => ({
          preferences: { ...state.preferences, topics },
        })),

        optOut: () => set((state) => ({
          preferences: { ...state.preferences, optedOut: true, enabled: false },
        })),

        optIn: () => set((state) => ({
          preferences: { ...state.preferences, optedOut: false, enabled: true },
        })),

        // Scheduling
        setSchedule: (scheduleId) => set((state) => ({
          activeSchedule: scheduleId,
        })),

        createCustomSchedule: (schedule) => {
          const newSchedule: PreferenceSchedule = {
            ...schedule,
            id: `custom_${Date.now()}`,
          };

          set((state) => ({
            schedules: [...state.schedules, newSchedule],
          }));

          return newSchedule;
        },

        shouldShowFeedback: (context = {}) => {
          const state = get();
          if (!state.preferences.enabled || state.preferences.optedOut) {
            return false;
          }

          // Check frequency limits
          const now = new Date();
          const today = now.toDateString();
          const thisWeek = getWeekNumber(now);

          const todayFeedback = state.frequencyHistory.filter(h => h.date.toDateString() === today);
          const thisWeekFeedback = state.frequencyHistory.filter(h => getWeekNumber(h.date) === thisWeek);

          if (todayFeedback.length >= 3 || thisWeekFeedback.length >= 10) {
            return false;
          }

          // Check cooldown period
          if (state.lastInteraction) {
            const hoursSinceLastInteraction = (now.getTime() - state.lastInteraction.getTime()) / (1000 * 60 * 60);
            if (hoursSinceLastInteraction < 2) {
              return false;
            }
          }

          // Check schedule
          const activeSchedule = state.schedules.find(s => s.id === state.activeSchedule);
          if (activeSchedule) {
            const currentHour = now.getHours();
            const currentDay = now.getDay();

            // Check if current day is preferred
            if (!activeSchedule.preferredDaysOfWeek.includes(currentDay)) {
              return false;
            }

            // Check if current time is close to preferred times
            const currentTime = `${currentHour.toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            const isPreferredTime = activeSchedule.preferredTimesOfDay.some(preferredTime => {
              const [hour, minute] = preferredTime.split(':').map(Number);
              const timeDiff = Math.abs((currentHour * 60 + now.getMinutes()) - (hour * 60 + minute));
              return timeDiff <= 30; // Within 30 minutes of preferred time
            });

            if (!isPreferredTime && activeSchedule.preferredTimesOfDay.length > 0) {
              return false;
            }
          }

          // Evaluate rules
          const applicableRules = state.rules
            .filter(rule => rule.enabled)
            .filter(rule => evaluateCondition(rule.condition, context))
            .sort((a, b) => b.priority - a.priority);

          for (const rule of applicableRules) {
            if (rule.action === 'hide') {
              return false;
            }
            if (rule.action === 'show') {
              return true;
            }
          }

          return true;
        },

        getNextAvailableTime: () => {
          const state = get();
          const activeSchedule = state.schedules.find(s => s.id === state.activeSchedule);
          if (!activeSchedule) return null;

          const now = new Date();
          const nextAvailableTime = new Date(now);

          // Find next preferred time
          for (let daysAhead = 0; daysAhead < 7; daysAhead++) {
            const checkDate = new Date(now);
            checkDate.setDate(checkDate.getDate() + daysAhead);

            if (activeSchedule.preferredDaysOfWeek.includes(checkDate.getDay())) {
              for (const preferredTime of activeSchedule.preferredTimesOfDay) {
                const [hour, minute] = preferredTime.split(':').map(Number);
                nextAvailableTime.setHours(hour, minute, 0, 0);

                if (nextAvailableTime > now) {
                  return nextAvailableTime;
                }
              }
            }
          }

          return null;
        },

        // Rules
        addRule: (rule) => set((state) => ({
          rules: [...state.rules, {
            ...rule,
            id: `rule_${Date.now()}`,
            createdAt: new Date(),
          }],
        })),

        removeRule: (ruleId) => set((state) => ({
          rules: state.rules.filter(r => r.id !== ruleId),
        })),

        updateRule: (ruleId, updates) => set((state) => ({
          rules: state.rules.map(r =>
            r.id === ruleId ? { ...r, ...updates } : r
          ),
        })),

        evaluateRules: (context) => {
          const state = get();
          return state.rules
            .filter(rule => rule.enabled)
            .filter(rule => evaluateCondition(rule.condition, context))
            .sort((a, b) => b.priority - a.priority);
        },

        // Adaptive learning
        recordInteraction: (type, context = {}) => set((state) => {
          const now = new Date();

          // Update basic tracking
          const newInteraction = {
            type,
            context,
            timestamp: now,
          };

          // Update response patterns
          const responsePatterns = { ...state.userBehavior.responsePatterns };
          responsePatterns[type] = (responsePatterns[type] || 0) + 1;

          // Update preferred times
          const currentHour = now.getHours().toString();
          const preferredTimes = [...state.userBehavior.preferredTimes];
          if (!preferredTimes.includes(currentHour)) {
            preferredTimes.push(currentHour);
          }

          return {
            lastInteraction: now,
            totalInteractions: state.totalInteractions + 1,
            userBehavior: {
              ...state.userBehavior,
              responsePatterns,
              preferredTimes,
            },
          };
        }),

        recordFeedback: (satisfaction, context = {}) => set((state) => {
          const now = new Date();

          // Add to recent feedback
          const recentFeedback = [...state.recentFeedback, now]
            .sort((a, b) => b.getTime() - a.getTime())
            .slice(0, 10); // Keep last 10

          // Update frequency history
          const today = now.toDateString();
          const existingEntry = state.frequencyHistory.find(h => h.date.toDateString() === today);

          let frequencyHistory;
          if (existingEntry) {
            frequencyHistory = state.frequencyHistory.map(h =>
              h.date.toDateString() === today
                ? { ...h, count: h.count + 1, satisfaction: (h.satisfaction! * h.count + satisfaction) / (h.count + 1) }
                : h
            );
          } else {
            frequencyHistory = [...state.frequencyHistory, { date: now, count: 1, satisfaction }];
          }

          // Update satisfaction trend
          const satisfactionTrend = [...state.userBehavior.satisfactionTrend, satisfaction]
            .slice(-50); // Keep last 50 data points

          return {
            recentFeedback,
            frequencyHistory,
            preferences: {
              ...state.preferences,
              lastInteraction: now,
              totalGiven: state.preferences.totalGiven + 1,
            },
            userBehavior: {
              ...state.userBehavior,
              satisfactionTrend,
            },
          };
        }),

        updateAdaptivePreferences: () => set((state) => {
          // Analyze user behavior and adjust preferences
          const { satisfactionTrend, responsePatterns, completionRate } = state.userBehavior;

          let updatedPreferences = { ...state.preferences };
          let updatedActiveSchedule = state.activeSchedule;

          // Adjust frequency based on satisfaction
          if (satisfactionTrend.length >= 5) {
            const recentSatisfaction = satisfactionTrend.slice(-5);
            const avgSatisfaction = recentSatisfaction.reduce((sum, sat) => sum + sat, 0) / recentSatisfaction.length;

            if (avgSatisfaction < 2.5 && state.preferences.frequency !== 'minimal') {
              // Reduce frequency if satisfaction is low
              updatedPreferences.frequency = 'minimal';
            } else if (avgSatisfaction > 4.0 && state.preferences.frequency === 'minimal') {
              // Can increase frequency if satisfaction is high
              updatedPreferences.frequency = 'moderate';
            }
          }

          // Adjust timing based on response patterns
          const bestTimes = Object.entries(responsePatterns)
            .filter(([type]) => type.includes('feedback'))
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);

          if (bestTimes.length > 0) {
            // This would update schedule based on most responsive times
            // Implementation would depend on specific timing data
          }

          return {
            preferences: updatedPreferences,
            activeSchedule: updatedActiveSchedule,
          };
        }),

        // Privacy
        updateConsent: (given, version) => set((state) => ({
          consentGiven: given,
          consentVersion: version,
        })),

        updatePrivacySettings: (settings) => set((state) => ({
          privacySettings: { ...state.privacySettings, ...settings },
        })),

        exportData: () => {
          const state = get();
          return JSON.stringify({
            preferences: state.preferences,
            profiles: state.profiles.filter(p => !p.isBuiltIn),
            schedules: state.schedules.filter(s => !s.id.startsWith('work_hours') && !s.id.startsWith('weekend')),
            rules: state.rules,
            userBehavior: state.userBehavior,
            privacySettings: state.privacySettings,
            exportedAt: new Date(),
          });
        },

        importData: (data) => {
          try {
            const imported = JSON.parse(data);
            set((state) => ({
              ...state,
              ...imported,
            }));
          } catch (error) {
            console.error('Failed to import preference data:', error);
          }
        },

        clearAllData: () => set({
          preferences: defaultProfiles.find(p => p.id === 'balanced')!.preferences,
          activeProfile: 'balanced',
          profiles: defaultProfiles,
          rules: [],
          lastInteraction: new Date(),
          totalInteractions: 0,
          recentFeedback: [],
          frequencyHistory: [],
          userBehavior: {
            preferredTimes: [],
            averageSessionLength: 0,
            completionRate: 0,
            satisfactionTrend: [],
            responsePatterns: {},
          },
        }),

        // Analytics
        getPreferenceAnalytics: () => {
          const state = get();

          const usagePatterns = {
            mostUsedChannels: [...state.preferences.channels],
            preferredTiming: [...state.preferences.timing],
            topicDistribution: state.preferences.topics.reduce((acc, topic) => {
              acc[topic] = (acc[topic] || 0) + 1;
              return acc;
            }, {} as Record<FeedbackTopic, number>),
          };

          const effectiveness = {
            completionRate: state.userBehavior.completionRate,
            satisfactionAverage: state.userBehavior.satisfactionTrend.length > 0
              ? state.userBehavior.satisfactionTrend.reduce((sum, sat) => sum + sat, 0) / state.userBehavior.satisfactionTrend.length
              : 0,
            responseRate: state.totalInteractions > 0
              ? state.preferences.totalGiven / state.totalInteractions
              : 0,
            optimalFrequency: state.preferences.frequency,
          };

          const adaptiveInsights = {
            bestPerformingTimes: state.userBehavior.preferredTimes,
            userSegment: this.determineUserSegment(state),
            recommendations: this.generateRecommendations(state),
          };

          return {
            totalProfiles: state.profiles.length,
            activeProfile: state.activeProfile,
            preferenceChanges: state.totalInteractions,
            lastUpdated: state.lastInteraction,
            usagePatterns,
            effectiveness,
            adaptiveInsights,
          };
        },
      }),
      {
        name: 'feedback-preferences',
        partialize: (state) => ({
          preferences: state.preferences,
          activeProfile: state.activeProfile,
          profiles: state.profiles,
          schedules: state.schedules,
          activeSchedule: state.activeSchedule,
          rules: state.rules,
          privacySettings: state.privacySettings,
        }),
      }
    ),
    {
      name: 'feedback-preferences',
    }
  )
);

// Helper functions
function evaluateCondition(condition: string, context: Record<string, any>): boolean {
  try {
    // Simple condition evaluation - in production, use a safer expression evaluator
    const func = new Function('context', `return ${condition}`);
    return func(context);
  } catch {
    return false;
  }
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Extension functions for analytics
function determineUserSegment(state: PreferenceManagerState): string {
  if (state.preferences.frequency === 'frequent') return 'power_user';
  if (state.preferences.frequency === 'minimal') return 'minimalist';
  if (state.userBehavior.satisfactionTrend.length > 0) {
    const avgSatisfaction = state.userBehavior.satisfactionTrend.reduce((sum, sat) => sum + sat, 0) / state.userBehavior.satisfactionTrend.length;
    if (avgSatisfaction > 4) return 'satisfied_user';
    if (avgSatisfaction < 2) return 'at_risk_user';
  }
  return 'regular_user';
}

function generateRecommendations(state: PreferenceManagerState): string[] {
  const recommendations: string[] = [];

  if (state.userBehavior.satisfactionTrend.length >= 5) {
    const recentTrend = state.userBehavior.satisfactionTrend.slice(-3);
    const isDeclining = recentTrend.every((val, i) => i === 0 || val < recentTrend[i - 1]);

    if (isDeclining) {
      recommendations.push('Consider reducing feedback frequency to prevent fatigue');
    }
  }

  if (state.preferences.channels.length > 2) {
    recommendations.push('Consider simplifying feedback channels for better experience');
  }

  if (state.preferences.topics.length > 4) {
    recommendations.push('Focus feedback on 2-3 key topics for higher quality responses');
  }

  const completionRate = state.userBehavior.completionRate;
  if (completionRate < 0.5) {
    recommendations.push('Try shorter, more focused feedback forms to improve completion');
  }

  return recommendations;
}

// Export convenience functions
export const {
  setPreferences,
  loadProfile,
  saveProfile,
  deleteProfile,
  setActiveProfile,
  updateFrequency,
  updateChannels,
  updateTiming,
  updateTopics,
  optOut,
  optIn,
  setSchedule,
  createCustomSchedule,
  shouldShowFeedback,
  getNextAvailableTime,
  addRule,
  removeRule,
  updateRule,
  evaluateRules,
  recordInteraction,
  recordFeedback,
  updateAdaptivePreferences,
  updateConsent,
  updatePrivacySettings,
  exportData,
  importData,
  clearAllData,
  getPreferenceAnalytics,
} = useFeedbackPreferences.getState();

export default useFeedbackPreferences;
