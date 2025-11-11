'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
	ChevronRight,
	ChevronLeft,
	X,
	Sparkles,
	Target,
	Zap,
	Shield,
	Rocket,
	BookOpen,
	Compass
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';
import { ToolRecommendationList } from './tool-recommendation-list';
import { CategoryExplorer } from './category-explorer';
import { AchievementNotification } from './achievement-notification';
import type { OnboardingStep, UserRole, ExperienceLevel, WorkflowPreference } from '@/types/onboarding';
import { toolsData } from '@/data/tools-data';

interface OnboardingFlowProps {
	isOpen: boolean;
	onComplete: () => void;
	onSkip: () => void;
}

export function OnboardingFlow({ isOpen, onComplete, onSkip }: OnboardingFlowProps) {
	const {
		state,
		steps,
		completeStep,
		skipStep,
		goToStep,
		updatePreferences,
		generateRecommendations,
		exploreCategory,
		unlockAchievement
	} = useOnboardingStore();

	const [currentStepIndex, setCurrentStepIndex] = useState(0);
	const [selectedRole, setSelectedRole] = useState<UserRole>('other');
	const [selectedExperience, setSelectedExperience] = useState<ExperienceLevel>('intermediate');
	const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowPreference>('quick-tasks');
	const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
	const [exploredCategories, setExploredCategories] = useState<Set<string>>(new Set());
	const [firstToolUsed, setFirstToolUsed] = useState(false);

	const currentStep = steps[currentStepIndex];
	const progress = state?.progress.percentage || 0;

	// Initialize step index from store
	useEffect(() => {
		if (state?.currentStep) {
			const index = steps.findIndex(step => step.id === state.currentStep.id);
			if (index !== -1) {
				setCurrentStepIndex(index);
			}
		}
	}, [state?.currentStep, steps]);

	const handleNext = () => {
		if (currentStepIndex < steps.length - 1) {
			const nextIndex = currentStepIndex + 1;
			setCurrentStepIndex(nextIndex);
			completeStep(currentStep.id);
			goToStep(steps[nextIndex].id);
		} else {
			handleComplete();
		}
	};

	const handlePrevious = () => {
		if (currentStepIndex > 0) {
			const prevIndex = currentStepIndex - 1;
			setCurrentStepIndex(prevIndex);
			goToStep(steps[prevIndex].id);
		}
	};

	const handleSkip = () => {
		skipStep(currentStep.id, 'user_skipped');
		onSkip();
	};

	const handleComplete = () => {
		// Generate recommendations based on collected preferences
		if (state?.preferences) {
			generateRecommendations(state.preferences);
		}

		// Unlock first achievement
		unlockAchievement('first_steps');

		// Complete final step
		completeStep(currentStep.id);
		onComplete();
	};

	const handleRoleSelection = (role: UserRole) => {
		setSelectedRole(role);
		updatePreferences({ role });
	};

	const handleExperienceSelection = (experience: ExperienceLevel) => {
		setSelectedExperience(experience);
		updatePreferences({ experienceLevel: experience });
	};

	const handleWorkflowSelection = (workflow: WorkflowPreference) => {
		setSelectedWorkflow(workflow);
		updatePreferences({ workflowPreference: workflow });
	};

	const handleInterestToggle = (interest: string, checked: boolean) => {
		const updatedInterests = checked
			? [...selectedInterests, interest]
			: selectedInterests.filter(i => i !== interest);

		setSelectedInterests(updatedInterests);
		updatePreferences({ interests: updatedInterests });
	};

	const handleCategoryExplore = (category: string) => {
		const newExplored = new Set(exploredCategories).add(category);
		setExploredCategories(newExplored);
		exploreCategory(category as any);

		// Auto-advance if 3+ categories explored
		if (newExplored.size >= 3) {
			setTimeout(handleNext, 1000);
		}
	};

	const handleToolUsed = () => {
		setFirstToolUsed(true);
		setTimeout(handleNext, 1000);
	};

	const renderStepContent = () => {
		switch (currentStep.id) {
			case 'welcome':
				return <WelcomeStep />;

			case 'role-selection':
				return (
					<RoleSelectionStep
						selectedRole={selectedRole}
						selectedExperience={selectedExperience}
						selectedWorkflow={selectedWorkflow}
						selectedInterests={selectedInterests}
						onRoleChange={handleRoleSelection}
						onExperienceChange={handleExperienceSelection}
						onWorkflowChange={handleWorkflowSelection}
						onInterestToggle={handleInterestToggle}
					/>
				);

			case 'category-exploration':
				return (
					<CategoryExplorer
						onCategoryExplore={handleCategoryExplore}
						exploredCategories={Array.from(exploredCategories)}
						targetCount={3}
					/>
				);

			case 'first-tool':
				return (
					<FirstToolStep
						onToolUsed={handleToolUsed}
						toolUsed={firstToolUsed}
					/>
				);

			case 'recommendations':
				return (
					<RecommendationsStep
						recommendations={state?.recommendations || []}
					/>
				);

			case 'completion':
				return <CompletionStep progress={progress} />;

			default:
				return <div>Step content not found</div>;
		}
	};

	if (!isOpen) return null;

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className=\"fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50\"
			>
				<motion.div
					initial={{ scale: 0.9, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					exit={{ scale: 0.9, opacity: 0 }}
					className=\"bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col\"
				>
					{/* Header */}
					<div className=\"flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700\">
						<div className=\"flex items-center gap-3\">
							{getStepIcon(currentStep.type)}
							<div>
								<h2 className=\"text-xl font-semibold text-gray-900 dark:text-white\">
									{currentStep.title}
								</h2>
								<p className=\"text-sm text-gray-600 dark:text-gray-400 mt-1\">
									Step {currentStepIndex + 1} of {steps.length} • {currentStep.estimatedTime} min
								</p>
							</div>
						</div>
						<div className=\"flex items-center gap-2\">
							<Button
								variant=\"ghost\"
								size=\"sm\"
								onClick={handleSkip}
								disabled={!currentStep.isSkippable}
							>
								Skip
							</Button>
							<Button
								variant=\"ghost\"
								size=\"sm\"
								onClick={onSkip}
							>
								<X className=\"w-4 h-4\" />
							</Button>
						</div>
					</div>

					{/* Progress Bar */}
					<div className=\"px-6 py-3 border-b border-gray-200 dark:border-gray-700\">
						<Progress value={progress} className=\"h-2\" />
					</div>

					{/* Content */}
					<div className=\"flex-1 overflow-y-auto p-6\">
						<AnimatePresence mode=\"wait\">
							<motion.div
								key={currentStep.id}
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								transition={{ duration: 0.3 }}
							>
								{renderStepContent()}
							</motion.div>
						</AnimatePresence>
					</div>

					{/* Footer */}
					<div className=\"flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700\">
						<Button
							variant=\"outline\"
							onClick={handlePrevious}
							disabled={currentStepIndex === 0}
						>
							<ChevronLeft className=\"w-4 h-4 mr-2\" />
							Previous
						</Button>

						<div className=\"flex gap-2\">
							{canProceed() && (
								<Button onClick={handleNext}>
									{currentStepIndex === steps.length - 1 ? 'Complete' : 'Next'}
									<ChevronRight className=\"w-4 h-4 ml-2\" />
								</Button>
							)}
						</div>
					</div>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);

	function getStepIcon(type: string) {
		switch (type) {
			case 'welcome':
				return <Rocket className=\"w-6 h-6 text-blue-500\" />;
			case 'tutorial':
				return <BookOpen className=\"w-6 h-6 text-green-500\" />;
			case 'exploration':
				return <Compass className=\"w-6 h-6 text-purple-500\" />;
			case 'interaction':
				return <Target className=\"w-6 h-6 text-orange-500\" />;
			case 'recommendation':
				return <Sparkles className=\"w-6 h-6 text-pink-500\" />;
			case 'achievement':
				return <Shield className=\"w-6 h-6 text-yellow-500\" />;
			default:
				return <Zap className=\"w-6 h-6 text-gray-500\" />;
		}
	}

	function canProceed() {
		switch (currentStep.id) {
			case 'role-selection':
				return selectedRole !== 'other';
			case 'category-exploration':
				return exploredCategories.size >= 3;
			case 'first-tool':
				return firstToolUsed;
			default:
				return true;
		}
	}
}

// Step Components
function WelcomeStep() {
	return (
		<div className=\"text-center space-y-6 max-w-2xl mx-auto\">
			<motion.div
				initial={{ scale: 0 }}
				animate={{ scale: 1 }}
				transition={{ type: 'spring', stiffness: 200, damping: 20 }}
				className=\"w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto\"
			>
				<Rocket className=\"w-10 h-10 text-white\" />
			</motion.div>

			<div className=\"space-y-4\">
				<h1 className=\"text-3xl font-bold text-gray-900 dark:text-white\">
					Welcome to Parsify.dev
				</h1>
				<p className=\"text-lg text-gray-600 dark:text-gray-400 leading-relaxed\">
					Discover 58+ powerful developer tools designed to make your work easier and more productive.
					All tools run securely in your browser with no server-side processing.
				</p>
			</div>

			<div className=\"grid grid-cols-2 md:grid-cols-3 gap-4 mt-8\">
				{[
					{ label: 'Total Tools', value: '58+', icon: '🔧' },
					{ label: 'Categories', value: '6', icon: '📁' },
					{ label: 'Client-side', value: '100%', icon: '🔒' }
				].map((stat, index) => (
					<motion.div
						key={index}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.1 }}
						className=\"bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center\"
					>
						<div className=\"text-2xl mb-2\">{stat.icon}</div>
						<div className=\"text-2xl font-bold text-gray-900 dark:text-white\">{stat.value}</div>
						<div className=\"text-sm text-gray-600 dark:text-gray-400\">{stat.label}</div>
					</motion.div>
				))}
			</div>

			<div className=\"bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-8\">
				<h3 className=\"font-semibold text-blue-900 dark:text-blue-100 mb-2\">What to expect:</h3>
				<ul className=\"text-sm text-blue-700 dark:text-blue-300 space-y-1 text-left max-w-md mx-auto\">
					<li>• Personalized tool recommendations based on your needs</li>
					<li>• Guided tour of key platform features</li>
					<li>• Hands-on experience with popular tools</li>
					<li>• Achievement system to track your progress</li>
				</ul>
			</div>
		</div>
	);
}

