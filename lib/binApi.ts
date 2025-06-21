// BIN 国家检测 API - 修正版本
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

class BinApiClient {
  private cache = new Map<string, BinInfo>()

  async getBinInfo(bin: string): Promise<BinInfo | null> {
    // 检查缓存
    if (this.cache.has(bin)) {
      return this.cache.get(bin)!
    }

    try {
      console.log(`🔍 [BIN API] 请求BIN信息: ${bin}`)
      const response = await fetch(`https://bin.32v.us/${bin}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log(`✅ [BIN API] BIN ${bin} 原始响应:`, data)

      // 直接使用API返回的数据结构
      const binInfo: BinInfo = {
        alpha_2: data.alpha_2 || "XX",
        alpha_3: data.alpha_3 || "XXX",
        bin: data.bin || bin,
        brand: data.brand || "Unknown",
        category: data.category || "Unknown",
        country: data.country || "Unknown",
        issuer: data.issuer || "Unknown",
        type: data.type || "Unknown",
      }

      // 缓存结果
      this.cache.set(bin, binInfo)
      console.log(`✅ [BIN API] BIN ${bin} 处理后信息:`, binInfo)
      return binInfo
    } catch (error) {
      console.error(`❌ [BIN API] 获取BIN信息失败 (${bin}):`, error)

      // 返回默认值
      const defaultInfo: BinInfo = {
        alpha_2: "XX",
        alpha_3: "XXX",
        bin: bin,
        brand: "Unknown",
        category: "Unknown",
        country: "Unknown",
        issuer: "Unknown",
        type: "Unknown",
      }

      this.cache.set(bin, defaultInfo)
      return defaultInfo
    }
  }

  // 批量获取BIN信息
  async getBinInfoBatch(bins: string[]): Promise<Map<string, BinInfo>> {
    const results = new Map<string, BinInfo>()
    console.log(`🔍 [BIN API] 批量获取BIN信息:`, bins)

    // 并发请求，但限制并发数量
    const batchSize = 3
    for (let i = 0; i < bins.length; i += batchSize) {
      const batch = bins.slice(i, i + batchSize)
      console.log(`🔍 [BIN API] 处理批次 ${Math.floor(i / batchSize) + 1}:`, batch)

      const promises = batch.map((bin) => this.getBinInfo(bin))

      try {
        const batchResults = await Promise.all(promises)
        batch.forEach((bin, index) => {
          if (batchResults[index]) {
            results.set(bin, batchResults[index])
          }
        })
      } catch (error) {
        console.error("❌ [BIN API] 批量获取BIN信息失败:", error)
      }

      // 添加延迟避免请求过于频繁
      if (i + batchSize < bins.length) {
        await new Promise((resolve) => setTimeout(resolve, 300))
      }
    }

    console.log(`✅ [BIN API] 批量获取完成，共获取 ${results.size} 个BIN信息`)
    return results
  }
}

export const binApiClient = new BinApiClient()
