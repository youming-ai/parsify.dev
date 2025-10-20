import {
  IWasmModule,
  IWasmModuleRegistry,
  WasmModuleMetadata,
  ModuleUpdate
} from '../interfaces/wasm-module.interface'

/**
 * In-memory WASM module registry implementation
 */
export class WasmModuleRegistry implements IWasmModuleRegistry {
  private modules: Map<string, IWasmModule> = new Map()
  private moduleMetadata: Map<string, WasmModuleMetadata> = new Map()
  private categories: Map<string, Set<string>> = new Map()
  private initialized = false

  constructor() {
    this.initialize()
  }

  /**
   * Initialize the registry
   */
  private async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      // Initialize built-in modules
      await this.registerBuiltinModules()
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize WASM module registry:', error)
      throw new Error(`Registry initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Register built-in modules
   */
  private async registerBuiltinModules(): Promise<void> {
    // This will be populated when we create the actual module implementations
    // For now, the registry starts empty and modules are registered dynamically
  }

  /**
   * Register a new module
   */
  async registerModule(module: IWasmModule): Promise<void> {
    if (!module) {
      throw new Error('Module cannot be null or undefined')
    }

    const moduleId = module.id

    // Check if module already exists
    if (this.modules.has(moduleId)) {
      throw new Error(`Module with ID '${moduleId}' is already registered`)
    }

    try {
      // Validate module
      await this.validateModule(module)

      // Get module metadata
      const metadata = module.getMetadata()

      // Register module
      this.modules.set(moduleId, module)
      this.moduleMetadata.set(moduleId, metadata)

      // Add to category
      if (!this.categories.has(metadata.category)) {
        this.categories.set(metadata.category, new Set())
      }
      this.categories.get(metadata.category)!.add(moduleId)

      console.log(`Registered WASM module: ${moduleId} (${metadata.name} v${metadata.version})`)
    } catch (error) {
      throw new Error(`Failed to register module '${moduleId}': ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Unregister a module
   */
  async unregisterModule(moduleId: string): Promise<void> {
    if (!this.modules.has(moduleId)) {
      throw new Error(`Module with ID '${moduleId}' is not registered`)
    }

    try {
      const module = this.modules.get(moduleId)!
      const metadata = module.getMetadata()

      // Dispose module
      await module.dispose()

      // Remove from registry
      this.modules.delete(moduleId)
      this.moduleMetadata.delete(moduleId)

      // Remove from category
      const categoryModules = this.categories.get(metadata.category)
      if (categoryModules) {
        categoryModules.delete(moduleId)
        if (categoryModules.size === 0) {
          this.categories.delete(metadata.category)
        }
      }

      console.log(`Unregistered WASM module: ${moduleId}`)
    } catch (error) {
      throw new Error(`Failed to unregister module '${moduleId}': ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get a module by ID
   */
  async getModule(moduleId: string): Promise<IWasmModule | null> {
    return this.modules.get(moduleId) || null
  }

  /**
   * List all registered modules
   */
  async listModules(category?: string): Promise<IWasmModule[]> {
    if (category) {
      const categoryModules = this.categories.get(category)
      if (!categoryModules) {
        return []
      }

      const modules: IWasmModule[] = []
      for (const moduleId of categoryModules) {
        const module = this.modules.get(moduleId)
        if (module) {
          modules.push(module)
        }
      }
      return modules
    }

    return Array.from(this.modules.values())
  }

  /**
   * Search modules by name, description, or tags
   */
  async searchModules(query: string): Promise<IWasmModule[]> {
    if (!query || query.trim() === '') {
      return this.listModules()
    }

    const searchTerm = query.toLowerCase().trim()
    const results: IWasmModule[] = []

    for (const [moduleId, module] of this.modules) {
      const metadata = this.moduleMetadata.get(moduleId)
      if (!metadata) {
        continue
      }

      // Search in name, description, and category
      const nameMatch = metadata.name.toLowerCase().includes(searchTerm)
      const descriptionMatch = metadata.description.toLowerCase().includes(searchTerm)
      const categoryMatch = metadata.category.toLowerCase().includes(searchTerm)
      const capabilityMatch = metadata.capabilities.some(cap =>
        cap.toLowerCase().includes(searchTerm)
      )

      if (nameMatch || descriptionMatch || categoryMatch || capabilityMatch) {
        results.push(module)
      }
    }

    return results
  }

  /**
   * Get modules by category
   */
  async getModulesByCategory(category: string): Promise<IWasmModule[]> {
    return this.listModules(category)
  }

  /**
   * Get all available categories
   */
  async getCategories(): Promise<string[]> {
    return Array.from(this.categories.keys()).sort()
  }

  /**
   * Check for module updates
   */
  async checkForUpdates(): Promise<ModuleUpdate[]> {
    const updates: ModuleUpdate[] = []

    for (const [moduleId, module] of this.modules) {
      try {
        const metadata = module.getMetadata()

        // In a real implementation, this would check against a remote registry
        // For now, we'll just return no updates
        // This could be extended to check GitHub releases, npm packages, etc.

        // Example of what an update check might look like:
        // const latestVersion = await this.getLatestVersion(moduleId)
        // if (this.isNewerVersion(latestVersion, metadata.version)) {
        //   updates.push({
        //     moduleId,
        //     currentVersion: metadata.version,
        //     availableVersion: latestVersion,
        //     updateType: this.getUpdateType(metadata.version, latestVersion),
        //     description: `Update available for ${metadata.name}`,
        //     breakingChanges: this.hasBreakingChanges(metadata.version, latestVersion)
        //   })
        // }
      } catch (error) {
        console.warn(`Failed to check updates for module '${moduleId}':`, error)
      }
    }

    return updates
  }

  /**
   * Update a module to a new version
   */
  async updateModule(moduleId: string, version?: string): Promise<void> {
    if (!this.modules.has(moduleId)) {
      throw new Error(`Module with ID '${moduleId}' is not registered`)
    }

    try {
      const currentModule = this.modules.get(moduleId)!
      const currentMetadata = currentModule.getMetadata()

      // In a real implementation, this would download and install the new version
      // For now, we'll just dispose and reinitialize the module
      await currentModule.dispose()
      await this.modules.delete(moduleId)

      // This would be replaced with actual module loading logic
      // const newModule = await this.loadModuleVersion(moduleId, version)
      // await this.registerModule(newModule)

      console.log(`Module '${moduleId}' would be updated to version ${version || 'latest'}`)
    } catch (error) {
      throw new Error(`Failed to update module '${moduleId}': ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get module metadata
   */
  async getModuleMetadata(moduleId: string): Promise<WasmModuleMetadata | null> {
    return this.moduleMetadata.get(moduleId) || null
  }

  /**
   * Get all module metadata
   */
  async getAllModuleMetadata(): Promise<WasmModuleMetadata[]> {
    return Array.from(this.moduleMetadata.values())
  }

  /**
   * Validate a module before registration
   */
  private async validateModule(module: IWasmModule): Promise<void> {
    // Check required properties
    if (!module.id || typeof module.id !== 'string') {
      throw new Error('Module must have a valid ID')
    }

    if (!module.name || typeof module.name !== 'string') {
      throw new Error('Module must have a valid name')
    }

    if (!module.version || typeof module.version !== 'string') {
      throw new Error('Module must have a valid version')
    }

    // Check version format (semantic versioning)
    if (!this.isValidVersion(module.version)) {
      throw new Error(`Invalid version format: ${module.version}`)
    }

    // Check compatibility
    const isCompatible = await module.isCompatible()
    if (!isCompatible) {
      throw new Error('Module is not compatible with the current environment')
    }

    // Check dependencies
    const metadata = module.getMetadata()
    for (const dependency of metadata.dependencies) {
      if (!this.modules.has(dependency)) {
        console.warn(`Module '${module.id}' depends on '${dependency}' which is not registered`)
      }
    }
  }

  /**
   * Check if version string follows semantic versioning
   */
  private isValidVersion(version: string): boolean {
    const semanticVersionRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9\-\.]+)?(\+[a-zA-Z0-9\-\.]+)?$/
    return semanticVersionRegex.test(version)
  }

  /**
   * Check if a version is newer than another
   */
  private isNewerVersion(newVersion: string, currentVersion: string): boolean {
    const parseVersion = (version: string) => {
      const [main, prerelease] = version.split('-')
      const [major, minor, patch] = main.split('.').map(Number)
      return { major, minor, patch, prerelease }
    }

    const newVer = parseVersion(newVersion)
    const currentVer = parseVersion(currentVersion)

    // Compare major version
    if (newVer.major > currentVer.major) return true
    if (newVer.major < currentVer.major) return false

    // Compare minor version
    if (newVer.minor > currentVer.minor) return true
    if (newVer.minor < currentVer.minor) return false

    // Compare patch version
    if (newVer.patch > currentVer.patch) return true
    if (newVer.patch < currentVer.patch) return false

    // For same version, consider prerelease
    if (!newVer.prerelease && currentVer.prerelease) return true
    if (newVer.prerelease && !currentVer.prerelease) return false

    return false
  }

  /**
   * Determine update type based on version difference
   */
  private getUpdateType(currentVersion: string, newVersion: string): ModuleUpdate['updateType'] {
    const current = currentVersion.split('.').map(Number)
    const newVer = newVersion.split('.').map(Number)

    if (newVer[0] > current[0]) return 'major'
    if (newVer[1] > current[1]) return 'minor'
    return 'patch'
  }

  /**
   * Check if update has breaking changes
   */
  private hasBreakingChanges(currentVersion: string, newVersion: string): boolean {
    const updateType = this.getUpdateType(currentVersion, newVersion)
    return updateType === 'major'
  }

  /**
   * Get registry statistics
   */
  async getRegistryStats(): Promise<{
    totalModules: number
    totalCategories: number
    initializedModules: number
    totalExecutions: number
    memoryUsage: number
  }> {
    let initializedModules = 0
    let totalExecutions = 0
    let memoryUsage = 0

    for (const [moduleId, metadata] of this.moduleMetadata) {
      const module = this.modules.get(moduleId)
      if (module && module.isInitialized()) {
        initializedModules++
      }
      totalExecutions += metadata.executionCount
      memoryUsage += metadata.memoryUsage
    }

    return {
      totalModules: this.modules.size,
      totalCategories: this.categories.size,
      initializedModules,
      totalExecutions,
      memoryUsage
    }
  }

  /**
   * Clear all modules from registry
   */
  async clear(): Promise<void> {
    const moduleIds = Array.from(this.modules.keys())

    for (const moduleId of moduleIds) {
      try {
        await this.unregisterModule(moduleId)
      } catch (error) {
        console.error(`Failed to unregister module '${moduleId}' during clear:`, error)
      }
    }

    this.categories.clear()
    this.initialized = false
  }

  /**
   * Export registry configuration
   */
  async exportRegistry(): Promise<{
    modules: WasmModuleMetadata[]
    categories: string[]
    exportedAt: string
  }> {
    return {
      modules: Array.from(this.moduleMetadata.values()),
      categories: Array.from(this.categories.keys()),
      exportedAt: new Date().toISOString()
    }
  }

  /**
   * Import registry configuration
   */
  async importRegistry(config: {
    modules: WasmModuleMetadata[]
    categories: string[]
  }): Promise<void> {
    // This would be used to restore a previously exported registry state
    // Implementation would depend on how modules are loaded and instantiated
    console.log('Registry import not yet implemented')
  }
}

// Create singleton instance
export const wasmModuleRegistry = new WasmModuleRegistry()
