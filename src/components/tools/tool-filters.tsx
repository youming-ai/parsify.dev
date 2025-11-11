"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Icon, ICONS } from "@/components/ui/material-symbols";
import { cn } from "@/lib/utils";
import type {
  Tool,
  ToolCategory,
  ToolDifficulty,
  ProcessingType,
  SecurityType,
  SearchState,
  FilterOptions,
} from "@/types/tools";

interface ToolFiltersProps {
  tools: Tool[];
  filters: Partial<SearchState>;
  onFiltersChange: (filters: Partial<SearchState>) => void;
  className?: string;
}

interface FilterSectionProps {
  title: string;
  icon: keyof typeof ICONS;
  items: Array<{
    id: string;
    label: string;
    count: number;
    color?: string;
  }>;
  selectedItems: string[];
  onItemChange: (itemId: string, checked: boolean) => void;
  defaultOpen?: boolean;
}

// Filter Section Component
function FilterSection({
  title,
  icon,
  items,
  selectedItems,
  onItemChange,
  defaultOpen = true,
}: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const hasSelections = selectedItems.length > 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-between p-2 sm:p-3 h-auto hover:bg-gray-50 dark:hover:bg-gray-800 touch-manipulation",
            hasSelections && "font-semibold",
          )}
        >
          <div className="flex items-center gap-2">
            <Icon
              name={icon}
              className="text-gray-600 dark:text-gray-400 text-sm sm:text-base"
            />
            <span className="text-xs sm:text-sm">{title}</span>
            {hasSelections && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {selectedItems.length}
              </Badge>
            )}
          </div>
          <Icon
            name={isOpen ? "EXPAND_LESS" : "EXPAND_MORE"}
            className="text-gray-400 text-sm sm:text-base"
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 px-2 sm:px-3 pb-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center space-x-2">
            <Checkbox
              id={`${title}-${item.id}`}
              checked={selectedItems.includes(item.id)}
              onCheckedChange={(checked) =>
                onItemChange(item.id, checked as boolean)
              }
              className="touch-manipulation"
            />
            <label
              htmlFor={`${title}-${item.id}`}
              className="flex-1 flex items-center justify-between text-xs sm:text-sm cursor-pointer touch-manipulation"
            >
              <span className="text-gray-700 dark:text-gray-300 truncate">
                {item.label}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs flex-shrink-0",
                  item.color && item.color.includes("text-") && item.color,
                )}
              >
                {item.count}
              </Badge>
            </label>
          </div>
        ))}
      </CollapsibleContent>
      <Separator className="my-2" />
    </Collapsible>
  );
}

