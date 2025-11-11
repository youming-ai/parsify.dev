/**
 * Tree Navigation Component
 * Implements keyboard navigation for hierarchical tree structures
 */

'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FocusableItem } from './focusable-item';
import { useKeyboardAnnouncements } from '@/hooks/use-keyboard-navigation';

export interface TreeNode {
	id: string;
	label: string;
	children?: TreeNode[];
	disabled?: boolean;
	selectable?: boolean;
	selected?: boolean;
	expanded?: boolean;
	data?: any;
}

interface TreeNavigationProps {
	items: TreeNode[];
	children: (node: TreeNode, depth: number, isSelected: boolean, isFocused: boolean, isExpanded: boolean) => React.ReactNode;
	onSelectionChange?: (node: TreeNode | null, path: number[]) => void;
	onExpansionChange?: (node: TreeNode, path: number[], expanded: boolean) => void;
	onNodeActivate?: (node: TreeNode, path: number[]) => void;
	selectedNodeId?: string;
	defaultExpandedNodes?: Set<string>;
	multiSelect?: boolean;
	showIcons?: boolean;
	indentSize?: number;
	className?: string;
	role?: 'tree' | 'treegrid';
	ariaLabel?: string;
}

export function TreeNavigation({
	items,
	children,
	onSelectionChange,
	onExpansionChange,
	onNodeActivate,
	selectedNodeId,
	defaultExpandedNodes = new Set(),
	multiSelect = false,
	showIcons = true,
	indentSize = 20,
	className,
	role = 'tree',
	ariaLabel,
}: TreeNavigationProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [focusedPath, setFocusedPath] = useState<number[]>([]);
	const [selectedPaths, setSelectedPaths] = useState<Set<string>>(() =>
		selectedNodeId ? new Set([selectedNodeId]) : new Set()
	);
	const [expandedNodes, setExpandedNodes] = useState<Set<string>>(defaultExpandedNodes);
	const { announce } = useKeyboardAnnouncements();

	// Flatten tree to array for navigation
	const flattenTree = useCallback((nodes: TreeNode[], parentPath: number[] = []): Array<{ node: TreeNode; path: number[]; depth: number }> => {
		const result: Array<{ node: TreeNode; path: number[]; depth: number }> = [];

		nodes.forEach((node, index) => {
			const currentPath = [...parentPath, index];
			result.push({ node, path: currentPath, depth: parentPath.length });

			if (node.children && expandedNodes.has(node.id)) {
				result.push(...flattenTree(node.children, currentPath));
			}
		});

		return result;
	}, [expandedNodes]);

	// Get node at specific path
	const getNodeAtPath = useCallback((path: number[]): TreeNode | null => {
		let current: TreeNode[] = items;
		let node: TreeNode | null = null;

		for (const index of path) {
			if (index >= 0 && index < current.length) {
				node = current[index];
				current = node.children || [];
			} else {
				return null;
			}
		}

		return node;
	}, [items]);

	// Find flat index from path
	const getFlatIndex = useCallback((targetPath: number[]): number => {
		const flattened = flattenTree();
		return flattened.findIndex(item =>
			item.path.length === targetPath.length &&
			item.path.every((index, i) => index === targetPath[i])
		);
	}, [flattenTree]);

	// Navigate to specific path
	const navigateTo = useCallback((path: number[]) => {
		const element = containerRef.current?.querySelector(`[data-node-path="${path.join('-')}"]`) as HTMLElement;
		if (element) {
			element.focus();
			setFocusedPath(path);

			const node = getNodeAtPath(path);
			if (node) {
				const depth = path.length;
				announce(`${node.label}, level ${depth + 1}`);
			}
			return true;
		}
		return false;
	}, [getNodeAtPath, announce]);

	// Navigate to next node
	const navigateNext = useCallback(() => {
		const flattened = flattenTree();
		const currentIndex = getFlatIndex(focusedPath);

		if (currentIndex < flattened.length - 1) {
			const nextNode = flattened[currentIndex + 1];
			navigateTo(nextNode.path);
		}
	}, [flattenTree, focusedPath, getFlatIndex, navigateTo]);

	// Navigate to previous node
	const navigatePrevious = useCallback(() => {
		const flattened = flattenTree();
		const currentIndex = getFlatIndex(focusedPath);

		if (currentIndex > 0) {
			const prevNode = flattened[currentIndex - 1];
			navigateTo(prevNode.path);
		}
	}, [flattenTree, focusedPath, getFlatIndex, navigateTo]);

	// Expand/collapse node
	const toggleExpansion = useCallback((path: number[]) => {
		const node = getNodeAtPath(path);
		if (!node || !node.children || node.children.length === 0) return;

		const nodeId = node.id;
		const isExpanded = expandedNodes.has(nodeId);
		const newExpanded = new Set(expandedNodes);

		if (isExpanded) {
			newExpanded.delete(nodeId);
		} else {
			newExpanded.add(nodeId);
		}

		setExpandedNodes(newExpanded);
		onExpansionChange?.(node, path, !isExpanded);

		const action = isExpanded ? 'Collapsed' : 'Expanded';
		announce(`${action} ${node.label}`);
	}, [getNodeAtPath, expandedNodes, onExpansionChange, announce]);

	// Select node
	const selectNode = useCallback((path: number[], additive = false) => {
		const node = getNodeAtPath(path);
		if (!node || !node.selectable) return;

		const nodeId = node.id;
		const newSelectedPaths = new Set(selectedPaths);

		if (additive && multiSelect) {
			if (newSelectedPaths.has(nodeId)) {
				newSelectedPaths.delete(nodeId);
			} else {
				newSelectedPaths.add(nodeId);
			}
		} else {
			newSelectedPaths.clear();
			newSelectedPaths.add(nodeId);
		}

		setSelectedPaths(newSelectedPaths);
		onSelectionChange?.(node, path);

		const action = newSelectedPaths.has(nodeId) ? 'Selected' : 'Deselected';
		announce(`${action} ${node.label}`);
	}, [getNodeAtPath, selectedPaths, multiSelect, onSelectionChange, announce]);

	// Handle keyboard events
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			let handled = false;

			switch (event.key) {
				case 'ArrowDown':
					event.preventDefault();
					navigateNext();
					handled = true;
					break;

				case 'ArrowUp':
					event.preventDefault();
					navigatePrevious();
					handled = true;
					break;

				case 'ArrowRight':
					event.preventDefault();
					if (focusedPath.length > 0) {
						const node = getNodeAtPath(focusedPath);
						if (node && node.children && node.children.length > 0) {
							if (!expandedNodes.has(node.id)) {
								toggleExpansion(focusedPath);
							} else {
								// Move to first child
								const childPath = [...focusedPath, 0];
								navigateTo(childPath);
							}
						}
					}
					handled = true;
					break;

				case 'ArrowLeft':
					event.preventDefault();
					if (focusedPath.length > 0) {
						const node = getNodeAtPath(focusedPath);
						if (node && node.children && expandedNodes.has(node.id)) {
							toggleExpansion(focusedPath);
						} else if (focusedPath.length > 1) {
							// Move to parent
							const parentPath = focusedPath.slice(0, -1);
							navigateTo(parentPath);
						}
					}
					handled = true;
					break;

				case 'Home':
					event.preventDefault();
					const flattened = flattenTree();
					if (flattened.length > 0) {
						navigateTo(flattened[0].path);
					}
					handled = true;
					break;

				case 'End':
					event.preventDefault();
					const allNodes = flattenTree();
					if (allNodes.length > 0) {
						navigateTo(allNodes[allNodes.length - 1].path);
					}
					handled = true;
					break;

				case 'Enter':
				case ' ':
					if (focusedPath.length > 0) {
						event.preventDefault();
						const node = getNodeAtPath(focusedPath);
						if (node) {
							onNodeActivate?.(node, focusedPath);
							selectNode(focusedPath, event.ctrlKey || event.metaKey);
						}
					}
					handled = true;
					break;

				case '*':
					// Expand all siblings
					if (focusedPath.length > 0) {
						event.preventDefault();
						const parentPath = focusedPath.slice(0, -1);
						const siblings = parentPath.length === 0 ? items : getNodeAtPath(parentPath)?.children || [];

						const newExpanded = new Set(expandedNodes);
						siblings.forEach(sibling => {
							if (sibling.children && sibling.children.length > 0) {
								newExpanded.add(sibling.id);
							}
						});

						setExpandedNodes(newExpanded);
						announce('Expanded all siblings');
					}
					handled = true;
					break;
			}

			if (handled) {
				event.stopPropagation();
			}
		};

		container.addEventListener('keydown', handleKeyDown);

		return () => {
			container.removeEventListener('keydown', handleKeyDown);
		};
	}, [focusedPath, items, navigateNext, navigatePrevious, navigateTo, toggleExpansion, getNodeAtPath, expandedNodes, flattenTree, onNodeActivate, selectNode, announce]);

	// Handle focus changes
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const handleFocusIn = (event: FocusEvent) => {
			const target = event.target as HTMLElement;
			const nodeElement = target.closest('[data-node-path]');
			if (nodeElement) {
				const pathString = nodeElement.getAttribute('data-node-path');
				if (pathString) {
					const path = pathString.split('-').map(Number);
					setFocusedPath(path);
				}
			}
		};

		const handleFocusOut = () => {
			setFocusedPath([]);
		};

		container.addEventListener('focusin', handleFocusIn);
		container.addEventListener('focusout', handleFocusOut);

		return () => {
			container.removeEventListener('focusin', handleFocusIn);
			container.removeEventListener('focusout', handleFocusOut);
		};
	}, []);

	// Sync with external selection
	useEffect(() => {
		if (selectedNodeId) {
			setSelectedPaths(new Set([selectedNodeId]));
		}
	}, [selectedNodeId]);

	// Render tree recursively
	const renderNode = useCallback((node: TreeNode, path: number[], depth: number = 0) => {
		const nodeId = node.id;
		const isSelected = selectedPaths.has(nodeId);
		const isFocused = focusedPath.length === path.length &&
			focusedPath.every((index, i) => index === path[i]);
		const isExpanded = expandedNodes.has(nodeId);
		const hasChildren = node.children && node.children.length > 0;

		return (
			<div key={nodeId} role="none">
				<div
					data-node-path={path.join('-')}
					role="treeitem"
					aria-expanded={hasChildren ? isExpanded : undefined}
					aria-selected={isSelected}
					aria-level={depth + 1}
					aria-setsize={depth === 0 ? items.length : undefined}
					aria-posinset={path[path.length - 1] + 1}
					tabIndex={isFocused ? 0 : -1}
					style={{
						paddingLeft: `${depth * indentSize}px`,
					}}
				>
					{children(node, depth, isSelected, isFocused, isExpanded)}
				</div>
				{hasChildren && isExpanded && (
					<div role="group">
						{node.children!.map((child, index) =>
							renderNode(child, [...path, index], depth + 1)
						)}
					</div>
				)}
			</div>
		);
	}, [selectedPaths, focusedPath, expandedNodes, items, children, indentSize]);

	return (
		<div
			ref={containerRef}
			className={className}
			role={role}
			aria-label={ariaLabel}
			aria-multiselectable={multiSelect}
			tabIndex={0}
		>
			{items.map((item, index) => renderNode(item, [index]))}
		</div>
	);
}
