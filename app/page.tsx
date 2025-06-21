"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Search, Upload, Trash2, Download, Move, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import GlowMenu from "@/components/glow-menu"
import InteractiveBackground from "@/components/interactive-background"
import { useApiData, useApiMutation } from "@/hooks/useApi"
import { apiClient } from "@/lib/api"
import { useBinInfoBatch } from "@/hooks/useBinInfo"

// 导入我们新创建的组件
import ConnectionStatusIndicator from "@/components/connection-status"
import DemoAlert from "@/components/demo-alert"
import SearchIndicator from "@/components/search-indicator"

// 统计区域的国旗显示（中文+国家代码+国旗）
const getCountryFlagForStats = (countryCode: string) => {
  const countryNames: { [key: string]: string } = {
    US: "美国",
    CA: "加拿大",
    UK: "英国",
    GB: "英国",
    DE: "德国",
    FR: "法国",
    JP: "日本",
    AU: "澳大利亚",
    CN: "中国",
    KR: "韩国",
    IT: "意大利",
    ES: "西班牙",
    NL: "荷兰",
    SE: "瑞典",
    NO: "挪威",
    DK: "丹麦",
    FI: "芬兰",
    CH: "瑞士",
    AT: "奥地利",
    BE: "比利时",
    IE: "爱尔兰",
    PT: "葡萄牙",
    GR: "希腊",
    PL: "波兰",
    CZ: "捷克",
    HU: "匈牙利",
    RO: "罗马尼亚",
    BG: "保加利亚",
    HR: "克罗地亚",
    SI: "斯洛文尼亚",
    SK: "斯洛伐克",
    LT: "立陶宛",
    LV: "拉脱维亚",
    EE: "爱沙尼亚",
    LU: "卢森堡",
    MT: "马耳他",
    CY: "塞浦路斯",
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-6 h-4 rounded-sm bg-gray-200 flex items-center justify-center text-xs font-bold border border-gray-300 country-flag country-flag-${countryCode.toLowerCase()}`}
        style={{
          backgroundImage: `url(https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        title={countryNames[countryCode] || countryCode}
      >
        <span className="country-code-fallback text-gray-600">{countryCode}</span>
      </div>
      <span className="text-sm font-medium text-white">
        {countryNames[countryCode] || countryCode} ({countryCode})
      </span>
    </div>
  )
}

// 表格中的国旗显示（国旗+国家代码）- 紧凑版
const getCountryFlagForTable = (countryCode: string) => {
  return (
    <div className="country-compact">
      <div
        className={`country-flag rounded-sm bg-gray-200 flex items-center justify-center text-xs font-bold border border-gray-300 country-flag-${countryCode.toLowerCase()}`}
        style={{
          backgroundImage: `url(https://flagcdn.com/16x12/${countryCode.toLowerCase()}.png)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        title={countryCode}
      >
        <span className="country-code-fallback text-gray-600 text-xs">{countryCode}</span>
      </div>
      <span className="text-white">{countryCode}</span>
    </div>
  )
}

// BIN 国家显示组件 - 清洁版本
const getBinCountryDisplay = (bin: string, binInfoMap: Map<string, any>) => {
  const binInfo = binInfoMap.get(bin)

  if (!binInfo) {
    return (
      <div className="bin-country-display">
        <div className="bin-country-flag bg-gray-200 flex items-center justify-center text-xs font-bold border border-gray-300">
          <span className="text-gray-500">?</span>
        </div>
        <span className="text-white font-mono font-bold">{bin}</span>
        <span className="text-red-300 text-xs ml-2">(加载中...)</span>
      </div>
    )
  }

  if (binInfo.alpha_2 === "XX") {
    return (
      <div className="bin-country-display">
        <div className="bin-country-flag bg-gray-200 flex items-center justify-center text-xs font-bold border border-gray-300">
          <span className="text-gray-500">?</span>
        </div>
        <span className="text-white font-mono font-bold">{bin}</span>
        <span className="text-yellow-300 text-xs ml-2">(未知国家)</span>
      </div>
    )
  }

  const countryCode = binInfo.alpha_2.toLowerCase()
  const flagUrl = `https://flagcdn.com/20x15/${countryCode}.png`

  return (
    <div className="bin-country-display">
      <div
        className="bin-country-flag bg-gray-200 border border-gray-300"
        style={{
          backgroundImage: `url(${flagUrl})`,
        }}
        title={`${binInfo.country} (${binInfo.alpha_2}) - ${binInfo.issuer}`}
      >
        {/* 只在图片加载失败时显示的fallback */}
        <span className="country-code-fallback text-gray-600">{binInfo.alpha_2}</span>
      </div>
      <span className="text-white font-mono font-bold">{bin}</span>
      <span className="text-green-300 text-xs ml-2">({binInfo.alpha_2})</span>
    </div>
  )
}

const getRating = (rate: number) => {
  if (rate >= 90) return ["Awesome", "rating-awesome"]
  if (rate >= 80) return ["Excellent", "rating-excellent"]
  if (rate >= 70) return ["Normal", "rating-normal"]
  if (rate >= 60) return ["So-so", "rating-so-so"]
  if (rate >= 50) return ["Loss", "rating-loss"]
  return ["Trash", "rating-trash"]
}

export default function CardzManagement() {
  const [selectedLibraryCards, setSelectedLibraryCards] = useState<number[]>([])
  const [selectedPoolCards, setSelectedPoolCards] = useState<number[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchInput, setSearchInput] = useState("") // 分离搜索输入和实际搜索
  const [uploadTarget, setUploadTarget] = useState("library")
  const [cardData, setCardData] = useState("")
  const [newBin, setNewBin] = useState("")
  const [newCardRate, setNewCardRate] = useState("")
  const [newAwsRate, setNewAwsRate] = useState("")
  
  const { toast } = useToast()
  const { data, refetch, connectionStatus, setConnectionStatus } = useApiData(searchQuery)
  const { mutate, loading: mutating } = useApiMutation()
  
  const allBins = data?.feed_bins.map((bin) => bin.bin) || []
  const { binInfoMap } = useBinInfoBatch(allBins)
  const apiInfo = apiClient.getApiInfo()

  useEffect(() => {
    // 这个 effect 只在 connectionStatus 变化时触发 toast，避免重复
    if (connectionStatus === 'connected') {
        toast({
            title: "✅ 后端连接成功",
            description: "已成功连接到后端服务器",
        });
    } else if (connectionStatus === 'disconnected') {
        // 只有当 data 存在（说明已加载模拟数据）时才显示此 toast
        if (data) {
          toast({
              title: "⚠️ 使用演示模式",
              description: `无法连接到后端服务器，当前使用模拟数据进行演示`,
          });
        }
    }
  }, [connectionStatus, toast, data]);


  const handleLibraryCardSelect = (cardId: number, checked: boolean) => {
    if (checked) {
      setSelectedLibraryCards([...selectedLibraryCards, cardId])
    } else {
      setSelectedLibraryCards(selectedLibraryCards.filter((id) => id !== cardId))
    }
  }

  const handlePoolCardSelect = (cardId: number, checked: boolean) => {
    if (checked) {
      setSelectedPoolCards([...selectedPoolCards, cardId])
    } else {
      setSelectedPoolCards(selectedPoolCards.filter((id) => id !== cardId))
    }
  }

  const toggleAllLibrary = (checked: boolean) => {
    if (checked && data) {
      setSelectedLibraryCards(data.library_cards.map((card) => card.id))
    } else {
      setSelectedLibraryCards([])
    }
  }

  const toggleAllPool = (checked: boolean) => {
    if (checked && data) {
      setSelectedPoolCards(data.pool_cards.map((card) => card.id))
    } else {
      setSelectedPoolCards([])
    }
  }

  // 搜索处理
  const handleSearch = () => {
    setSearchQuery(searchInput.trim())
  }

  const handleClearSearch = () => {
    setSearchInput("")
    setSearchQuery("")
  }

  // 回车键搜索
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  // 文件上传处理
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setCardData(content)
      }
      reader.readAsText(file)
    }
  }

  const handleUpload = async () => {
    if (!cardData.trim()) {
      toast({
        title: "错误",
        description: "请输入卡片数据或上传文件",
        variant: "destructive",
      })
      return
    }

    await mutate(
      () => apiClient.uploadCards(uploadTarget as "library" | "pool", cardData),
      (result: any) => {
        toast({
          title: "成功",
          description: result.message,
        })
        setCardData("")
        refetch()
      },
      (error) => {
        toast({
          title: "上传失败",
          description: error.message,
          variant: "destructive",
        })
      },
    )
  }

  const handleMoveToPool = async () => {
    if (selectedLibraryCards.length === 0) {
      toast({
        title: "错误",
        description: "请选择要移动的卡片",
        variant: "destructive",
      })
      return
    }

    await mutate(
      () => apiClient.moveToPool(selectedLibraryCards),
      (result: any) => {
        toast({
          title: "成功",
          description: result.message,
        })
        setSelectedLibraryCards([])
        refetch()
      },
      (error) => {
        toast({
          title: "移动失败",
          description: error.message,
          variant: "destructive",
        })
      },
    )
  }

  const handleDeleteCards = async (target: "library" | "pool") => {
    const selectedCards = target === "library" ? selectedLibraryCards : selectedPoolCards
    if (selectedCards.length === 0) {
      toast({
        title: "错误",
        description: "请选择要删除的卡片",
        variant: "destructive",
      })
      return
    }

    await mutate(
      () => apiClient.deleteCards(target, selectedCards),
      (result: any) => {
        toast({
          title: "成功",
          description: result.message,
        })
        if (target === "library") {
          setSelectedLibraryCards([])
        } else {
          setSelectedPoolCards([])
        }
        refetch()
      },
      (error) => {
        toast({
          title: "删除失败",
          description: error.message,
          variant: "destructive",
        })
      },
    )
  }

  const handleExportCards = async (target: "library" | "pool") => {
    const selectedCards = target === "library" ? selectedLibraryCards : selectedPoolCards
    if (selectedCards.length === 0) {
      toast({
        title: "错误",
        description: "请选择要导出的卡片",
        variant: "destructive",
      })
      return
    }

    await mutate(
      () => apiClient.exportCards(target, selectedCards),
      (blob: Blob) => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "cards.txt"
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast({
          title: "成功",
          description: "卡片已导出",
        })
      },
      (error) => {
        toast({
          title: "导出失败",
          description: error.message,
          variant: "destructive",
        })
      },
    )
  }

  const handleAddFeedBin = async () => {
    if (!newBin || newBin.length !== 6) {
      toast({
        title: "错误",
        description: "请输入有效的6位BIN",
        variant: "destructive",
      })
      return
    }

    await mutate(
      () =>
        apiClient.addFeedBin(
          newBin,
          newCardRate ? Number.parseInt(newCardRate) : undefined,
          newAwsRate ? Number.parseInt(newAwsRate) : undefined,
        ),
      (result: any) => {
        toast({
          title: "成功",
          description: result.message,
        })
        setNewBin("")
        setNewCardRate("")
        setNewAwsRate("")
        refetch()
      },
      (error) => {
        toast({
          title: "添加失败",
          description: error.message,
          variant: "destructive",
        })
      },
    )
  }

  const handleDeleteFeedBin = async (id: number) => {
    await mutate(
      () => apiClient.deleteFeedBin(id),
      (result: any) => {
        toast({
          title: "成功",
          description: result.message,
        })
        refetch()
      },
      (error) => {
        toast({
          title: "删除失败",
          description: error.message,
          variant: "destructive",
        })
      },
    )
  }

  // 重新测试连接
  const handleRetryConnection = async () => {
    setConnectionStatus("testing")
    await refetch() 
    // refetch 内部会更新 connectionStatus
  }

  return (
    <>
      <InteractiveBackground />

      <div className="min-h-screen theme-transition relative z-10">
        <header className="relative z-20 backdrop-blur-xl bg-white/10 border-b border-white/20">
          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent">
                  Cardz 卡片管理系统
                </h1>
                <ConnectionStatusIndicator status={connectionStatus} />
              </div>
              <GlowMenu />
            </div>
          </div>
        </header>

        <main className="relative z-10 container mx-auto px-6 py-8 space-y-8">
          <DemoAlert show={apiInfo.usingMockData} onRetry={handleRetryConnection} />

          <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl theme-transition">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="w-5 h-5" />
                上传卡片
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-white/80 text-sm font-medium">上传至:</label>
                <Select value={uploadTarget} onValueChange={setUploadTarget}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900/95 border-white/20 backdrop-blur-xl z-[9999]">
                    <SelectItem value="library">卡库 (未使用)</SelectItem>
                    <SelectItem value="pool">卡池 (已使用)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-white/80 text-sm font-medium">上传文件:</label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept=".txt,.csv"
                    onChange={handleFileUpload}
                    className="bg-white/10 border-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/20 file:text-white hover:file:bg-white/30"
                  />
                  <span className="text-white/60 text-sm">支持 .txt, .csv 格式</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-white/80 text-sm font-medium">或粘贴卡片数据 (一行一张):</label>
                <Textarea
                  value={cardData}
                  onChange={(e) => setCardData(e.target.value)}
                  placeholder="卡号|月份/年份|CVV..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[120px]"
                />
              </div>
              <Button
                onClick={handleUpload}
                disabled={mutating}
                className="bg-gradient-to-r from-blue-500/80 to-purple-500/80 hover:from-blue-600/80 hover:to-purple-600/80 text-white shadow-lg border-0"
              >
                {mutating ? "上传中..." : "开始上传"}
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl theme-transition">
            <CardHeader>
              <CardTitle className="text-white">料站 - cczauvr.sale/Other 高活率BIN</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="space-y-2">
                  <label className="text-white/80 text-sm font-medium">BIN (6位数字)</label>
                  <Input
                    value={newBin}
                    onChange={(e) => setNewBin(e.target.value)}
                    placeholder="BIN"
                    maxLength={6}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-white/80 text-sm font-medium">卡片活率</label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={newCardRate}
                      onChange={(e) => setNewCardRate(e.target.value)}
                      placeholder="0-100"
                      min="0"
                      max="100"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pr-8"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60">%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-white/80 text-sm font-medium">AWS活率</label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={newAwsRate}
                      onChange={(e) => setNewAwsRate(e.target.value)}
                      placeholder="0-100"
                      min="0"
                      max="100"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pr-8"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60">%</span>
                  </div>
                </div>
                <Button
                  onClick={handleAddFeedBin}
                  disabled={mutating}
                  className="bg-gradient-to-r from-green-500/80 to-emerald-500/80 hover:from-green-600/80 hover:to-emerald-600/80 text-white border-0"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {mutating ? "添加中..." : "添加/更新"}
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-3 px-4 text-white/80 font-medium">BIN</th>
                      <th className="text-left py-3 px-4 text-white/80 font-medium">卡片活率</th>
                      <th className="text-left py-3 px-4 text-white/80 font-medium">AWS活率</th>
                      <th className="text-left py-3 px-4 text-white/80 font-medium">最后修改日期</th>
                      <th className="text-left py-3 px-4 text-white/80 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.feed_bins.map((bin) => (
                      <tr key={bin.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4">{getBinCountryDisplay(bin.bin, binInfoMap)}</td>
                        <td className="py-3 px-4 text-white">
                          {bin.card_rate !== null ? `${bin.card_rate}%` : "N/A"}
                          {bin.card_rate !== null && (
                            <span
                              className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${getRating(bin.card_rate)[1]}`}
                            >
                              {getRating(bin.card_rate)[0]}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-white">
                          {bin.aws_rate !== null ? `${bin.aws_rate}%` : "N/A"}
                          {bin.aws_rate !== null && (
                            <span
                              className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${getRating(bin.aws_rate)[1]}`}
                            >
                              {getRating(bin.aws_rate)[0]}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-white/70">{bin.last_modified}</td>
                        <td className="py-3 px-4">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteFeedBin(bin.id)}
                            disabled={mutating}
                            className="bg-red-500/80 hover:bg-red-600/80 border-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl theme-transition">
            <CardHeader>
              <CardTitle className="text-white">卡片库存统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {data &&
                  Object.entries(data.stats).map(([country, stats]) => (
                    <div key={country} className="space-y-3">
                      <div className="flex items-center gap-2">
                        {getCountryFlagForStats(country)}
                        <span className="text-white font-bold text-lg">(总计: {stats.total} 张)</span>
                      </div>
                      <ul className="space-y-1 pl-4">
                        {Object.entries(stats.bins).map(([bin, count]) => (
                          <li key={bin} className="text-white/70 text-sm">
                            <span className="font-mono">{bin}</span>: {count} 张
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl theme-transition">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                  <Input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                    placeholder="在卡库和卡池中搜索 (卡号, 国家, 品牌, 类型, 发卡行等)..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pl-10"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={!searchInput.trim()}
                  className="bg-gradient-to-r from-blue-500/80 to-purple-500/80 hover:from-blue-600/80 hover:to-purple-600/80 text-white border-0"
                >
                  <Search className="w-4 h-4 mr-2" />
                  搜索
                </Button>
                {searchQuery && (
                  <Button
                    variant="outline"
                    onClick={handleClearSearch}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    清除搜索
                  </Button>
                )}
              </div>
              <SearchIndicator query={searchQuery} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl theme-transition">
              <CardHeader>
                <CardTitle className="text-white">卡库 (未使用) - 共 {data?.library_cards.length || 0} 张</CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleMoveToPool}
                    disabled={selectedLibraryCards.length === 0 || mutating}
                    className="bg-gradient-to-r from-blue-500/80 to-cyan-500/80 hover:from-blue-600/80 hover:to-cyan-600/80 text-white border-0"
                  >
                    <Move className="w-4 h-4 mr-2" />
                    移动选中到卡池
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteCards("library")}
                    disabled={selectedLibraryCards.length === 0 || mutating}
                    className="bg-red-500/80 hover:bg-red-600/80 border-0"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    删除选中
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExportCards("library")}
                    disabled={selectedLibraryCards.length === 0 || mutating}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    导出选中
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full cards-table">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left py-2 px-2">
                          <Checkbox
                            checked={
                              data != null &&
                              data.library_cards.length > 0 &&
                              selectedLibraryCards.length === data.library_cards.length
                            }
                            onCheckedChange={toggleAllLibrary}
                          />
                        </th>
                        <th className="text-left py-2 px-2 text-white/80 font-medium">卡号</th>
                        <th className="text-left py-2 px-2 text-white/80 font-medium">国家</th>
                        <th className="text-left py-2 px-2 text-white/80 font-medium">有效期</th>
                        <th className="text-left py-2 px-2 text-white/80 font-medium">CVV</th>
                        <th className="text-left py-2 px-2 text-white/80 font-medium">品牌</th>
                        <th className="text-left py-2 px-2 text-white/80 font-medium">发卡行 / 类型</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.library_cards.map((card) => (
                        <tr key={card.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                          <td className="py-2 px-2">
                            <Checkbox
                              checked={selectedLibraryCards.includes(card.id)}
                              onCheckedChange={(checked) => handleLibraryCardSelect(card.id, checked as boolean)}
                            />
                          </td>
                          <td className="py-2 px-2 text-white font-mono text-sm">
                            {card.card_number.slice(0, 6)}...{card.card_number.slice(-4)}
                          </td>
                          <td className="py-2 px-2 text-white">{getCountryFlagForTable(card.country_alpha2)}</td>
                          <td className="py-2 px-2 text-white text-sm">
                            {card.month}/{card.year}
                          </td>
                          <td className="py-2 px-2 text-white font-mono text-sm">{card.cvv}</td>
                          <td className="py-2 px-2 text-white text-sm">{card.brand || "N/A"}</td>
                          <td className="py-2 px-2 text-white">
                            <div className="issuer-info">
                              <div className="issuer-name">{card.issuer || "未知发卡行"}</div>
                              <div className="card-details">
                                <span>{card.type || "未知类型"}</span>
                                <span className="text-white/40">•</span>
                                <span>{card.category || "未知级别"}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl theme-transition">
              <CardHeader>
                <CardTitle className="text-white">卡池 (已使用) - 共 {data?.pool_cards.length || 0} 张</CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteCards("pool")}
                    disabled={selectedPoolCards.length === 0 || mutating}
                    className="bg-red-500/80 hover:bg-red-600/80 border-0"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    删除选中
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExportCards("pool")}
                    disabled={selectedPoolCards.length === 0 || mutating}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    导出选中
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full cards-table">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left py-2 px-2">
                          <Checkbox
                            checked={
                              data != null &&
                              data.pool_cards.length > 0 &&
                              selectedPoolCards.length === data.pool_cards.length
                            }
                            onCheckedChange={toggleAllPool}
                          />
                        </th>
                        <th className="text-left py-2 px-2 text-white/80 font-medium">卡号</th>
                        <th className="text-left py-2 px-2 text-white/80 font-medium">国家</th>
                        <th className="text-left py-2 px-2 text-white/80 font-medium">有效期</th>
                        <th className="text-left py-2 px-2 text-white/80 font-medium">CVV</th>
                        <th className="text-left py-2 px-2 text-white/80 font-medium">品牌</th>
                        <th className="text-left py-2 px-2 text-white/80 font-medium">发卡行 / 类型</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.pool_cards.map((card) => (
                        <tr key={card.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                          <td className="py-2 px-2">
                            <Checkbox
                              checked={selectedPoolCards.includes(card.id)}
                              onCheckedChange={(checked) => handlePoolCardSelect(card.id, checked as boolean)}
                            />
                          </td>
                          <td className="py-2 px-2 text-white font-mono text-sm">
                            {card.card_number.slice(0, 6)}...{card.card_number.slice(-4)}
                          </td>
                          <td className="py-2 px-2 text-white">{getCountryFlagForTable(card.country_alpha2)}</td>
                          <td className="py-2 px-2 text-white text-sm">
                            {card.month}/{card.year}
                          </td>
                          <td className="py-2 px-2 text-white font-mono text-sm">{card.cvv}</td>
                          <td className="py-2 px-2 text-white text-sm">{card.brand || "N/A"}</td>
                          <td className="py-2 px-2 text-white">
                            <div className="issuer-info">
                              <div className="issuer-name">{card.issuer || "未知发卡行"}</div>
                              <div className="card-details">
                                <span>{card.type || "未知类型"}</span>
                                <span className="text-white/40">•</span>
                                <span>{card.category || "未知级别"}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  )
}