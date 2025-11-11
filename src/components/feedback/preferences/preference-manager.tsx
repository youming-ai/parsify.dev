/**
 * Preference Manager Component
 * Allows users to manage their feedback preferences and settings
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Bell,
  Clock,
  MessageSquare,
  User,
  Shield,
  Calendar,
  BarChart3,
  Save,
  RotateCcw,
  Download,
  Upload
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFeedbackPreferences } from '@/lib/feedback/preferences/user-preferences';

interface PreferenceManagerProps {
  className?: string;
  onPreferenceChange?: (preferences: any) => void;
}

export function PreferenceManager({ className, onPreferenceChange }: PreferenceManagerProps) {
  const {
    preferences,
    profiles,
    activeProfile,
    schedules,
    activeSchedule,
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
    updatePrivacySettings,
    exportData,
    importData,
    clearAllData,
    getPreferenceAnalytics,
  } = useFeedbackPreferences();

  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDescription, setNewProfileDescription] = useState('');
  const [isCreatingSchedule, setIsCreatingSchedule] = useState(false);
  const [importDataText, setImportDataText] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);

  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  const handleSavePreferences = () => {
    setPreferences(localPreferences);
    onPreferenceChange?.(localPreferences);
  };

  const handleSaveProfile = () => {
    if (newProfileName.trim()) {
      saveProfile(newProfileName.trim(), newProfileDescription.trim());
      setNewProfileName('');
      setNewProfileDescription('');
      setIsCreatingProfile(false);
    }
  };

  const handleExportPreferences = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback-preferences-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportPreferences = () => {
    try {
      importData(importDataText);
      setImportDataText('');
      setShowImportDialog(false);
    } catch (error) {
      console.error('Failed to import preferences:', error);
    }
  };

  const frequencyOptions = [
    { value: 'never', label: 'Never', description: 'No feedback requests' },
    { value: 'minimal', label: 'Minimal', description: 'Only essential feedback' },
    { value: 'moderate', label: 'Moderate', description: 'Balanced feedback frequency' },
    { value: 'frequent', label: 'Frequent', description: 'Regular feedback requests' },
  ];

  const channelOptions = [
    { value: 'modal', label: 'Modal', description: 'Full-screen modal dialogs' },
    { value: 'inline', label: 'Inline', description: 'Embedded in page content' },
    { value: 'tooltip', label: 'Tooltip', description: 'Hover or click tooltips' },
    { value: 'toast', label: 'Toast', description: 'Notification toasts' },
    { value: 'email', label: 'Email', description: 'Email follow-ups' },
  ];

  const timingOptions = [
    { value: 'after_tool_use', label: 'After tool use', description: 'When you finish using a tool' },
    { value: 'on_error', label: 'On errors', description: 'When something goes wrong' },
    { value: 'on_session_end', label: 'Session end', description: 'When you\'re about to leave' },
    { value: 'periodic', label: 'Periodic', description: 'At regular intervals' },
    { value: 'on_feature_discovery', label: 'Feature discovery', description: 'When trying new features' },
  ];

  const topicOptions = [
    { value: 'satisfaction', label: 'Satisfaction', description: 'Overall experience ratings' },
    { value: 'bug_report', label: 'Bug reports', description: 'Report issues and problems' },
    { value: 'feature_request', label: 'Feature requests', description: 'Suggest new features' },
    { value: 'usability', label: 'Usability', description: 'Ease of use feedback' },
    { value: 'performance', label: 'Performance', description: 'Speed and responsiveness' },
    { value: 'documentation', label: 'Documentation', description: 'Help content quality' },
    { value: 'general', label: 'General', description: 'General feedback' },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Feedback Preferences
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your feedback collection settings and privacy preferences
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPreferences}
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImportDialog(true)}
          >
            <Upload className="h-4 w-4 mr-1" />
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllData}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="profiles">Profiles</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              General Settings
            </h3>

            {/* Enable/Disable */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <Label htmlFor="feedback-enabled">Enable Feedback Collection</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Allow the system to collect your feedback
                </p>
              </div>
              <Switch
                id="feedback-enabled"
                checked={localPreferences.enabled}
                onCheckedChange={(checked) =>
                  setLocalPreferences({ ...localPreferences, enabled: checked })
                }
              />
            </div>

            {/* Frequency */}
            <div className="mb-6">
              <Label htmlFor="frequency">Feedback Frequency</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                How often would you like to receive feedback requests?
              </p>
              <Select
                value={localPreferences.frequency}
                onValueChange={(value: any) =>
                  setLocalPreferences({ ...localPreferences, frequency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {frequencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-gray-500">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Channels */}
            <div className="mb-6">
              <Label>Feedback Channels</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                How would you like to receive feedback requests?
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {channelOptions.map((channel) => (
                  <div key={channel.value} className="flex items-center space-x-2">
                    <Switch
                      id={`channel-${channel.value}`}
                      checked={localPreferences.channels.includes(channel.value as any)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setLocalPreferences({
                            ...localPreferences,
                            channels: [...localPreferences.channels, channel.value as any]
                          });
                        } else {
                          setLocalPreferences({
                            ...localPreferences,
                            channels: localPreferences.channels.filter(c => c !== channel.value)
                          });
                        }
                      }}
                    />
                    <Label htmlFor={`channel-${channel.value}`} className="text-sm">
                      {channel.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Timing */}
            <div className="mb-6">
              <Label>Timing Preferences</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                When would you like to receive feedback requests?
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {timingOptions.map((timing) => (
                  <div key={timing.value} className="flex items-center space-x-2">
                    <Switch
                      id={`timing-${timing.value}`}
                      checked={localPreferences.timing.includes(timing.value as any)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setLocalPreferences({
                            ...localPreferences,
                            timing: [...localPreferences.timing, timing.value as any]
                          });
                        } else {
                          setLocalPreferences({
                            ...localPreferences,
                            timing: localPreferences.timing.filter(t => t !== timing.value)
                          });
                        }
                      }}
                    />
                    <Label htmlFor={`timing-${timing.value}`} className="text-sm">
                      {timing.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Topics */}
            <div className="mb-6">
              <Label>Feedback Topics</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                What types of feedback are you interested in providing?
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {topicOptions.map((topic) => (
                  <div key={topic.value} className="flex items-center space-x-2">
                    <Switch
                      id={`topic-${topic.value}`}
                      checked={localPreferences.topics.includes(topic.value as any)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setLocalPreferences({
                            ...localPreferences,
                            topics: [...localPreferences.topics, topic.value as any]
                          });
                        } else {
                          setLocalPreferences({
                            ...localPreferences,
                            topics: localPreferences.topics.filter(t => t !== topic.value)
                          });
                        }
                      }}
                    />
                    <Label htmlFor={`topic-${topic.value}`} className="text-sm">
                      {topic.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={handleSavePreferences}>
                <Save className="h-4 w-4 mr-1" />
                Save Preferences
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="profiles" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <User className="h-5 w-5 mr-2" />
                Preference Profiles
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreatingProfile(true)}
              >
                Create New Profile
              </Button>
            </div>

            {/* Current Profile */}
            <div className="mb-6">
              <Label>Current Profile</Label>
              <Select
                value={activeProfile}
                onValueChange={setActiveProfile}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      <div>
                        <div className="font-medium">{profile.name}</div>
                        <div className="text-sm text-gray-500">{profile.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Profile List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profiles.map((profile) => (
                <Card
                  key={profile.id}
                  className={`p-4 ${activeProfile === profile.id ? 'border-blue-500' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{profile.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {profile.description}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge variant={profile.isBuiltIn ? 'secondary' : 'outline'}>
                          {profile.isBuiltIn ? 'Built-in' : 'Custom'}
                        </Badge>
                        {profile.isDefault && (
                          <Badge variant="outline">Default</Badge>
                        )}
                      </div>
                    </div>
                    {!profile.isBuiltIn && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteProfile(profile.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Create New Profile Dialog */}
            {isCreatingProfile && (
              <Card className="p-6 mt-4 border-blue-500">
                <h4 className="font-medium mb-4">Create New Profile</h4>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="profile-name">Profile Name</Label>
                    <Input
                      id="profile-name"
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      placeholder="Enter profile name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="profile-description">Description</Label>
                    <Textarea
                      id="profile-description"
                      value={newProfileDescription}
                      onChange={(e) => setNewProfileDescription(e.target.value)}
                      placeholder="Enter profile description"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCreatingProfile(false);
                        setNewProfileName('');
                        setNewProfileDescription('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSaveProfile}>
                      Create Profile
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="scheduling" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Scheduling Preferences
            </h3>

            {/* Schedule Selection */}
            <div className="mb-6">
              <Label htmlFor="schedule">Active Schedule</Label>
              <Select
                value={activeSchedule}
                onValueChange={setSchedule}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {schedules.map((schedule) => (
                    <SelectItem key={schedule.id} value={schedule.id}>
                      <div>
                        <div className="font-medium">{schedule.name}</div>
                        <div className="text-sm text-gray-500">
                          {schedule.frequency} • {schedule.maxPerDay} per day
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Next Available Time */}
            <div className="mb-6">
              <Label>Next Available Feedback Time</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {getNextAvailableTime()
                  ? `Available around ${getNextAvailableTime()?.toLocaleString()}`
                  : 'No scheduled feedback times'
                }
              </p>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={() => setLocalPreferences({ ...localPreferences, frequency: 'minimal' })}
                className="w-full justify-start"
              >
                <Bell className="h-4 w-4 mr-2" />
                Reduce Frequency (Minimal)
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocalPreferences({ ...localPreferences, frequency: 'moderate' })}
                className="w-full justify-start"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Balance Frequency (Moderate)
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocalPreferences({ ...localPreferences, frequency: 'frequent' })}
                className="w-full justify-start"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Increase Frequency (Frequent)
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Privacy Settings
            </h3>

            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={optIn}
                  disabled={!localPreferences.optedOut}
                >
                  Opt In to Feedback
                </Button>
                <Button
                  variant="outline"
                  onClick={optOut}
                  disabled={localPreferences.optedOut}
                  className="text-red-600 hover:text-red-700"
                >
                  Opt Out of Feedback
                </Button>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <Label className="font-medium">Current Status</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {localPreferences.optedOut
                      ? 'You have opted out of feedback collection'
                      : 'You are participating in feedback collection'
                    }
                  </p>
                </div>
                <Badge variant={localPreferences.optedOut ? 'destructive' : 'default'}>
                  {localPreferences.optedOut ? 'Opted Out' : 'Active'}
                </Badge>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Your Feedback Analytics
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Stats */}
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Feedback Given:</span>
                  <span className="font-medium">{localPreferences.totalGiven}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Interaction:</span>
                  <span className="font-medium">
                    {localPreferences.lastInteraction.toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Preferred Channels:</span>
                  <div className="flex flex-wrap gap-1">
                    {localPreferences.channels.map((channel) => (
                      <Badge key={channel} variant="outline" className="text-xs">
                        {channel}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Preferred Topics:</span>
                  <div className="flex flex-wrap gap-1">
                    {localPreferences.topics.map((topic) => (
                      <Badge key={topic} variant="outline" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Insights */}
              <div className="space-y-4">
                <h4 className="font-medium">Your Feedback Profile</h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <p>
                    <strong>Frequency:</strong> {localPreferences.frequency}
                  </p>
                  <p>
                    <strong>Participation Level:</strong> {
                      localPreferences.totalGiven > 10 ? 'Active' :
                      localPreferences.totalGiven > 5 ? 'Moderate' :
                      localPreferences.totalGiven > 0 ? 'Light' : 'New'
                    }
                  </p>
                  <p>
                    <strong>Preferred Times:</strong> Based on your interactions
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Import Preferences</h3>
            <Textarea
              value={importDataText}
              onChange={(e) => setImportDataText(e.target.value)}
              placeholder="Paste your exported preferences JSON here..."
              rows={10}
              className="mb-4"
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowImportDialog(false);
                  setImportDataText('');
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleImportPreferences}>
                Import
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default PreferenceManager;
