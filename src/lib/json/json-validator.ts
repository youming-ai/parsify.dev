/**
 * JSON Validator Service
 *
 * Comprehensive JSON validation service with detailed error reporting,
 * JSON schema validation, and performance monitoring.
 */

// Enhanced validation error types
export interface ValidationError {
  line: number;
  column: number;
  position: number;
  message: string;
  code: string;
  severity: "error" | "warning" | "info";
  path: string;
  rule: string;
  suggestion?: string;
  context?: {
    before: string;
    after: string;
    line: string;
  };
}

export interface ValidationWarning extends ValidationError {
  severity: "warning" | "info";
}

export interface ValidationResult {
  isValid: boolean;
  hasWarnings: boolean;
  hasErrors: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  schema?: SchemaValidationResult;
  performance: ValidationPerformance;
  metadata: ValidationMetadata;
}

export interface ValidationPerformance {
  parseTime: number;
  validateTime: number;
  schemaTime: number;
  totalTime: number;
  memoryUsage: number;
  linesProcessed: number;
  charactersProcessed: number;
}

export interface ValidationMetadata {
  version: string;
  timestamp: Date;
  options: ValidationOptions;
  inputSize: number;
  inputType: "json" | "json5" | "text";
}

export interface ValidationOptions {
  strictMode: boolean;
  allowComments: boolean;
  allowTrailingCommas: boolean;
  allowSingleQuotes: boolean;
  allowUnicode: boolean;
  maxDepth: number;
  maxDocumentSize: number;
  schemaValidation: boolean;
  performanceMonitoring: boolean;
  autoRepair: boolean;
  detailedErrors: boolean;
  customRules: ValidationRule[];
}

export interface ValidationRule {
  name: string;
  description: string;
  severity: ValidationError["severity"];
  enabled: boolean;
  validate: (value: any, path: string, options: ValidationOptions) => ValidationError[];
}

export interface JSONSchema {
  type: "object" | "array" | "string" | "number" | "boolean" | "null";
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema;
  required?: string[];
  additionalProperties?: boolean | JSONSchema;
  minItems?: number;
  maxItems?: number;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  format?: string;
  enum?: any[];
  $ref?: string;
  definitions?: Record<string, JSONSchema>;
  id?: string;
  title?: string;
  description?: string;
}

export interface SchemaValidationResult {
  isValid: boolean;
  errors: SchemaValidationError[];
  validatedPath: string[];
  usedSchemas: string[];
}

export interface SchemaValidationError extends ValidationError {
  schemaPath: string;
  instancePath: string;
  schema: JSONSchema;
  instance: any;
}

