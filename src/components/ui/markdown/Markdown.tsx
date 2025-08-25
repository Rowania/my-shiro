'use client'

import { clsx } from 'clsx'
import type { MarkdownToJSX } from 'markdown-to-jsx'
import { compiler, RuleType, sanitizer } from 'markdown-to-jsx'
import Script from 'next/script'
import type { FC, PropsWithChildren } from 'react'
import * as React from 'react'
import {
  Fragment,
  memo,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { CodeBlockRender } from '~/components/modules/shared/CodeBlock'
import { FloatPopover } from '~/components/ui/float-popover'
import { MAIN_MARKDOWN_ID } from '~/constants/dom-id'
import { isDev } from '~/lib/env'
import { springScrollToElement } from '~/lib/scroller'

import { Gallery } from '../gallery'
import { MarkdownLink } from '../link/MarkdownLink'
import { LinkCard, LinkCardSource } from '../link-card'
import styles from './markdown.module.css'
// 移除直接导入，改为动态导入避免循环依赖
// import { LongContentMarkdown } from './LongContentMarkdown'
import { MarkdownErrorBoundary } from './MarkdownErrorBoundary'
import { ContainerRule } from './parsers/container'
import { InsertRule } from './parsers/ins'
import { KateXBlockRule, KateXRule } from './parsers/katex'
import { MentionRule } from './parsers/mention'
import { SpoilerRule } from './parsers/spoiler'
import {
  MParagraph,
  MTable,
  MTableBody,
  MTableHead,
  MTableRow,
  MTableTd,
} from './renderers'
import { MBlockQuote } from './renderers/blockqoute'
import { MDetails } from './renderers/collapse'
import { MFootNote } from './renderers/footnotes'
import { createMarkdownHeadingComponent } from './renderers/heading'
import { MarkdownImage } from './renderers/image'
import { Tab, Tabs } from './renderers/tabs'
import { MTag } from './renderers/tag'
import { Video } from './renderers/video'
import { getFootNoteDomId, getFootNoteRefDomId } from './utils/get-id'
import { redHighlight } from './utils/redHighlight'

// 稳定的空对象引用
const EMPTY_PROPS = {}

// 懒加载的长内容组件
const LazyLongContentMarkdown = memo(({ mdContent }: { mdContent: string }) => {
  const [Component, setComponent] = useState<any>(null)

  useEffect(() => {
    import('./LongContentMarkdown')
      .then((module) => {
        setComponent(() => module.LongContentMarkdown)
      })
      .catch((error) => {
        console.error('Failed to load LongContentMarkdown:', error)
        // 回退到简单渲染
        setComponent(() => ({ content, className }: any) => (
          <div className={className}>
            <pre className="whitespace-pre-wrap">{content}</pre>
          </div>
        ))
      })
  }, [])

  if (!Component) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto mb-2 size-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        <div className="text-gray-600">加载渲染器...</div>
      </div>
    )
  }

  return <Component content={mdContent} className="w-full" />
})

// 错误恢复组件
const ErrorRecoveryComponent = memo(({ mdContent }: { mdContent: string }) => {
  const [Component, setComponent] = useState<any>(null)

  useEffect(() => {
    import('./LongContentMarkdown')
      .then((module) => {
        setComponent(() => module.LongContentMarkdown)
      })
      .catch(() => {
        // 如果动态导入也失败，使用最简单的回退
        setComponent(() => ({ content, className }: any) => (
          <div className={className}>
            <div className="mb-4 rounded border border-yellow-200 bg-yellow-50 p-4">
              <p className="text-yellow-800">
                检测到复杂组件，使用安全模式渲染：
              </p>
            </div>
            <pre className="whitespace-pre-wrap text-sm">{content}</pre>
          </div>
        ))
      })
  }, [])

  if (!Component) {
    return (
      <div className="py-4 text-center">
        <div className="text-gray-600">正在切换到安全模式...</div>
      </div>
    )
  }

  return <Component content={mdContent} className="w-full" />
})

export interface MdProps {
  value?: string

  style?: React.CSSProperties
  readonly renderers?: Partial<MarkdownToJSX.PartialRules>
  wrapperProps?: React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  >
  codeBlockFully?: boolean
  className?: string
  as?: React.ElementType

  allowsScript?: boolean

  removeWrapper?: boolean
}

const debugValue = isDev
  ? ''
  : //       '```component shadow with-styles\n' +
    //         `import=https://cdn.jsdelivr.net/npm/@innei/react-cdn-components@0.0.33/dist/components/ShadowDOMTest.js
    // name=MDX.ShadowDOMTest
    // height=4 05` +
    //         '\n' +
    //         '```',
    //     ].join('')
    null
