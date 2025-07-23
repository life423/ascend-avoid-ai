/**
 * Service Locator for dependency injection
 * Provides a central registry for services that can be injected into systems
 * and other components, promoting loose coupling and testability.
 */

export interface ServiceDefinition<T = any> {
    instance: T;
    singleton: boolean;
    factory?: () => T;
    dependencies?: string[];
}

export interface Initializable {
    initialize(): Promise<void> | void;
}

export class ServiceLocator {
    private services = new Map<string, ServiceDefinition>();
    private instances = new Map<string, any>();
    private initializing = new Set<string>();

    /**
     * Register a service instance
     * @param name - Service name/key
     * @param instance - Service instance
     * @param singleton - Whether this should be a singleton (default: true)
     */
    register<T>(name: string, instance: T, singleton = true): void {
        if (this.services.has(name)) {
            console.warn(`ServiceLocator: Overriding existing service '${name}'`);
        }

        this.services.set(name, {
            instance,
            singleton,
        });

        if (singleton) {
            this.instances.set(name, instance);
        }
    }

    /**
     * Register a service factory function
     * @param name - Service name/key
     * @param factory - Function that creates the service instance
     * @param dependencies - Array of dependency service names
     * @param singleton - Whether this should be a singleton (default: true)
     */
    registerFactory<T>(
        name: string,
        factory: () => T,
        dependencies: string[] = [],
        singleton = true
    ): void {
        if (this.services.has(name)) {
            console.warn(`ServiceLocator: Overriding existing service '${name}'`);
        }

        this.services.set(name, {
            instance: null,
            singleton,
            factory,
            dependencies,
        });
    }

    /**
     * Get a service instance
     * @param name - Service name/key
     * @returns Service instance
     * @throws Error if service not found
     */
    get<T>(name: string): T {
        // Check for circular dependency
        if (this.initializing.has(name)) {
            throw new Error(`ServiceLocator: Circular dependency detected for service '${name}'`);
        }

        // Return existing singleton instance
        if (this.instances.has(name)) {
            return this.instances.get(name);
        }

        const serviceDefinition = this.services.get(name);
        if (!serviceDefinition) {
            throw new Error(`ServiceLocator: Service '${name}' not found. Available services: ${Array.from(this.services.keys()).join(', ')}`);
        }

        // If it's a direct instance registration
        if (serviceDefinition.factory === undefined) {
            const instance = serviceDefinition.instance;
            if (serviceDefinition.singleton) {
                this.instances.set(name, instance);
            }
            return instance;
        }

        // It's a factory registration - need to create instance
        this.initializing.add(name);

        try {
            // Resolve dependencies first
            const dependencies: any[] = [];
            if (serviceDefinition.dependencies) {
                for (const depName of serviceDefinition.dependencies) {
                    dependencies.push(this.get(depName));
                }
            }

            // Create instance using factory
            const instance = serviceDefinition.factory();

            // Cache if singleton
            if (serviceDefinition.singleton) {
                this.instances.set(name, instance);
            }

            this.initializing.delete(name);
            return instance;
        } catch (error: any) {
            this.initializing.delete(name);
            throw new Error(`ServiceLocator: Failed to create service '${name}': ${error.message}`);
        }
    }

    /**
     * Check if a service is registered
     * @param name - Service name/key
     * @returns True if service exists
     */
    has(name: string): boolean {
        return this.services.has(name);
    }

    /**
     * Get all registered service names
     * @returns Array of service names
     */
    getServiceNames(): string[] {
        return Array.from(this.services.keys());
    }

    /**
     * Remove a service
     * @param name - Service name/key
     */
    unregister(name: string): void {
        this.services.delete(name);
        this.instances.delete(name);
    }

    /**
     * Remove a service (alias for unregister)
     * @param name - Service name/key
     */
    remove(name: string): void {
        this.unregister(name);
    }

    /**
     * Clear all services
     */
    clear(): void {
        // Dispose any services that have a dispose method
        this.instances.forEach((instance, name) => {
            if (instance && typeof instance.dispose === 'function') {
                try {
                    instance.dispose();
                } catch (error) {
                    console.warn(`ServiceLocator: Error disposing service '${name}':`, error);
                }
            }
        });

        this.services.clear();
        this.instances.clear();
        this.initializing.clear();
    }

    /**
     * Create a dependency injection container for a specific context
     * @param context - Context name (e.g., 'game', 'test')
     * @returns Scoped service locator
     */
    createScope(context: string): ScopedServiceLocator {
        return new ScopedServiceLocator(this, context);
    }

    /**
     * Get diagnostic information about services
     * @returns Service diagnostic info
     */
    getDiagnostics(): {
        registeredServices: string[];
        singletonInstances: string[];
        circularDependencies: string[];
    } {
        return {
            registeredServices: Array.from(this.services.keys()),
            singletonInstances: Array.from(this.instances.keys()),
            circularDependencies: Array.from(this.initializing),
        };
    }

    /**
     * Validate that all dependencies can be resolved
     * @returns Array of missing dependencies
     */
    validateDependencies(): string[] {
        const missing: string[] = [];

        this.services.forEach((definition, serviceName) => {
            if (definition.dependencies) {
                for (const depName of definition.dependencies) {
                    if (!this.services.has(depName)) {
                        missing.push(`${serviceName} -> ${depName}`);
                    }
                }
            }
        });

        return missing;
    }

    /**
     * Initialize all registered services
     * Useful for warming up the container
     */
    async initializeAll(): Promise<void> {
        const serviceNames = Array.from(this.services.keys());
        
        for (const serviceName of serviceNames) {
            try {
                const service = this.get(serviceName);
                
                // Call initialize method if it exists and is a function
                if (service && typeof service === 'object' && 'initialize' in service && typeof service.initialize === 'function') {
                    await (service as Initializable).initialize();
                }
            } catch (error: any) {
                console.error(`ServiceLocator: Failed to initialize service '${serviceName}':`, error);
                throw error;
            }
        }
    }
}

/**
 * Scoped service locator that inherits from a parent but can override services
 */
export class ScopedServiceLocator extends ServiceLocator {
    constructor(
        private parent: ServiceLocator,
        _context: string // Context for debugging purposes
    ) {
        super();
    }

    /**
     * Get service from this scope first, then parent
     */
    get<T>(name: string): T {
        try {
            // Try to get from this scope first
            return super.get(name);
        } catch {
            // Fall back to parent
            return this.parent.get(name);
        }
    }

    /**
     * Check if service exists in this scope or parent
     */
    has(name: string): boolean {
        return super.has(name) || this.parent.has(name);
    }

    /**
     * Get all service names from both scopes
     */
    getServiceNames(): string[] {
        const parentNames = this.parent.getServiceNames();
        const thisNames = super.getServiceNames();
        return [...new Set([...parentNames, ...thisNames])];
    }
}

// Global service locator instance
export const globalServiceLocator = new ServiceLocator();

export default ServiceLocator;
