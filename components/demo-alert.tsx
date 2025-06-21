"use client"

import type React from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface DemoAlertProps {
  show: boolean
  onRetry: () => void
}

export default function DemoAlert({ show, onRetry }: DemoAlertProps) {
  if (!show) {
    return null
  }

  return (
    <Alert className="border-yellow-400/30 bg-yellow-500/10 backdrop-blur-xl">
      <AlertCircle className="h-4 w-4 text-yellow-300" />
      <AlertDescription className="text-yellow-200 flex items-center justify-between">
        <div>
          <strong>演示模式:</strong> 无法连接到后端服务器，当前使用模拟数据进行演示。所有操作都是模拟的，不会保存到真实数据库。
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="ml-4 border-yellow-400/30 text-yellow-200 hover:bg-yellow-500/20 bg-transparent"
        >
          重试连接
        </Button>
      </AlertDescription>
    </Alert>
  )
}