// Built-in validation rules
const BUILT_IN_RULES: ValidationRule[] = [
  {
    name: "no-undefined-values",
    description: "Detect undefined values in JSON",
    severity: "error",
    enabled: true,
    validate: (value, path, options) => {
      const errors: ValidationError[] = [];

      const checkForUndefined = (obj: any, currentPath: string) => {
        if (obj === undefined) {
          errors.push({
            line: 0,
            column: 0,
            position: 0,
            message: `Undefined value found at ${currentPath}`,
            code: "UNDEFINED_VALUE",
            severity: "error",
            path: currentPath,
            rule: "no-undefined-values",
            suggestion: "Remove undefined values or provide explicit null values",
          });
        } else if (obj !== null && typeof obj === "object") {
          Object.keys(obj).forEach((key) => {
            checkForUndefined(obj[key], `${currentPath}.${key}`);
          });
        } else if (Array.isArray(obj)) {
          obj.forEach((item, index) => {
            checkForUndefined(item, `${currentPath}[${index}]`);
          });
        }
      };

      checkForUndefined(value, path);
      return errors;
    },
  },
  {
    name: "no-circular-references",
    description: "Detect circular references in objects",
    severity: "error",
    enabled: true,
    validate: (value, path, options) => {
      const errors: ValidationError[] = [];
      const seen = new WeakSet();

      const checkCircular = (obj: any, currentPath: string) => {
        if (obj !== null && typeof obj === "object") {
          if (seen.has(obj)) {
            errors.push({
              line: 0,
              column: 0,
              position: 0,
              message: `Circular reference detected at ${currentPath}`,
              code: "CIRCULAR_REFERENCE",
              severity: "error",
              path: currentPath,
              rule: "no-circular-references",
              suggestion: "Break the circular reference or use a ref library",
            });
          } else {
            seen.add(obj);
            Object.keys(obj).forEach((key) => {
              checkCircular(obj[key], `${currentPath}.${key}`);
            });
          }
        }
      };

      checkCircular(value, path);
      return errors;
    },
  },
  {
    name: "max-depth-check",
    description: "Validate maximum object nesting depth",
    severity: "error",
    enabled: true,
    validate: (value, path, options) => {
      const errors: ValidationError[] = [];

      const checkDepth = (obj: any, currentPath: string, currentDepth: number) => {
        if (currentDepth > options.maxDepth) {
          errors.push({
            line: 0,
            column: 0,
            position: 0,
            message: `Maximum depth exceeded (${options.maxDepth}) at ${currentPath}`,
            code: "MAX_DEPTH_EXCEEDED",
            severity: "error",
            path: currentPath,
            rule: "max-depth-check",
            suggestion: `Reduce nesting depth or increase maxDepth to ${currentDepth}`,
          });
        } else if (obj !== null && typeof obj === "object" && !Array.isArray(obj)) {
          Object.keys(obj).forEach((key) => {
            checkDepth(obj[key], `${currentPath}.${key}`, currentDepth + 1);
          });
        }
      };

      checkDepth(value, path, 0);
      return errors;
    },
  },
  {
    name: "key-format-check",
    description: "Validate object key format (best practices)",
    severity: "warning",
    enabled: false,
    validate: (value, path, options) => {
      const errors: ValidationError[] = [];

      const checkKeys = (obj: any, currentPath: string) => {
        if (obj !== null && typeof obj === "object" && !Array.isArray(obj)) {
          Object.keys(obj).forEach((key) => {
            // Check for spaces in keys
            if (key.includes(" ")) {
              errors.push({
                line: 0,
                column: 0,
                position: 0,
                message: `Key contains spaces: "${key}" at ${currentPath}`,
                code: "INVALID_KEY_FORMAT",
                severity: "warning",
                path: `${currentPath}.${key}`,
                rule: "key-format-check",
                suggestion: "Use underscores or camelCase for key names",
              });
            }

            // Check for empty keys
            if (key.length === 0) {
              errors.push({
                line: 0,
                column: 0,
                position: 0,
                message: `Empty key found at ${currentPath}`,
                code: "EMPTY_KEY",
                severity: "warning",
                path: currentPath,
                rule: "key-format-check",
                suggestion: "Provide meaningful key names",
              });
            }

            checkKeys(obj[key], `${currentPath}.${key}`);
          });
        }
      };

      checkKeys(value, path);
      return errors;
    },
  },
  {
    name: "array-consistency-check",
    description: "Check array consistency (mixed types)",
    severity: "warning",
    enabled: false,
    validate: (value, path, options) => {
      const errors: ValidationError[] = [];

      const checkArrays = (obj: any, currentPath: string) => {
        if (Array.isArray(obj)) {
          if (obj.length === 0) return;

          // Check type consistency
          const types = new Set();
          obj.forEach((item) => {
            if (item === null) {
              types.add("null");
            } else if (Array.isArray(item)) {
              types.add("array");
            } else if (typeof item === "object") {
              types.add("object");
            } else {
              types.add(typeof item);
            }
          });

          if (types.size > 2) {
            errors.push({
              line: 0,
              column: 0,
              position: 0,
              message: `Mixed types in array at ${currentPath}: ${Array.from(types).join(", ")}`,
              code: "MIXED_ARRAY_TYPES",
              severity: "warning",
              path: currentPath,
              rule: "array-consistency-check",
              suggestion: "Consider using consistent types in arrays",
            });
          }

          obj.forEach((item) => checkArrays(item, currentPath));
        } else if (obj !== null && typeof obj === "object") {
          Object.keys(obj).forEach((key) => {
            checkArrays(obj[key], `${currentPath}.${key}`);
          });
        }
      };

      checkArrays(value, path);
      return errors;
    },
  },
];

