import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

import { MotionButtonBase } from '~/components/ui/button'
import { toast } from '~/lib/toast'

export const Hitokoto = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isWrapped, setIsWrapped] = useState(false)

  const {
    data: hitokoto,
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ['hitokoto'],
    queryFn: () =>
      fetchHitokoto([
        SentenceType.诗词,
        SentenceType.原创,
        SentenceType.哲学,
        SentenceType.文学,
        SentenceType.抖机灵,
      ]),
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    staleTime: 0,
    gcTime: 0,
    select(data) {
      const postfix = Object.values({
        from: data.from,
        from_who: data.from_who,
        creator: data.creator,
      }).find(Boolean)
      if (!data.hitokoto) {
        return '没有获取到句子信息'
      } else {
        return data.hitokoto + (postfix ? ` —— ${postfix}` : '')
      }
    },
  })

  useEffect(() => {
    const checkWrapping = () => {
      if (containerRef.current) {
        const container = containerRef.current
        const span = container.querySelector('span')
        const buttonDiv = container.querySelector('div:last-child')

        if (span && buttonDiv) {
          const spanRect = span.getBoundingClientRect()
          const buttonRect = buttonDiv.getBoundingClientRect()

          // 如果按钮的顶部位置大于文本的顶部位置，说明换行了
          setIsWrapped(buttonRect.top > spanRect.top + 5)
        }
      }
    }

    checkWrapping()
    window.addEventListener('resize', checkWrapping)

    return () => window.removeEventListener('resize', checkWrapping)
  }, [hitokoto])

  if (!hitokoto) return null
  if (isLoading) return <div className="loading loading-dots" />
  return (
    <div
      ref={containerRef}
      className="flex flex-wrap items-center justify-center gap-2"
    >
      <span className="text-base leading-normal">{hitokoto}</span>
      <div
        className={`flex items-center space-x-2 ${isWrapped ? '-ml-0.7' : 'ml-2 mt-1'}`}
      >
        <MotionButtonBase onClick={() => refetch()}>
          <i className="i-mingcute-refresh-2-line text-gray-400 dark:text-gray-400" />
        </MotionButtonBase>

        <MotionButtonBase
          onClick={() => {
            if (hitokoto) {
              navigator.clipboard.writeText(hitokoto)
              toast.success('已复制')
              toast.info(hitokoto)
            }
          }}
        >
          <i className="i-mingcute-copy-line text-gray-400 dark:text-gray-400" />
        </MotionButtonBase>
      </div>
    </div>
  )
}

export enum SentenceType {
  '动画' = 'a',
  '漫画' = 'b',
  '游戏' = 'c',
  '文学' = 'd',
  '原创' = 'e',
  '来自网络' = 'f',
  '其他' = 'g',
  '影视' = 'h',
  '诗词' = 'i',
  '网易云' = 'j',
  '哲学' = 'k',
  '抖机灵' = 'l',
}
export const fetchHitokoto = async (
  type: SentenceType[] | SentenceType = SentenceType.文学,
) => {
  const json = await fetch(
    `https://v1.hitokoto.cn/${
      Array.isArray(type)
        ? `?${type.map((t) => `c=${t}`).join('&')}`
        : `?c=${type}`
    }`,
  )
  const data = (await (json.json() as unknown)) as {
    id: number
    hitokoto: string
    type: string
    from: string
    from_who: string
    creator: string
    creator_uid: number
    reviewer: number
    uuid: string
    created_at: string
  }

  return data
}
