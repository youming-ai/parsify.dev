import { cn } from '@/lib/utils'
import { Footer } from './footer'
import { Header } from './header'
import { Sidebar } from './sidebar'

interface MainLayoutProps {
  children: React.ReactNode
  showSidebar?: boolean
}

export function MainLayout({ children, showSidebar = false }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        {showSidebar && <Sidebar />}
        <main className={cn('flex-1', showSidebar ? 'md:ml-64' : '')}>
          {children}
          <Footer />
        </main>
      </div>
    </div>
  )
}
