import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility function", () => {
  it("merges class names correctly", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("foo", true && "bar", false && "baz")).toBe("foo bar");
  });

  it("handles undefined and null values", () => {
    expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
  });

  it("handles empty strings", () => {
    expect(cn("foo", "", "bar")).toBe("foo bar");
  });

  it("handles conflicting tailwind classes", () => {
    expect(cn("text-sm text-lg")).toBe("text-lg");
  });

  it("handles arrays and objects", () => {
    expect(cn(["foo", "bar"], { baz: true, qux: false })).toBe("foo bar baz");
  });

  it("handles complex input", () => {
    const result = cn(
      "base-class",
      {
        "conditional-class": true,
        "another-conditional": false,
      },
      ["array-class-1", "array-class-2"],
      null,
      undefined,
      "",
    );

    expect(result).toBe("base-class conditional-class array-class-1 array-class-2");
  });
});
