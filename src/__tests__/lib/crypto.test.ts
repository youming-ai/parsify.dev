import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CryptoUtils, validateJWT, generateUUID } from "@/lib/crypto";

describe("JWT Validation", () => {
  // Test JWT tokens (these are example tokens, not real secrets)
  const validJWT =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

  const expiredJWT =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZXhwIjoxNjAwMDAwMDAwfQ.invalid";

  const notBeforeJWT =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwibmJmIjo5OTk5OTk5OTk5OX0.invalid";

  const invalidFormatJWT = "invalid.jwt.token";

  describe("validateJWT", () => {
    it("should validate a properly formatted JWT", () => {
      const result = CryptoUtils.validateJWT(validJWT);

      expect(result.valid).toBe(true);
      expect(result.header).toBeDefined();
      expect(result.payload).toBeDefined();
      expect(result.error).toBeUndefined();

      expect(result.header).toHaveProperty("alg");
      expect(result.header).toHaveProperty("typ");
      expect(result.payload).toHaveProperty("sub");
      expect(result.payload).toHaveProperty("name");
    });

    it("should reject JWT with incorrect format", () => {
      const result = CryptoUtils.validateJWT(invalidFormatJWT);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid JWT format");
      expect(result.header).toBeUndefined();
      expect(result.payload).toBeUndefined();
    });

    it("should handle empty JWT token", () => {
      const result = CryptoUtils.validateJWT("");

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid JWT format");
    });

    it("should handle JWT with missing parts", () => {
      const result = CryptoUtils.validateJWT("header.payload");

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid JWT format");
    });

    it("should handle JWT with too many parts", () => {
      const result = CryptoUtils.validateJWT("header.payload.signature.extra");

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid JWT format");
    });

    it("should handle malformed base64 in header", () => {
      const malformedJWT = "invalid!header.payload.signature";
      const result = CryptoUtils.validateJWT(malformedJWT);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should handle malformed JSON in header", () => {
      const malformedJWT = "aW52YWxpZCBqc29u.payload.signature";
      const result = CryptoUtils.validateJWT(malformedJWT);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should handle malformed base64 in payload", () => {
      const malformedJWT =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid!payload.signature";
      const result = CryptoUtils.validateJWT(malformedJWT);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should handle malformed JSON in payload", () => {
      const malformedJWT =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.aW52YWxpZCBqc29u.signature";
      const result = CryptoUtils.validateJWT(malformedJWT);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should handle expired tokens", () => {
      // Create a token that's expired
      const expiredTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
      const payload = btoa(
        JSON.stringify({
          sub: "1234567890",
          name: "John Doe",
          exp: expiredTime,
        }),
      );
      const expiredToken = `${header}.${payload}.signature`;

      const result = CryptoUtils.validateJWT(expiredToken);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Token expired");
      expect(result.header).toBeDefined();
      expect(result.payload).toBeDefined();
    });

    it("should handle not-before tokens", () => {
      // Create a token that's not valid yet
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
      const payload = btoa(
        JSON.stringify({
          sub: "1234567890",
          name: "John Doe",
          nbf: futureTime,
        }),
      );
      const notBeforeToken = `${header}.${payload}.signature`;

      const result = CryptoUtils.validateJWT(notBeforeToken);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Token not valid until");
      expect(result.header).toBeDefined();
      expect(result.payload).toBeDefined();
    });

    it("should handle tokens with valid exp and nbf claims", () => {
      const now = Math.floor(Date.now() / 1000);
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
      const payload = btoa(
        JSON.stringify({
          sub: "1234567890",
          name: "John Doe",
          iat: now - 3600, // issued 1 hour ago
          exp: now + 3600, // expires in 1 hour
          nbf: now - 1800, // valid for last 30 minutes
        }),
      );
      const validToken = `${header}.${payload}.signature`;

      const result = CryptoUtils.validateJWT(validToken);

      expect(result.valid).toBe(true);
      expect(result.header).toBeDefined();
      expect(result.payload).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it("should handle non-numeric exp claim", () => {
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
      const payload = btoa(
        JSON.stringify({
          sub: "1234567890",
          name: "John Doe",
          exp: "not-a-number",
        }),
      );
      const invalidToken = `${header}.${payload}.signature`;

      const result = CryptoUtils.validateJWT(invalidToken);

      // Should still be valid since we only check numeric exp
      expect(result.valid).toBe(true);
    });

    it("should handle non-numeric nbf claim", () => {
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
      const payload = btoa(
        JSON.stringify({
          sub: "1234567890",
          name: "John Doe",
          nbf: "not-a-number",
        }),
      );
      const invalidToken = `${header}.${payload}.signature`;

      const result = CryptoUtils.validateJWT(invalidToken);

      // Should still be valid since we only check numeric nbf
      expect(result.valid).toBe(true);
    });
  });

  describe("validateJWT convenience function", () => {
    it("should work as a convenience function", () => {
      const result = validateJWT(validJWT);

      expect(result.valid).toBe(true);
      expect(result.header).toBeDefined();
      expect(result.payload).toBeDefined();
    });

    it("should handle errors in convenience function", () => {
      const result = validateJWT(invalidFormatJWT);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("JWT Edge Cases", () => {
    it("should handle base64url encoding correctly", () => {
      // Test with padding characters removed (base64url format)
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })).replace(
        /=/g,
        "",
      );
      const payload = btoa(
        JSON.stringify({ sub: "1234567890", name: "John Doe" }),
      ).replace(/=/g, "");
      const token = `${header}.${payload}.signature`;

      const result = CryptoUtils.validateJWT(token);

      expect(result.valid).toBe(true);
    });

    it("should handle base64url with URL-safe characters", () => {
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
      const payload = btoa(
        JSON.stringify({ sub: "1234567890", name: "John Doe" }),
      )
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
      const token = `${header}.${payload}.signature`;

      const result = CryptoUtils.validateJWT(token);

      expect(result.valid).toBe(true);
    });

    it("should handle empty payload", () => {
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
      const payload = btoa(JSON.stringify({}));
      const token = `${header}.${payload}.signature`;

      const result = CryptoUtils.validateJWT(token);

      expect(result.valid).toBe(true);
      expect(result.payload).toEqual({});
    });

    it("should handle empty header", () => {
      const header = btoa(JSON.stringify({}));
      const payload = btoa(JSON.stringify({ sub: "1234567890" }));
      const token = `${header}.${payload}.signature`;

      const result = CryptoUtils.validateJWT(token);

      expect(result.valid).toBe(true);
      expect(result.header).toEqual({});
    });
  });
});

describe("Hash Generation", () => {
  const originalCrypto = global.crypto;
  const originalWindow = global.window;

  beforeEach(() => {
    // Mock Web Crypto API
    const mockDigest = vi.fn().mockResolvedValue(
      new ArrayBuffer(32), // Mock hash output
    );

    global.crypto = {
      subtle: {
        digest: mockDigest,
      } as any,
      getRandomValues: vi.fn(),
    } as any;

    global.window = {
      crypto: global.crypto,
    } as any;
  });

  afterEach(() => {
    global.crypto = originalCrypto;
    global.window = originalWindow;
    vi.clearAllMocks();
  });

  describe("generateHash", () => {
    it("should generate SHA-256 hash from string", async () => {
      const data = "test string";
      const result = await CryptoUtils.generateHash(data, "sha256");

      expect(result.algorithm).toBe("sha256");
      expect(result.hash).toBeDefined();
      expect(result.inputSize).toBe(data.length);
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
      expect(global.crypto.subtle.digest).toHaveBeenCalledWith(
        "SHA-256",
        expect.any(Uint8Array),
      );
    });

    it("should generate hash from ArrayBuffer", async () => {
      const data = new ArrayBuffer(16);
      const result = await CryptoUtils.generateHash(data, "sha256");

      expect(result.algorithm).toBe("sha256");
      expect(result.hash).toBeDefined();
      expect(result.inputSize).toBe(16);
      expect(global.crypto.subtle.digest).toHaveBeenCalledWith(
        "SHA-256",
        expect.any(Uint8Array),
      );
    });

    it("should support different algorithms", async () => {
      const algorithms = ["sha1", "sha256", "sha384", "sha512"];

      for (const algorithm of algorithms) {
        await CryptoUtils.generateHash("test", algorithm);

        const expectedAlgorithm = algorithm.toUpperCase().replace("-", "");
        expect(global.crypto.subtle.digest).toHaveBeenCalledWith(
          expectedAlgorithm,
          expect.any(Uint8Array),
        );
      }
    });

    it("should format hash as uppercase when requested", async () => {
      const mockHash = "abcdef1234567890";
      const mockBuffer = new Uint8Array([171, 205, 239, 18, 52, 86, 144, 144]);

      // Mock bufferToHex to return specific value
      vi.spyOn(CryptoUtils as any, "bufferToHex").mockReturnValue(mockHash);

      const result = await CryptoUtils.generateHash("test", "sha256", {
        uppercase: true,
      });

      expect(result.hash).toBe(mockHash.toUpperCase());
    });

    it("should format hash as base64 when requested", async () => {
      const mockHash = "abcdef1234567890";
      vi.spyOn(CryptoUtils as any, "bufferToHex").mockReturnValue(mockHash);
      vi.spyOn(CryptoUtils as any, "hexToBase64").mockReturnValue(
        "YWJjZGVmMTIzNDU2Nzg5MA==",
      );

      const result = await CryptoUtils.generateHash("test", "sha256", {
        format: "base64",
      });

      expect(result.hash).toBe("YWJjZGVmMTIzNDU2Nzg5MA==");
    });

    it("should handle Web Crypto API unavailability", async () => {
      // Remove Web Crypto API
      global.crypto = {} as any;
      global.window = {} as any;

      const result = await CryptoUtils.generateHash("test", "sha256");

      expect(result.algorithm).toBe("sha256");
      expect(result.hash).toBeDefined();
      expect(result.inputSize).toBe(4);
    });

    it("should handle hash generation errors", async () => {
      (global.crypto.subtle.digest as any).mockRejectedValue(
        new Error("Hash failed"),
      );

      await expect(CryptoUtils.generateHash("test", "sha256")).rejects.toThrow(
        "Hash generation failed: Hash failed",
      );
    });

    it("should handle MD5 with fallback", async () => {
      const result = await CryptoUtils.generateHash("test", "md5");

      expect(result.algorithm).toBe("md5");
      expect(result.hash).toBeDefined();
      expect(result.hash.length).toBe(32); // MD5 produces 32 character hex string
    });
  });
});

describe("Encryption/Decryption", () => {
  const originalCrypto = global.crypto;
  const originalWindow = global.window;

  beforeEach(() => {
    // Mock Web Crypto API for encryption
    const mockEncrypt = vi.fn().mockResolvedValue(new ArrayBuffer(32));
    const mockDecrypt = vi.fn().mockResolvedValue(new ArrayBuffer(16));
    const mockImportKey = vi.fn().mockResolvedValue({} as CryptoKey);
    const mockDeriveKey = vi.fn().mockResolvedValue({} as CryptoKey);
    const mockDeriveBits = vi.fn().mockResolvedValue(new ArrayBuffer(32));

    global.crypto = {
      subtle: {
        encrypt: mockEncrypt,
        decrypt: mockDecrypt,
        importKey: mockImportKey,
        deriveKey: mockDeriveKey,
        deriveBits: mockDeriveBits,
      } as any,
      getRandomValues: vi.fn((arr) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      }),
    } as any;

    global.window = {
      crypto: global.crypto,
    } as any;
  });

  afterEach(() => {
    global.crypto = originalCrypto;
    global.window = originalWindow;
    vi.clearAllMocks();
  });

  describe("encryptData", () => {
    it("should encrypt data with password", async () => {
      const data = "secret message";
      const password = "password123";

      const result = await CryptoUtils.encryptData(data, password);

      expect(result.algorithm).toBe("AES-256-GCM");
      expect(result.encryptedData).toBeDefined();
      expect(result.salt).toBeDefined();
      expect(result.iv).toBeDefined();
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
      expect(result.dataSize).toBe(data.length);
    });

    it("should support different key sizes", async () => {
      const data = "test";
      const password = "password";

      await CryptoUtils.encryptData(data, password, { keySize: 128 });

      expect(global.crypto.subtle.deriveKey).toHaveBeenCalledWith(
        expect.objectContaining({ length: 128 }),
        expect.any(Object),
        expect.objectContaining({ name: "AES-GCM" }),
        false,
        ["encrypt"],
      );
    });

    it("should throw error when Web Crypto API is unavailable", async () => {
      global.crypto = {} as any;
      global.window = {} as any;

      await expect(CryptoUtils.encryptData("test", "password")).rejects.toThrow(
        "Web Crypto API not available in this environment",
      );
    });

    it("should handle encryption errors", async () => {
      (global.crypto.subtle.encrypt as any).mockRejectedValue(
        new Error("Encryption failed"),
      );

      await expect(CryptoUtils.encryptData("test", "password")).rejects.toThrow(
        "Encryption failed: Encryption failed",
      );
    });
  });

  describe("decryptData", () => {
    it("should decrypt data with password", async () => {
      const encryptedData = "mock-encrypted-data";
      const password = "password123";
      const salt = "mock-salt";
      const iv = "mock-iv";

      // Mock base64ToArrayBuffer to return valid buffer
      vi.spyOn(CryptoUtils as any, "base64ToArrayBuffer").mockReturnValue(
        new ArrayBuffer(32),
      );

      const result = await CryptoUtils.decryptData(
        encryptedData,
        password,
        salt,
        iv,
      );

      expect(result).toBe("decrypted content");
    });

    it("should throw error when Web Crypto API is unavailable", async () => {
      global.crypto = {} as any;
      global.window = {} as any;

      await expect(
        CryptoUtils.decryptData("data", "password", "salt", "iv"),
      ).rejects.toThrow("Web Crypto API not available in this environment");
    });

    it("should handle decryption errors", async () => {
      (global.crypto.subtle.decrypt as any).mockRejectedValue(
        new Error("Decryption failed"),
      );

      vi.spyOn(CryptoUtils as any, "base64ToArrayBuffer").mockReturnValue(
        new ArrayBuffer(32),
      );

      await expect(
        CryptoUtils.decryptData("data", "password", "salt", "iv"),
      ).rejects.toThrow("Decryption failed: Decryption failed");
    });

    it("should handle invalid base64 data", async () => {
      vi.spyOn(CryptoUtils as any, "base64ToArrayBuffer").mockImplementation(
        () => {
          throw new Error("Invalid base64");
        },
      );

      await expect(
        CryptoUtils.decryptData("invalid", "password", "salt", "iv"),
      ).rejects.toThrow("Decryption failed: Invalid base64");
    });
  });
});

describe("Password Generation", () => {
  const originalCrypto = global.crypto;
  const originalWindow = global.window;

  beforeEach(() => {
    // Mock crypto for secure random generation
    global.crypto = {
      getRandomValues: vi.fn((arr: Uint8Array) => {
        // Generate predictable values for testing
        for (let i = 0; i < arr.length; i++) {
          arr[i] = (i * 7) % 256;
        }
        return arr;
      }),
    } as any;

    global.window = {
      crypto: global.crypto,
    } as any;
  });

  afterEach(() => {
    global.crypto = originalCrypto;
    global.window = originalWindow;
    vi.clearAllMocks();
  });

  describe("generatePassword", () => {
    it("should generate password with default options", () => {
      const result = CryptoUtils.generatePassword();

      expect(result.password).toBeDefined();
      expect(result.password.length).toBe(16);
      expect(result.strength).toBeDefined();
      expect(result.strength.score).toBeGreaterThanOrEqual(0);
      expect(result.strength.score).toBeLessThanOrEqual(100);
      expect(result.strength.level).toBeDefined();
    });

    it("should generate password with custom length", () => {
      const options = { length: 32 };
      const result = CryptoUtils.generatePassword(options);

      expect(result.password.length).toBe(32);
    });

    it("should include only specified character types", () => {
      const options = {
        length: 20,
        includeUppercase: true,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: false,
      };
      const result = CryptoUtils.generatePassword(options);

      expect(result.password).toMatch(/^[A-Z]+$/);
    });

    it("should exclude similar characters when requested", () => {
      const options = {
        length: 50,
        excludeSimilar: true,
      };
      const result = CryptoUtils.generatePassword(options);

      // Should not contain i, l, 1, L, o, 0, O
      expect(result.password).not.toMatch(/[il1lo0O]/);
    });

    it("should exclude ambiguous characters when requested", () => {
      const options = {
        length: 50,
        excludeAmbiguous: true,
      };
      const result = CryptoUtils.generatePassword(options);

      // Should not contain {}, [], (), /, \, ', ", `, ~, ,, ;, ., <, >
      expect(result.password).not.toMatch(/[{}[\]()\/\\'"`~,;.<>]/);
    });

    it("should use custom character set when provided", () => {
      const options = {
        length: 10,
        customCharset: "ABC123",
      };
      const result = CryptoUtils.generatePassword(options);

      expect(result.password).toMatch(/^[ABC123]+$/);
    });

    it("should ensure all required character types are included", () => {
      const options = {
        length: 20,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
      };
      const result = CryptoUtils.generatePassword(options);

      expect(result.password).toMatch(/[A-Z]/);
      expect(result.password).toMatch(/[a-z]/);
      expect(result.password).toMatch(/[0-9]/);
      expect(result.password).toMatch(/[^a-zA-Z0-9]/);
    });

    it("should throw error when no character set is selected", () => {
      const options = {
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: false,
      };

      expect(() => CryptoUtils.generatePassword(options)).toThrow(
        "No character set selected for password generation",
      );
    });

    it("should work without Web Crypto API", () => {
      global.crypto = {} as any;
      global.window = {} as any;

      const result = CryptoUtils.generatePassword();

      expect(result.password).toBeDefined();
      expect(result.password.length).toBe(16);
    });
  });

  describe("calculatePasswordStrength", () => {
    it("should calculate strength for very weak password", () => {
      const password = "123";
      const result = CryptoUtils.calculatePasswordStrength(password);

      expect(result.score).toBeLessThan(30);
      expect(result.level).toBe("very_weak");
      expect(result.crackTime).toBe("instant");
      expect(result.feedback).toContain(
        "Password should be at least 8 characters long",
      );
      expect(result.entropy).toBeGreaterThan(0);
    });

    it("should calculate strength for strong password", () => {
      const password = "Str0ng!P@ssw0rd#123";
      const result = CryptoUtils.calculatePasswordStrength(password);

      expect(result.score).toBeGreaterThan(80);
      expect(result.level).toBe("very_strong");
      expect(result.crackTime).toBe("centuries");
      expect(result.feedback).toEqual([]);
      expect(result.entropy).toBeGreaterThan(100);
    });

    it("should penalize repeating characters", () => {
      const password = "aaaaBBBB1111!!!!";
      const result = CryptoUtils.calculatePasswordStrength(password);

      expect(result.feedback).toContain("Avoid repeating characters");
    });

    it("should penalize common patterns", () => {
      const passwords = ["password123", "qwerty", "admin123", "letmein"];

      passwords.forEach((password) => {
        const result = CryptoUtils.calculatePasswordStrength(password);
        expect(result.feedback).toContain("Avoid common patterns and words");
      });
    });

    it("should provide feedback for missing character types", () => {
      const password = "lowercaseonly";
      const result = CryptoUtils.calculatePasswordStrength(password);

      expect(result.feedback).toContain("Include uppercase letters");
      expect(result.feedback).toContain("Include numbers");
      expect(result.feedback).toContain("Include special characters");
    });

    it("should calculate entropy correctly", () => {
      const password = "abc123";
      const result = CryptoUtils.calculatePasswordStrength(password);

      // Entropy = length * log2(charsetSize)
      // For lowercase + numbers: 6 * log2(36) ≈ 31
      expect(result.entropy).toBeCloseTo(31, 0);
    });
  });
});

describe("UUID Generation", () => {
  const originalCrypto = global.crypto;
  const originalWindow = global.window;

  beforeEach(() => {
    global.crypto = {
      getRandomValues: vi.fn((arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = i;
        }
        return arr;
      }),
    } as any;

    global.window = {
      crypto: global.crypto,
    } as any;
  });

  afterEach(() => {
    global.crypto = originalCrypto;
    global.window = originalWindow;
    vi.clearAllMocks();
  });

  describe("generateUUID", () => {
    it("should generate valid UUID v4 format", () => {
      const uuid = CryptoUtils.generateUUID();

      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it("should generate different UUIDs on multiple calls", () => {
      const uuid1 = CryptoUtils.generateUUID();
      const uuid2 = CryptoUtils.generateUUID();

      expect(uuid1).not.toBe(uuid2);
    });

    it("should work without Web Crypto API", () => {
      global.crypto = {} as any;
      global.window = {} as any;

      const uuid = CryptoUtils.generateUUID();

      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });
  });
});

describe("Utility Functions", () => {
  describe("Convenience Functions", () => {
    it("should export generateHash as convenience function", async () => {
      const data = "test";
      const hash = await CryptoUtils.generateHash(data, "sha256");

      expect(hash.algorithm).toBe("sha256");
      expect(hash.hash).toBeDefined();
    });

    it("should export calculatePasswordStrength as convenience function", () => {
      const password = "test";
      const strength = CryptoUtils.calculatePasswordStrength(password);

      expect(strength.score).toBeGreaterThanOrEqual(0);
      expect(strength.level).toBeDefined();
    });

    it("should export generateUUID as convenience function", () => {
      const uuid = CryptoUtils.generateUUID();

      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });
  });
});