// Main Filters Component
export function ToolFilters({
  tools,
  filters,
  onFiltersChange,
  className,
}: ToolFiltersProps) {
  // Calculate item counts for each filter option
  const getFilterOptions = useCallback(() => {
    const categories = tools.reduce(
      (acc, tool) => {
        const category = tool.category;
        if (!acc[category]) {
          acc[category] = { id: category, label: category, count: 0 };
        }
        acc[category].count++;
        return acc;
      },
      {} as Record<string, { id: string; label: string; count: number }>,
    );

    const difficulties = tools.reduce(
      (acc, tool) => {
        const difficulty = tool.difficulty;
        if (!acc[difficulty]) {
          acc[difficulty] = {
            id: difficulty,
            label: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
            count: 0,
          };
        }
        acc[difficulty].count++;
        return acc;
      },
      {} as Record<string, { id: string; label: string; count: number }>,
    );

    const processingTypes = tools.reduce(
      (acc, tool) => {
        const type = tool.processingType;
        if (!acc[type]) {
          acc[type] = {
            id: type,
            label: type
              .replace("-", " ")
              .replace(/\b\w/g, (l) => l.toUpperCase()),
            count: 0,
          };
        }
        acc[type].count++;
        return acc;
      },
      {} as Record<string, { id: string; label: string; count: number }>,
    );

    const securityTypes = tools.reduce(
      (acc, tool) => {
        const type = tool.security;
        if (!acc[type]) {
          acc[type] = {
            id: type,
            label: type
              .replace("-", " ")
              .replace(/\b\w/g, (l) => l.toUpperCase()),
            count: 0,
          };
        }
        acc[type].count++;
        return acc;
      },
      {} as Record<string, { id: string; label: string; count: number }>,
    );

    const features = tools.reduce(
      (acc, tool) => {
        tool.features.forEach((feature) => {
          if (!acc[feature]) {
            acc[feature] = { id: feature, label: feature, count: 0 };
          }
          acc[feature].count++;
        });
        return acc;
      },
      {} as Record<string, { id: string; label: string; count: number }>,
    );

    const tags = tools.reduce(
      (acc, tool) => {
        tool.tags.forEach((tag) => {
          if (!acc[tag]) {
            acc[tag] = { id: tag, label: tag, count: 0 };
          }
          acc[tag].count++;
        });
        return acc;
      },
      {} as Record<string, { id: string; label: string; count: number }>,
    );

    const status = tools.reduce(
      (acc, tool) => {
        const toolStatus = tool.status;
        if (!acc[toolStatus]) {
          acc[toolStatus] = {
            id: toolStatus,
            label: toolStatus.charAt(0).toUpperCase() + toolStatus.slice(1),
            count: 0,
          };
        }
        acc[toolStatus].count++;
        return acc;
      },
      {} as Record<string, { id: string; label: string; count: number }>,
    );

    return {
      categories: Object.values(categories),
      difficulties: Object.values(difficulties),
      processingTypes: Object.values(processingTypes),
      securityTypes: Object.values(securityTypes),
      features: Object.values(features)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      tags: Object.values(tags)
        .sort((a, b) => b.count - a.count)
        .slice(0, 15),
      status: Object.values(status),
    };
  }, [tools]);

  const filterOptions = getFilterOptions();

  // Handle filter changes
  const handleFilterChange = useCallback(
    (filterType: keyof SearchState, itemId: string, checked: boolean) => {
      const currentFilters = (filters[filterType] as string[]) || [];
      let newFilters: string[];

      if (checked) {
        newFilters = [...currentFilters, itemId];
      } else {
        newFilters = currentFilters.filter((id) => id !== itemId);
      }

      onFiltersChange({
        ...filters,
        [filterType]: newFilters,
      });
    },
    [filters, onFiltersChange],
  );

  // Handle boolean filters (isNew, isPopular)
  const handleBooleanFilterChange = useCallback(
    (filterType: "isNew" | "isPopular", value: boolean | null) => {
      onFiltersChange({
        ...filters,
        [filterType]: value,
      });
    },
    [filters, onFiltersChange],
  );

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    onFiltersChange({
      query: filters.query || "",
      categories: [],
      difficulties: [],
      processingTypes: [],
      securityTypes: [],
      features: [],
      tags: [],
      status: [],
      isNew: null,
      isPopular: null,
    });
  }, [filters.query, onFiltersChange]);

  // Get active filters count
  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    count += filters.categories?.length || 0;
    count += filters.difficulties?.length || 0;
    count += filters.processingTypes?.length || 0;
    count += filters.securityTypes?.length || 0;
    count += filters.features?.length || 0;
    count += filters.tags?.length || 0;
    count += filters.status?.length || 0;
    if (filters.isNew !== null) count++;
    if (filters.isPopular !== null) count++;
    return count;
  }, [filters]);

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card className={cn("w-full max-w-xs", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Icon name="FILTER_LIST" className="text-sm sm:text-base" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs h-6 px-2 touch-manipulation"
            >
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-1 max-h-96 sm:max-h-none overflow-y-auto">
        {/* Categories Filter */}
        <FilterSection
          title="Categories"
          icon="CATEGORY"
          items={filterOptions.categories}
          selectedItems={filters.categories || []}
          onItemChange={(itemId, checked) =>
            handleFilterChange("categories", itemId, checked)
          }
          defaultOpen={true}
        />

        {/* Difficulty Filter */}
        <FilterSection
          title="Difficulty"
          icon="SIGNAL_CELLULAR_ALT"
          items={filterOptions.difficulties}
          selectedItems={filters.difficulties || []}
          onItemChange={(itemId, checked) =>
            handleFilterChange("difficulties", itemId, checked)
          }
          defaultOpen={false}
        />

        {/* Processing Type Filter */}
        <FilterSection
          title="Processing"
          icon="COMPUTER"
          items={filterOptions.processingTypes}
          selectedItems={filters.processingTypes || []}
          onItemChange={(itemId, checked) =>
            handleFilterChange("processingTypes", itemId, checked)
          }
          defaultOpen={false}
        />

        {/* Security Type Filter */}
        <FilterSection
          title="Security"
          icon="SECURITY"
          items={filterOptions.securityTypes}
          selectedItems={filters.securityTypes || []}
          onItemChange={(itemId, checked) =>
            handleFilterChange("securityTypes", itemId, checked)
          }
          defaultOpen={false}
        />

        {/* Features Filter */}
        <FilterSection
          title="Features"
          icon="STAR"
          items={filterOptions.features}
          selectedItems={filters.features || []}
          onItemChange={(itemId, checked) =>
            handleFilterChange("features", itemId, checked)
          }
          defaultOpen={false}
        />

        {/* Tags Filter */}
        <FilterSection
          title="Tags"
          icon="TAG"
          items={filterOptions.tags}
          selectedItems={filters.tags || []}
          onItemChange={(itemId, checked) =>
            handleFilterChange("tags", itemId, checked)
          }
          defaultOpen={false}
        />

        {/* Status Filter */}
        <FilterSection
          title="Status"
          icon="INFO"
          items={filterOptions.status}
          selectedItems={filters.status || []}
          onItemChange={(itemId, checked) =>
            handleFilterChange("status", itemId, checked)
          }
          defaultOpen={false}
        />

        {/* Special Filters */}
        <div className="space-y-3 pt-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white px-3">
            Special Filters
          </h4>

          <div className="space-y-2 px-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="filter-new"
                checked={filters.isNew === true}
                onCheckedChange={(checked) =>
                  handleBooleanFilterChange("isNew", checked ? true : null)
                }
              />
              <label
                htmlFor="filter-new"
                className="flex items-center gap-2 text-sm cursor-pointer flex-1"
              >
                <span className="text-gray-700 dark:text-gray-300">
                  New Tools
                </span>
                <Badge
                  variant="secondary"
                  className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                >
                  {tools.filter((tool) => tool.isNew).length}
                </Badge>
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="filter-popular"
                checked={filters.isPopular === true}
                onCheckedChange={(checked) =>
                  handleBooleanFilterChange("isPopular", checked ? true : null)
                }
              />
              <label
                htmlFor="filter-popular"
                className="flex items-center gap-2 text-sm cursor-pointer flex-1"
              >
                <span className="text-gray-700 dark:text-gray-300">
                  Popular Tools
                </span>
                <Badge
                  variant="secondary"
                  className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                >
                  {tools.filter((tool) => tool.isPopular).length}
                </Badge>
              </label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Active Filters Display Component
interface ActiveFiltersProps {
  filters: Partial<SearchState>;
  onRemoveFilter: (filterType: keyof SearchState, value?: string) => void;
  onClearAll: () => void;
  className?: string;
}

export function ActiveFilters({
  filters,
  onRemoveFilter,
  onClearAll,
  className,
}: ActiveFiltersProps) {
  const getActiveFilters = useCallback(() => {
    const activeFilters: Array<{
      type: keyof SearchState;
      label: string;
      value?: string;
    }> = [];

    Object.entries(filters).forEach(([key, value]) => {
      if (!value) return;

      switch (key) {
        case "categories":
          (value as string[]).forEach((cat) => {
            activeFilters.push({
              type: "categories",
              label: cat,
              value: cat,
            });
          });
          break;
        case "difficulties":
          (value as string[]).forEach((diff) => {
            activeFilters.push({
              type: "difficulties",
              label: diff.charAt(0).toUpperCase() + diff.slice(1),
              value: diff,
            });
          });
          break;
        case "processingTypes":
          (value as string[]).forEach((type) => {
            activeFilters.push({
              type: "processingTypes",
              label: type.replace("-", " "),
              value: type,
            });
          });
          break;
        case "securityTypes":
          (value as string[]).forEach((type) => {
            activeFilters.push({
              type: "securityTypes",
              label: type.replace("-", " "),
              value: type,
            });
          });
          break;
        case "features":
          (value as string[]).forEach((feature) => {
            activeFilters.push({
              type: "features",
              label: feature,
              value: feature,
            });
          });
          break;
        case "tags":
          (value as string[]).forEach((tag) => {
            activeFilters.push({
              type: "tags",
              label: tag,
              value: tag,
            });
          });
          break;
        case "status":
          (value as string[]).forEach((status) => {
            activeFilters.push({
              type: "status",
              label: status.charAt(0).toUpperCase() + status.slice(1),
              value: status,
            });
          });
          break;
        case "isNew":
          if (value === true) {
            activeFilters.push({
              type: "isNew",
              label: "New Tools",
            });
          }
          break;
        case "isPopular":
          if (value === true) {
            activeFilters.push({
              type: "isPopular",
              label: "Popular",
            });
          }
          break;
      }
    });

    return activeFilters;
  }, [filters]);

  const activeFilters = getActiveFilters();

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap gap-2 items-center", className)}>
      <span className="text-sm text-gray-600 dark:text-gray-400">
        Active filters:
      </span>
      {activeFilters.map((filter, index) => (
        <Badge
          key={`${filter.type}-${filter.value || index}`}
          variant="secondary"
          className="flex items-center gap-1 pr-1"
        >
          <span>{filter.label}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={() => onRemoveFilter(filter.type, filter.value)}
          >
            <Icon name="CLOSE" className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="text-xs h-6 px-2"
      >
        Clear All
      </Button>
    </div>
  );
}
