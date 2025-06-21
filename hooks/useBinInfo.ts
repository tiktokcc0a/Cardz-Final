"use client"

import { useState, useEffect } from "react"
import { binApiClient } from "@/lib/binApi"

interface BinInfo {
  alpha_2: string
  alpha_3: string
  bin: string
  brand: string
  category: string
  country: string
  issuer: string
  type: string
}

export function useBinInfo(bin: string) {
  const [binInfo, setBinInfo] = useState<BinInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!bin || bin.length !== 6) {
      setBinInfo(null)
      return
    }

    const fetchBinInfo = async () => {
      setLoading(true)
      setError(null)

      try {
        const info = await binApiClient.getBinInfo(bin)
        setBinInfo(info)
      } catch (err) {
        setError(err instanceof Error ? err.message : "获取BIN信息失败")
      } finally {
        setLoading(false)
      }
    }

    fetchBinInfo()
  }, [bin])

  return { binInfo, loading, error }
}

export function useBinInfoBatch(bins: string[]) {
  const [binInfoMap, setBinInfoMap] = useState<Map<string, BinInfo>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (bins.length === 0) {
      setBinInfoMap(new Map())
      return
    }

    const fetchBinInfoBatch = async () => {
      setLoading(true)
      setError(null)

      try {
        const infoMap = await binApiClient.getBinInfoBatch(bins)
        setBinInfoMap(infoMap)
      } catch (err) {
        setError(err instanceof Error ? err.message : "批量获取BIN信息失败")
      } finally {
        setLoading(false)
      }
    }

    fetchBinInfoBatch()
  }, [bins.join(",")])

  return { binInfoMap, loading, error }
}
