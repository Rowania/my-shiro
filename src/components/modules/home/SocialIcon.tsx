/* eslint-disable @eslint-react/no-missing-key */
import type { ReactNode } from 'react'
import { memo, useEffect, useMemo, useRef,useState } from 'react'

import { BilibiliIcon } from '~/components/icons/platform/BilibiliIcon'
import { BlueskyIcon } from '~/components/icons/platform/BlueskyIcon'
import { NeteaseCloudMusicIcon } from '~/components/icons/platform/NeteaseIcon'
import { SteamIcon } from '~/components/icons/platform/SteamIcon'
import { XIcon } from '~/components/icons/platform/XIcon'
import { MotionButtonBase } from '~/components/ui/button'
import { FloatPopover } from '~/components/ui/float-popover'

interface SocialIconProps {
  type: string
  id: string
}

const iconSet: Record<
  string,
  [string, ReactNode, string, (id: string) => string]
> = {
  github: [
    'Github',
    <i
      className="i-mingcute-github-line"
      style={{
        color: '#F0F0F0',
        filter: 'brightness(0) saturate(100%) invert(90%)',
      }}
    />,
    '#000000',
    (id) => `https://github.com/${id}`,
  ],
  twitter: [
    'Twitter',
    <i className="i-mingcute-twitter-line" />,
    '#1DA1F2',
    (id) => `https://twitter.com/${id}`,
  ],
  x: ['x', <XIcon />, 'rgba(36,46,54,1.00)', (id) => `https://x.com/${id}`],
  telegram: [
    'Telegram',
    <i className="i-mingcute-telegram-line" />,
    '#0088cc',
    (id) => `https://t.me/${id}`,
  ],
  mail: [
    'Email',
    <i className="i-mingcute-mail-line" />,
    '#D44638',
    (id) => `mailto:${id}`,
  ],
  get email() {
    return this.mail
  },
  get feed() {
    return this.rss
  },
  rss: ['RSS', <i className="i-mingcute-rss-line" />, '#FFA500', (id) => id],
  bilibili: [
    '哔哩哔哩',
    <BilibiliIcon />,
    '#00A1D6',
    (id) => `https://space.bilibili.com/${id}`,
  ],
  netease: [
    '网易云音乐',
    <NeteaseCloudMusicIcon />,
    '#C20C0C',
    (id) => `https://music.163.com/#/user/home?id=${id}`,
  ],
  qq: [
    'QQ',
    <i className="i-mingcute-qq-fill" />,
    '#1e6fff',
    (id) => `https://wpa.qq.com/msgrd?v=3&uin=${id}&site=qq&menu=yes`,
  ],
  wechat: [
    '微信',
    <i className="i-mingcute-wechat-fill" />,
    '#2DC100',
    (id) => id,
  ],
  weibo: [
    '微博',
    <i className="i-mingcute-weibo-line" />,
    '#E6162D',
    (id) => `https://weibo.com/${id}`,
  ],
  discord: [
    'Discord',
    <i className="i-mingcute-discord-fill" />,
    '#7289DA',
    (id) => `https://discord.gg/${id}`,
  ],
  bluesky: [
    'Bluesky',
    <BlueskyIcon />,
    '#0085FF',
    (id) => `https://bsky.app/profile/${id}`,
  ],
  steam: [
    'Steam',
    <SteamIcon />,
    '#0F1C30',
    (id) => `https://steamcommunity.com/id/${id}`,
  ],
}
const icons = Object.keys(iconSet)

export const isSupportIcon = (icon: string) => icons.includes(icon)
export const SocialIcon = memo((props: SocialIconProps) => {
  const { id, type } = props
  const [showWechatQR, setShowWechatQR] = useState(false)
  const [showQQQR, setShowQQQR] = useState(false)
  const wechatRef = useRef<HTMLDivElement>(null)
  const qqRef = useRef<HTMLDivElement>(null)

  // 点击外部区域关闭弹窗
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wechatRef.current &&
        !wechatRef.current.contains(event.target as Node)
      ) {
        setShowWechatQR(false)
      }
      if (qqRef.current && !qqRef.current.contains(event.target as Node)) {
        setShowQQQR(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const [name, Icon, iconBg, hrefFn] = useMemo(() => {
    const [name, Icon, iconBg, hrefFn] = (iconSet as any)[type as any] || []
    return [name, Icon, iconBg, hrefFn]
  }, [type])

  if (!name) return null
  const href = hrefFn(id)

  // 如果是微信，显示带二维码的弹窗
  if (type === 'wechat') {
    return (
      <div className="relative" ref={wechatRef}>
        <FloatPopover
          type="tooltip"
          triggerElement={
            <MotionButtonBase
              className="center flex aspect-square size-10 rounded-full text-2xl text-white"
              style={{
                background: iconBg,
              }}
              onClick={() => setShowWechatQR(!showWechatQR)}
            >
              {Icon}
            </MotionButtonBase>
          }
        >
          {name}
        </FloatPopover>

        {showWechatQR && (
          <div className="absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 rounded-lg border bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-2 text-center font-medium text-gray-800 dark:text-gray-200">
              微信二维码
            </div>
            <div className="center flex size-40 rounded border bg-white p-2">
              <img
                src={id}
                alt="微信二维码"
                className="size-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  ;(e.currentTarget
                    .nextElementSibling as HTMLElement)!.style.display = 'block'
                }}
              />
              <div
                className="center hidden flex-col text-gray-500"
                style={{ display: 'none' }}
              >
                <i className="i-mingcute-wechat-fill text-4xl" />
                <div className="mt-2 text-xs">二维码</div>
              </div>
            </div>
            <div className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              扫码添加微信
            </div>
            <button
              className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              onClick={() => setShowWechatQR(false)}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    )
  }

  // 如果是QQ，显示带二维码的弹窗
  if (type === 'qq') {
    return (
      <div className="relative" ref={qqRef}>
        <FloatPopover
          type="tooltip"
          triggerElement={
            <MotionButtonBase
              className="center flex aspect-square size-10 rounded-full text-2xl text-white"
              style={{
                background: iconBg,
              }}
              onClick={() => setShowQQQR(!showQQQR)}
            >
              {Icon}
            </MotionButtonBase>
          }
        >
          {name}
        </FloatPopover>

        {showQQQR && (
          <div className="absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 rounded-lg border bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-2 text-center font-medium text-gray-800 dark:text-gray-200">
              QQ二维码
            </div>
            <div className="center flex size-40 rounded border bg-white p-2">
              <img
                src={id}
                alt="QQ二维码"
                className="size-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  ;(e.currentTarget
                    .nextElementSibling as HTMLElement)!.style.display = 'block'
                }}
              />
              <div
                className="center hidden flex-col text-gray-500"
                style={{ display: 'none' }}
              >
                <i className="i-mingcute-qq-fill text-4xl" />
                <div className="mt-2 text-xs">二维码</div>
              </div>
            </div>
            <div className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              扫码添加QQ
            </div>
            <button
              className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              onClick={() => setShowQQQR(false)}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <FloatPopover
      type="tooltip"
      triggerElement={
        <MotionButtonBase
          className="center flex aspect-square size-10 rounded-full text-2xl text-white"
          style={{
            background: iconBg,
          }}
        >
          <a
            target="_blank"
            href={href}
            className="center flex"
            rel="noreferrer"
          >
            {Icon}
          </a>
        </MotionButtonBase>
      }
    >
      {name}
    </FloatPopover>
  )
})
SocialIcon.displayName = 'SocialIcon'
