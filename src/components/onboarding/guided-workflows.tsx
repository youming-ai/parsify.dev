'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
	Play,
	BookOpen,
	HelpCircle,
	Search,
	Lightbulb,
	MessageSquare,
	Terminal,
	FileText,
	Database,
	Globe,
	Shield,
	Type,
	Zap,
	ArrowRight,
	ExternalLink,
	Bookmark,
	Plus,
	X,
	CheckCircle,
	Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';
import { TutorialOverlay, useTutorial } from './tutorial-overlay';
import type { QuickStartGuide, Tutorial as TutorialType, ContextualHelp } from '@/types/onboarding';

interface GuidedWorkflowsProps {
	className?: string;
}

// Mock data for quick start guides
const quickStartGuides: QuickStartGuide[] = [
	{
		id: 'json-basics',
		title: 'JSON Processing Basics',
		description: 'Learn the fundamentals of working with JSON data',
		category: 'JSON Processing',
		steps: [
			{
				id: 'format-json',
				title: 'Format Your First JSON',
				description: 'Paste messy JSON and format it beautifully',
				action: 'Open JSON Formatter and paste your JSON data',
				expectedResult: 'Cleanly formatted JSON with proper indentation',
				toolId: 'json-formatter'
			},
			{
				id: 'validate-json',
				title: 'Validate JSON Structure',
				description: 'Check if your JSON is valid and find errors',
				action: 'Use JSON Validator to check syntax',
				expectedResult: 'Confirmation that your JSON is valid or error details',
				toolId: 'json-validator'
			},
			{
				id: 'convert-json',
				title: 'Convert JSON to Other Formats',
				description: 'Transform JSON into CSV, XML, or YAML',
				action: 'Use JSON Converter to change format',
				expectedResult: 'Your data in the desired format',
				toolId: 'json-converter'
			}
		],
		estimatedTime: 10,
		difficulty: 'beginner',
		tags: ['json', 'formatting', 'validation', 'conversion'],
		isPopular: true
	},
	{
		id: 'code-analysis',
		title: 'Code Analysis & Optimization',
		description: 'Analyze and optimize your code for better performance',
		category: 'Code Processing',
		steps: [
			{
				id: 'format-code',
				title: 'Format Your Code',
				description: 'Apply consistent formatting to your code',
				action: 'Open Code Formatter and paste your code',
				expectedResult: 'Consistently formatted code',
				toolId: 'code-formatter'
			},
			{
				id: 'minify-code',
				title: 'Minify for Production',
				description: 'Reduce file size by minifying your code',
				action: 'Use Code Minifier to compress your code',
				expectedResult: 'Smaller file size for faster loading',
				toolId: 'code-minifier'
			},
			{
				id: 'compare-code',
				title: 'Compare Code Changes',
				description: 'See differences between code versions',
				action: 'Use Code Comparator to compare two code snippets',
				expectedResult: 'Highlighted differences and changes',
				toolId: 'code-comparator'
			}
		],
		estimatedTime: 15,
		difficulty: 'intermediate',
		tags: ['code', 'formatting', 'minification', 'comparison'],
		isPopular: true
	},
	{
		id: 'security-essentials',
		title: 'Security Essentials',
		description: 'Essential security tools for developers',
		category: 'Security & Encryption',
		steps: [
			{
				id: 'generate-hash',
				title: 'Generate File Hashes',
				description: 'Create checksums for file integrity verification',
				action: 'Use Hash Generator to create file hashes',
				expectedResult: 'MD5, SHA-256, and other hash values',
				toolId: 'hash-generator'
			},
			{
				id: 'create-password',
				title: 'Generate Strong Passwords',
				description: 'Create secure passwords for your applications',
				action: 'Use Password Generator with custom criteria',
				expectedResult: 'Strong, random passwords',
				toolId: 'password-generator'
			},
			{
				id: 'encrypt-files',
				title: 'Encrypt Sensitive Files',
				description: 'Protect your sensitive data with encryption',
				action: 'Use File Encryptor to secure your files',
				expectedResult: 'Encrypted files that only you can access',
				toolId: 'file-encryptor'
			}
		],
		estimatedTime: 20,
		difficulty: 'intermediate',
		tags: ['security', 'encryption', 'hashing', 'passwords'],
		isPopular: false
	}
];

