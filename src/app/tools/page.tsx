"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";

export default function ToolsPage() {
  const router = useRouter();

  useEffect(() => {
    // 自动重定向到创新设计页面
    router.replace("/tools/innovative");
  }, [router]);

  return (
    <MainLayout>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600 dark:text-gray-300 mb-4">
            正在重定向到创新设计页面...
          </h1>
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-transparent border-b-transparent animate-spin"></div>
        </div>
      </div>
    </MainLayout>
  );
}
