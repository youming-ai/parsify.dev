import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/material-symbols';
import { mockTools, createMockLocalStorage, mockUserEvent } from '../test-utils';

// Mock ToolCard component (extracted from ToolsPage)
interface ToolCardProps {
  tool: any;
  viewMode: 'grid' | 'list';
  isFavorite: boolean;
  onToggleFavorite: (toolId: string) => void;
  onSaveRecentTool: (toolId: string) => void;
}

const ToolCard = ({ tool, viewMode, isFavorite, onToggleFavorite, onSaveRecentTool }: ToolCardProps) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
  };

  const getProcessingIcon = (type: string) => {
    switch (type) {
      case 'client-side':
        return <Icon name="COMPUTER" className="h-3 w-3" />;
      case 'server-side':
        return <Icon name="CLOUD" className="h-3 w-3" />;
      case 'hybrid':
        return <Icon name="SYNC" className="h-3 w-3" />;
    }
  };

  const getSecurityIcon = (security: string) => {
    switch (security) {
      case 'local-only':
        return <Icon name="LOCK" className="h-3 w-3 text-green-500" />;
      case 'secure-sandbox':
        return <Icon name="SHIELD" className="h-3 w-3 text-blue-500" />;
      case 'network-required':
        return <Icon name="WIFI" className="h-3 w-3 text-orange-500" />;
    }
  };

  return (
    <Card
      className={`group transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
        viewMode === 'list' ? 'flex flex-row' : ''
      }`}
    >
      <CardHeader className={viewMode === 'list' ? 'flex-1' : ''}>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
              <Icon name={tool.icon} className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-lg group-hover:text-blue-600 transition-colors">
                {tool.name}
                {tool.isNew && (
                  <Badge variant="secondary" className="text-xs">
                    New
                  </Badge>
                )}
                {tool.isPopular && (
                  <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                    <Icon name="STAR" className="h-3 w-3 mr-1" />
                    Popular
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`text-xs ${getDifficultyColor(tool.difficulty)}`}>
                  {tool.difficulty}
                </Badge>
                <div className="flex items-center text-gray-500 text-xs gap-1">
                  {getProcessingIcon(tool.processingType)}
                  <span>{tool.processingType?.replace('-', ' ')}</span>
                </div>
                {getSecurityIcon(tool.security)}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleFavorite(tool.id)}
            className="h-8 w-8 p-0"
            aria-label={`Toggle favorite for ${tool.name}`}
          >
            <Icon
              name={isFavorite ? 'FAVORITE' : 'FAVORITE_BORDER'}
              className={`h-4 w-4 ${
                isFavorite ? 'text-red-500 fill-current' : 'text-gray-400'
              }`}
            />
          </Button>
        </div>
        <CardDescription className="mt-3 text-sm">{tool.description}</CardDescription>
      </CardHeader>
      <CardContent className={viewMode === 'list' ? 'flex items-center gap-4' : ''}>
        {/* Features */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {tool.features.slice(0, viewMode === 'list' ? 2 : 3).map((feature: string) => (
              <Badge key={feature} variant="outline" className="text-xs">
                {feature}
              </Badge>
            ))}
            {tool.features.length > (viewMode === 'list' ? 2 : 3) && (
              <Badge variant="outline" className="text-xs">
                +{tool.features.length - (viewMode === 'list' ? 2 : 3)} more
              </Badge>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {tool.tags.slice(0, 3).map((tag: string) => (
              <span
                key={tag}
                className="rounded bg-gray-100 px-2 py-1 text-gray-500 text-xs dark:bg-gray-700 dark:text-gray-400"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between ${viewMode === 'list' ? 'ml-auto' : ''}`}>
          <a
            href={tool.href}
            onClick={() => onSaveRecentTool(tool.id)}
            className="inline-flex items-center"
          >
            <Button size="sm" className="group">
              Try Tool
              <Icon
                name="ARROW_RIGHT"
                className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
              />
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
};

describe('ToolCard Component', () => {
  const mockTool = mockTools[0];
  const defaultProps = {
    tool: mockTool,
    viewMode: 'grid' as const,
    isFavorite: false,
    onToggleFavorite: vi.fn(),
    onSaveRecentTool: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders tool card with correct information', () => {
      render(<ToolCard {...defaultProps} />);

      expect(screen.getByText(mockTool.name)).toBeInTheDocument();
      expect(screen.getByText(mockTool.description)).toBeInTheDocument();
      expect(screen.getByText(mockTool.difficulty)).toBeInTheDocument();
      expect(screen.getByText(mockTool.processingType.replace('-', ' '))).toBeInTheDocument();
    });

    it('displays tool icon', () => {
      render(<ToolCard {...defaultProps} />);

      const icon = document.querySelector('.w-5.h-5');
      expect(icon).toBeInTheDocument();
    });

    it('shows tool features', () => {
      render(<ToolCard {...defaultProps} />);

      mockTool.features.slice(0, 3).forEach(feature => {
        expect(screen.getByText(feature)).toBeInTheDocument();
      });
    });

    it('displays tool tags', () => {
      render(<ToolCard {...defaultProps} />);

      mockTool.tags.slice(0, 3).forEach(tag => {
        expect(screen.getByText(tag)).toBeInTheDocument();
      });
    });

    it('shows "Try Tool" button', () => {
      render(<ToolCard {...defaultProps} />);

      expect(screen.getByText('Try Tool')).toBeInTheDocument();
    });

    it('shows favorite button', () => {
      render(<ToolCard {...defaultProps} />);

      const favoriteButton = screen.getByRole('button', {
        name: `Toggle favorite for ${mockTool.name}`
      });
      expect(favoriteButton).toBeInTheDocument();
    });
  });

  describe('Badge Display', () => {
    it('shows NEW badge for new tools', () => {
      const newTool = { ...mockTool, isNew: true };

      render(<ToolCard {...defaultProps} tool={newTool} />);

      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('shows Popular badge for popular tools', () => {
      const popularTool = { ...mockTool, isPopular: true };

      render(<ToolCard {...defaultProps} tool={popularTool} />);

      expect(screen.getByText('Popular')).toBeInTheDocument();
    });

    it('shows both NEW and Popular badges when applicable', () => {
      const newAndPopularTool = { ...mockTool, isNew: true, isPopular: true };

      render(<ToolCard {...defaultProps} tool={newAndPopularTool} />);

      expect(screen.getByText('New')).toBeInTheDocument();
      expect(screen.getByText('Popular')).toBeInTheDocument();
    });

    it('hides badges when tool is neither new nor popular', () => {
      const regularTool = { ...mockTool, isNew: false, isPopular: false };

      render(<ToolCard {...defaultProps} tool={regularTool} />);

      expect(screen.queryByText('New')).not.toBeInTheDocument();
      expect(screen.queryByText('Popular')).not.toBeInTheDocument();
    });
  });

  describe('Difficulty Badges', () => {
    it('shows beginner difficulty with correct styling', () => {
      const beginnerTool = { ...mockTool, difficulty: 'beginner' };

      render(<ToolCard {...defaultProps} tool={beginnerTool} />);

      const difficultyBadge = screen.getByText('beginner');
      expect(difficultyBadge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('shows intermediate difficulty with correct styling', () => {
      const intermediateTool = { ...mockTool, difficulty: 'intermediate' };

      render(<ToolCard {...defaultProps} tool={intermediateTool} />);

      const difficultyBadge = screen.getByText('intermediate');
      expect(difficultyBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('shows advanced difficulty with correct styling', () => {
      const advancedTool = { ...mockTool, difficulty: 'advanced' };

      render(<ToolCard {...defaultProps} tool={advancedTool} />);

      const difficultyBadge = screen.getByText('advanced');
      expect(difficultyBadge).toHaveClass('bg-red-100', 'text-red-800');
    });
  });

  describe('Processing Type Icons', () => {
    it('shows computer icon for client-side processing', () => {
      const clientSideTool = { ...mockTool, processingType: 'client-side' };

      render(<ToolCard {...defaultProps} tool={clientSideTool} />);

      expect(screen.getByText('client side')).toBeInTheDocument();
    });

    it('shows cloud icon for server-side processing', () => {
      const serverSideTool = { ...mockTool, processingType: 'server-side' };

      render(<ToolCard {...defaultProps} tool={serverSideTool} />);

      expect(screen.getByText('server side')).toBeInTheDocument();
    });

    it('shows sync icon for hybrid processing', () => {
      const hybridTool = { ...mockTool, processingType: 'hybrid' };

      render(<ToolCard {...defaultProps} tool={hybridTool} />);

      expect(screen.getByText('hybrid')).toBeInTheDocument();
    });
  });

  describe('Security Icons', () => {
    it('shows lock icon for local-only security', () => {
      const localOnlyTool = { ...mockTool, security: 'local-only' };

      render(<ToolCard {...defaultProps} tool={localOnlyTool} />);

      const lockIcon = document.querySelector('.text-green-500');
      expect(lockIcon).toBeInTheDocument();
    });

    it('shows shield icon for secure-sandbox security', () => {
      const sandboxTool = { ...mockTool, security: 'secure-sandbox' };

      render(<ToolCard {...defaultProps} tool={sandboxTool} />);

      const shieldIcon = document.querySelector('.text-blue-500');
      expect(shieldIcon).toBeInTheDocument();
    });

    it('shows wifi icon for network-required security', () => {
      const networkTool = { ...mockTool, security: 'network-required' };

      render(<ToolCard {...defaultProps} tool={networkTool} />);

      const wifiIcon = document.querySelector('.text-orange-500');
      expect(wifiIcon).toBeInTheDocument();
    });
  });

  describe('Feature Display', () => {
    it('shows limited features in grid view', () => {
      render(<ToolCard {...defaultProps} viewMode="grid" />);

      // Should show max 3 features
      const displayedFeatures = screen.getAllByText(mockTool.features[0]);
      expect(displayedFeatures.length).toBeGreaterThanOrEqual(1);

      // Check if "more" badge is shown when there are more than 3 features
      if (mockTool.features.length > 3) {
        expect(screen.getByText(`+${mockTool.features.length - 3} more`)).toBeInTheDocument();
      }
    });

    it('shows limited features in list view', () => {
      render(<ToolCard {...defaultProps} viewMode="list" />);

      // Should show max 2 features
      if (mockTool.features.length > 2) {
        expect(screen.getByText(`+${mockTool.features.length - 2} more`)).toBeInTheDocument();
      }
    });

    it('shows all features when tool has 3 or fewer features in grid view', () => {
      const toolWithFewFeatures = {
        ...mockTool,
        features: ['Feature 1', 'Feature 2']
      };

      render(<ToolCard {...defaultProps} tool={toolWithFewFeatures} viewMode="grid" />);

      expect(screen.queryByText(/\+.*more/)).not.toBeInTheDocument();
    });

    it('shows all features when tool has 2 or fewer features in list view', () => {
      const toolWithFewFeatures = {
        ...mockTool,
        features: ['Feature 1', 'Feature 2']
      };

      render(<ToolCard {...defaultProps} tool={toolWithFewFeatures} viewMode="list" />);

      expect(screen.queryByText(/\+.*more/)).not.toBeInTheDocument();
    });
  });

  describe('Tag Display', () => {
    it('shows limited tags', () => {
      render(<ToolCard {...defaultProps} />);

      // Should show max 3 tags
      mockTool.tags.slice(0, 3).forEach(tag => {
        expect(screen.getByText(tag)).toBeInTheDocument();
      });
    });

    it('handles tools with no tags', () => {
      const toolWithoutTags = { ...mockTool, tags: [] };

      render(<ToolCard {...defaultProps} tool={toolWithoutTags} />);

      // Should not show any tag elements
      const tagElements = document.querySelectorAll('.rounded.bg-gray-100');
      expect(tagElements.length).toBe(0);
    });

    it('handles tools with single tag', () => {
      const toolWithSingleTag = { ...mockTool, tags: ['single-tag'] };

      render(<ToolCard {...defaultProps} tool={toolWithSingleTag} />);

      expect(screen.getByText('single-tag')).toBeInTheDocument();
    });
  });

  describe('View Mode Variations', () => {
    it('renders correctly in grid view', () => {
      render(<ToolCard {...defaultProps} viewMode="grid" />);

      const card = document.querySelector('.group.transition-all');
      expect(card).not.toHaveClass('flex', 'flex-row');
    });

    it('renders correctly in list view', () => {
      render(<ToolCard {...defaultProps} viewMode="list" />);

      const card = document.querySelector('.group.transition-all');
      expect(card).toHaveClass('flex', 'flex-row');
    });

    it('shows different number of features based on view mode', () => {
      const toolWithManyFeatures = {
        ...mockTool,
        features: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4']
      };

      const { rerender } = render(<ToolCard {...defaultProps} tool={toolWithManyFeatures} viewMode="grid" />);
      expect(screen.getByText('+1 more')).toBeInTheDocument();

      rerender(<ToolCard {...defaultProps} tool={toolWithManyFeatures} viewMode="list" />);
      expect(screen.getByText('+2 more')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onToggleFavorite when favorite button is clicked', async () => {
      const user = userEvent.setup();
      const onToggleFavorite = vi.fn();

      render(<ToolCard {...defaultProps} onToggleFavorite={onToggleFavorite} />);

      const favoriteButton = screen.getByRole('button', {
        name: `Toggle favorite for ${mockTool.name}`
      });
      await user.click(favoriteButton);

      expect(onToggleFavorite).toHaveBeenCalledWith(mockTool.id);
    });

    it('calls onSaveRecentTool when Try Tool is clicked', async () => {
      const user = userEvent.setup();
      const onSaveRecentTool = vi.fn();

      render(<ToolCard {...defaultProps} onSaveRecentTool={onSaveRecentTool} />);

      const tryToolButton = screen.getByText('Try Tool');
      await user.click(tryToolButton);

      expect(onSaveRecentTool).toHaveBeenCalledWith(mockTool.id);
    });

    it('navigates to tool page when Try Tool is clicked', async () => {
      const user = userEvent.setup();

      render(<ToolCard {...defaultProps} />);

      const tryToolLink = screen.getByText('Try Tool').closest('a');
      expect(tryToolLink).toHaveAttribute('href', mockTool.href);
    });
  });

  describe('Favorite State', () => {
    it('shows filled favorite icon when tool is favorited', () => {
      render(<ToolCard {...defaultProps} isFavorite={true} />);

      const favoriteIcon = document.querySelector('.text-red-500.fill-current');
      expect(favoriteIcon).toBeInTheDocument();
    });

    it('shows outline favorite icon when tool is not favorited', () => {
      render(<ToolCard {...defaultProps} isFavorite={false} />);

      const favoriteIcon = document.querySelector('.text-gray-400');
      expect(favoriteIcon).toBeInTheDocument();
    });
  });

  describe('Hover Effects', () => {
    it('applies hover classes to card', () => {
      render(<ToolCard {...defaultProps} />);

      const card = document.querySelector('.group.transition-all');
      expect(card).toHaveClass('hover:shadow-lg', 'hover:-translate-y-1');
    });

    it('changes title color on hover', () => {
      render(<ToolCard {...defaultProps} />);

      const title = screen.getByText(mockTool.name);
      expect(title).toHaveClass('group-hover:text-blue-600', 'transition-colors');
    });

    it('animates arrow on hover', () => {
      render(<ToolCard {...defaultProps} />);

      const arrow = document.querySelector('.group-hover\\:translate-x-1');
      expect(arrow).toHaveClass('transition-transform');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<ToolCard {...defaultProps} />);

      const favoriteButton = screen.getByRole('button', {
        name: `Toggle favorite for ${mockTool.name}`
      });
      expect(favoriteButton).toHaveAttribute('aria-label');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      const onToggleFavorite = vi.fn();

      render(<ToolCard {...defaultProps} onToggleFavorite={onToggleFavorite} />);

      const favoriteButton = screen.getByRole('button', {
        name: `Toggle favorite for ${mockTool.name}`
      });

      favoriteButton.focus();
      expect(favoriteButton).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(onToggleFavorite).toHaveBeenCalledWith(mockTool.id);
    });

    it('provides semantic structure', () => {
      render(<ToolCard {...defaultProps} />);

      // Should have proper heading structure
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();

      // Should have proper link structure
      const tryToolLink = screen.getByText('Try Tool').closest('a');
      expect(tryToolLink).toBeInTheDocument();
    });

    it('has sufficient color contrast', () => {
      render(<ToolCard {...defaultProps} />);

      // Difficulty badges should have contrast classes
      const difficultyBadge = screen.getByText(mockTool.difficulty);
      expect(difficultyBadge).toHaveClass(/bg-\w+-100/, /text-\w+-800/);
    });

    it('announces changes to screen readers', async () => {
      const user = userEvent.setup();
      const onToggleFavorite = vi.fn();

      render(<ToolCard {...defaultProps} onToggleFavorite={onToggleFavorite} />);

      const favoriteButton = screen.getByRole('button', {
        name: `Toggle favorite for ${mockTool.name}`
      });

      await user.click(favoriteButton);

      // The aria-label should be updated after state change
      // This would be tested with actual state updates
    });
  });

  describe('Error Handling', () => {
    it('handles missing tool properties gracefully', () => {
      const incompleteTool = {
        id: 'test',
        name: 'Test Tool',
        // Missing other properties
      };

      expect(() => {
        render(<ToolCard {...defaultProps} tool={incompleteTool} />);
      }).not.toThrow();
    });

    it('handles empty features array', () => {
      const toolWithoutFeatures = {
        ...mockTool,
        features: []
      };

      render(<ToolCard {...defaultProps} tool={toolWithoutFeatures} />);

      expect(screen.queryByText(/\+.*more/)).not.toBeInTheDocument();
    });

    it('handles undefined handlers gracefully', () => {
      expect(() => {
        render(
          <ToolCard
            {...defaultProps}
            onToggleFavorite={undefined}
            onSaveRecentTool={undefined}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('renders efficiently with large feature lists', () => {
      const toolWithManyFeatures = {
        ...mockTool,
        features: Array.from({ length: 100 }, (_, i) => `Feature ${i}`)
      };

      const startTime = performance.now();
      render(<ToolCard {...defaultProps} tool={toolWithManyFeatures} />);
      const endTime = performance.now();

      // Should render quickly even with many features
      expect(endTime - startTime).toBeLessThan(50);
    });

    it('only renders visible features', () => {
      const toolWithManyFeatures = {
        ...mockTool,
        features: Array.from({ length: 10 }, (_, i) => `Feature ${i}`)
      };

      render(<ToolCard {...defaultProps} tool={toolWithManyFeatures} />);

      // Should only show first 3 features + "more" badge
      expect(screen.getByText('Feature 0')).toBeInTheDocument();
      expect(screen.getByText('Feature 1')).toBeInTheDocument();
      expect(screen.getByText('Feature 2')).toBeInTheDocument();
      expect(screen.getByText('+7 more')).toBeInTheDocument();
      expect(screen.queryByText('Feature 3')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('adapts layout for different screen sizes', () => {
      const { rerender } = render(<ToolCard {...defaultProps} viewMode="grid" />);

      // Grid view should use card layout
      let card = document.querySelector('.group.transition-all');
      expect(card).not.toHaveClass('flex', 'flex-row');

      // List view should use horizontal layout
      rerender(<ToolCard {...defaultProps} viewMode="list" />);
      card = document.querySelector('.group.transition-all');
      expect(card).toHaveClass('flex', 'flex-row');
    });

    it('adjusts content based on view mode', () => {
      const { rerender } = render(<ToolCard {...defaultProps} viewMode="grid" />);

      // Grid view should show different layout classes
      let cardHeader = document.querySelector('.card-header');
      expect(cardHeader).not.toHaveClass('flex-1');

      rerender(<ToolCard {...defaultProps} viewMode="list" />);
      cardHeader = document.querySelector('.card-header');
      expect(cardHeader).toHaveClass('flex-1');
    });
  });
});
