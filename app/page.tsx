"use client"

import type React from "react"
import { useState, useEffect, useMemo, useId } from "react"
import { Search, Upload, Trash2, Download, Move, Plus, ChevronLeft, ChevronRight, ChevronsUpDown, ArrowDown, ArrowUp } from "lucide-react"
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

import { countryNames } from "@/lib/countries"
import ConnectionStatusIndicator from "@/components/connection-status"
import DemoAlert from "@/components/demo-alert"
import SearchIndicator from "@/components/search-indicator"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"

const getCountryFlagForStats = (countryCode: string) => {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-6 h-4 rounded-sm bg-gray-200 flex items-center justify-center text-xs font-bold border border-gray-300 country-flag country-flag-${countryCode.toLowerCase()}`}
        style={{ backgroundImage: `url(https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png)`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}
        title={countryNames[countryCode] || countryCode}
      >
        <span className="country-code-fallback text-gray-600">{countryCode}</span>
      </div>
      <span className="text-sm font-medium text-white">{countryNames[countryCode] || countryCode} ({countryCode})</span>
    </div>
  )
}

const getCountryFlagForTable = (countryCode: string) => {
  return (
    <div className="country-compact">
      <div
        className={`country-flag rounded-sm bg-gray-200 flex items-center justify-center text-xs font-bold border border-gray-300 country-flag-${countryCode.toLowerCase()}`}
        style={{ backgroundImage: `url(https://flagcdn.com/16x12/${countryCode.toLowerCase()}.png)`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}
        title={countryCode}
      >
        <span className="country-code-fallback text-gray-600 text-xs">{countryCode}</span>
      </div>
      <span className="text-white">{countryCode}</span>
    </div>
  )
}

const getBinCountryDisplay = (bin: string, binInfoMap: Map<string, any>) => {
  const binInfo = binInfoMap.get(bin)

  if (!binInfo) return <div className="bin-country-display"><div className="bin-country-flag bg-gray-200 flex items-center justify-center text-xs font-bold border border-gray-300"><span className="text-gray-500">?</span></div><span className="text-white font-mono font-bold">{bin}</span><span className="text-red-300 text-xs ml-2">(加载中...)</span></div>
  if (binInfo.alpha_2 === "XX") return <div className="bin-country-display"><div className="bin-country-flag bg-gray-200 flex items-center justify-center text-xs font-bold border border-gray-300"><span className="text-gray-500">?</span></div><span className="text-white font-mono font-bold">{bin}</span><span className="text-yellow-300 text-xs ml-2">(未知国家)</span></div>

  const countryCode = binInfo.alpha_2.toLowerCase()
  const flagUrl = `https://flagcdn.com/20x15/${countryCode}.png`
  return <div className="bin-country-display"><div className="bin-country-flag bg-gray-200 border border-gray-300" style={{ backgroundImage: `url(${flagUrl})` }} title={`${binInfo.country} (${binInfo.alpha_2}) - ${binInfo.issuer}`}><span className="country-code-fallback text-gray-600">{binInfo.alpha_2}</span></div><span className="text-white font-mono font-bold">{bin}</span><span className="text-green-300 text-xs ml-2">({binInfo.alpha_2})</span></div>
}

const getRating = (rate: number) => {
  if (rate >= 90) return ["Awesome", "rating-awesome"]
  if (rate >= 80) return ["Excellent", "rating-excellent"]
  if (rate >= 70) return ["Normal", "rating-normal"]
  if (rate >= 60) return ["So-so", "rating-so-so"]
  if (rate >= 50) return ["Loss", "rating-loss"]
  return ["Trash", "rating-trash"]
}

