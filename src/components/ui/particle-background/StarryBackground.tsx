'use client'

import { useTheme } from 'next-themes'
import * as React from 'react'
import { useEffect, useRef, useState } from 'react'

interface StarryBackgroundProps {
  className?: string
}

// 星星类
class Star {
  x: number
  y: number
  originalX: number
  originalY: number
  size: number
  opacity: number
  twinkleSpeed: number
  twinklePhase: number
  color: string
  originalSize: number

  constructor(
    canvasWidth: number,
    canvasHeight: number,
    isDark: boolean,
    totalHeight: number = canvasHeight,
  ) {
    this.originalX = Math.random() * canvasWidth
    // 确保星星分布在整个文档高度范围内，与粒子背景保持一致
    // 使用实际的文档高度，最小不低于视口高度的3倍
    const distributionHeight = Math.max(totalHeight, canvasHeight * 3)
    this.originalY = Math.random() * distributionHeight
    this.x = this.originalX
    this.y = this.originalY
    this.originalSize = Math.random() * 2 + 0.5
    this.size = this.originalSize
    this.opacity = Math.random() * 0.8 + 0.2
    this.twinkleSpeed = Math.random() * 0.02 + 0.01
    this.twinklePhase = Math.random() * Math.PI * 2

    // 星星颜色
    const colors = isDark
      ? ['#ffffff', '#fef3c7', '#ddd6fe', '#bfdbfe', '#c7d2fe']
      : ['#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0', '#f8fafc']
    this.color = colors[Math.floor(Math.random() * colors.length)]
  }

  // 更新星星位置以跟随滚动
  updatePosition(scrollY: number) {
    this.x = this.originalX
    // 星星保持在固定的世界坐标中，画布会随着滚动移动来显示不同的部分
    this.y = this.originalY
  }

  update(time: number) {
    // 闪烁效果
    this.twinklePhase += this.twinkleSpeed
    const twinkle = (Math.sin(this.twinklePhase) + 1) / 2
    this.size = this.originalSize * (0.8 + twinkle * 0.4)
    this.opacity = 0.3 + twinkle * 0.5
  }

  draw(ctx: CanvasRenderingContext2D, scrollY = 0) {
    // 计算屏幕坐标
    const screenY = this.y - scrollY

    ctx.globalAlpha = this.opacity
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(this.x, screenY, this.size, 0, Math.PI * 2)
    ctx.fill()

    // 十字光芒效果（仅对较大的星星）
    if (this.originalSize > 1.5) {
      ctx.strokeStyle = this.color
      ctx.lineWidth = 0.5
      ctx.globalAlpha = this.opacity * 0.6

      // 垂直线
      ctx.beginPath()
      ctx.moveTo(this.x, screenY - this.size * 3)
      ctx.lineTo(this.x, screenY + this.size * 3)
      ctx.stroke()

      // 水平线
      ctx.beginPath()
      ctx.moveTo(this.x - this.size * 3, screenY)
      ctx.lineTo(this.x + this.size * 3, screenY)
      ctx.stroke()
    }

    ctx.globalAlpha = 1
  }

  // 检查星星是否在可见区域内
  isVisible(scrollY: number, viewHeight: number) {
    const margin = 100 // 额外边距，确保星星平滑出现
    // 星星的屏幕坐标 = 世界坐标 - 滚动偏移
    const screenY = this.y - scrollY
    return screenY >= -margin && screenY <= viewHeight + margin
  }
}

// 流星类
class ShootingStar {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  life: number
  maxLife: number
  trail: Array<{ x: number; y: number; opacity: number }>
  color: string

