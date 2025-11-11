"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Icon, ICONS } from "@/components/ui/material-symbols";
import { cn } from "@/lib/utils";
import {
  CATEGORIES_METADATA,
  getAllCategories,
  getFeaturedCategories,
  type CategoryMetadata,
} from "@/lib/category-utils";
import type { ToolCategory } from "@/types/tools";

interface CategoryNavigationProps {
  activeCategory?: ToolCategory;
  activeSubcategory?: string;
  className?: string;
  showMobileMenu?: boolean;
}

interface CategoryItemProps {
  category: CategoryMetadata;
  isActive: boolean;
  activeSubcategory?: string;
  onSelect: (category: CategoryMetadata) => void;
  onSubcategorySelect: (
    category: CategoryMetadata,
    subcategory: string,
  ) => void;
  isMobile?: boolean;
}

const CategoryItem = ({
  category,
  isActive,
  activeSubcategory,
  onSelect,
  onSubcategorySelect,
  isMobile = false,
}: CategoryItemProps) => {
  const [isExpanded, setIsExpanded] = useState(isActive || category.featured);

  const getCategoryColor = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: "bg-blue-500 hover:bg-blue-600",
      green: "bg-green-500 hover:bg-green-600",
      purple: "bg-purple-500 hover:bg-purple-600",
      cyan: "bg-cyan-500 hover:bg-cyan-600",
      orange: "bg-orange-500 hover:bg-orange-500",
      red: "bg-red-500 hover:bg-red-600",
    };
    return colorMap[color] || "bg-gray-500 hover:bg-gray-600";
  };

  const getCategoryBorderColor = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: "border-blue-200 dark:border-blue-800",
      green: "border-green-200 dark:border-green-800",
      purple: "border-purple-200 dark:border-purple-800",
      cyan: "border-cyan-200 dark:border-cyan-800",
      orange: "border-orange-200 dark:border-orange-800",
      red: "border-red-200 dark:border-red-800",
    };
    return colorMap[color] || "border-gray-200 dark:border-gray-800";
  };

  const handleCategoryClick = () => {
    onSelect(category);
  };

  const handleSubcategoryClick = (subcategory: string) => {
    onSubcategorySelect(category, subcategory);
  };

  if (isMobile) {
    return (
      <div className="space-y-2">
        <Button
          variant={isActive ? "default" : "ghost"}
          className={cn(
            "w-full justify-start h-auto p-2 sm:p-3 touch-manipulation",
            isActive && getCategoryColor(category.color),
          )}
          onClick={handleCategoryClick}
        >
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Icon
              name={category.icon as keyof typeof ICONS}
              className="text-base sm:text-lg flex-shrink-0"
            />
            <div className="text-left flex-1 min-w-0">
              <div className="font-medium text-sm sm:text-base truncate">
                {category.name}
              </div>
              <div className="text-xs opacity-80">
                {category.toolCount} tools
              </div>
            </div>
          </div>
        </Button>

        {category.subcategories && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start pl-8 sm:pl-10 text-sm touch-manipulation"
              >
                <Icon
                  name="CHEVRON_RIGHT"
                  className={cn(
                    "mr-2 h-4 w-4 transition-transform flex-shrink-0",
                    isExpanded && "rotate-90",
                  )}
                />
                Subcategories
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 pl-8 sm:pl-10">
              {Object.entries(category.subcategories).map(
                ([key, subcategory]) => (
                  <Button
                    key={key}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start text-sm touch-manipulation",
                      activeSubcategory === key && "bg-primary/10 text-primary",
                    )}
                    onClick={() => handleSubcategoryClick(key)}
                  >
                    <span className="truncate flex-1 text-left">
                      {subcategory.name}
                    </span>
                    <Badge
                      variant="secondary"
                      className="ml-auto text-xs flex-shrink-0"
                    >
                      {subcategory.toolIds.length}
                    </Badge>
                  </Button>
                ),
              )}
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border rounded-lg p-3 sm:p-4 transition-all duration-200",
        getCategoryBorderColor(category.color),
        isActive && "shadow-md",
        "hover:shadow-md",
      )}
    >
      {/* Category Header */}
      <div
        className="flex items-center justify-between cursor-pointer mb-3"
        onClick={handleCategoryClick}
      >
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div
            className={cn(
              "w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0",
              getCategoryColor(category.color),
            )}
          >
            <Icon
              name={category.icon as keyof typeof ICONS}
              className="text-lg sm:text-xl"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
              {category.name}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {category.description}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          <Badge variant="secondary" className="text-xs">
            {category.toolCount}
          </Badge>
          {category.featured && (
            <Badge
              variant="default"
              className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
            >
              Featured
            </Badge>
          )}
        </div>
      </div>

      {/* Subcategories */}
      {category.subcategories && (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <Icon
                name="CHEVRON_RIGHT"
                className={cn(
                  "mr-2 h-4 w-4 transition-transform",
                  isExpanded && "rotate-90",
                )}
              />
              {Object.keys(category.subcategories).length} Subcategories
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-3">
            {Object.entries(category.subcategories).map(
              ([key, subcategory]) => (
                <div
                  key={key}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors",
                    activeSubcategory === key
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800",
                  )}
                  onClick={() => handleSubcategoryClick(key)}
                >
                  <div>
                    <div className="font-medium text-sm">
                      {subcategory.name}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {subcategory.description}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {subcategory.toolIds.length}
                  </Badge>
                </div>
              ),
            )}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

