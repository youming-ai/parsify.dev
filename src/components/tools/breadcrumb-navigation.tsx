"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon, ICONS } from "@/components/ui/material-symbols";
import { cn } from "@/lib/utils";
import type { BreadcrumbItem } from "@/types/tools";

interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
  className?: string;
  showHomeIcon?: boolean;
  maxItems?: number;
}

export function BreadcrumbNavigation({
  items,
  className,
  showHomeIcon = true,
  maxItems = 5,
}: BreadcrumbNavigationProps) {
  const router = useRouter();

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  // If there are too many items, show only the first and last few
  const displayItems =
    items.length > maxItems
      ? [
          ...items.slice(0, 2),
          { label: "...", isActive: false },
          ...items.slice(-2),
        ]
      : items;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center space-x-1 text-xs sm:text-sm",
        className,
      )}
    >
      {displayItems.map((item, index) => {
        const isLast = index === displayItems.length - 1;
        const isEllipsis = item.label === "...";

        if (isEllipsis) {
          return (
            <span
              key={`ellipsis-${index}`}
              className="text-gray-400 dark:text-gray-600 px-1"
            >
              {item.label}
            </span>
          );
        }

        const HomeIcon =
          showHomeIcon && index === 0 ? (
            <Icon name="HOME" className="h-3 w-3 sm:h-4 sm:w-4" />
          ) : null;

        const content = (
          <span className="flex items-center space-x-1">
            {HomeIcon}
            <span
              className={cn(
                "truncate max-w-[80px] sm:max-w-[150px]",
                item.isActive
                  ? "text-gray-900 dark:text-white font-medium"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white",
              )}
            >
              {item.label}
            </span>
          </span>
        );

        if (item.isActive || !item.href) {
          return (
            <span key={item.label} className="flex items-center space-x-1">
              {content}
            </span>
          );
        }

        return (
          <div key={item.label} className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs sm:text-sm font-normal touch-manipulation"
              onClick={() => handleNavigation(item.href!)}
            >
              {content}
            </Button>

            {!isLast && (
              <Icon
                name="CHEVRON_RIGHT"
                className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-600 flex-shrink-0"
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}

// Breadcrumb item with additional metadata
interface EnhancedBreadcrumbItem extends BreadcrumbItem {
  icon?: string;
  badge?: string;
  description?: string;
}

interface EnhancedBreadcrumbNavigationProps {
  items: EnhancedBreadcrumbItem[];
  className?: string;
  showDescriptions?: boolean;
  variant?: "default" | "minimal" | "detailed";
}

export function EnhancedBreadcrumbNavigation({
  items,
  className,
  showDescriptions = false,
  variant = "default",
}: EnhancedBreadcrumbNavigationProps) {
  const router = useRouter();

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  if (variant === "minimal") {
    return (
      <BreadcrumbNavigation
        items={items.map((item) => ({
          label: item.label,
          href: item.href,
          isActive: item.isActive,
        }))}
        className={className}
        showHomeIcon={false}
      />
    );
  }

  if (variant === "detailed") {
    return (
      <nav className={cn("space-y-2", className)}>
        {/* Main breadcrumb */}
        <BreadcrumbNavigation items={items} showHomeIcon={true} />

        {/* Current item description */}
        {showDescriptions && items.length > 0 && (
          <div className="text-xs text-gray-600 dark:text-gray-400 pl-6">
            {items[items.length - 1]?.description}
          </div>
        )}
      </nav>
    );
  }

  // Default variant with icons and badges
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center space-x-2 text-sm", className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        const ItemIcon = item.icon ? (
          <Icon name={item.icon as keyof typeof ICONS} className="h-4 w-4" />
        ) : index === 0 ? (
          <Icon name="HOME" className="h-4 w-4" />
        ) : null;

        const content = (
          <div className="flex items-center space-x-2">
            {ItemIcon}
            <span
              className={cn(
                item.isActive
                  ? "text-gray-900 dark:text-white font-medium"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white",
              )}
            >
              {item.label}
            </span>
            {item.badge && (
              <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </div>
        );

        if (item.isActive || !item.href) {
          return (
            <div key={item.label} className="flex items-center space-x-2">
              {content}
            </div>
          );
        }

        return (
          <div key={item.label} className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-2 text-sm font-normal"
              onClick={() => handleNavigation(item.href!)}
            >
              {content}
            </Button>

            {!isLast && (
              <Icon
                name="CHEVRON_RIGHT"
                className="h-4 w-4 text-gray-400 dark:text-gray-600"
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}

// Hook to generate breadcrumbs based on current path
interface UseBreadcrumbOptions {
  categoryName?: string;
  subcategoryName?: string;
  toolName?: string;
  customItems?: BreadcrumbItem[];
}

export function useBreadcrumbs(
  options: UseBreadcrumbOptions = {},
): BreadcrumbItem[] {
  const { categoryName, subcategoryName, toolName, customItems } = options;

  if (customItems) {
    return customItems;
  }

  const breadcrumb: BreadcrumbItem[] = [{ label: "Home", href: "/tools" }];

  if (categoryName) {
    breadcrumb.push({
      label: categoryName,
      href: `/tools/${categoryName.toLowerCase().replace(/\s+/g, "-")}`,
    });
  }

  if (subcategoryName) {
    breadcrumb.push({
      label: subcategoryName,
      href: `/tools/${categoryName?.toLowerCase().replace(/\s+/g, "-")}/${subcategoryName.toLowerCase().replace(/\s+/g, "-")}`,
    });
  }

  if (toolName) {
    breadcrumb.push({
      label: toolName,
      isActive: true,
    });
  }

  return breadcrumb;
}