// Mock tutorials
const tutorials: TutorialType[] = [
	{
		id: 'platform-overview',
		name: 'Platform Overview',
		description: 'Get familiar with Parsify.dev interface and features',
		steps: [
			{
				id: 'interface-tour',
				title: 'Interface Tour',
				content: 'Let\'s explore the main interface elements',
				type: 'instruction',
				elementSelector: '[data-testid=\"main-layout\"]'
			},
			{
				id: 'search-usage',
				title: 'Using Search',
				content: 'Learn how to quickly find tools using the search bar',
				type: 'interaction',
				elementSelector: '[data-testid=\"search-input\"]',
				interactionType: 'click',
				expectedAction: 'Click the search input'
			}
		],
		category: 'general',
		difficulty: 'beginner',
		duration: 5,
		isInteractive: true
	}
];

export function GuidedWorkflows({ className }: GuidedWorkflowsProps) {
	const [activeTab, setActiveTab] = useState('guides');
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedGuide, setSelectedGuide] = useState<QuickStartGuide | null>(null);
	const [currentStep, setCurrentStep] = useState(0);
	const [showTutorial, setShowTutorial] = useState(false);
	const [selectedTutorial, setSelectedTutorial] = useState<TutorialType | null>(null);

	const { markToolUsed, trackEvent } = useOnboardingStore();
	const tutorial = useTutorial(selectedTutorial?.id || '');

	const filteredGuides = quickStartGuides.filter(guide =>
		guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
		guide.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
		guide.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
	);

	const handleStartGuide = (guide: QuickStartGuide) => {
		setSelectedGuide(guide);
		setCurrentStep(0);
		trackEvent({
			type: 'step_started',
			data: { guideId: guide.id, action: 'start_guide' }
		});
	};

	const handleNextStep = () => {
		if (selectedGuide && currentStep < selectedGuide.steps.length - 1) {
			setCurrentStep(currentStep + 1);
			trackEvent({
				type: 'step_completed',
				data: { guideId: selectedGuide.id, stepIndex: currentStep }
			});
		} else {
			// Guide completed
			handleCompleteGuide();
		}
	};

	const handlePreviousStep = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	const handleCompleteGuide = () => {
		if (selectedGuide) {
			trackEvent({
				type: 'onboarding_completed',
				data: { guideId: selectedGuide.id, completedAt: new Date() }
			});
			setSelectedGuide(null);
			setCurrentStep(0);
		}
	};

	const handleTryTool = (toolId: string) => {
		markToolUsed(toolId);
		trackEvent({
			type: 'tool_opened',
			data: { toolId, source: 'guided_workflow' }
		});
	};

	const handleStartTutorial = (tutorial: TutorialType) => {
		setSelectedTutorial(tutorial);
		setShowTutorial(true);
	};

	const getDifficultyColor = (difficulty: string) => {
		switch (difficulty) {
			case 'beginner':
				return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
			case 'intermediate':
				return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
			case 'advanced':
				return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
		}
	};

	const getIconForCategory = (category: string) => {
		switch (category) {
			case 'JSON Processing':
				return <FileText className=\"w-5 h-5\" />;
			case 'Code Processing':
				return <Terminal className=\"w-5 h-5\" />;
			case 'Security & Encryption':
				return <Shield className=\"w-5 h-5\" />;
			case 'Network Utilities':
				return <Globe className=\"w-5 h-5\" />;
			case 'Text Processing':
				return <Type className=\"w-5 h-5\" />;
			case 'File Processing':
				return <Database className=\"w-5 h-5\" />;
			default:
				return <Zap className=\"w-5 h-5\" />;
		}
	};

	return (
		<TooltipProvider>
			<div className={`space-y-6 ${className}`}>
				{/* Header */}
				<div className=\"text-center space-y-4\">
					<h2 className=\"text-2xl font-bold text-gray-900 dark:text-white\">
						Learning & Help Center
					</h2>
					<p className=\"text-gray-600 dark:text-gray-400 max-w-2xl mx-auto\">
						Get started with guided tutorials, quick start guides, and contextual help to make the most of Parsify.dev tools.
					</p>
				</div>

				{/* Search */}
				<div className=\"max-w-md mx-auto\">
					<div className=\"relative\">
						<Search className=\"absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4\" />
						<Input
							type=\"text\"
							placeholder=\"Search guides, tutorials, or help topics...\"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className=\"pl-10\"
						/>
					</div>
				</div>

				{/* Main Content */}
				<Tabs value={activeTab} onValueChange={setActiveTab} className=\"w-full\">
					<TabsList className=\"grid w-full grid-cols-3\">
						<TabsTrigger value=\"guides\" className=\"flex items-center gap-2\">
							<BookOpen className=\"w-4 h-4\" />
							Quick Start Guides
						</TabsTrigger>
						<TabsTrigger value=\"tutorials\" className=\"flex items-center gap-2\">
							<Play className=\"w-4 h-4\" />
							Interactive Tutorials
						</TabsTrigger>
						<TabsTrigger value=\"help\" className=\"flex items-center gap-2\">
							<HelpCircle className=\"w-4 h-4\" />
							Help & Resources
						</TabsTrigger>
					</TabsList>

					{/* Quick Start Guides */}
					<TabsContent value=\"guides\" className=\"space-y-6\">
						<div className=\"text-center mb-6\">
							<h3 className=\"text-lg font-semibold text-gray-900 dark:text-white mb-2\">
								Step-by-Step Guides
							</h3>
							<p className=\"text-gray-600 dark:text-gray-400\">
								Follow our curated guides to learn common workflows and best practices.
							</p>
						</div>

						<div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6\">
							{filteredGuides.map((guide, index) => (
								<motion.div
									key={guide.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.1 }}
								>
									<Card className=\"h-full hover:shadow-lg transition-shadow cursor-pointer\"
										onClick={() => handleStartGuide(guide)}>
										<CardHeader className=\"pb-3\">
											<div className=\"flex items-start justify-between mb-2\">
												<div className=\"p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400\">
													{getIconForCategory(guide.category)}
												</div>
												{guide.isPopular && (
													<Badge variant=\"secondary\" className=\"text-xs\">
														⭐ Popular
													</Badge>
												)}
											</div>
											<CardTitle className=\"text-lg leading-tight\">{guide.title}</CardTitle>
											<p className=\"text-sm text-gray-600 dark:text-gray-400 mt-2\">
												{guide.description}
											</p>
										</CardHeader>
										<CardContent className=\"space-y-4\">
											<div className=\"flex items-center justify-between text-sm\">
												<span className=\"flex items-center gap-1\">
													<Clock className=\"w-3 h-3\" />
													{guide.estimatedTime} min
												</span>
												<span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(guide.difficulty)}`}>
													{guide.difficulty}
												</span>
											</div>

											<div className=\"flex flex-wrap gap-1\">
												{guide.tags.slice(0, 3).map((tag) => (
													<Badge key={tag} variant=\"outline\" className=\"text-xs\">
														{tag}
													</Badge>
												))}
											</div>

											<Button className=\"w-full mt-auto\">
												Start Guide
												<ArrowRight className=\"w-4 h-4 ml-2\" />
											</Button>
										</CardContent>
									</Card>
								</motion.div>
							))}
						</div>
					</TabsContent>

					{/* Interactive Tutorials */}
					<TabsContent value=\"tutorials\" className=\"space-y-6\">
						<div className=\"text-center mb-6\">
							<h3 className=\"text-lg font-semibold text-gray-900 dark:text-white mb-2\">
								Interactive Learning
							</h3>
							<p className=\"text-gray-600 dark:text-gray-400\">
								Hands-on tutorials that guide you through using tools in real-time.
							</p>
						</div>

						<div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
							{tutorials.map((tutorial, index) => (
								<motion.div
									key={tutorial.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.1 }}
								>
									<Card className=\"hover:shadow-lg transition-shadow\">
										<CardHeader>
											<div className=\"flex items-center gap-3 mb-2\">
												<div className=\"p-2 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400\">
													<Play className=\"w-5 h-5\" />
												</div>
												<div className=\"flex-1\">
													<CardTitle className=\"text-lg\">{tutorial.name}</CardTitle>
													<p className=\"text-sm text-gray-600 dark:text-gray-400 mt-1\">
														{tutorial.description}
													</p>
												</div>
											</div>
										</CardHeader>
										<CardContent className=\"space-y-4\">
											<div className=\"flex items-center justify-between text-sm text-gray-600 dark:text-gray-400\">
												<span>{tutorial.steps.length} steps</span>
												<span>{tutorial.duration} minutes</span>
												<span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(tutorial.difficulty)}`}>
													{tutorial.difficulty}
												</span>
											</div>

											{tutorial.isInteractive && (
												<Badge variant=\"secondary\" className=\"w-full justify-center\">
													<Zap className=\"w-3 h-3 mr-1\" />
													Interactive
												</Badge>
											)}

											<Button
												className=\"w-full\"
												onClick={() => handleStartTutorial(tutorial)}
											>
												Start Tutorial
												<Play className=\"w-4 h-4 ml-2\" />
											</Button>
										</CardContent>
									</Card>
								</motion.div>
							))}
						</div>
					</TabsContent>

					{/* Help & Resources */}
					<TabsContent value=\"help\" className=\"space-y-6\">
						<div className=\"text-center mb-6\">
							<h3 className=\"text-lg font-semibold text-gray-900 dark:text-white mb-2\">
								Help & Resources
							</h3>
							<p className=\"text-gray-600 dark:text-gray-400\">
								Find answers to common questions and access additional learning resources.
							</p>
						</div>

						<div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6\">
							{[
								{
									title: 'FAQ',
									description: 'Frequently asked questions about our tools',
									icon: <HelpCircle className=\"w-6 h-6\" />,
									color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
									link: '/faq'
								},
								{
									title: 'Documentation',
									description: 'Detailed documentation for all tools',
									icon: <FileText className=\"w-6 h-6\" />,
									color: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
									link: '/docs'
								},
								{
									title: 'Community',
									description: 'Join our community for tips and discussions',
									icon: <MessageSquare className=\"w-6 h-6\" />,
									color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
									link: '/community'
								},
								{
									title: 'Keyboard Shortcuts',
									description: 'Master productivity with keyboard shortcuts',
									icon: <Terminal className=\"w-6 h-6\" />,
									color: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
									link: '/shortcuts'
								},
								{
									title: 'Best Practices',
									description: 'Learn best practices for tool usage',
									icon: <Lightbulb className=\"w-6 h-6\" />,
									color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
									link: '/best-practices'
								},
								{
									title: 'API Reference',
									description: 'Programmatic access to our tools',
									icon: <Globe className=\"w-6 h-6\" />,
									color: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
									link: '/api'
								}
							].map((resource, index) => (
								<motion.div
									key={resource.title}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.1 }}
								>
									<Card className=\"hover:shadow-lg transition-shadow cursor-pointer h-full\"
										onClick={() => window.open(resource.link, '_blank')}>
										<CardHeader className=\"text-center pb-3\">
											<div className={`w-12 h-12 rounded-full ${resource.color} flex items-center justify-center mx-auto mb-3`}>
												{resource.icon}
											</div>
											<CardTitle className=\"text-lg\">{resource.title}</CardTitle>
										</CardHeader>
										<CardContent className=\"text-center space-y-3\">
											<p className=\"text-sm text-gray-600 dark:text-gray-400\">
												{resource.description}
											</p>
											<Button variant=\"outline\" size=\"sm\" className=\"w-full\">
												Learn More
												<ExternalLink className=\"w-3 h-3 ml-1\" />
											</Button>
										</CardContent>
									</Card>
								</motion.div>
							))}
						</div>
					</TabsContent>
				</Tabs>

				{/* Guide Step Modal */}
				<AnimatePresence>
					{selectedGuide && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className=\"fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50\"
							onClick={() => setSelectedGuide(null)}
						>
							<motion.div
								initial={{ scale: 0.9, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								exit={{ scale: 0.9, opacity: 0 }}
								className=\"bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden\"
								onClick={(e) => e.stopPropagation()}
							>
								<div className=\"p-6 border-b border-gray-200 dark:border-gray-700\">
									<div className=\"flex items-center justify-between mb-4\">
										<div>
											<h3 className=\"text-xl font-bold text-gray-900 dark:text-white\">
												{selectedGuide.title}
											</h3>
											<p className=\"text-gray-600 dark:text-gray-400 mt-1\">
												Step {currentStep + 1} of {selectedGuide.steps.length}
											</p>
										</div>
										<Button
											variant=\"ghost\"
											size=\"sm\"
											onClick={() => setSelectedGuide(null)}
										>
											<X className=\"w-4 h-4\" />
										</Button>
									</div>

									{/* Progress Bar */}
									<div className=\"w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4\">
										<motion.div
											className=\"bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full\"
											initial={{ width: 0 }}
											animate={{ width: `${((currentStep + 1) / selectedGuide.steps.length) * 100}%` }}
											transition={{ duration: 0.3 }}
										/>
									</div>
								</div>

								<div className=\"p-6 overflow-y-auto max-h-[50vh]\">
									<div className=\"space-y-4\">
										<div>
											<h4 className=\"text-lg font-semibold text-gray-900 dark:text-white mb-2\">
												{selectedGuide.steps[currentStep].title}
											</h4>
											<p className=\"text-gray-600 dark:text-gray-400 mb-4\">
												{selectedGuide.steps[currentStep].description}
											</p>
										</div>

										<Card className=\"bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800\">
											<CardHeader className=\"pb-3\">
												<CardTitle className=\"text-base flex items-center gap-2\">
													<Plus className=\"w-4 h-4\" />
													What to do:
												</CardTitle>
											</CardHeader>
											<CardContent>
												<p className=\"text-sm text-blue-700 dark:text-blue-300 mb-2\">
													{selectedGuide.steps[currentStep].action}
												</p>
												{selectedGuide.steps[currentStep].toolId && (
													<Button
														variant=\"outline\"
														size=\"sm\"
														onClick={() => handleTryTool(selectedGuide.steps[currentStep].toolId!)}
													>
														Try Tool
														<ExternalLink className=\"w-3 h-3 ml-1\" />
													</Button>
												)}
											</CardContent>
										</Card>

										<Card className=\"bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800\">
											<CardHeader className=\"pb-3\">
												<CardTitle className=\"text-base flex items-center gap-2\">
													<CheckCircle className=\"w-4 h-4\" />
													Expected result:
												</CardTitle>
											</CardHeader>
											<CardContent>
												<p className=\"text-sm text-green-700 dark:text-green-300\">
													{selectedGuide.steps[currentStep].expectedResult}
												</p>
											</CardContent>
										</Card>
									</div>
								</div>

								<div className=\"flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700\">
									<Button
										variant=\"outline\"
										onClick={handlePreviousStep}
										disabled={currentStep === 0}
									>
										Previous
									</Button>

									<div className=\"flex gap-2\">
										{currentStep === selectedGuide.steps.length - 1 ? (
											<Button onClick={handleCompleteGuide}>
												Complete Guide
												<CheckCircle className=\"w-4 h-4 ml-2\" />
											</Button>
										) : (
											<Button onClick={handleNextStep}>
												Next Step
												<ArrowRight className=\"w-4 h-4 ml-2\" />
											</Button>
										)}
									</div>
								</div>
							</motion.div>
						</motion.div>
					)}
				</AnimatePresence>

				{/* Tutorial Overlay */}
				{selectedTutorial && tutorial.tutorial && (
					<TutorialOverlay
						tutorial={tutorial.tutorial}
						isOpen={showTutorial}
						onClose={() => setShowTutorial(false)}
						onComplete={() => setShowTutorial(false)}
					/>
				)}
			</div>
		</TooltipProvider>
	);
}
