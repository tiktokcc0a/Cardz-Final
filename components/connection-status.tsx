"use client"

import type React from "react"
import { Wifi, WifiOff } from "lucide-react"
import type { ConnectionStatus } from "@/hooks/useApi" // 从我们之前定义的类型中导入

interface ConnectionStatusIndicatorProps {
  status: ConnectionStatus
}

export default function ConnectionStatusIndicator({ status }: ConnectionStatusIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {status === "connected" && (
        <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full border border-green-400/30">
          <Wifi className="w-4 h-4 text-green-300" />
          <span className="text-xs text-green-200">已连接</span>
        </div>
      )}
      {status === "disconnected" && (
        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 rounded-full border border-yellow-400/30">
          <WifiOff className="w-4 h-4 text-yellow-300" />
          <span className="text-xs text-yellow-200">演示模式</span>
        </div>
      )}
      {status === "testing" && (
        <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 rounded-full border border-blue-400/30">
          <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-blue-200">测试中</span>
        </div>
      )}
    </div>
  )
}