/**
 * Fallback User Feedback Components
 * Components for collecting and displaying user feedback on fallback processing
 */

import React, { useState, useEffect } from 'react';
import {
	ThumbsUp,
	ThumbsDown,
	MessageSquare,
	Star,
	Send,
	X,
	AlertTriangle,
	Info,
	Lightbulb,
	Bug,
	CheckCircle,
	BarChart3,
	TrendingUp,
	User,
	Settings
} from 'lucide-react';
import {
	UserFeedback,
	UserRating,
	FeedbackType,
	QualityAssessment,
	qualityAssessmentEngine
} from '../../monitoring/fallback-quality-system';
import { FallbackResult } from '../../monitoring/fallback-processing-system';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { Progress } from '../ui/progress';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "../ui/tabs";

interface FallbackFeedbackCollectorProps {
	fallbackResult: FallbackResult;
	sessionId: string;
	onFeedbackSubmit?: (feedback: UserFeedback) => void;
	autoShow?: boolean;
	delay?: number;
	className?: string;
}

export const FallbackFeedbackCollector: React.FC<FallbackFeedbackCollectorProps> = ({
	fallbackResult,
	sessionId,
	onFeedbackSubmit,
	autoShow = false,
	delay = 3000,
	className = '',
}) => {
	const [isOpen, setIsOpen] = useState(autoShow);
	const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
	const [rating, setRating] = useState<UserRating>({
		overall: 0,
		quality: 0,
		usefulness: 0,
		satisfaction: 0,
		likelihoodToUse: 0,
	});
	const [comment, setComment] = useState('');
	const [feedbackType, setFeedbackType] = useState<FeedbackType>('explicit_rating');
	const [issues, setIssues] = useState<string[]>([]);
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (autoShow && delay > 0) {
			const timer = setTimeout(() => setIsOpen(true), delay);
			return () => clearTimeout(timer);
		}
	}, [autoShow, delay]);

	const handleSubmit = async () => {
		setIsSubmitting(true);

		try {
			const feedback: UserFeedback = {
				id: generateFeedbackId(),
				sessionId,
				timestamp: new Date(),
				fallbackResultId: fallbackResult.strategyUsed || 'unknown',
				rating,
				feedbackType,
				content: {
					rating: rating.overall,
					comment: comment || undefined,
					issues,
					suggestions,
					praise: [],
				},
				context: {
					toolUsed: fallbackResult.strategyUsed || 'unknown',
					operation: 'fallback_processing',
					fallbackStrategy: fallbackResult.strategyUsed,
					qualityPerceived: fallbackResult.quality,
					degradationNoticed: fallbackResult.degradationLevel !== 'none',
					workaroundUsed: false,
					sessionDuration: fallbackResult.processingTime,
					userExperience: getUserExperience(rating.overall),
				},
				sentiment: {
					score: calculateSentimentScore(rating.overall, comment),
					magnitude: calculateSentimentMagnitude(comment),
					emotions: [],
					keyPhrases: extractKeyPhrases(comment),
					entities: [],
				},
				followUpRequired: rating.overall <= 2,
			};

			await qualityAssessmentEngine.recordUserFeedback(feedback);
			onFeedbackSubmit?.(feedback);
			setFeedbackSubmitted(true);

			// Auto-close after successful submission
			setTimeout(() => setIsOpen(false), 2000);
		} catch (error) {
			console.error('Failed to submit feedback:', error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleQuickFeedback = (isPositive: boolean) => {
		setRating({
			overall: isPositive ? 5 : 1,
			quality: isPositive ? 5 : 1,
			usefulness: isPositive ? 5 : 1,
			satisfaction: isPositive ? 5 : 1,
			likelihoodToUse: isPositive ? 5 : 1,
		});
		setFeedbackType('automatic');
		handleSubmit();
	};

	if (feedbackSubmitted) {
		return (
			<Card className={`${className}`}>
				<CardContent className="pt-6">
					<div className="flex items-center justify-center space-x-2 text-green-600">
						<CheckCircle className="w-5 h-5" />
						<span>Thank you for your feedback!</span>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm" className={className}>
					<MessageSquare className="w-4 h-4 mr-2" />
					Feedback
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center space-x-2">
						<MessageSquare className="w-5 h-5" />
						<span>Fallback Processing Feedback</span>
						<Badge variant="secondary">{fallbackResult.quality}</Badge>
					</DialogTitle>
					<DialogDescription>
						Help us improve the fallback processing by sharing your experience
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					{/* Quick Feedback Options */}
					<div className="flex justify-center space-x-4">
						<Button
							variant="outline"
							onClick={() => handleQuickFeedback(true)}
							className="flex items-center space-x-2 hover:bg-green-50"
						>
							<ThumbsUp className="w-4 h-4 text-green-600" />
							<span>Worked Well</span>
						</Button>
						<Button
							variant="outline"
							onClick={() => handleQuickFeedback(false)}
							className="flex items-center space-x-2 hover:bg-red-50"
						>
							<ThumbsDown className="w-4 h-4 text-red-600" />
							<span>Had Issues</span>
						</Button>
					</div>

					<Separator />

					<Tabs defaultValue="rating" className="w-full">
						<TabsList className="grid w-full grid-cols-3">
							<TabsTrigger value="rating">Rating</TabsTrigger>
							<TabsTrigger value="detailed">Detailed</TabsTrigger>
							<TabsTrigger value="issues">Issues</TabsTrigger>
						</TabsList>

						<TabsContent value="rating" className="space-y-4">
							<RatingInput
								label="Overall Experience"
								value={rating.overall}
								onChange={(value) => setRating(prev => ({ ...prev, overall: value }))}
							/>
							<RatingInput
								label="Quality of Result"
								value={rating.quality}
								onChange={(value) => setRating(prev => ({ ...prev, quality: value }))}
							/>
							<RatingInput
								label="Usefulness"
								value={rating.usefulness}
								onChange={(value) => setRating(prev => ({ ...prev, usefulness: value }))}
							/>
							<RatingInput
								label="Satisfaction"
								value={rating.satisfaction}
								onChange={(value) => setRating(prev => ({ ...prev, satisfaction: value }))}
							/>
						</TabsContent>

						<TabsContent value="detailed" className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="feedback-type">Feedback Type</Label>
								<Select
									value={feedbackType}
									onValueChange={(value: FeedbackType) => setFeedbackType(value)}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="explicit_rating">Rating</SelectItem>
										<SelectItem value="comment">General Comment</SelectItem>
										<SelectItem value="bug_report">Bug Report</SelectItem>
										<SelectItem value="suggestion">Suggestion</SelectItem>
										<SelectItem value="complaint">Complaint</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="comment">Additional Comments</Label>
								<Textarea
									id="comment"
									placeholder="Tell us more about your experience..."
									value={comment}
									onChange={(e) => setComment(e.target.value)}
									rows={4}
								/>
							</div>
						</TabsContent>

						<TabsContent value="issues" className="space-y-4">
							<IssueSuggestionInput
								label="Issues Encountered"
								placeholder="What problems did you experience?"
								value={issues}
								onChange={setIssues}
								icon={<Bug className="w-4 h-4" />}
							/>
							<IssueSuggestionInput
								label="Suggestions for Improvement"
								placeholder="How could we make this better?"
								value={suggestions}
								onChange={setSuggestions}
								icon={<Lightbulb className="w-4 h-4" />}
							/>
						</TabsContent>
					</Tabs>

					<div className="flex justify-end space-x-2">
						<Button variant="outline" onClick={() => setIsOpen(false)}>
							Cancel
						</Button>
						<Button
							onClick={handleSubmit}
							disabled={isSubmitting || rating.overall === 0}
						>
							{isSubmitting ? (
								<>Submitting...</>
							) : (
								<>
									<Send className="w-4 h-4 mr-2" />
									Submit Feedback
								</>
							)}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

interface RatingInputProps {
	label: string;
	value: number;
	onChange: (value: number) => void;
}

const RatingInput: React.FC<RatingInputProps> = ({ label, value, onChange }) => {
	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<Label>{label}</Label>
				<span className="text-sm text-gray-500">{value}/5</span>
			</div>
			<div className="flex space-x-1">
				{[1, 2, 3, 4, 5].map((star) => (
					<button
						key={star}
						onClick={() => onChange(star)}
						className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
					>
						<Star
							className={`w-6 h-6 transition-colors ${
								star <= value
									? 'fill-yellow-400 text-yellow-400'
									: 'fill-gray-200 text-gray-300 hover:fill-gray-300'
							}`}
						/>
					</button>
				))}
			</div>
		</div>
	);
};

interface IssueSuggestionInputProps {
	label: string;
	placeholder: string;
	value: string[];
	onChange: (value: string[]) => void;
	icon?: React.ReactNode;
}

const IssueSuggestionInput: React.FC<IssueSuggestionInputProps> = ({
	label,
	placeholder,
	value,
	onChange,
	icon,
}) => {
	const [inputValue, setInputValue] = useState('');

	const addItem = () => {
		if (inputValue.trim()) {
			onChange([...value, inputValue.trim()]);
			setInputValue('');
		}
	};

	const removeItem = (index: number) => {
		onChange(value.filter((_, i) => i !== index));
	};

	return (
		<div className="space-y-2">
			<Label className="flex items-center space-x-2">
				{icon}
				<span>{label}</span>
			</Label>
			<div className="flex space-x-2">
				<Input
					placeholder={placeholder}
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
					onKeyPress={(e) => e.key === 'Enter' && addItem()}
				/>
				<Button onClick={addItem} variant="outline" size="sm">
					Add
				</Button>
			</div>
			{value.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{value.map((item, index) => (
						<Badge
							key={index}
							variant="secondary"
							className="flex items-center space-x-1"
						>
							<span>{item}</span>
							<button
								onClick={() => removeItem(index)}
								className="ml-1 hover:text-red-600"
							>
								<X className="w-3 h-3" />
							</button>
						</Badge>
					))}
				</div>
			)}
		</div>
	);
};

interface FallbackQualityDashboardProps {
	timeRange?: { start: Date; end: Date };
	className?: string;
}

export const FallbackQualityDashboard: React.FC<FallbackQualityDashboardProps> = ({
	timeRange,
	className = '',
}) => {
	const [metrics, setMetrics] = useState<any>(null);
	const [feedbackAnalysis, setFeedbackAnalysis] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadData = async () => {
			try {
				const qualityMetrics = qualityAssessmentEngine.getQualityMetrics(undefined, timeRange);
				const feedback = qualityAssessmentEngine.getFeedbackAnalysis(timeRange);

				setMetrics(qualityMetrics);
				setFeedbackAnalysis(feedback);
			} catch (error) {
				console.error('Failed to load quality dashboard data:', error);
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, [timeRange]);

	if (loading) {
		return (
			<Card className={className}>
				<CardContent className="pt-6">
					<div className="flex items-center justify-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className={`space-y-6 ${className}`}>
			{/* Overview Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<StatCard
					title="Average Quality"
					value={metrics?.averageQualityScore || 0}
					format="percentage"
					icon={<BarChart3 className="w-5 h-5" />}
					color="blue"
				/>
				<StatCard
					title="User Rating"
					value={feedbackAnalysis?.averageRating || 0}
					format="rating"
					icon={<Star className="w-5 h-5" />}
					color="yellow"
				/>
				<StatCard
					title="Total Assessments"
					value={metrics?.totalAssessments || 0}
					format="number"
					icon={<CheckCircle className="w-5 h-5" />}
					color="green"
				/>
				<StatCard
					title="Feedback Count"
					value={feedbackAnalysis?.totalFeedbacks || 0}
					format="number"
					icon={<User className="w-5 h-5" />}
					color="purple"
				/>
			</div>

			{/* Quality Distribution */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center space-x-2">
						<BarChart3 className="w-5 h-5" />
						<span>Quality Distribution</span>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{metrics?.qualityDistribution && Object.entries(metrics.qualityDistribution).map(([level, count]) => (
							<div key={level} className="flex items-center space-x-3">
								<span className="w-20 text-sm capitalize">{level}</span>
								<Progress
									value={(count / metrics.totalAssessments) * 100}
									className="flex-1"
								/>
								<span className="w-12 text-sm text-right">{count}</span>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Top Issues and Suggestions */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center space-x-2">
							<AlertTriangle className="w-5 h-5 text-red-600" />
							<span>Top Issues</span>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{metrics?.topIssues?.map((issue: string, index: number) => (
								<div key={index} className="flex items-center space-x-2">
									<span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs">
										{index + 1}
									</span>
									<span className="text-sm">{issue}</span>
								</div>
							)) || <div className="text-sm text-gray-500">No issues reported</div>}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center space-x-2">
							<Lightbulb className="w-5 h-5 text-yellow-600" />
							<span>User Suggestions</span>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{feedbackAnalysis?.commonSuggestions?.map((suggestion: string, index: number) => (
								<div key={index} className="flex items-center space-x-2">
									<span className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-xs">
										{index + 1}
									</span>
									<span className="text-sm">{suggestion}</span>
								</div>
							)) || <div className="text-sm text-gray-500">No suggestions available</div>}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Rating Distribution */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center space-x-2">
						<Star className="w-5 h-5" />
						<span>Rating Distribution</span>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{feedbackAnalysis?.ratingDistribution && Object.entries(feedbackAnalysis.ratingDistribution)
							.reverse()
							.map(([rating, count]) => (
								<div key={rating} className="flex items-center space-x-3">
									<div className="flex items-center space-x-1 w-16">
										<span className="text-sm">{rating}</span>
										<Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
									</div>
									<Progress
										value={(count / feedbackAnalysis.totalFeedbacks) * 100}
										className="flex-1"
									/>
									<span className="w-12 text-sm text-right">{count}</span>
								</div>
							))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

interface StatCardProps {
	title: string;
	value: number;
	format: 'percentage' | 'rating' | 'number';
	icon: React.ReactNode;
	color: 'blue' | 'green' | 'yellow' | 'purple';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, format, icon, color }) => {
	const formatValue = () => {
		switch (format) {
			case 'percentage':
				return `${Math.round(value)}%`;
			case 'rating':
				return `${value.toFixed(1)}/5.0`;
			case 'number':
				return value.toLocaleString();
			default:
				return value.toString();
		}
	};

	const getColorClasses = () => {
		switch (color) {
			case 'blue': return 'bg-blue-50 text-blue-600 border-blue-200';
			case 'green': return 'bg-green-50 text-green-600 border-green-200';
			case 'yellow': return 'bg-yellow-50 text-yellow-600 border-yellow-200';
			case 'purple': return 'bg-purple-50 text-purple-600 border-purple-200';
			default: return 'bg-gray-50 text-gray-600 border-gray-200';
		}
	};

	return (
		<Card>
			<CardContent className="pt-6">
				<div className="flex items-center space-x-3">
					<div className={`p-2 rounded-lg ${getColorClasses()}`}>
						{icon}
					</div>
					<div>
						<p className="text-sm font-medium text-gray-600">{title}</p>
						<p className="text-2xl font-bold">{formatValue()}</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

// Utility functions
const generateFeedbackId = (): string => {
	return `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const getUserExperience = (rating: number): UserFeedback['context']['userExperience'] => {
	if (rating >= 4.5) return 'delighted';
	if (rating >= 3.5) return 'satisfied';
	if (rating >= 2.5) return 'neutral';
	if (rating >= 1.5) return 'annoyed';
	return 'frustrated';
};

const calculateSentimentScore = (rating: number, comment: string): number => {
	// Simple sentiment calculation based on rating
	const baseScore = (rating - 3) / 2; // Convert 1-5 scale to -1 to 1

	// Adjust based on comment sentiment (simplified)
	const commentSentiment = comment.toLowerCase();
	let commentAdjustment = 0;

	const positiveWords = ['great', 'excellent', 'good', 'helpful', 'useful'];
	const negativeWords = ['bad', 'terrible', 'useless', 'frustrating', 'broken'];

	positiveWords.forEach(word => {
		if (commentSentiment.includes(word)) commentAdjustment += 0.1;
	});

	negativeWords.forEach(word => {
		if (commentSentiment.includes(word)) commentAdjustment -= 0.1;
	});

	return Math.max(-1, Math.min(1, baseScore + commentAdjustment));
};

const calculateSentimentMagnitude = (comment: string): number => {
	// Simple magnitude calculation based on comment length and exclamation marks
	const length = comment.length;
	const exclamationCount = (comment.match(/!/g) || []).length;

	return Math.min(1, (length / 200) + (exclamationCount * 0.1));
};

const extractKeyPhrases = (comment: string): string[] => {
	// Simple key phrase extraction (would use NLP in production)
	const words = comment.toLowerCase().split(/\s+/);
	const keywords = words.filter(word =>
		word.length > 4 &&
		!['the', 'and', 'but', 'for', 'with', 'that', 'this'].includes(word)
	);

	return keywords.slice(0, 5);
};