// Main JSON Validator class
export class JSONValidator {
  private options: ValidationOptions;
  private rules: ValidationRule[];

  constructor(options: Partial<ValidationOptions> = {}) {
    this.options = {
      strictMode: false,
      allowComments: false,
      allowTrailingCommas: false,
      allowSingleQuotes: false,
      allowUnicode: true,
      maxDepth: 10,
      maxDocumentSize: 10 * 1024 * 1024, // 10MB
      schemaValidation: false,
      performanceMonitoring: true,
      autoRepair: false,
      detailedErrors: true,
      customRules: [],
      ...options,
    };

    this.rules = [...BUILT_IN_RULES, ...this.options.customRules];
  }

  /**
   * Validate JSON string
   */
  validate(jsonString: string): ValidationResult {
    const startTime = performance.now();
    const metadata: ValidationMetadata = {
      version: "1.0.0",
      timestamp: new Date(),
      options: this.options,
      inputSize: new Blob([jsonString]).size,
      inputType: this.detectInputType(jsonString),
    };

    try {
      // Check document size
      if (this.options.maxDocumentSize > 0 && metadata.inputSize > this.options.maxDocumentSize) {
        throw new Error(
          `Document size (${metadata.inputSize} bytes) exceeds maximum (${this.options.maxDocumentSize} bytes)`,
        );
      }

      // Parse JSON (with auto-repair if enabled)
      const parseStartTime = performance.now();
      let data: any;
      let repaired = false;

      try {
        if (
          this.options.allowComments ||
          this.options.allowTrailingCommas ||
          this.options.allowSingleQuotes
        ) {
          data = this.parseWithRelaxedRules(jsonString);
        } else {
          data = JSON.parse(jsonString);
        }
      } catch (error) {
        if (this.options.autoRepair) {
          const repairedResult = this.attemptRepair(jsonString);
          if (repairedResult.success) {
            data = repairedResult.data;
            repaired = true;
          } else {
            throw new Error(
              `Invalid JSON and repair failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            );
          }
        } else {
          throw error;
        }
      }
      const parseTime = performance.now() - parseStartTime;

      // Validate parsed data
      const validateStartTime = performance.now();
      const errors = this.validateData(data, "");
      const warnings = errors.filter((e) => e.severity === "warning" || e.severity === "info");
      const validationErrors = errors.filter((e) => e.severity === "error");
      const validateTime = performance.now() - validateStartTime;

      // Schema validation
      let schemaResult: SchemaValidationResult | undefined;
      if (this.options.schemaValidation) {
        // Schema validation would be implemented here
        schemaResult = {
          isValid: true,
          errors: [],
          validatedPath: [],
          usedSchemas: [],
        };
      }

      const totalTime = performance.now() - startTime;

      return {
        isValid: validationErrors.length === 0,
        hasWarnings: warnings.length > 0,
        hasErrors: validationErrors.length > 0,
        errors: validationErrors,
        warnings,
        schema: schemaResult,
        performance: {
          parseTime,
          validateTime,
          schemaTime: schemaResult ? totalTime - parseTime - validateTime : 0,
          totalTime,
          memoryUsage: 0, // Would need Memory API for accurate measurement
          linesProcessed: jsonString.split("\n").length,
          charactersProcessed: jsonString.length,
        },
        metadata: { ...metadata, repaired },
      };
    } catch (error) {
      return {
        isValid: false,
        hasWarnings: false,
        hasErrors: true,
        errors: [
          {
            line: 0,
            column: 0,
            position: 0,
            message: error instanceof Error ? error.message : "Unknown validation error",
            code: "VALIDATION_ERROR",
            severity: "error",
            path: "",
            rule: "parse",
            suggestion: this.getSuggestionForError(error),
          },
        ],
        warnings: [],
        performance: {
          parseTime: performance.now() - startTime,
          validateTime: 0,
          schemaTime: 0,
          totalTime: performance.now() - startTime,
          memoryUsage: 0,
          linesProcessed: jsonString.split("\n").length,
          charactersProcessed: jsonString.length,
        },
        metadata,
      };
    }
  }

  /**
   * Validate parsed JSON data
   */
  private validateData(data: any, path: string): ValidationError[] {
    const errors: ValidationError[] = [];

    // Apply enabled rules
    for (const rule of this.rules) {
      if (rule.enabled) {
        errors.push(...rule.validate(data, path, this.options));
      }
    }

    return errors;
  }

  /**
   * Detect input type (JSON, JSON5, etc.)
   */
  private detectInputType(input: string): ValidationMetadata["inputType"] {
    // Check for JSON5 features
    if (this.hasJSON5Features(input)) {
      return "json5";
    }

    // Check if it's valid JSON
    try {
      JSON.parse(input);
      return "json";
    } catch {
      return "text";
    }
  }

  /**
   * Check if input has JSON5 features
   */
  private hasJSON5Features(input: string): boolean {
    return /\/\/|\/\*|\*\/|'[^\\]'/.test(input);
  }

  /**
   * Parse with relaxed rules (JSON5-like)
   */
  private parseWithRelaxedRules(input: string): any {
    // Remove comments if allowed
    let processedInput = input;
    if (this.options.allowComments) {
      processedInput = processedInput.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
    }

    // Remove trailing commas if allowed
    if (this.options.allowTrailingCommas) {
      processedInput = processedInput.replace(/,(\s*[}\]])/g, "$1");
    }

    // Handle single quotes if allowed
    if (this.options.allowSingleQuotes) {
      processedInput = processedInput.replace(/'/g, '"');
    }

    return JSON.parse(processedInput);
  }

  /**
   * Attempt to repair invalid JSON
   */
  private attemptRepair(input: string): { success: boolean; data?: any; repaired: string } {
    let repaired = input;

    try {
      // Common repair attempts
      repaired = repaired
        .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas
        .replace(/'/g, '"') // Convert single quotes to double quotes
        .replace(/(\w+)\s*:/g, '"$1":') // Quote unquoted keys
        .replace(/:\s*'/g, ':"') // Quote unquoted string values
        .replace(/\s*\/\/.*$/gm, "") // Remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, ""); // Remove multi-line comments

      return {
        success: true,
        data: JSON.parse(repaired),
        repaired,
      };
    } catch (error) {
      return {
        success: false,
        repaired: "",
      };
    }
  }

  /**
   * Get suggestion for parsing errors
   */
  private getSuggestionForError(error: Error): string {
    const message = error.message.toLowerCase();

    if (message.includes("unexpected token")) {
      return "Check for missing commas, brackets, or quotes";
    }
    if (message.includes("unexpected end of input")) {
      return "Make sure the JSON is complete and properly closed";
    }
    if (message.includes("duplicate key")) {
      return "Remove duplicate keys in your JSON object";
    }
    if (message.includes("invalid character")) {
      return "Remove any invalid characters or properly escape them";
    }

    return "Check JSON syntax and structure";
  }

  /**
   * Validate JSON schema (simplified implementation)
   */
  validateSchema(data: any, schema: JSONSchema, path: string = ""): SchemaValidationResult {
    const errors: SchemaValidationError[] = [];
    const validatedPath: string[] = [];
    const usedSchemas: string[] = [schema.id || "root"];

    const validateValue = (value: any, currentSchema: JSONSchema, currentPath: string): boolean => {
      // Type validation
      if (currentSchema.type) {
        const actualType = Array.isArray(value) ? "array" : value === null ? "null" : typeof value;

        if (Array.isArray(currentSchema.type)) {
          if (!currentSchema.type.includes(actualType)) {
            errors.push({
              line: 0,
              column: 0,
              position: 0,
              message: `Expected type ${currentSchema.type.join(" or ")}, got ${actualType}`,
              code: "TYPE_MISMATCH",
              severity: "error",
              path: currentPath,
              rule: "schema",
              schemaPath: currentPath,
              instancePath: currentPath,
              schema: currentSchema,
              instance: value,
            });
            return false;
          }
        } else if (actualType !== currentSchema.type) {
          errors.push({
            line: 0,
            column: 0,
            position: 0,
            message: `Expected type ${currentSchema.type}, got ${actualType}`,
            code: "TYPE_MISMATCH",
            severity: "error",
            path: currentPath,
            rule: "schema",
            schemaPath: currentPath,
            instancePath: currentPath,
            schema: currentSchema,
            instance: value,
          });
          return false;
        }
      }

      // Array validation
      if (currentSchema.type === "array" && Array.isArray(value)) {
        if (currentSchema.minItems && value.length < currentSchema.minItems) {
          errors.push({
            line: 0,
            column: 0,
            position: 0,
            message: `Array minimum length is ${currentSchema.minItems}, got ${value.length}`,
            code: "ARRAY_MIN_ITEMS",
            severity: "error",
            path: currentPath,
            rule: "schema",
            schemaPath: currentPath,
            instancePath: currentPath,
            schema: currentSchema,
            instance: value,
          });
        }

        if (currentSchema.maxItems && value.length > currentSchema.maxItems) {
          errors.push({
            line: 0,
            column: 0,
            position: 0,
            message: `Array maximum length is ${currentSchema.maxItems}, got ${value.length}`,
            code: "ARRAY_MAX_ITEMS",
            severity: "error",
            path: currentPath,
            rule: "schema",
            schemaPath: currentPath,
            instancePath: currentPath,
            schema: currentSchema,
            instance: value,
          });
        }

        if (currentSchema.items) {
          value.forEach((item, index) => {
            validateValue(item, currentSchema.items, `${currentPath}[${index}]`);
          });
        }
      }

      // Object validation
      if (
        currentSchema.type === "object" &&
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        if (currentSchema.required) {
          currentSchema.required.forEach((requiredProp) => {
            if (!(requiredProp in value)) {
              errors.push({
                line: 0,
                column: 0,
                position: 0,
                message: `Required property '${requiredProp}' is missing`,
                code: "REQUIRED_PROPERTY",
                severity: "error",
                path: currentPath,
                rule: "schema",
                schemaPath: currentPath,
                instancePath: currentPath,
                schema: currentSchema,
                instance: value,
              });
            }
          });
        }

        if (currentSchema.properties) {
          Object.entries(currentSchema.properties).forEach(([propName, propSchema]) => {
            if (propName in value) {
              validateValue(value[propName], propSchema, `${currentPath}.${propName}`);
            }
          });
        }

        if (currentSchema.additionalProperties === false) {
          const allowedProps = new Set(Object.keys(currentSchema.properties || {}));
          Object.keys(value).forEach((prop) => {
            if (!allowedProps.has(prop)) {
              errors.push({
                line: 0,
                column: 0,
                position: 0,
                message: `Additional property '${prop}' not allowed`,
                code: "ADDITIONAL_PROPERTY",
                severity: "error",
                path: currentPath,
                rule: "schema",
                schemaPath: currentPath,
                instancePath: currentPath,
                schema: currentSchema,
                instance: value,
              });
            }
          });
        }
      }

      // String validation
      if (currentSchema.type === "string" && typeof value === "string") {
        if (currentSchema.minLength && value.length < currentSchema.minLength) {
          errors.push({
            line: 0,
            column: 0,
            position: 0,
            message: `String minimum length is ${currentSchema.minLength}, got ${value.length}`,
            code: "STRING_MIN_LENGTH",
            severity: "error",
            path: currentPath,
            rule: "schema",
            schemaPath: currentPath,
            instancePath: currentPath,
            schema: currentSchema,
            instance: value,
          });
        }

        if (currentSchema.maxLength && value.length > currentSchema.maxLength) {
          errors.push({
            line: 0,
            column: 0,
            position: 0,
            message: `String maximum length is ${currentSchema.maxLength}, got ${value.length}`,
            code: "STRING_MAX_LENGTH",
            severity: "error",
            path: currentPath,
            rule: "schema",
            schemaPath: currentPath,
            instancePath: currentPath,
            schema: currentSchema,
            instance: value,
          });
        }

        if (currentSchema.pattern && !new RegExp(currentSchema.pattern).test(value)) {
          errors.push({
            line: 0,
            column: 0,
            position: 0,
            message: `String does not match pattern: ${currentSchema.pattern}`,
            code: "STRING_PATTERN",
            severity: "error",
            path: currentPath,
            rule: "schema",
            schemaPath: currentPath,
            instancePath: currentPath,
            schema: currentSchema,
            instance: value,
          });
        }
      }

      // Number validation
      if (currentSchema.type === "number" && typeof value === "number") {
        if (currentSchema.minimum !== undefined && value < currentSchema.minimum) {
          errors.push({
            line: 0,
            column: 0,
            position: 0,
            message: `Number minimum is ${currentSchema.minimum}, got ${value}`,
            code: "NUMBER_MINIMUM",
            severity: "error",
            path: currentPath,
            rule: "schema",
            schemaPath: currentPath,
            instancePath: currentPath,
            schema: currentSchema,
            instance: value,
          });
        }

        if (currentSchema.maximum !== undefined && value > currentSchema.maximum) {
          errors.push({
            line: 0,
            column: 0,
            position: 0,
            message: `Number maximum is ${currentSchema.maximum}, got ${value}`,
            code: "NUMBER_MAXIMUM",
            severity: "error",
            path: currentPath,
            rule: "schema",
            schemaPath: currentPath,
            instancePath: currentPath,
            schema: currentSchema,
            instance: value,
          });
        }
      }

      // Enum validation
      if (currentSchema.enum && !currentSchema.enum.includes(value)) {
        errors.push({
          line: 0,
          column: 0,
          position: 0,
          message: `Value must be one of: ${currentSchema.enum.join(", ")}`,
          code: "ENUM_MISMATCH",
          severity: "error",
          path: currentPath,
          rule: "schema",
          schemaPath: currentPath,
          instancePath: currentPath,
          schema: currentSchema,
          instance: value,
        });
      }

      return true;
    };

    validateValue(data, schema, path);

    return {
      isValid: errors.length === 0,
      errors,
      validatedPath,
      usedSchemas,
    };
  }

  /**
   * Add custom validation rule
   */
  addRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }

  /**
   * Remove validation rule by name
   */
  removeRule(name: string): boolean {
    const index = this.rules.findIndex((rule) => rule.name === name);
    if (index !== -1) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get all rules
   */
  getRules(): ValidationRule[] {
    return [...this.rules];
  }

  /**
   * Enable/disable rule by name
   */
  setRuleEnabled(name: string, enabled: boolean): boolean {
    const rule = this.rules.find((rule) => rule.name === name);
    if (rule) {
      rule.enabled = enabled;
      return true;
    }
    return false;
  }

  /**
   * Update validation options
   */
  updateOptions(newOptions: Partial<ValidationOptions>): void {
    this.options = { ...this.options, ...newOptions };
    // Update custom rules if provided
    if (newOptions.customRules) {
      // Remove existing custom rules
      this.rules = this.rules.filter((rule) => !BUILT_IN_RULES.includes(rule));
      // Add new custom rules
      this.rules.push(...newOptions.customRules);
    }
  }

  /**
   * Get current validation options
   */
  getOptions(): ValidationOptions {
    return { ...this.options };
  }
}

// Convenience function for quick validation
export function validateJSON(
  jsonString: string,
  options?: Partial<ValidationOptions>,
): ValidationResult {
  const validator = new JSONValidator(options);
  return validator.validate(jsonString);
}

// Convenience function for schema validation
export function validateJSONSchema(
  data: any,
  schema: JSONSchema,
  path?: string,
): SchemaValidationResult {
  const validator = new JSONValidator();
  return validator.validateSchema(data, schema, path);
}

// Export default validator instance
export const defaultValidator = new JSONValidator();
