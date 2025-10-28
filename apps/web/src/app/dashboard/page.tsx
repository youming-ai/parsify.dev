'use client';

import { useAuth } from '@/components/auth/auth-context';
import { ProtectedRoute } from '@/components/auth/auth-guard';
import { UserProfile } from '@/components/auth/user-profile';
import { MainLayout } from '@/components/layout/main-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Activity,
	BarChart3,
	ChevronRight,
	Clock,
	Download,
	FileText,
	Settings,
	TrendingUp,
	Zap,
} from 'lucide-react';
import { useState } from 'react';

export default function DashboardPage() {
	const { user, logout } = useAuth();
	const [isLoading, setIsLoading] = useState(false);
	const [recentActivity, _setRecentActivity] = useState([
		{
			id: 1,
			action: 'JSON formatted',
			tool: 'JSON Formatter',
			time: '2 minutes ago',
		},
		{
			id: 2,
			action: 'Code executed',
			tool: 'Code Runner',
			time: '15 minutes ago',
		},
		{
			id: 3,
			action: 'File converted',
			tool: 'JSON Converter',
			time: '1 hour ago',
		},
		{
			id: 4,
			action: 'Password reset',
			tool: 'Account Settings',
			time: '2 hours ago',
		},
	]);
	const [stats, _setStats] = useState({
		totalOperations: 156,
		toolsUsed: 8,
		filesProcessed: 42,
		timeSaved: '3.5 hours',
	});

	const handleLogout = async () => {
		setIsLoading(true);
		try {
			await logout();
		} catch (error) {
			console.error('Logout failed:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const getWelcomeMessage = () => {
		const hour = new Date().getHours();
		if (hour < 12) return 'Good morning';
		if (hour < 17) return 'Good afternoon';
		return 'Good evening';
	};

	return (
		<ProtectedRoute>
			<MainLayout>
				<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
					{/* Welcome Section */}
					<div className="mb-8">
						<div className="flex items-center justify-between">
							<div>
								<h1 className="font-bold text-3xl text-gray-900">
									{getWelcomeMessage()}, {user?.name}!
								</h1>
								<p className="mt-2 text-gray-600">
									Welcome back to your developer dashboard. Here's what's been
									happening.
								</p>
							</div>
							<div className="flex gap-3">
								<Button
									variant="outline"
									onClick={() => (window.location.href = '/auth/profile')}
								>
									<Settings className="mr-2 h-4 w-4" />
									Settings
								</Button>
								<Button
									variant="outline"
									onClick={handleLogout}
									disabled={isLoading}
								>
									{isLoading ? 'Signing out...' : 'Sign out'}
								</Button>
							</div>
						</div>
					</div>

					{/* Stats Grid */}
					<div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="font-medium text-sm">
									Total Operations
								</CardTitle>
								<BarChart3 className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl">
									{stats.totalOperations}
								</div>
								<p className="text-muted-foreground text-xs">
									<TrendingUp className="mr-1 inline h-3 w-3" />
									+12% from last month
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="font-medium text-sm">
									Tools Used
								</CardTitle>
								<Zap className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl">{stats.toolsUsed}</div>
								<p className="text-muted-foreground text-xs">
									+2 new tools this week
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="font-medium text-sm">
									Files Processed
								</CardTitle>
								<FileText className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl">{stats.filesProcessed}</div>
								<p className="text-muted-foreground text-xs">
									+8 from yesterday
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="font-medium text-sm">
									Time Saved
								</CardTitle>
								<Clock className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl">{stats.timeSaved}</div>
								<p className="text-muted-foreground text-xs">
									Estimated automation time
								</p>
							</CardContent>
						</Card>
					</div>

					<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
						{/* Recent Activity */}
						<div className="lg:col-span-2">
							<Card>
								<CardHeader>
									<div className="flex items-center gap-2">
										<Activity className="h-5 w-5" />
										<CardTitle>Recent Activity</CardTitle>
									</div>
									<CardDescription>
										Your latest tool usage and actions
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										{recentActivity.map((activity) => (
											<div
												key={activity.id}
												className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-gray-50"
											>
												<div className="flex items-center gap-3">
													<div className="h-2 w-2 rounded-full bg-blue-500"></div>
													<div>
														<p className="font-medium text-sm">
															{activity.action}
														</p>
														<p className="text-gray-500 text-xs">
															{activity.tool}
														</p>
													</div>
												</div>
												<div className="flex items-center gap-2">
													<span className="text-gray-500 text-xs">
														{activity.time}
													</span>
													<ChevronRight className="h-4 w-4 text-gray-400" />
												</div>
											</div>
										))}
									</div>
									<div className="mt-4 text-center">
										<Button variant="outline" size="sm">
											View All Activity
										</Button>
									</div>
								</CardContent>
							</Card>

							{/* Quick Actions */}
							<Card className="mt-6">
								<CardHeader>
									<CardTitle>Quick Actions</CardTitle>
									<CardDescription>
										Frequently used tools and features
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-2 gap-4">
										<Button
											variant="outline"
											className="h-auto justify-start p-4"
											onClick={() => (window.location.href = '/tools/json')}
										>
											<div className="flex items-center gap-3">
												<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
													<FileText className="h-4 w-4 text-blue-600" />
												</div>
												<div className="text-left">
													<p className="font-medium">JSON Tools</p>
													<p className="text-gray-500 text-xs">
														Format & validate
													</p>
												</div>
											</div>
										</Button>

										<Button
											variant="outline"
											className="h-auto justify-start p-4"
											onClick={() => (window.location.href = '/tools/code')}
										>
											<div className="flex items-center gap-3">
												<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
													<Zap className="h-4 w-4 text-green-600" />
												</div>
												<div className="text-left">
													<p className="font-medium">Code Runner</p>
													<p className="text-gray-500 text-xs">Execute code</p>
												</div>
											</div>
										</Button>

										<Button
											variant="outline"
											className="h-auto justify-start p-4"
											onClick={() =>
												(window.location.href = '/tools/converter')
											}
										>
											<div className="flex items-center gap-3">
												<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
													<Download className="h-4 w-4 text-purple-600" />
												</div>
												<div className="text-left">
													<p className="font-medium">File Converter</p>
													<p className="text-gray-500 text-xs">
														Convert formats
													</p>
												</div>
											</div>
										</Button>

										<Button
											variant="outline"
											className="h-auto justify-start p-4"
											onClick={() => (window.location.href = '/auth/profile')}
										>
											<div className="flex items-center gap-3">
												<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
													<Settings className="h-4 w-4 text-orange-600" />
												</div>
												<div className="text-left">
													<p className="font-medium">Settings</p>
													<p className="text-gray-500 text-xs">Account prefs</p>
												</div>
											</div>
										</Button>
									</div>
								</CardContent>
							</Card>
						</div>

						{/* User Profile Sidebar */}
						<div className="space-y-6">
							<UserProfile variant="sidebar" />

							<Card>
								<CardHeader>
									<CardTitle>Account Status</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3">
									<div className="flex items-center justify-between">
										<span className="text-gray-600 text-sm">Account Type</span>
										<Badge className="bg-green-100 text-green-800">Free</Badge>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-gray-600 text-sm">Member Since</span>
										<span className="font-medium text-sm">
											{new Date().toLocaleDateString('en-US', {
												month: 'short',
												year: 'numeric',
											})}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-gray-600 text-sm">
											Email Verified
										</span>
										<Badge className="bg-blue-100 text-blue-800">
											Verified
										</Badge>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle>Upgrade to Pro</CardTitle>
									<CardDescription>
										Unlock advanced features and remove limitations
									</CardDescription>
								</CardHeader>
								<CardContent>
									<ul className="mb-4 space-y-2 text-gray-600 text-sm">
										<li className="flex items-center gap-2">
											<div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
											Unlimited tool usage
										</li>
										<li className="flex items-center gap-2">
											<div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
											Priority support
										</li>
										<li className="flex items-center gap-2">
											<div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
											Advanced features
										</li>
									</ul>
									<Button className="w-full">Upgrade Now</Button>
								</CardContent>
							</Card>
						</div>
					</div>
				</div>
			</MainLayout>
		</ProtectedRoute>
	);
}