export function CategoryNavigation({
  activeCategory,
  activeSubcategory,
  className,
  showMobileMenu = true,
}: CategoryNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const categories = getAllCategories();
  const featuredCategories = getFeaturedCategories();

  const handleCategorySelect = (category: CategoryMetadata) => {
    router.push(`/tools/${category.slug}`);
    setIsMobileMenuOpen(false);
  };

  const handleSubcategorySelect = (
    category: CategoryMetadata,
    subcategory: string,
  ) => {
    router.push(
      `/tools/${category.slug}/${subcategory.toLowerCase().replace(/\s+/g, "-")}`,
    );
    setIsMobileMenuOpen(false);
  };

  const isActiveCategory = (category: CategoryMetadata) => {
    return activeCategory === category.name;
  };

  // Desktop Sidebar
  const DesktopNavigation = () => (
    <div className={cn("hidden lg:block space-y-6", className)}>
      {/* Featured Categories */}
      {featuredCategories.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Icon name="STAR" className="mr-2 text-yellow-500" />
            Featured Categories
          </h2>
          <div className="space-y-3">
            {featuredCategories.map((category) => (
              <CategoryItem
                key={category.id}
                category={category}
                isActive={isActiveCategory(category)}
                activeSubcategory={activeSubcategory}
                onSelect={handleCategorySelect}
                onSubcategorySelect={handleSubcategorySelect}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Categories */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Icon name="CATEGORY" className="mr-2" />
          All Categories
        </h2>
        <div className="space-y-3">
          {categories.map((category) => (
            <CategoryItem
              key={category.id}
              category={category}
              isActive={isActiveCategory(category)}
              activeSubcategory={activeSubcategory}
              onSelect={handleCategorySelect}
              onSubcategorySelect={handleSubcategorySelect}
            />
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">
          Quick Stats
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">
              Total Categories
            </span>
            <span className="font-medium">{categories.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">
              Total Tools
            </span>
            <span className="font-medium">
              {categories.reduce((sum, cat) => sum + cat.toolCount, 0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Featured</span>
            <span className="font-medium">{featuredCategories.length}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Mobile Navigation
  const MobileNavigation = () => (
    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden">
          <Icon name="MENU" className="mr-2 h-4 w-4" />
          Categories
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 overflow-y-auto">
        <div className="space-y-6 py-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Icon name="CODE" className="text-white text-sm" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Categories
            </h2>
          </div>

          {/* Featured Categories */}
          {featuredCategories.length > 0 && (
            <div>
              <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <Icon name="STAR" className="mr-2 text-yellow-500" />
                Featured
              </h3>
              <div className="space-y-2">
                {featuredCategories.map((category) => (
                  <CategoryItem
                    key={category.id}
                    category={category}
                    isActive={isActiveCategory(category)}
                    activeSubcategory={activeSubcategory}
                    onSelect={handleCategorySelect}
                    onSubcategorySelect={handleSubcategorySelect}
                    isMobile
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Categories */}
          <div>
            <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
              All Categories
            </h3>
            <div className="space-y-2">
              {categories.map((category) => (
                <CategoryItem
                  key={category.id}
                  category={category}
                  isActive={isActiveCategory(category)}
                  activeSubcategory={activeSubcategory}
                  onSelect={handleCategorySelect}
                  onSubcategorySelect={handleSubcategorySelect}
                  isMobile
                />
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <>
      <DesktopNavigation />
      {showMobileMenu && <MobileNavigation />}
    </>
  );
}
