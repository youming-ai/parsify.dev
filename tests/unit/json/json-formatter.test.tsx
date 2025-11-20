import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { JSONFormatter } from "@/components/tools/json/json-formatter";

describe("JSONFormatter", () => {
  const mockProps = {
    jsonData: '{"name":"test","value":123}',
    onFormatChange: vi.fn(),
    className: "",
    readOnly: false,
    showStats: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders JSON formatter component", () => {
    render(<JSONFormatter {...mockProps} />);
    expect(screen.getByText(/format/i)).toBeInTheDocument();
  });

  it("formats JSON correctly", () => {
    render(<JSONFormatter {...mockProps} />);
    const formatButton = screen.getByText(/format/i);
    fireEvent.click(formatButton);

    // Verify the callback was called
    expect(mockProps.onFormatChange).toHaveBeenCalled();
  });

  it("validates JSON syntax", () => {
    const invalidProps = { ...mockProps, jsonData: '{"invalid": json}' };
    render(<JSONFormatter {...invalidProps} />);

    // Should show error for invalid JSON
    expect(screen.getByText(/invalid.*json/i)).toBeInTheDocument();
  });

  it("displays statistics when enabled", () => {
    render(<JSONFormatter {...mockProps} />);
    expect(screen.getByText(/characters/i)).toBeInTheDocument();
    expect(screen.getByText(/lines/i)).toBeInTheDocument();
  });
});