export const Markdown: FC<MdProps & MarkdownToJSX.Options & PropsWithChildren> =
  memo((props) => {
    const {
      value,
      renderers,
      style,
      wrapperProps = {},
      codeBlockFully = false,
      className,
      overrides,
      extendsRules,

      as: As = 'div',
      allowsScript = false,
      removeWrapper = false,

      ...rest
    } = props

    const ref = useRef<HTMLDivElement>(null)

    const MHeader = useMemo(() => createMarkdownHeadingComponent(), [])

    const node = useMemo(() => {
      const mdContent = debugValue || value || props.children

      if (!mdContent) return null
      if (typeof mdContent != 'string') return null

      // 对于长文档进行性能优化
      const isLongContent = mdContent.length > 100000 // 提高阈值到 100KB

      // 检查是否包含可能有问题的组件（大写 Tabs 和小写 tab）
      const hasComplexComponents = /<Tabs[^>]*>|<\/Tabs>|<tab\s+label=/i.test(
        mdContent,
      )

      // 如果包含 Tabs 组件且内容较长，或者内容非常长时才使用分段加载
      if (isLongContent || (hasComplexComponents && mdContent.length > 10000)) {
        return <LazyLongContentMarkdown mdContent={mdContent} />
      }

      try {
        const mdElement = compiler(mdContent, {
          slugify,
          doNotProcessHtmlElements: ['tab', 'style', 'script'] as any[],
          wrapper: null,

          overrides: {
            p: MParagraph,

            thead: MTableHead,
            tr: MTableRow,
            tbody: MTableBody,
            td: MTableTd,
            table: MTable,
            // FIXME: footer tag in raw html will renders not as expected, but footer tag in this markdown lib will wrapper as linkReferer footnotes
            footer: MFootNote,
            details: MDetails,
            img: MarkdownImage,
            tag: MTag,

            Tabs,

            tab: Tab,
            video: Video,

            // for custom react component
            // Tag: MTag,

            LinkCard,
            Gallery,
            script: allowsScript ? Script : undefined!,

            ...overrides,
          },

          overrideRules: {
            [RuleType.heading]: {
              render(node, output, state) {
                return (
                  <MHeader id={node.id} level={node.level} key={state?.key}>
                    {output(node.children, state!)}
                  </MHeader>
                )
              },
            },
            [RuleType.textMarked]: {
              render(node, output, state) {
                return (
                  <mark key={state?.key} className="rounded-md">
                    <span className="px-1">
                      {output(node.children, state!)}
                    </span>
                  </mark>
                )
              },
            },
            [RuleType.gfmTask]: {
              render(node, _, state) {
                return (
                  <input
                    type="checkbox"
                    key={state?.key}
                    checked={node.completed}
                    readOnly
                    className="!size-[1em]"
                  />
                )
              },
            },

            [RuleType.link]: {
              render(node, output, state) {
                const { target, title } = node

                let realText = ''

                for (const child of node.children) {
                  if (child.type === RuleType.text) {
                    realText += child.text
                  }
                }

                return (
                  <MarkdownLink
                    href={sanitizer(target)!}
                    title={title}
                    key={state?.key}
                    text={realText}
                  >
                    {output(node.children, state!)}
                  </MarkdownLink>
                )
              },
            },

            [RuleType.blockQuote]: {
              render(node, output, state) {
                return (
                  <MBlockQuote key={state?.key} alert={node.alert}>
                    {output(node.children, state!)}
                  </MBlockQuote>
                )
              },
            },

            [RuleType.footnoteReference]: {
              render(node, output, state) {
                const { footnoteMap, text } = node
                const footnote = footnoteMap.get(text)
                const linkCardId = (() => {
                  try {
                    const thisUrl = new URL(
                      footnote?.footnote?.replace(': ', '') ?? '',
                    )
                    const isCurrentHost =
                      thisUrl.hostname === window.location.hostname
                    if (!isCurrentHost && !isDev) {
                      return
                    }
                    const { pathname } = thisUrl
                    return pathname.slice(1)
                  } catch {
                    return
                  }
                })()

                return (
                  <Fragment key={state?.key}>
                    <FloatPopover
                      wrapperClassName="inline"
                      as="span"
                      triggerElement={
                        <a
                          href={`${getFootNoteDomId(text)}`}
                          onClick={(e) => {
                            e.preventDefault()
                            const id = getFootNoteDomId(text)
                            springScrollToElement(
                              document.getElementById(id)!,
                              -window.innerHeight / 2,
                            )
                            redHighlight(id)
                          }}
                        >
                          <sup
                            id={`${getFootNoteRefDomId(text)}`}
                          >{`[^${text}]`}</sup>
                        </a>
                      }
                      type="tooltip"
                    >
                      {footnote?.footnote?.slice(1)}
                    </FloatPopover>
                    {linkCardId && (
                      <LinkCard
                        id={linkCardId}
                        source={LinkCardSource.MixSpace}
                      />
                    )}
                  </Fragment>
                )
              },
            },

            [RuleType.codeBlock]: {
              render(node, output, state) {
                return (
                  <CodeBlockRender
                    key={state?.key}
                    content={node.text}
                    lang={node.lang}
                    attrs={node?.rawAttrs}
                  />
                )
              },
            },
            [RuleType.codeInline]: {
              render(node, output, state) {
                return (
                  <code
                    key={state?.key}
                    className="rounded-md bg-zinc-200 px-2 font-mono dark:bg-neutral-800"
                  >
                    {node.text}
                  </code>
                )
              },
            },

            [RuleType.orderedList]: listRule as any,
            [RuleType.unorderedList]: listRule as any,

            ...renderers,
          },
          extendsRules: {
            spoilder: SpoilerRule,
            mention: MentionRule,

            ins: InsertRule,
            kateX: KateXRule,
            kateXBlock: KateXBlockRule,
            container: ContainerRule,
            ...extendsRules,
          },
          ...rest,
        })

        return mdElement
      } catch (error) {
        console.error('Markdown rendering error:', error)

        // 特殊处理 Tabs 相关错误
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        const isTabsError =
          errorMessage.includes('TabsContent') || errorMessage.includes('Tabs')

        if (isTabsError) {
          // 如果是 Tabs 相关错误，尝试使用长文档组件重新渲染
          console.info('Detected Tabs error, switching to LongContentMarkdown')
          return <ErrorRecoveryComponent mdContent={mdContent} />
        }

        // 如果渲染失败，返回简化的错误提示
        return (
          <div className="rounded border border-red-200 bg-red-50 p-4">
            <h3 className="mb-2 font-medium text-red-800">内容渲染失败</h3>
            <p className="text-sm text-red-600">
              {isTabsError
                ? '检测到复杂的 Tabs 组件结构，已切换到简化模式。'
                : '内容过于复杂或过长，请尝试分段发布或简化内容。'}
            </p>
            <details className="mt-2">
              <summary className="cursor-pointer text-red-600">
                查看错误详情
              </summary>
              <pre className="mt-1 max-h-32 overflow-auto text-xs">
                {errorMessage}
              </pre>
            </details>
          </div>
        )
      }
    }, [
      value,
      props.children,
      allowsScript,
      overrides,
      extendsRules,
      renderers,
      rest,
      MHeader,
    ])

    if (removeWrapper) return <Suspense>{node}</Suspense>

    return (
      <MarkdownErrorBoundary content={value || (props.children as string)}>
        <Suspense>
          <As
            style={style}
            {...wrapperProps}
            ref={ref}
            className={clsx(
              styles['md'],
              codeBlockFully ? styles['code-fully'] : undefined,
              className,
            )}
          >
            {node}
          </As>
        </Suspense>
      </MarkdownErrorBoundary>
    )
  })
