# Security Tools Test Suite

This directory contains comprehensive unit tests for the security tools in the Parsify.dev platform.

## Test Files

### Component Tests

1. **hash-generator.test.tsx** - Tests for the Hash Generator component
   - Algorithm selection functionality
   - Text and file input processing
   - HMAC settings
   - Hash comparison feature
   - Error handling and validation
   - Accessibility tests
   - UI interactions and state management

2. **file-encryptor.test.tsx** - Tests for the File Encryptor component
   - Encryption algorithm selection
   - Password validation and strength calculation
   - File encryption/decryption workflows
   - Text encryption/decryption
   - Progress tracking and job management
   - Error handling and security validation
   - Accessibility and keyboard navigation

3. **password-generator.test.tsx** - Tests for the Password Generator component
   - Random password generation with various options
   - Pronounceable password generation
   - Passphrase generation
   - Batch generation functionality
   - Password strength calculation
   - History management
   - Accessibility features (text-to-speech)
   - Copy and download functionality

### Utility Tests

4. **crypto.test.ts** (in `src/__tests__/lib/`) - Tests for crypto utility functions
   - Hash generation (multiple algorithms)
   - Encryption/decryption operations
   - Password generation and strength calculation
   - UUID generation
   - JWT validation
   - Error handling for various edge cases
   - Fallback implementations for environments without Web Crypto API

## Test Coverage

### Features Tested

- ✅ Component rendering and UI elements
- ✅ User interactions (clicks, typing, form submissions)
- ✅ File processing (upload, encryption, hashing)
- ✅ Security functionality (password generation, strength validation)
- ✅ Error handling and validation
- ✅ Accessibility (keyboard navigation, ARIA labels)
- ✅ State management and data flow
- ✅ Edge cases (large files, empty inputs, invalid data)
- ✅ Integration with crypto utility functions
- ✅ Mock external dependencies appropriately
- ✅ Performance considerations for heavy cryptographic operations

### Security Aspects Covered

- ✅ Secure algorithm selection
- ✅ Password strength validation
- ✅ Input sanitization
- ✅ Error message security (no sensitive data leakage)
- ✅ Proper key derivation functions
- ✅ Random number generation security
- ✅ File handling security

## Test Framework

- **Testing Library**: React Testing Library for component tests
- **Test Runner**: Vitest
- **Mocking**: Vitest's vi.mock for external dependencies
- **Environment**: jsdom for DOM simulation
- **Type Checking**: TypeScript for type safety

## Mocking Strategy

### External Dependencies Mocked

- Web Crypto API (crypto.subtle)
- File API (File, Blob, URL)
- Clipboard API (navigator.clipboard)
- Speech Synthesis API (speechSynthesis)
- Toast notifications (sonner)

### Component Mocks

- File upload components
- Progress indicators
- Download functionality

## Running Tests

```bash
# Run all security tests
pnpm test src/__tests__/components/tools/security/

# Run specific test file
pnpm test src/__tests__/components/tools/security/hash-generator.test.tsx

# Run with coverage
pnpm test:coverage src/__tests__/components/tools/security/

# Run in watch mode
pnpm test:ui src/__tests__/components/tools/security/
```

## Test Structure

Each test file follows this structure:

1. **Setup and Mocking** - Configure mocks and test environment
2. **Basic Rendering Tests** - Verify components render correctly
3. **User Interaction Tests** - Test user actions and state changes
4. **Functionality Tests** - Test core features and business logic
5. **Error Handling Tests** - Test error scenarios and validation
6. **Accessibility Tests** - Test keyboard navigation and ARIA support
7. **Integration Tests** - Test component interactions with utilities
8. **Edge Cases** - Test boundary conditions and unusual inputs

## Best Practices Followed

- **Descriptive Test Names** - Clear, descriptive test descriptions
- **User-Centric Testing** - Tests focus on user behavior and outcomes
- **Proper Cleanup** - Each test cleans up mocks and state
- **Realistic Mocks** - Mocks behave like real implementations
- **Accessibility Testing** - Tests include accessibility scenarios
- **Error Coverage** - Both happy path and error scenarios tested
- **Performance Considerations** - Heavy operations are properly mocked

## Security Considerations in Tests

- No real secrets or sensitive data used in tests
- Password strength calculations use realistic scenarios
- Encryption operations are mocked, not performed with real keys
- File operations use safe mock implementations
- Crypto API calls are properly mocked to avoid real cryptographic operations

## Future Enhancements

- Add E2E tests for complete user workflows
- Add visual regression tests for UI components
- Add performance tests for large file processing
- Add internationalization tests
- Add integration tests with actual Web Crypto API in browsers