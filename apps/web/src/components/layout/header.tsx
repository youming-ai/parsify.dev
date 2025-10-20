'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/components/auth/auth-context'
import { UserAvatar } from '@/components/auth/user-avatar'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ThemeToggle } from './theme-toggle'
import {
  Menu,
  ChevronDown,
  Code,
  FileJson,
  Wrench,
  Settings,
  User,
  LogIn,
  LogOut,
  UserCircle,
} from 'lucide-react'

const tools = [
  {
    title: 'JSON Tools',
    href: '/tools/json',
    icon: FileJson,
    description: 'Format, validate, and convert JSON data',
  },
  {
    title: 'Code Tools',
    href: '/tools/code',
    icon: Code,
    description: 'Format and execute code securely',
  },
  {
    title: 'All Tools',
    href: '/tools',
    icon: Wrench,
    description: 'Browse all available tools',
  },
]

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout, isAuthenticated, _isLoading } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Code className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              Parsify.dev
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-1">
                  <span>Tools</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {tools.map(tool => (
                  <DropdownMenuItem key={tool.href} asChild>
                    <Link
                      href={tool.href}
                      className="flex items-center space-x-2"
                    >
                      <tool.icon className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{tool.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {tool.description}
                        </div>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Link
              href="/docs"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Documentation
            </Link>
          </nav>
        </div>

        {/* Mobile navigation */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <Link
              href="/"
              className="flex items-center"
              onClick={() => setIsOpen(false)}
            >
              <Code className="mr-2 h-4 w-4" />
              <span className="font-bold">Parsify.dev</span>
            </Link>
            <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
              <div className="flex flex-col space-y-3">
                <h4 className="font-medium">Tools</h4>
                {tools.map(tool => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className="flex items-center space-x-2 text-sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <tool.icon className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{tool.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {tool.description}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="flex flex-col space-y-2 mt-6">
                <Link
                  href="/docs"
                  className="text-sm"
                  onClick={() => setIsOpen(false)}
                >
                  Documentation
                </Link>
                {isAuthenticated && user ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="text-sm"
                      onClick={() => setIsOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/auth/profile"
                      className="text-sm"
                      onClick={() => setIsOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout()
                        setIsOpen(false)
                      }}
                      className="text-sm text-left"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className="text-sm"
                      onClick={() => setIsOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="text-sm"
                      onClick={() => setIsOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Search bar could go here in the future */}
          </div>
          <nav className="flex items-center space-x-2">
            <ThemeToggle />
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <UserAvatar user={user} size="sm" />
                    <span className="hidden sm:inline-block">{user.name}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard"
                      className="flex items-center space-x-2"
                    >
                      <UserCircle className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/auth/profile"
                      className="flex items-center space-x-2"
                    >
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/auth/profile"
                      className="flex items-center space-x-2"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4" />
                    <span className="sr-only">User menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link
                      href="/auth/login"
                      className="flex items-center space-x-2"
                    >
                      <LogIn className="h-4 w-4" />
                      <span>Sign In</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/auth/signup"
                      className="flex items-center space-x-2"
                    >
                      <UserCircle className="h-4 w-4" />
                      <span>Sign Up</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
