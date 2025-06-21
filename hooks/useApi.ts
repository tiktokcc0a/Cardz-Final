"use client"

import { useState, useEffect, useCallback }
from "react"
import { apiClient, type ApiResponse } from "@/lib/api"

export type ConnectionStatus = "testing" | "connected" | "disconnected"

export function useApiData(searchQuery?: string) {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("testing")

  // 1. 优化后的连接测试与数据获取函数
  const fetchData = useCallback(async (isRetry = false) => {
    setLoading(true)
    setError(null)

    try {
      // 首次尝试直接获取数据 (乐观模式)
      const result = await apiClient.getAllData(searchQuery)
      setData(result)
      // 如果请求成功，无论是否是mock，都说明流程通了
      if (apiClient.getApiInfo().usingMockData) {
        setConnectionStatus("disconnected")
      } else {
        setConnectionStatus("connected")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "获取数据失败"
      console.error("useApiData error:", errorMessage)
      setError(errorMessage)
      setConnectionStatus("disconnected")

      // 如果是连接错误，可以尝试强制使用 mock 模式并重新获取一次数据
      if (!isRetry && (errorMessage.includes("HTML instead of JSON") || errorMessage.includes("Expected JSON response"))) {
        console.log("🔄 Forcing mock mode and retrying...")
        apiClient.forceMockMode()
        await fetchData(true); // 传入 isRetry=true 避免无限循环
      } else if (!isRetry) {
        setError("无法获取数据，请检查网络连接")
      }

    } finally {
      setLoading(false)
    }
  }, [searchQuery]) // 使用 useCallback 包装

  // 2. 初始加载时执行
  useEffect(() => {
    fetchData()
  }, [fetchData]) // fetchData 包含了 searchQuery 的依赖

  // 3. 返回连接状态，方便UI展示
  return {
    data,
    loading,
    error,
    refetch: () => fetchData(), // refetch 直接调用 fetchData
    connectionStatus,
    setConnectionStatus, // 暴露 setConnectionStatus
  }
}

// useApiMutation 保持不变
export function useApiMutation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = async <T,>(
    apiCall: () => Promise<T>,
    onSuccess?: (data: T) => void,
    onError?: (error: Error) => void,
  ) => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiCall()
      onSuccess?.(result)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error("操作失败")
      setError(error.message)
      onError?.(error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    mutate,
    loading,
    error,
  }
}