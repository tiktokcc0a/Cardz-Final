"use client" // 错误组件必须是客户端组件

import type React from "react"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import InteractiveBackground from "@/components/interactive-background"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 可以将错误记录到日志服务
    console.error(error)
  }, [error])

  return (
    <>
      <InteractiveBackground />
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="text-center p-8 bg-black/30 backdrop-blur-md rounded-xl shadow-2xl border border-white/20">
          <h2 className="text-2xl font-bold text-red-300 mb-4">加载数据时出错</h2>
          <p className="text-white/80 mb-6">
            抱歉，我们遇到了一些问题，请稍后重试。
          </p>
          <Button
            onClick={
              // 尝试重置，通过重新渲染路由段
              () => reset()
            }
            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            重试
          </Button>
        </div>
      </div>
    </>
  )
}