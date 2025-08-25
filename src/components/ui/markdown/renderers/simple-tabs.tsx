'use client'

import * as RadixTabs from '@radix-ui/react-tabs'
import { m } from 'motion/react'
import type { FC, PropsWithChildren } from 'react'
import * as React from 'react'
import { useId, useMemo, useState } from 'react'

import { clsxm } from '~/lib/helper'

// 简化的 Tab 组件，避免循环引用
export const SimpleTabs: FC<PropsWithChildren> = ({ children }) => {
  const id = useId()

  const tabs = useMemo(() => {
    const labels = [] as string[]

    // 使用更安全的方式处理 children
    if (Array.isArray(children)) {
      for (const child of children) {
        if (!child || typeof child !== 'object') continue
        if (!('props' in child) || !('type' in child)) continue
        if (child.type !== SimpleTab) continue
        const { label } = child.props as any as { label: string }
        labels.push(label)
      }
    } else if (
      children &&
      typeof children === 'object' &&
      'props' in children &&
      'type' in children
     && children.type === SimpleTab) {
        const { label } = children.props as any as { label: string }
        labels.push(label)
      }

    return labels
  }, [children])

  const [activeTab, setActiveTab] = useState<string | null>(tabs[0])

  return (
    <RadixTabs.Root value={activeTab || ''} onValueChange={setActiveTab}>
      <RadixTabs.List className="flex gap-2">
        {tabs.map((tab) => (
          <RadixTabs.Trigger
            className={clsxm(
              'relative flex px-2 py-1 text-sm font-bold focus:outline-none',
              'text-gray-600 transition-colors duration-300 dark:text-gray-300',
            )}
            key={tab}
            value={tab}
          >
            {tab}

            {activeTab === tab && (
              <m.div
                layoutId={`tab${id}`}
                layout
                className="absolute inset-x-2 -bottom-1 h-[2px] rounded-md bg-accent"
              />
            )}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>

      {children}
    </RadixTabs.Root>
  )
}

export const SimpleTab: FC<{
  label: string
  children: React.ReactNode
}> = ({ label, children }) => {
  // 直接渲染内容，不使用 Markdown 组件避免循环引用
  const renderContent = () => {
    if (typeof children === 'string') {
      // 如果是字符串，尝试基础的 markdown 渲染
      try {
        const { compiler } = require('markdown-to-jsx')
        return compiler(children, {
          wrapper: null,
          // 只使用基础的 markdown 功能
          overrides: {
            code: ({ children, ...props }: any) => (
              <code
                className="rounded bg-gray-100 px-1 py-0.5 text-sm dark:bg-gray-800"
                {...props}
              >
                {children}
              </code>
            ),
            pre: ({ children, ...props }: any) => (
              <pre
                className="mb-4 overflow-x-auto rounded bg-gray-100 p-4 dark:bg-gray-800"
                {...props}
              >
                {children}
              </pre>
            ),
          },
        })
      } catch {
        // 如果渲染失败，直接显示文本
        return <div className="whitespace-pre-wrap">{children}</div>
      }
    }
    return children
  }

  return (
    <RadixTabs.Content
      className="animate-fade animate-duration-500"
      value={label}
    >
      {renderContent()}
    </RadixTabs.Content>
  )
}
