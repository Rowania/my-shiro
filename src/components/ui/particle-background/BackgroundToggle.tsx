'use client'

import { useState } from 'react'

import { FloatPopover } from '~/components/ui/float-popover'

import { ParticleBackground } from './ParticleBackground'
import { StarryBackground } from './StarryBackground'

export type BackgroundType = 'particle' | 'starry'

function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setStoredValue = (newValue: T | ((prev: T) => T)) => {
    let valueToStore: T
    if (typeof newValue === 'function') {
      // 明确类型转换
      valueToStore = (newValue as (prev: T) => T)(value)
    } else {
      valueToStore = newValue
    }
    setValue(valueToStore)
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(valueToStore))
    }
  }

  return [value, setStoredValue] as const
}

const BackgroundToggleButton = ({
  currentBackground,
  onToggle,
}: {
  currentBackground: BackgroundType
  onToggle: () => void
}) => {
  const nextBackgroundName = currentBackground === 'particle' ? '星空' : '粒子'
  const currentBackgroundName =
    currentBackground === 'particle' ? '粒子' : '星空'

  return (
    <FloatPopover
      type="tooltip"
      triggerElement={
        <button
          onClick={onToggle}
          className="group relative flex size-11 items-center justify-center rounded-xl border border-zinc-200/50 bg-zinc-50/80 shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-zinc-100/80 hover:shadow-xl active:scale-95 dark:border-zinc-700/50 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80"
        >
          {/* 背景渐变光晕 */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* 图标容器 */}
          <div className="relative z-10 transition-all duration-300 group-hover:rotate-3 group-hover:scale-110">
            {currentBackground === 'particle' ? (
              // 星星图标 - 下一个要切换到的背景
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                className="text-zinc-700 transition-colors duration-300 group-hover:text-zinc-900 dark:text-zinc-300 dark:group-hover:text-zinc-100"
              >
                <path
                  d="M12 2L14.09 8.26L20 10L14.09 11.74L12 18L9.91 11.74L4 10L9.91 8.26L12 2Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="currentColor"
                  fillOpacity="0.3"
                  className="drop-shadow-sm"
                />
                <path
                  d="M19 4L20 7L23 8L20 9L19 12L18 9L15 8L18 7L19 4Z"
                  stroke="currentColor"
                  strokeWidth="1"
                  fill="currentColor"
                  fillOpacity="0.2"
                  className="drop-shadow-sm"
                />
              </svg>
            ) : (
              // 粒子连线图标 - 下一个要切换到的背景
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                className="text-zinc-700 transition-colors duration-300 group-hover:text-zinc-900 dark:text-zinc-300 dark:group-hover:text-zinc-100"
              >
                <circle
                  cx="6"
                  cy="6"
                  r="1.5"
                  fill="currentColor"
                  className="opacity-80 drop-shadow-sm"
                />
                <circle
                  cx="18"
                  cy="6"
                  r="1.5"
                  fill="currentColor"
                  className="opacity-80 drop-shadow-sm"
                />
                <circle
                  cx="6"
                  cy="18"
                  r="1.5"
                  fill="currentColor"
                  className="opacity-80 drop-shadow-sm"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="1.5"
                  fill="currentColor"
                  className="opacity-80 drop-shadow-sm"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="1.5"
                  fill="currentColor"
                  className="opacity-80 drop-shadow-sm"
                />
                <path
                  d="M6 6L12 12M12 12L18 6M12 12L6 18M12 12L18 18"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="opacity-60 drop-shadow-sm"
                />
              </svg>
            )}
          </div>

          {/* 交互指示环 */}
          <div className="absolute inset-0 rounded-xl border border-transparent transition-all duration-300 group-hover:border-zinc-300/50 dark:group-hover:border-zinc-600/50" />
        </button>
      }
    >
      <div className="px-3 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
        切换到{nextBackgroundName}背景
        {nextBackgroundName === '粒子' && (
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            粒子可以互动哦
          </div>
        )}
        {nextBackgroundName === '星空' && (
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            最下面设置为夜间模式效果更佳
          </div>
        )}
      </div>
    </FloatPopover>
  )
}

export const BackgroundManager = () => {
  const [backgroundType, setBackgroundType] = useLocalStorage<BackgroundType>(
    'background-type',
    Math.random() > 0.5 ? 'particle' : 'starry',
  )

  const toggleBackground = () => {
    setBackgroundType((prev) => (prev === 'particle' ? 'starry' : 'particle'))
  }

  return (
    <>
      {backgroundType === 'particle' ? (
        <ParticleBackground />
      ) : (
        <StarryBackground />
      )}

      <div className="fixed left-20 top-4 z-50">
        <BackgroundToggleButton
          currentBackground={backgroundType}
          onToggle={toggleBackground}
        />
      </div>
    </>
  )
}

export default BackgroundManager