const MainPaginationControls = ({ totalPages, currentPage, onPageChange, pageSize, onPageSizeChange }: { totalPages: number, currentPage: number, onPageChange: (page: number) => void, pageSize: number, onPageSizeChange: (size: string) => void }) => {
  const selectId = useId();
  if (totalPages <= 1 && totalPages * pageSize <= pageSize) return null;
  return (
    <div className="flex justify-center items-center mt-4 gap-4">
      <div className="flex items-center gap-2"><label htmlFor={selectId} className="text-sm text-white/80">每页:</label><Select value={String(pageSize)} onValueChange={onPageSizeChange}><SelectTrigger id={selectId} className="bg-white/10 border-white/20 text-white w-[100px]"><SelectValue /></SelectTrigger><SelectContent className="bg-gray-900/95 border-white/20 backdrop-blur-xl z-[9999]"><SelectItem value="10">10</SelectItem><SelectItem value="20">20</SelectItem><SelectItem value="50">50</SelectItem><SelectItem value="100">100</SelectItem></SelectContent></Select></div>
      <Pagination><PaginationContent><PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); if (currentPage > 1) onPageChange(currentPage - 1); }} className={currentPage === 1 ? "pointer-events-none opacity-50" : ""} /></PaginationItem><PaginationItem><span className="px-4 py-2 text-sm text-white/80">第 {currentPage} 页 / 共 {totalPages} 页</span></PaginationItem><PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) onPageChange(currentPage + 1); }} className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""} /></PaginationItem></PaginationContent></Pagination>
    </div>
  );
};

