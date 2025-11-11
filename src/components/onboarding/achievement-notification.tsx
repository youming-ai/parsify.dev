/**
 * Achievement Notification Component
 *
 * This component displays achievement notifications to users when they complete milestones
 * or unlock achievements within the application.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Trophy,
  Star,
  Compass,
  Zap,
  Shield,
  Target,
  Flame,
  Download,
  Share2,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'exploration' | 'usage' | 'expertise' | 'social' | 'learning' | 'productivity';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  points: number;
  icon: string;
  unlockedAt: Date;
  progress?: {
    current: number;
    total: number;
  };
}

interface AchievementNotificationProps {
  achievement: Achievement | null;
  isVisible: boolean;
  onClose: () => void;
  onShare?: (achievement: Achievement) => void;
  autoHide?: boolean;
  showConfetti?: boolean;
}

export const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  isVisible,
  onClose,
  onShare,
  autoHide = true,
  showConfetti = true
}) => {
  const [showConfettiEffect, setShowConfettiEffect] = useState(false);

  useEffect(() => {
    if (isVisible && achievement && showConfetti) {
      setShowConfettiEffect(true);
      const timer = setTimeout(() => {
        setShowConfettiEffect(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, achievement, showConfetti]);

  useEffect(() => {
    if (isVisible && autoHide) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoHide, onClose]);

  const getAchievementIcon = (category: string, rarity: string) => {
    switch (category) {
      case 'exploration':
        return <Compass className="w-8 h-8" />;
      case 'usage':
        return <Zap className="w-8 h-8" />;
      case 'expertise':
        return <Shield className="w-8 h-8" />;
      case 'social':
        return <Star className="w-8 h-8" />;
      case 'learning':
        return <Target className="w-8 h-8" />;
      case 'productivity':
        return <Flame className="w-8 h-8" />;
      default:
        return <Trophy className="w-8 h-8" />;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white border-yellow-500';
      case 'epic':
        return 'bg-gradient-to-br from-purple-400 to-pink-500 text-white border-purple-500';
      case 'rare':
        return 'bg-gradient-to-br from-blue-400 to-cyan-500 text-white border-blue-500';
      case 'uncommon':
        return 'bg-gradient-to-br from-green-400 to-emerald-500 text-white border-green-500';
      default:
        return 'bg-gradient-to-br from-gray-400 to-gray-500 text-white border-gray-500';
    }
  };

  const getPointsDisplay = (points: number) => {
    if (points >= 1000) {
      return `${(points / 1000).toFixed(1)}k`;
    }
    return points.toString();
  };

  const handleShare = () => {
    if (achievement && onShare) {
      onShare(achievement);
      toast.success('Achievement shared successfully!');
    }
  };

  const handleDownload = () => {
    if (!achievement) return;

    const badgeData = {
      title: achievement.title,
      description: achievement.description,
      category: achievement.category,
      rarity: achievement.rarity,
      points: achievement.points,
      unlockedAt: achievement.unlockedAt,
    };

    const blob = new Blob([JSON.stringify(badgeData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `achievement-${achievement.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Achievement badge downloaded!');
  };

  if (!achievement) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Confetti Effect */}
          <AnimatePresence>
            {showConfettiEffect && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 pointer-events-none z-[9998]"
              >
                {Array.from({ length: 50 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{
                      x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
                      y: -20,
                      rotate: Math.random() * 360
                    }}
                    animate={{
                      y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 20,
                      rotate: Math.random() * 720,
                      opacity: 0
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      delay: Math.random() * 0.5,
                      ease: 'easeIn'
                    }}
                    className="absolute w-2 h-2"
                    style={{
                      backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'][Math.floor(Math.random() * 6)],
                      borderRadius: Math.random() > 0.5 ? '50%' : '0%'
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Achievement Notification */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30
            }}
            className="fixed top-4 right-4 z-[9999] max-w-sm"
          >
            <Card className={`${getRarityColor(achievement.rarity)} border-2 shadow-2xl overflow-hidden`}>
              <CardContent className="p-0">
                <div className="relative">
                  {/* Achievement Icon and Title */}
                  <div className="flex items-center gap-3 p-4 bg-white/10 backdrop-blur-sm">
                    <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                      {getAchievementIcon(achievement.category, achievement.rarity)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-white">Achievement Unlocked!</h3>
                      <p className="text-sm opacity-90 text-white">{achievement.rarity.toUpperCase()}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        {getPointsDisplay(achievement.points)}
                      </div>
                      <p className="text-xs opacity-75">points</p>
                    </div>
                  </div>

                  {/* Achievement Details */}
                  <div className="p-4 bg-white text-gray-900">
                    <div className="text-center py-2">
                      <div className="text-3xl mb-2">{achievement.icon}</div>
                      <h4 className="font-bold text-xl mb-1">{achievement.title}</h4>
                      <p className="text-gray-600 text-sm leading-relaxed mb-3">
                        {achievement.description}
                      </p>

                      {/* Progress (if applicable) */}
                      {achievement.progress && (
                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>{achievement.progress.current}/{achievement.progress.total}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-500"
                              style={{
                                width: `${(achievement.progress.current / achievement.progress.total) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownload}
                          className="flex-1"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                        {onShare && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleShare}
                            className="flex-1"
                          >
                            <Share2 className="w-4 h-4 mr-1" />
                            Share
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onClose}
                          className="px-2"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AchievementNotification;
