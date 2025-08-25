'use client'

import type { FC} from 'react';
import { useCallback, useEffect,useMemo, useRef, useState } from 'react'

// 配置常量
const CHUNK_SIZE = 5000 // 每个分块的字符数

// 安全模式的 Tabs 组件
const SafeTabsComponent = ({ children, ...props }: any) => (
  <div
    className="mb-4 rounded border border-blue-200 bg-blue-50 p-4"
    {...props}
  >
    <div className="mb-2 text-sm text-blue-700">📋 Tabs 组件（安全模式）</div>
    {children}
  </div>
)

// 安全模式的 Tab 组件
const SafeTabComponent = ({ children, label, ...props }: any) => (
  <div className="mb-4 rounded border border-blue-100 bg-white p-3" {...props}>
    <div className="mb-2 font-medium text-blue-600">{label}</div>
    <div className="whitespace-pre-wrap">{children}</div>
  </div>
)

interface LongContentMarkdownProps {
  content: string
  className?: string
}

// 简单的 Intersection Observer Hook
function useIntersectionObserver(
  ref: React.RefObject<Element>,
  callback: () => void,
  options: IntersectionObserverInit = {},
) {
  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        callback()
      }
    }, options)

    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, callback, options])
}

// 单个内容块的渲染组件
const ContentChunk: FC<{
  content: string
  className?: string
}> = ({ content, className }) => {
  // 使用固定的渲染逻辑，避免 hooks 数量变化
  const renderedContent = useMemo(() => {
    try {
      const { compiler } = require('markdown-to-jsx')

      // 检查是否包含 Tabs 组件
      const hasTabsContent =
        /<Tabs[^>]*>[\s\S]*?<\/Tabs>/i.test(content) ||
        /<tab\s+label=/i.test(content)

      if (hasTabsContent) {
        // 使用动态导入来避免循环依赖
        try {
          const simpleTabsModule = require('../renderers/simple-tabs')
          const { SimpleTab, SimpleTabs } = simpleTabsModule

          if (!SimpleTab || !SimpleTabs) {
            throw new Error('SimpleTabs components not found')
          }

          return compiler(content, {
            wrapper: null,
            overrides: {
              Tabs: SimpleTabs,
              tab: SimpleTab,
            },
          })
        } catch (importError) {
          console.error('Failed to import SimpleTabs:', importError)
          // 回退到安全的 Tabs 渲染
          return compiler(content, {
            wrapper: null,
            overrides: {
              Tabs: SafeTabsComponent,
              tab: SafeTabComponent,
            },
          })
        }
      }

      // 普通内容的基础渲染
      return compiler(content, { wrapper: null })
    } catch (error) {
      console.error('ContentChunk render error:', error)
      // 错误回退
      return (
        <div className="rounded border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">内容渲染失败，显示原始文本：</p>
          <pre className="mt-2 whitespace-pre-wrap text-sm">{content}</pre>
        </div>
      )
    }
  }, [content])

  return <div className={className}>{renderedContent}</div>
}

// 懒加载触发器组件
const LazyTrigger: FC<{
  onIntersect: () => void
}> = ({ onIntersect }) => {
  const ref = useRef<HTMLDivElement>(null)

  useIntersectionObserver(ref, onIntersect, {
    threshold: 0.1,
    rootMargin: '100px',
  })

  return <div ref={ref} className="h-4" />
}

export const LongContentMarkdown: FC<LongContentMarkdownProps> = ({
  content,
  className = '',
}) => {
  // 分割内容的逻辑 - 稳定的 useMemo
  const chunks = useMemo(() => {
    const splitContent = (text: string): string[] => {
      if (text.length <= CHUNK_SIZE) {
        return [text]
      }

      const chunks: string[] = []
      let currentPos = 0

      while (currentPos < text.length) {
        let nextPos = currentPos + CHUNK_SIZE

        // 如果还有剩余内容
        if (nextPos < text.length) {
          // 寻找合适的分割点（段落结束）
          const searchEnd = Math.min(nextPos + 1000, text.length)
          const searchText = text.slice(nextPos, searchEnd)

          // 查找段落结束标志
          const paragraphEnd = searchText.match(/\n\s*\n/)
          if (paragraphEnd && paragraphEnd.index !== undefined) {
            nextPos = nextPos + paragraphEnd.index + paragraphEnd[0].length
          } else {
            // 查找句子结束
            const sentenceEnd = searchText.match(/[.!?]\s*\n/)
            if (sentenceEnd && sentenceEnd.index !== undefined) {
              nextPos = nextPos + sentenceEnd.index + sentenceEnd[0].length
            }
          }
        } else {
          nextPos = text.length
        }

        const chunk = text.slice(currentPos, nextPos).trim()
        if (chunk) {
          chunks.push(chunk)
        }
        currentPos = nextPos
      }

      return chunks.length > 0 ? chunks : [text]
    }

    return splitContent(content)
  }, [content])

  // 固定的状态 hooks
  const [visibleChunks, setVisibleChunks] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  // 稳定的回调函数
  const loadMore = useCallback(() => {
    if (isLoading || visibleChunks >= chunks.length) return

    setIsLoading(true)
    // 模拟异步加载
    setTimeout(() => {
      setVisibleChunks((prev) => Math.min(prev + 1, chunks.length))
      setIsLoading(false)
    }, 100)
  }, [isLoading, visibleChunks, chunks.length])

  // 检查是否需要分块
  const needsChunking = chunks.length > 1

  // 如果不需要分块，直接渲染
  if (!needsChunking) {
    return (
      <div className={className}>
        <ContentChunk content={content} />
      </div>
    )
  }

  return (
    <div className={className}>
      {/* 渲染可见的分块 */}
      {chunks.slice(0, visibleChunks).map((chunk, index) => (
        <div
          key={`chunk-${index}-${chunk.slice(0, 20).replaceAll(/\s+/g, '')}`}
          className="mb-6"
        >
          <ContentChunk content={chunk} />
        </div>
      ))}

      {/* 加载更多的控制 */}
      {visibleChunks < chunks.length && (
        <div className="py-6 text-center">
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="size-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              <span className="text-gray-600">加载中...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 手动加载按钮 */}
              <button
                type="button"
                onClick={loadMore}
                className="rounded bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
              >
                加载更多内容 ({visibleChunks}/{chunks.length})
              </button>

              {/* 自动加载触发器 */}
              <LazyTrigger onIntersect={loadMore} />
            </div>
          )}
        </div>
      )}

      {/* 加载完成提示 */}
      {visibleChunks >= chunks.length && chunks.length > 1 && (
        <div className="border-t border-gray-200 py-4 text-center text-gray-500">
          ✅ 全部内容已加载完成 ({chunks.length} 个部分)
        </div>
      )}
    </div>
  )
}