interface RoleSelectionStepProps {
	selectedRole: UserRole;
	selectedExperience: ExperienceLevel;
	selectedWorkflow: WorkflowPreference;
	selectedInterests: string[];
	onRoleChange: (role: UserRole) => void;
	onExperienceChange: (experience: ExperienceLevel) => void;
	onWorkflowChange: (workflow: WorkflowPreference) => void;
	onInterestToggle: (interest: string, checked: boolean) => void;
}

function RoleSelectionStep({
	selectedRole,
	selectedExperience,
	selectedWorkflow,
	selectedInterests,
	onRoleChange,
	onExperienceChange,
	onWorkflowChange,
	onInterestToggle
}: RoleSelectionStepProps) {
	const roles: { value: UserRole; label: string; description: string }[] = [
		{
			value: 'frontend-developer',
			label: 'Frontend Developer',
			description: 'Building user interfaces and experiences'
		},
		{
			value: 'backend-developer',
			label: 'Backend Developer',
			description: 'Server-side development and APIs'
		},
		{
			value: 'fullstack-developer',
			label: 'Full-Stack Developer',
			description: 'Working across the entire stack'
		},
		{
			value: 'devops-engineer',
			label: 'DevOps Engineer',
			description: 'Infrastructure and deployment'
		},
		{
			value: 'qa-engineer',
			label: 'QA Engineer',
			description: 'Testing and quality assurance'
		},
		{
			value: 'data-scientist',
			label: 'Data Scientist',
			description: 'Data analysis and machine learning'
		},
		{
			value: 'student',
			label: 'Student',
			description: 'Learning programming and development'
		},
		{
			value: 'hobbyist',
			label: 'Hobbyist',
			description: 'Coding for fun and personal projects'
		}
	];

	const interests = [
		'JSON Processing', 'Code Analysis', 'Security', 'API Testing',
		'Text Processing', 'File Conversion', 'Data Validation', 'Network Tools'
	];

	return (
		<div className=\"space-y-8 max-w-3xl mx-auto\">
			<div className=\"text-center mb-8\">
				<h2 className=\"text-2xl font-bold text-gray-900 dark:text-white mb-4\">
					Tell Us About Yourself
				</h2>
				<p className=\"text-gray-600 dark:text-gray-400\">
					This helps us personalize your experience and recommend the most relevant tools.
				</p>
			</div>

			{/* Role Selection */}
			<div className=\"space-y-4\">
				<Label className=\"text-base font-semibold\">What's your primary role?</Label>
				<RadioGroup value={selectedRole} onValueChange={onRoleChange}>
					<div className=\"grid grid-cols-1 md:grid-cols-2 gap-3\">
						{roles.map((role) => (
							<div key={role.value} className=\"flex items-center space-x-2\">
								<RadioGroupItem value={role.value} id={role.value} />
								<Label htmlFor={role.value} className=\"flex-1 cursor-pointer\">
									<div className=\"font-medium\">{role.label}</div>
									<div className=\"text-sm text-gray-500\">{role.description}</div>
								</Label>
							</div>
						))}
					</div>
				</RadioGroup>
			</div>

			{/* Experience Level */}
			<div className=\"space-y-4\">
				<Label className=\"text-base font-semibold\">Experience Level</Label>
				<Select value={selectedExperience} onValueChange={onExperienceChange}>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value=\"beginner\">Beginner - Just starting out</SelectItem>
						<SelectItem value=\"intermediate\">Intermediate - Some experience</SelectItem>
						<SelectItem value=\"advanced\">Advanced - Experienced developer</SelectItem>
						<SelectItem value=\"expert\">Expert - Senior/Lead level</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Workflow Preference */}
			<div className=\"space-y-4\">
				<Label className=\"text-base font-semibold\">Preferred Workflow</Label>
				<RadioGroup value={selectedWorkflow} onValueChange={onWorkflowChange}>
					<div className=\"space-y-3\">
						{[
							{ value: 'quick-tasks', label: 'Quick Tasks', description: 'Fast, simple tool usage' },
							{ value: 'detailed-analysis', label: 'Detailed Analysis', description: 'In-depth processing and reporting' },
							{ value: 'batch-processing', label: 'Batch Processing', description: 'Working with multiple files at once' },
							{ value: 'learning-exploration', label: 'Learning & Exploration', description: 'Discovering new tools and features' }
						].map((workflow) => (
							<div key={workflow.value} className=\"flex items-center space-x-2\">
								<RadioGroupItem value={workflow.value} id={workflow.value} />
								<Label htmlFor={workflow.value} className=\"flex-1 cursor-pointer\">
									<div className=\"font-medium\">{workflow.label}</div>
									<div className=\"text-sm text-gray-500\">{workflow.description}</div>
								</Label>
							</div>
						))}
					</div>
				</RadioGroup>
			</div>

			{/* Interests */}
			<div className=\"space-y-4\">
				<Label className=\"text-base font-semibold\">Areas of Interest (Optional)</Label>
				<div className=\"grid grid-cols-2 md:grid-cols-3 gap-3\">
					{interests.map((interest) => (
						<div key={interest} className=\"flex items-center space-x-2\">
							<Checkbox
								id={interest}
								checked={selectedInterests.includes(interest)}
								onCheckedChange={(checked) => onInterestToggle(interest, checked as boolean)}
							/>
							<Label htmlFor={interest} className=\"cursor-pointer text-sm\">
								{interest}
							</Label>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

interface FirstToolStepProps {
	onToolUsed: () => void;
	toolUsed: boolean;
}

function FirstToolStep({ onToolUsed, toolUsed }: FirstToolStepProps) {
	const popularTools = toolsData.filter(tool => tool.isPopular).slice(0, 4);

	return (
		<div className=\"space-y-6 max-w-4xl mx-auto\">
			<div className=\"text-center mb-8\">
				<h2 className=\"text-2xl font-bold text-gray-900 dark:text-white mb-4\">
					Try Your First Tool
				</h2>
				<p className=\"text-gray-600 dark:text-gray-400\">
					Select one of our popular tools below to try it out. We'll guide you through the basics.
				</p>
			</div>

			{toolUsed ? (
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					className=\"text-center py-12\"
				>
					<div className=\"w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4\">
						✅
					</div>
					<h3 className=\"text-xl font-semibold text-green-700 dark:text-green-300 mb-2\">
						Great Job!
					</h3>
					<p className=\"text-gray-600 dark:text-gray-400\">
						You've successfully tried your first tool. Click Next to continue.
					</p>
				</motion.div>
			) : (
				<div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
					{popularTools.map((tool, index) => (
						<motion.div
							key={tool.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1 }}
						>
							<Card className=\"cursor-pointer hover:shadow-lg transition-shadow group\"
								onClick={() => {
									// Simulate opening the tool
									onToolUsed();
								}}
							>
								<CardHeader>
									<CardTitle className=\"flex items-center gap-2\">
										<span className=\"text-2xl\">{tool.icon}</span>
										{tool.name}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className=\"text-sm text-gray-600 dark:text-gray-400 mb-3\">
										{tool.description}
									</p>
									<div className=\"flex flex-wrap gap-1 mb-3\">
										{tool.tags.slice(0, 3).map((tag) => (
											<Badge key={tag} variant=\"secondary\" className=\"text-xs\">
												{tag}
											</Badge>
										))}
									</div>
									<Button variant=\"outline\" size=\"sm\" className=\"w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors\">
										Try This Tool
									</Button>
								</CardContent>
							</Card>
						</motion.div>
					))}
				</div>
			)}
		</div>
	);
}

interface RecommendationsStepProps {
	recommendations: any[];
}

function RecommendationsStep({ recommendations }: RecommendationsStepProps) {
	return (
		<div className=\"space-y-6 max-w-4xl mx-auto\">
			<div className=\"text-center mb-8\">
				<h2 className=\"text-2xl font-bold text-gray-900 dark:text-white mb-4\">
					Your Personalized Recommendations
				</h2>
				<p className=\"text-gray-600 dark:text-gray-400\">
					Based on your profile, here are tools we think you'll find most useful.
				</p>
			</div>

			{recommendations.length > 0 ? (
				<ToolRecommendationList recommendations={recommendations} />
			) : (
				<div className=\"text-center py-12\">
					<div className=\"w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4\">
						🔍
					</div>
					<h3 className=\"text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2\">
						No Recommendations Yet
					</h3>
					<p className=\"text-gray-600 dark:text-gray-400\">
						Complete the previous steps to get personalized recommendations.
					</p>
				</div>
			)}
		</div>
	);
}

interface CompletionStepProps {
	progress: number;
}

function CompletionStep({ progress }: CompletionStepProps) {
	return (
		<div className=\"text-center space-y-6 max-w-2xl mx-auto\">
			<motion.div
				initial={{ scale: 0 }}
				animate={{ scale: 1 }}
				transition={{ type: 'spring\", stiffness: 200, damping: 20 }}
				className=\"w-24 h-24 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto\"
			>
				<Shield className=\"w-12 h-12 text-white\" />
			</motion.div>

			<div className=\"space-y-4\">
				<h1 className=\"text-3xl font-bold text-gray-900 dark:text-white\">
					You're All Set! 🎉
				</h1>
				<p className=\"text-lg text-gray-600 dark:text-gray-400 leading-relaxed\">
					Congratulations! You've completed the onboarding and are ready to make your development workflow more efficient.
				</p>
			</div>

			<div className=\"grid grid-cols-1 md:grid-cols-3 gap-4 my-8\">
				{[
					{ label: 'Onboarding Complete', value: `${progress}%`, icon: '✅' },
					{ label: 'Achievements Earned', value: '1', icon: '🏆' },
					{ label: 'Tools Available', value: '58+', icon: '🔧' }
				].map((stat, index) => (
					<motion.div
						key={index}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.1 }}
						className=\"bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center\"
					>
						<div className=\"text-2xl mb-2\">{stat.icon}</div>
						<div className=\"text-2xl font-bold text-gray-900 dark:text-white\">{stat.value}</div>
						<div className=\"text-sm text-gray-600 dark:text-gray-400\">{stat.label}</div>
					</motion.div>
				))}
			</div>

			<div className=\"bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-left\">
				<h3 className=\"font-semibold text-green-900 dark:text-green-100 mb-3\">What's next?</h3>
				<ul className=\"text-sm text-green-700 dark:text-green-300 space-y-2\">
					<li>• Check your achievements page for badges you've earned</li>
					<li>• Use the search bar to quickly find specific tools</li>
					<li>• Bookmark your favorite tools for easy access</li>
					<li>• Explore tool categories to discover new functionality</li>
					<li>• Enable notifications to stay updated on new features</li>
				</ul>
			</div>

			<div className=\"text-sm text-gray-500 dark:text-gray-400\">
				<p>Remember: All your data is processed locally in your browser for maximum privacy and security.</p>
			</div>
		</div>
	);
}
