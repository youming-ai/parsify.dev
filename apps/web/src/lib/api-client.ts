/**
 * API Client for communicating with Workers API
 */

export class ApiClient {
	private baseUrl: string

	constructor() {
		// Determine API base URL based on environment
		if (typeof window !== 'undefined') {
			// Client-side
			const hostname = window.location.hostname
			if (hostname === 'parsify.dev' || hostname.endsWith('.parsify.dev')) {
				this.baseUrl = 'https://api.parsify.dev'
			} else if (hostname.includes('staging')) {
				this.baseUrl = 'https://api-staging.parsify.dev'
			} else {
				this.baseUrl = 'http://localhost:8787'
			}
		} else {
			// Server-side or build time
			this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8787'
		}
	}

	private async request<T>(
		path: string,
		options: RequestInit = {}
	): Promise<T> {
		const url = `${this.baseUrl}${path}`

		const defaultHeaders = {
			'Content-Type': 'application/json',
			'User-Agent': 'Parsify-Web/1.0',
		}

		// Add CORS headers for browser requests
		if (typeof window !== 'undefined') {
			defaultHeaders['Accept'] = 'application/json'
		}

		const response = await fetch(url, {
			...options,
			headers: {
				...defaultHeaders,
				...options.headers,
			},
		})

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}))
			throw new Error(
				errorData.message || `API request failed: ${response.statusText}`
			)
		}

		return response.json()
	}

	// JSON Tools API
	async formatJson(json: string, options?: { indent?: number; sortKeys?: boolean }) {
		return this.request('/api/v1/json/format', {
			method: 'POST',
			body: JSON.stringify({ json, options }),
		})
	}

	async validateJson(json: string, schema?: any) {
		return this.request('/api/v1/json/validate', {
			method: 'POST',
			body: JSON.stringify({ json, schema }),
		})
	}

	async convertJson(json: string, format: 'csv' | 'xml' | 'yaml') {
		return this.request(`/api/v1/json/convert/${format}`, {
			method: 'POST',
			body: JSON.stringify({ json }),
		})
	}

	// Code Execution API
	async executeCode(code: string, language: 'javascript' | 'python', options?: { timeout?: number }) {
		return this.request('/api/v1/code/execute', {
			method: 'POST',
			body: JSON.stringify({ code, language, options }),
		})
	}

	async formatCode(code: string, language: string, options?: any) {
		return this.request('/api/v1/code/format', {
			method: 'POST',
			body: JSON.stringify({ code, language, options }),
		})
	}

	// Utility Tools API
	async encodeText(text: string, encoding: 'base64' | 'url') {
		return this.request('/api/v1/utils/encode', {
			method: 'POST',
			body: JSON.stringify({ text, encoding }),
		})
	}

	async decodeText(text: string, encoding: 'base64' | 'url') {
		return this.request('/api/v1/utils/decode', {
			method: 'POST',
			body: JSON.stringify({ text, encoding }),
		})
	}

	async generateUuid(version: '4' | '1' | '7' = '4') {
		return this.request(`/api/v1/utils/uuid?version=${version}`)
	}

	async hashText(text: string, algorithm: 'md5' | 'sha256' | 'sha512') {
		return this.request('/api/v1/utils/hash', {
			method: 'POST',
			body: JSON.stringify({ text, algorithm }),
		})
	}

	// Health check
	async healthCheck() {
		return this.request('/health')
	}

	// File Upload API
	async uploadFile(file: File, options?: { public?: boolean }) {
		const formData = new FormData()
		formData.append('file', file)
		if (options) {
			Object.entries(options).forEach(([key, value]) => {
				formData.append(key, String(value))
			})
		}

		return this.request('/api/v1/upload', {
			method: 'POST',
			body: formData,
			headers: {}, // Let browser set Content-Type for FormData
		})
	}

	// Get API base URL (useful for debugging)
	getApiBaseUrl() {
		return this.baseUrl
	}
}

// Export singleton instance
export const apiClient = new ApiClient()
