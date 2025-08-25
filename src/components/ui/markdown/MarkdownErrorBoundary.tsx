'use client'

import type { FC, PropsWithChildren } from 'react'
import { ErrorBoundary as ErrorBoundaryLib } from 'react-error-boundary'

import { StyledButton } from '../button'

interface MarkdownErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
  content?: string
}

const MarkdownErrorFallback: FC<MarkdownErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
  content,
}) => {
  const isLongContent = content && content.length > 50000

  return (
    <div className="center flex w-full flex-col space-y-4 py-6">
      <div className="text-center">
        <h3 className="mb-2 text-lg font-semibold text-red-600 dark:text-red-400">
          文档渲染失败
        </h3>

        {isLongContent && (
          <div className="mb-4 rounded border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              📝 检测到这是一个长文档 ({Math.round(content.length / 1000)}KB)
            </p>
            <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-300">
              建议将文档分为多个较短的章节，或简化内容复杂度
            </p>
          </div>
        )}

        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          内容过于复杂或过长，渲染器无法处理。
        </p>

        <details className="mx-auto mb-4 max-w-md text-left">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
            查看错误详情
          </summary>
          <pre className="mt-2 max-h-32 overflow-auto rounded bg-gray-100 p-2 text-xs text-red-600 dark:bg-gray-800">
            {error.message}
          </pre>
        </details>
      </div>

      <div className="flex justify-center gap-2">
        <StyledButton onClick={resetErrorBoundary} variant="primary">
          重试渲染
        </StyledButton>
        <StyledButton
          onClick={() => window.location.reload()}
          variant="secondary"
        >
          刷新页面
        </StyledButton>
      </div>

      <div className="text-center text-xs text-gray-500">
        <p>如果问题持续，请联系</p>
        <a
          href="mailto:ywb@stu.pku.edu.cn"
          className="text-blue-600 underline hover:text-blue-800"
        >
          Rowan
        </a>
      </div>
    </div>
  )
}

interface MarkdownErrorBoundaryProps extends PropsWithChildren {
  content?: string
}

export const MarkdownErrorBoundary: FC<MarkdownErrorBoundaryProps> = ({
  children,
  content,
}) => {
  return (
    <ErrorBoundaryLib
      FallbackComponent={(props) => (
        <MarkdownErrorFallback {...props} content={content} />
      )}
      onError={(error) => {
        console.error('Markdown rendering error:', error)

        // 发送错误统计
        if (content) {
          console.warn(`Long content error: ${content.length} characters`)
        }
      }}
    >
      {children}
    </ErrorBoundaryLib>
  )
}
