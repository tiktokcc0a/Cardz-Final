"use client"

import type React from "react"

interface SearchIndicatorProps {
  query: string
}

export default function SearchIndicator({ query }: SearchIndicatorProps) {
  if (!query) {
    return null
  }

  return <div className="mt-2 text-sm text-white/60">搜索结果: "{query}"</div>
}