  constructor(canvasWidth: number, canvasHeight: number) {
    // 从屏幕边缘开始
    const side = Math.floor(Math.random() * 4)
    switch (side) {
      case 0: {
        // 上边
        this.x = Math.random() * canvasWidth
        this.y = -50
        break
      }
      case 1: {
        // 右边
        this.x = canvasWidth + 50
        this.y = Math.random() * canvasHeight
        break
      }
      case 2: {
        // 下边
        this.x = Math.random() * canvasWidth
        this.y = canvasHeight + 50
        break
      }
      default: {
        // 左边
        this.x = -50
        this.y = Math.random() * canvasHeight
      }
    }

    // 速度指向屏幕中心附近的随机点
    const targetX = canvasWidth * 0.3 + Math.random() * canvasWidth * 0.4
    const targetY = canvasHeight * 0.3 + Math.random() * canvasHeight * 0.4
    const dx = targetX - this.x
    const dy = targetY - this.y
    const distance = Math.hypot(dx, dy)
    const speed = 3 + Math.random() * 4

    this.vx = (dx / distance) * speed
    this.vy = (dy / distance) * speed
    this.size = Math.random() * 2 + 1
    this.opacity = 1
    this.maxLife = 60 + Math.random() * 60
    this.life = this.maxLife
    this.trail = []
    this.color = '#ffffff'
  }