const PaginatedBinsList = ({ bins, onPageChange, currentPage }: { bins: { [bin: string]: number }, currentPage: number, onPageChange: (page: number) => void }) => {
  const BINS_PER_PAGE = 5;
  const binEntries = useMemo(() => Object.entries(bins), [bins]);
  const totalPages = Math.ceil(binEntries.length / BINS_PER_PAGE);

  const paginatedBins = useMemo(() => binEntries.slice(
    (currentPage - 1) * BINS_PER_PAGE,
    currentPage * BINS_PER_PAGE
  ), [binEntries, currentPage]);

  return (
    <div className="pl-4 space-y-1">
      {paginatedBins.map(([bin, count], index) => {
        const isLastItemOnPage = index === paginatedBins.length - 1;
        const showPagination = isLastItemOnPage && totalPages > 1;

        return (
          <div key={bin} className={showPagination ? "flex justify-between items-center" : ""}>
            <span className="text-white/70 text-sm">
              <span className="font-mono">{bin}</span>: {count} 张
            </span>
            {showPagination && (
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="h-6 w-6 text-white/70 hover:bg-white/10"><ChevronLeft className="h-4 w-4" /></Button>
                <span className="text-xs text-white/60">{currentPage}/{totalPages}</span>
                <Button size="icon" variant="ghost" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="h-6 w-6 text-white/70 hover:bg-white/10"><ChevronRight className="h-4 w-4" /></Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default function CardzManagement() {
  const [selectedLibraryCards, setSelectedLibraryCards] = useState<number[]>([])
  const [selectedPoolCards, setSelectedPoolCards] = useState<number[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [uploadTarget, setUploadTarget] = useState("library")
  const [cardData, setCardData] = useState("")
  const [newBin, setNewBin] = useState("")
  const [newCardRate, setNewCardRate] = useState("")
  const [newAwsRate, setNewAwsRate] = useState("")
  
  const [libraryPageSize, setLibraryPageSize] = useState(10);
  const [poolPageSize, setPoolPageSize] = useState(10);
  const [feedBinPageSize, setFeedBinPageSize] = useState(10);

  const [libraryCurrentPage, setLibraryCurrentPage] = useState(1);
  const [poolCurrentPage, setPoolCurrentPage] = useState(1);
  const [feedBinCurrentPage, setFeedBinCurrentPage] = useState(1);

  const [statsPages, setStatsPages] = useState<{ [countryCode: string]: number }>({});

  // **新增：排序状态**
  type SortDirection = 'ascending' | 'descending';
  type SortConfig = { key: keyof(typeof data.feed_bins[0]); direction: SortDirection } | null;
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const { toast } = useToast()
  const { data, refetch, connectionStatus, setConnectionStatus } = useApiData(searchQuery)
  const { mutate, loading: mutating } = useApiMutation()
  
  const apiInfo = apiClient.getApiInfo()

  useEffect(() => {
    if (connectionStatus === 'disconnected' && data) {
      toast({ title: "⚠️ 使用演示模式", description: `无法连接到后端服务器，当前使用模拟数据进行演示` });
    }
  }, [connectionStatus, data, toast]);

  const { paginatedLibraryCards, libraryTotalPages } = useMemo(() => {
    const items = data?.library_cards || [];
    const totalPages = Math.ceil(items.length / libraryPageSize);
    const paginated = items.slice((libraryCurrentPage - 1) * libraryPageSize, libraryCurrentPage * libraryPageSize);
    return { paginatedLibraryCards: paginated, libraryTotalPages: totalPages };
  }, [data?.library_cards, libraryCurrentPage, libraryPageSize]);

  const { paginatedPoolCards, poolTotalPages } = useMemo(() => {
    const items = data?.pool_cards || [];
    const totalPages = Math.ceil(items.length / poolPageSize);
    const paginated = items.slice((poolCurrentPage - 1) * poolPageSize, poolCurrentPage * poolPageSize);
    return { paginatedPoolCards: paginated, poolTotalPages: totalPages };
  }, [data?.pool_cards, poolCurrentPage, poolPageSize]);
  
  // **新增：排序逻辑**
  const sortedFeedBins = useMemo(() => {
    let sortableItems = [...(data?.feed_bins || [])];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
  
        // 处理 null 值，使其始终排在最后
        if (aValue === null) return 1;
        if (bValue === null) return -1;
  
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [data?.feed_bins, sortConfig]);

  const { paginatedFeedBins, feedBinTotalPages } = useMemo(() => {
    const items = sortedFeedBins;
    const totalPages = Math.ceil(items.length / feedBinPageSize);
    const paginated = items.slice((feedBinCurrentPage - 1) * feedBinPageSize, feedBinCurrentPage * feedBinPageSize);
    return { paginatedFeedBins: paginated, feedBinTotalPages: totalPages };
  }, [sortedFeedBins, feedBinCurrentPage, feedBinPageSize]);

  const visibleBins = paginatedFeedBins.map((bin) => bin.bin);
  const { binInfoMap } = useBinInfoBatch(visibleBins);

  const handleStatsPageChange = (countryCode: string, newPage: number) => {
    setStatsPages(prev => ({
      ...prev,
      [countryCode]: newPage
    }));
  };

  const requestSort = (key: keyof (typeof data.feed_bins[0])) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setFeedBinCurrentPage(1); // 排序后回到第一页
  };
  
  const SortIndicator = ({ columnKey }: { columnKey: keyof (typeof data.feed_bins[0]) }) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="h-4 w-4 opacity-30" />;
    }
    return sortConfig.direction === 'ascending' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };
  
    const handleLibraryCardSelect = (cardId: number, checked: boolean) => {
    if (checked) setSelectedLibraryCards(prev => [...prev, cardId]);
    else setSelectedLibraryCards(prev => prev.filter((id) => id !== cardId));
  }

  const handlePoolCardSelect = (cardId: number, checked: boolean) => {
    if (checked) setSelectedPoolCards(prev => [...prev, cardId]);
    else setSelectedPoolCards(prev => prev.filter((id) => id !== cardId));
  }

  const toggleAllLibrary = (checked: boolean) => {
    setSelectedLibraryCards(checked ? paginatedLibraryCards.map((card) => card.id) : []);
  }

  const toggleAllPool = (checked: boolean) => {
    setSelectedPoolCards(checked ? paginatedPoolCards.map((card) => card.id) : []);
  }

  const handleSearch = () => {
    setSearchQuery(searchInput.trim());
    setLibraryCurrentPage(1);
    setPoolCurrentPage(1);
    setFeedBinCurrentPage(1);
  }
  const handleClearSearch = () => {
    setSearchInput("")
    setSearchQuery("")
  }

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

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
      toast({ title: "错误", description: "请输入卡片数据或上传文件", variant: "destructive" });
      return
    }
    await mutate(() => apiClient.uploadCards(uploadTarget as "library" | "pool", cardData),
      (result: any) => {
        toast({ title: "成功", description: result.message });
        setCardData("");
        refetch();
      },
      (error) => {
        toast({ title: "上传失败", description: error.message, variant: "destructive" });
      }
    )
  }

  const handleMoveToPool = async () => {
    if (selectedLibraryCards.length === 0) {
      toast({ title: "错误", description: "请选择要移动的卡片", variant: "destructive" });
      return
    }
    await mutate(() => apiClient.moveToPool(selectedLibraryCards),
      (result: any) => {
        toast({ title: "成功", description: result.message });
        setSelectedLibraryCards([]);
        refetch();
      },
      (error) => {
        toast({ title: "移动失败", description: error.message, variant: "destructive" });
      }
    )
  }

  const handleDeleteCards = async (target: "library" | "pool") => {
    const selectedCards = target === "library" ? selectedLibraryCards : selectedPoolCards
    if (selectedCards.length === 0) {
      toast({ title: "错误", description: "请选择要删除的卡片", variant: "destructive" });
      return
    }
    await mutate(() => apiClient.deleteCards(target, selectedCards),
      (result: any) => {
        toast({ title: "成功", description: result.message });
        if (target === "library") setSelectedLibraryCards([]);
        else setSelectedPoolCards([]);
        refetch();
      },
      (error) => {
        toast({ title: "删除失败", description: error.message, variant: "destructive" });
      }
    )
  }

  const handleExportCards = async (target: "library" | "pool") => {
    const selectedCards = target === "library" ? selectedLibraryCards : selectedPoolCards
    if (selectedCards.length === 0) {
      toast({ title: "错误", description: "请选择要导出的卡片", variant: "destructive" });
      return
    }
    await mutate(() => apiClient.exportCards(target, selectedCards),
      (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "cards.txt";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast({ title: "成功", description: "卡片已导出" });
      },
      (error) => {
        toast({ title: "导出失败", description: error.message, variant: "destructive" });
      }
    )
  }

  const handleAddFeedBin = async () => {
    if (!newBin || newBin.length !== 6) {
      toast({ title: "错误", description: "请输入有效的6位BIN", variant: "destructive" });
      return
    }
    await mutate(() => apiClient.addFeedBin(newBin, newCardRate ? Number.parseInt(newCardRate) : undefined, newAwsRate ? Number.parseInt(newAwsRate) : undefined),
      (result: any) => {
        toast({ title: "成功", description: result.message });
        setNewBin("");
        setNewCardRate("");
        setNewAwsRate("");
        refetch();
      },
      (error) => {
        toast({ title: "添加失败", description: error.message, variant: "destructive" });
      }
    )
  }

  const handleDeleteFeedBin = async (id: number) => {
    await mutate(() => apiClient.deleteFeedBin(id),
      (result: any) => {
        toast({ title: "成功", description: result.message });
        refetch();
      },
      (error) => {
        toast({ title: "删除失败", description: error.message, variant: "destructive" });
      }
    )
  }

  const handleRetryConnection = async () => {
    setConnectionStatus("testing")
    await refetch() 
  }
  
  return (
    <>
      <InteractiveBackground />
      <div className="min-h-screen theme-transition relative z-10">
        <header className="relative z-20 backdrop-blur-xl bg-white/10 border-b border-white/20">
          <div className="container mx-auto px-6 py-6"><div className="flex items-center justify-between"><div className="flex items-center gap-4"><h1 className="text-3xl font-bold bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent">Cardz 卡片管理系统</h1><ConnectionStatusIndicator status={connectionStatus} /></div><GlowMenu /></div></div>
        </header>

        <main className="relative z-10 container mx-auto px-6 py-8 space-y-8">
          <DemoAlert show={apiInfo.usingMockData} onRetry={handleRetryConnection} />
          <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl theme-transition">
            <CardHeader><CardTitle className="text-white flex items-center gap-2"><Upload className="w-5 h-5" />上传卡片</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><label className="text-white/80 text-sm font-medium">上传至:</label><Select value={uploadTarget} onValueChange={setUploadTarget}><SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger><SelectContent className="bg-gray-900/95 border-white/20 backdrop-blur-xl z-[9999]"><SelectItem value="library">卡库 (未使用)</SelectItem><SelectItem value="pool">卡池 (已使用)</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><label className="text-white/80 text-sm font-medium">上传文件:</label><div className="flex items-center gap-4"><input type="file" accept=".txt,.csv" onChange={handleFileUpload} className="bg-white/10 border-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/20 file:text-white hover:file:bg-white/30" /><span className="text-white/60 text-sm">支持 .txt, .csv 格式</span></div></div>
              <div className="space-y-2"><label className="text-white/80 text-sm font-medium">或粘贴卡片数据 (一行一张):</label><Textarea value={cardData} onChange={(e) => setCardData(e.target.value)} placeholder="卡号|月份/年份|CVV..." className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[120px]" /></div>
              <Button onClick={handleUpload} disabled={mutating} className="bg-gradient-to-r from-blue-500/80 to-purple-500/80 hover:from-blue-600/80 hover:to-purple-600/80 text-white shadow-lg border-0">{mutating ? "上传中..." : "开始上传"}</Button>
            </CardContent>
          </Card>
          <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl theme-transition">
            <CardHeader><CardTitle className="text-white">料站 - cczauvr.sale/Other 高活率BIN</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-end"><div className="space-y-2"><label className="text-white/80 text-sm font-medium">BIN (6位数字)</label><Input value={newBin} onChange={(e) => setNewBin(e.target.value)} placeholder="BIN" maxLength={6} className="bg-white/10 border-white/20 text-white placeholder:text-white/50" /></div><div className="space-y-2"><label className="text-white/80 text-sm font-medium">卡片活率</label><div className="relative"><Input type="number" value={newCardRate} onChange={(e) => setNewCardRate(e.target.value)} placeholder="0-100" min="0" max="100" className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pr-8" /><span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60">%</span></div></div><div className="space-y-2"><label className="text-white/80 text-sm font-medium">AWS活率</label><div className="relative"><Input type="number" value={newAwsRate} onChange={(e) => setNewAwsRate(e.target.value)} placeholder="0-100" min="0" max="100" className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pr-8" /><span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60">%</span></div></div><Button onClick={handleAddFeedBin} disabled={mutating} className="bg-gradient-to-r from-green-500/80 to-emerald-500/80 hover:from-green-600/80 hover:to-emerald-600/80 text-white border-0"><Plus className="w-4 h-4 mr-2" />{mutating ? "添加中..." : "添加/更新"}</Button></div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-3 px-4 text-white/80 font-medium">BIN</th>
                      {/* **新增：排序UI和逻辑** */}
                      <th className="text-left py-3 px-4 text-white/80 font-medium">
                        <div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('card_rate')}>
                          <span>卡片活率</span>
                          <SortIndicator columnKey="card_rate" />
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 text-white/80 font-medium">
                        <div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('aws_rate')}>
                          <span>AWS活率</span>
                          <SortIndicator columnKey="aws_rate" />
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 text-white/80 font-medium">
                        <div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('last_modified')}>
                          <span>最后修改日期</span>
                          <SortIndicator columnKey="last_modified" />
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 text-white/80 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>{paginatedFeedBins.map((bin) => (<tr key={bin.id} className="border-b border-white/10 hover:bg-white/5 transition-colors"><td className="py-3 px-4">{getBinCountryDisplay(bin.bin, binInfoMap)}</td><td className="py-3 px-4 text-white">{bin.card_rate !== null ? `${bin.card_rate}%` : "N/A"}{bin.card_rate !== null && (<span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${getRating(bin.card_rate)[1]}`}>{getRating(bin.card_rate)[0]}</span>)}</td><td className="py-3 px-4 text-white">{bin.aws_rate !== null ? `${bin.aws_rate}%` : "N/A"}{bin.aws_rate !== null && (<span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${getRating(bin.aws_rate)[1]}`}>{getRating(bin.aws_rate)[0]}</span>)}</td><td className="py-3 px-4 text-white/70">{bin.last_modified}</td><td className="py-3 px-4"><Button size="sm" variant="destructive" onClick={() => handleDeleteFeedBin(bin.id)} disabled={mutating} className="bg-red-500/80 hover:bg-red-600/80 border-0"><Trash2 className="w-4 h-4" /></Button></td></tr>))}</tbody>
                </table>
              </div>
              <MainPaginationControls totalPages={feedBinTotalPages} currentPage={feedBinCurrentPage} onPageChange={setFeedBinCurrentPage} pageSize={feedBinPageSize} onPageSizeChange={(size) => { setFeedBinPageSize(parseInt(size)); setFeedBinCurrentPage(1); }} />
            </CardContent>
          </Card>
          
          <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl theme-transition">
            <CardHeader><CardTitle className="text-white">卡片库存统计</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {data && Object.entries(data.stats).map(([country, stats]) => (
                  <div key={country} className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getCountryFlagForStats(country)}
                      <span className="text-white font-bold text-lg">(总计: {stats.total} 张)</span>
                    </div>
                    <PaginatedBinsList bins={stats.bins} currentPage={statsPages[country] || 1} onPageChange={(page) => handleStatsPageChange(country, page)} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl theme-transition">
            <CardContent className="pt-6"><div className="flex flex-wrap items-center gap-4"><div className="relative flex-1 min-w-[300px]"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" /><Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyPress={handleSearchKeyPress} placeholder="在卡库和卡池中搜索 (卡号, 国家, 品牌, 类型, 发卡行等)..." className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pl-10" /></div><div className="flex gap-2"><Button onClick={handleSearch} disabled={!searchInput.trim()} className="bg-gradient-to-r from-blue-500/80 to-purple-500/80 hover:from-blue-600/80 hover:to-purple-600/80 text-white border-0"><Search className="w-4 h-4 mr-2" />搜索</Button>{searchQuery && (<Button variant="outline" onClick={handleClearSearch} className="bg-white/10 border-white/20 text-white hover:bg-white/20">清除搜索</Button>)}</div></div><SearchIndicator query={searchQuery} /></CardContent>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl theme-transition">
              <CardHeader><CardTitle className="text-white">卡库 (未使用) - 共 {data?.library_cards.length || 0} 张</CardTitle><div className="flex gap-2"><Button size="sm" onClick={handleMoveToPool} disabled={selectedLibraryCards.length === 0 || mutating} className="bg-gradient-to-r from-blue-500/80 to-cyan-500/80 hover:from-blue-600/80 hover:to-cyan-600/80 text-white border-0"><Move className="w-4 h-4 mr-2" />移动选中到卡池</Button><Button size="sm" variant="destructive" onClick={() => handleDeleteCards("library")} disabled={selectedLibraryCards.length === 0 || mutating} className="bg-red-500/80 hover:bg-red-600/80 border-0"><Trash2 className="w-4 h-4 mr-2" />删除选中</Button><Button size="sm" variant="outline" onClick={() => handleExportCards("library")} disabled={selectedLibraryCards.length === 0 || mutating} className="bg-white/10 border-white/20 text-white hover:bg-white/20"><Download className="w-4 h-4 mr-2" />导出选中</Button></div></CardHeader>
              <CardContent>
                <div className="overflow-x-auto"><table className="w-full cards-table"><thead><tr className="border-b border-white/20"><th className="text-left py-2 px-2"><Checkbox checked={paginatedLibraryCards.length > 0 && selectedLibraryCards.length === paginatedLibraryCards.length} onCheckedChange={toggleAllLibrary}/></th><th className="text-left py-2 px-2 text-white/80 font-medium">卡号</th><th className="text-left py-2 px-2 text-white/80 font-medium">国家</th><th className="text-left py-2 px-2 text-white/80 font-medium">有效期</th><th className="text-left py-2 px-2 text-white/80 font-medium">CVV</th><th className="text-left py-2 px-2 text-white/80 font-medium">品牌</th><th className="text-left py-2 px-2 text-white/80 font-medium">发卡行 / 类型</th></tr></thead><tbody>{paginatedLibraryCards.map((card) => (<tr key={card.id} className="border-b border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 px-2"><Checkbox checked={selectedLibraryCards.includes(card.id)} onCheckedChange={(checked) => handleLibraryCardSelect(card.id, checked as boolean)}/></td><td className="py-2 px-2 text-white font-mono text-sm">{card.card_number.slice(0, 6)}...{card.card_number.slice(-4)}</td><td className="py-2 px-2 text-white">{getCountryFlagForTable(card.country_alpha2)}</td><td className="py-2 px-2 text-white text-sm">{card.month}/{card.year}</td><td className="py-2 px-2 text-white font-mono text-sm">{card.cvv}</td><td className="py-2 px-2 text-white text-sm">{card.brand || "N/A"}</td><td className="py-2 px-2 text-white"><div className="issuer-info"><div className="issuer-name">{card.issuer || "未知发卡行"}</div><div className="card-details"><span>{card.type || "未知类型"}</span><span className="text-white/40">•</span><span>{card.category || "未知级别"}</span></div></div></td></tr>))}</tbody></table></div>
                <MainPaginationControls totalPages={libraryTotalPages} currentPage={libraryCurrentPage} onPageChange={setLibraryCurrentPage} pageSize={libraryPageSize} onPageSizeChange={(size) => { setLibraryPageSize(parseInt(size)); setLibraryCurrentPage(1); }} />
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl theme-transition">
              <CardHeader><CardTitle className="text-white">卡池 (已使用) - 共 {data?.pool_cards.length || 0} 张</CardTitle><div className="flex gap-2"><Button size="sm" variant="destructive" onClick={() => handleDeleteCards("pool")} disabled={selectedPoolCards.length === 0 || mutating} className="bg-red-500/80 hover:bg-red-600/80 border-0"><Trash2 className="w-4 h-4 mr-2" />删除选中</Button><Button size="sm" variant="outline" onClick={() => handleExportCards("pool")} disabled={selectedPoolCards.length === 0 || mutating} className="bg-white/10 border-white/20 text-white hover:bg-white/20"><Download className="w-4 h-4 mr-2" />导出选中</Button></div></CardHeader>
              <CardContent>
                <div className="overflow-x-auto"><table className="w-full cards-table"><thead><tr className="border-b border-white/20"><th className="text-left py-2 px-2"><Checkbox checked={paginatedPoolCards.length > 0 && selectedPoolCards.length === paginatedPoolCards.length} onCheckedChange={toggleAllPool}/></th><th className="text-left py-2 px-2 text-white/80 font-medium">卡号</th><th className="text-left py-2 px-2 text-white/80 font-medium">国家</th><th className="text-left py-2 px-2 text-white/80 font-medium">有效期</th><th className="text-left py-2 px-2 text-white/80 font-medium">CVV</th><th className="text-left py-2 px-2 text-white/80 font-medium">品牌</th><th className="text-left py-2 px-2 text-white/80 font-medium">发卡行 / 类型</th></tr></thead><tbody>{paginatedPoolCards.map((card) => (<tr key={card.id} className="border-b border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 px-2"><Checkbox checked={selectedPoolCards.includes(card.id)} onCheckedChange={(checked) => handlePoolCardSelect(card.id, checked as boolean)}/></td><td className="py-2 px-2 text-white font-mono text-sm">{card.card_number.slice(0, 6)}...{card.card_number.slice(-4)}</td><td className="py-2 px-2 text-white">{getCountryFlagForTable(card.country_alpha2)}</td><td className="py-2 px-2 text-white text-sm">{card.month}/{card.year}</td><td className="py-2 px-2 text-white font-mono text-sm">{card.cvv}</td><td className="py-2 px-2 text-white text-sm">{card.brand || "N/A"}</td><td className="py-2 px-2 text-white"><div className="issuer-info"><div className="issuer-name">{card.issuer || "未知发卡行"}</div><div className="card-details"><span>{card.type || "未知类型"}</span><span className="text-white/40">•</span><span>{card.category || "未知级别"}</span></div></div></td></tr>))}</tbody></table></div>
                <MainPaginationControls totalPages={poolTotalPages} currentPage={poolCurrentPage} onPageChange={setPoolCurrentPage} pageSize={poolPageSize} onPageSizeChange={(size) => { setPoolPageSize(parseInt(size)); setPoolCurrentPage(1); }} />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  )
}