Markdown.displayName = 'Markdown'

export const MainMarkdown: FC<
  MdProps & MarkdownToJSX.Options & PropsWithChildren
> = (props) => {
  const { wrapperProps = EMPTY_PROPS } = props
  return (
    <Markdown
      as="main"
      {...props}
      wrapperProps={useMemo(
        () => ({
          ...wrapperProps,
          id: MAIN_MARKDOWN_ID,
        }),
        [wrapperProps],
      )}
    />
  )
}

// not complete, but probably good enough
function slugify(str: string) {
  return (
    str
      .replaceAll(/[ÀÁÂÃÄÅæ]/gi, 'a')
      .replaceAll(/ç/gi, 'c')
      .replaceAll(/ð/gi, 'd')
      .replaceAll(/[ÈÉÊË]/gi, 'e')
      .replaceAll(/[ÏÎÍÌ]/gi, 'i')
      .replaceAll(/Ñ/gi, 'n')
      .replaceAll(/[øœÕÔÓÒ]/gi, 'o')
      .replaceAll(/[ÜÛÚÙ]/gi, 'u')
      .replaceAll(/[ŸÝ]/gi, 'y')
      // remove non-chinese, non-latin, non-number, non-space
      .replaceAll(
        /[^\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AFa-z0-9- ]/gi,
        '',
      )
      .replaceAll(' ', '-')
      .toLowerCase()
  )
}

const listRule: Partial<
  MarkdownToJSX.Rule<
    MarkdownToJSX.OrderedListNode | MarkdownToJSX.UnorderedListNode
  >
> = {
  render(node, output, state) {
    const Tag = node.ordered ? 'ol' : 'ul'

    return (
      <Tag
        key={state?.key}
        start={node.type === RuleType.orderedList ? node.start : undefined}
      >
        {node.items.map((item: any, i: number) => {
          let className = ''
          if (item[0]?.type === 'gfmTask') {
            className = 'list-none flex items-center'
          }

          return (
            <li
              className={className}
              key={`list-item-${i}-${item[0]?.type || 'default'}`}
            >
              {output(item, state!)}
            </li>
          )
        })}
      </Tag>
    )
  },
}