  update() {
    this.x += this.vx
    this.y += this.vy
    this.life--
    this.opacity = this.life / this.maxLife

    // 记录轨迹
    this.trail.push({
      x: this.x,
      y: this.y,
      opacity: this.opacity,
    })

    // 限制轨迹长度
    if (this.trail.length > 15) {
      this.trail.shift()
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    // 绘制轨迹
    this.trail.forEach((point, index) => {
      const trailOpacity = (index / this.trail.length) * point.opacity * 0.5
      ctx.globalAlpha = trailOpacity
      ctx.fillStyle = this.color
      ctx.beginPath()
      const trailSize = this.size * (index / this.trail.length)
      ctx.arc(point.x, point.y, trailSize, 0, Math.PI * 2)
      ctx.fill()
    })

    // 绘制流星本体
    ctx.globalAlpha = this.opacity
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()

    // 发光效果
    ctx.shadowBlur = 10
    ctx.shadowColor = this.color
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.globalAlpha = 1
  }

  isDead() {
    return this.life <= 0
  }
}

export const StarryBackground: React.FC<StarryBackgroundProps> = ({
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationIdRef = useRef<number>()
  const starsRef = useRef<Star[]>([])
  const shootingStarsRef = useRef<ShootingStar[]>([])
  const timeRef = useRef(0)
  const scrollYRef = useRef(0)
  const lastDocumentHeightRef = useRef(0)
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const lastFrameTimeRef = useRef(0)
  const visibleStarsCacheRef = useRef<Star[]>([])
  const frameSkipCounterRef = useRef(0)

  // 硬编码配置 - 基于视口面积密度
  const STARS_PER_VIEWPORT_AREA = 0.00006 // 每平方像素的星星数量（视口单位）
  const MAX_STARS = 600 // 增加最大星星数以支持长页面
  const SHOOTING_STAR_FREQUENCY = 0.004
  const MAX_SHOOTING_STARS = 5 // 最大流星数量
  const FPS_LIMIT = 60 // 限制帧率

  useEffect(() => {
    setMounted(true)
  }, [])

  // 监听滚动事件
  useEffect(() => {
    if (!mounted) return

    const handleScroll = () => {
      scrollYRef.current = window.scrollY
    }

    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [mounted])

  // 监听文档高度变化
  useEffect(() => {
    if (!mounted) return

    const checkDocumentHeight = () => {
      const currentHeight = Math.max(
        document.body.scrollHeight || 0,
        document.body.offsetHeight || 0,
        document.documentElement.clientHeight || 0,
        document.documentElement.scrollHeight || 0,
        document.documentElement.offsetHeight || 0,
        window.innerHeight * 3, // 从5倍改为3倍，与粒子背景保持一致
      )

      if (
        Math.abs(currentHeight - lastDocumentHeightRef.current) >
        window.innerHeight
      ) {
        lastDocumentHeightRef.current = currentHeight
        // 触发重新创建星星
        const canvas = canvasRef.current
        if (canvas) {
          const ctx = canvas.getContext('2d')
          if (ctx) {
            const isDark = theme === 'dark'
            // 重新创建星星
            starsRef.current = []
            // 基于视口面积密度计算星星总数：确保在不同设备上密度一致
            const viewportArea = window.innerWidth * window.innerHeight
            const viewportCount = Math.ceil(currentHeight / window.innerHeight)
            const starsPerViewport = Math.floor(
              viewportArea * STARS_PER_VIEWPORT_AREA,
            )
            const adjustedStarCount = Math.min(
              viewportCount * starsPerViewport,
              MAX_STARS,
            )

            for (let i = 0; i < adjustedStarCount; i++) {
              starsRef.current.push(
                new Star(
                  window.innerWidth,
                  window.innerHeight,
                  isDark,
                  currentHeight,
                ),
              )
            }
          }
        }
      }
    }

    // 定期检查文档高度
    const interval = setInterval(checkDocumentHeight, 2000)

    return () => {
      clearInterval(interval)
    }
  }, [mounted, theme])

  useEffect(() => {
    if (!mounted) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const isDark = theme === 'dark'

    // 设置画布尺寸
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.scale(dpr, dpr)

      // 重新创建星星
      starsRef.current = []

      // 获取真实的文档高度
      const getDocumentHeight = () => {
        return Math.max(
          document.body.scrollHeight || 0,
          document.body.offsetHeight || 0,
          document.documentElement.clientHeight || 0,
          document.documentElement.scrollHeight || 0,
          document.documentElement.offsetHeight || 0,
          window.innerHeight * 3, // 从5倍改为3倍，与粒子背景保持一致
        )
      }

      const documentHeight = getDocumentHeight()

      // 基于视口面积密度计算星星总数：确保在不同设备上密度一致
      const viewportArea = window.innerWidth * window.innerHeight
      const viewportCount = Math.ceil(documentHeight / window.innerHeight)
      const starsPerViewport = Math.floor(
        viewportArea * STARS_PER_VIEWPORT_AREA,
      )
      const adjustedStarCount = Math.min(
        viewportCount * starsPerViewport,
        MAX_STARS,
      )

      console.log(
        'Document height:',
        documentHeight,
        'Viewport count:',
        viewportCount,
        'Star count:',
        adjustedStarCount,
      )

      for (let i = 0; i < adjustedStarCount; i++) {
        starsRef.current.push(
          new Star(
            window.innerWidth,
            window.innerHeight,
            isDark,
            documentHeight,
          ),
        )
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // 动画循环
    const animate = (currentTime: number) => {
      // 帧率限制
      if (currentTime - lastFrameTimeRef.current < 1000 / FPS_LIMIT) {
        animationIdRef.current = requestAnimationFrame(animate)
        return
      }
      lastFrameTimeRef.current = currentTime

      // 每4帧更新一次可见星星缓存以减少计算
      frameSkipCounterRef.current++
      const shouldUpdateCache = frameSkipCounterRef.current % 4 === 0

      timeRef.current++
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      // 绘制渐变背景（夜空效果）
      if (isDark) {
        const gradient = ctx.createLinearGradient(0, 0, 0, window.innerHeight)
        gradient.addColorStop(0, 'rgba(15, 23, 42, 0.6)') // slate-900
        gradient.addColorStop(0.5, 'rgba(30, 41, 59, 0.4)') // slate-800
        gradient.addColorStop(1, 'rgba(51, 65, 85, 0.2)') // slate-700
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)
      }

      // 更新可见星星缓存
      if (shouldUpdateCache) {
        visibleStarsCacheRef.current = starsRef.current.filter((star) =>
          star.isVisible(scrollYRef.current, window.innerHeight),
        )
      }

      // 只更新和绘制可见的星星
      visibleStarsCacheRef.current.forEach((star) => {
        star.updatePosition(scrollYRef.current)
        star.update(timeRef.current)
        star.draw(ctx, scrollYRef.current)
      })

      // 随机生成流星 - 限制最大数量
      if (
        Math.random() < SHOOTING_STAR_FREQUENCY &&
        shootingStarsRef.current.length < MAX_SHOOTING_STARS
      ) {
        shootingStarsRef.current.push(
          new ShootingStar(window.innerWidth, window.innerHeight),
        )
      }

      // 更新和绘制流星
      shootingStarsRef.current = shootingStarsRef.current.filter(
        (shootingStar) => {
          shootingStar.update()
          shootingStar.draw(ctx)
          return !shootingStar.isDead()
        },
      )

      animationIdRef.current = requestAnimationFrame(animate)
    }

    animate(0)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }, [mounted, theme])

  if (!mounted) {
    return null
  }

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none fixed inset-0 z-0 ${className}`}
      style={{
        background: 'transparent',
      }}
    />
  )
}

export default StarryBackground
