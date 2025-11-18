import { ToolsLayout as ToolsLayoutComponent } from "@/components/layout/tools-layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer Tools - Parsify.dev",
  description:
    "Professional tools for JSON processing, code execution, file transformation, and more. All tools run securely in your browser with no data sent to servers.",
  keywords: [
    "developer tools",
    "json formatter",
    "code executor",
    "file processor",
    "online utilities",
    "browser tools",
    "wasm sandbox",
  ],
  openGraph: {
    title: "Developer Tools - Parsify.dev",
    description:
      "Professional tools for JSON processing, code execution, file transformation, and more.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Developer Tools - Parsify.dev",
    description:
      "Professional tools for JSON processing, code execution, file transformation, and more.",
  },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <ToolsLayoutComponent>{children}</ToolsLayoutComponent>;
}
