'use client'

import * as React from 'react'
import { useEffect, useRef, useState } from 'react'

interface ParticleBackgroundProps {
  className?: string
}

// 粒子类
class Particle {
  x: number
  y: number
  originalX: number
  originalY: number
  vx: number
  vy: number
  size: number
  opacity: number
  color: string

  constructor(
    canvasWidth: number,
    canvasHeight: number,
    totalHeight: number = canvasHeight,
  ) {
    this.originalX = Math.random() * canvasWidth
    // 确保粒子分布在整个文档高度范围内，而不是固定的5倍视口高度
    // 使用实际的文档高度，最小不低于视口高度的3倍
    const distributionHeight = Math.max(totalHeight, canvasHeight * 3)
    this.originalY = Math.random() * distributionHeight
    this.x = this.originalX
    this.y = this.originalY
    this.vx = (Math.random() - 0.5) * 0.5
    this.vy = (Math.random() - 0.5) * 0.5
    this.size = Math.random() * 2 + 1
    this.opacity = Math.random() * 0.6 + 0.4
    // 更鲜明的色彩
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FECA57',
      '#FF9FF3',
      '#54A0FF',
    ]
    this.color = colors[Math.floor(Math.random() * colors.length)]
  }

  // 更新粒子位置以跟随滚动
  updatePosition(scrollY: number) {
    this.x = this.originalX
    // 粒子保持在固定的世界坐标中
    this.y = this.originalY
  }

  update(
    mouseX: number,
    mouseY: number,
    canvasWidth: number,
    canvasHeight: number,
    scrollY: number,
    totalHeight: number = canvasHeight,
  ) {
    // 计算屏幕坐标用于鼠标交互
    const screenY = this.y - scrollY

    // 极其轻微的鼠标排斥效果
    const repelRadius = 80
    const repelStrength = 0.002

    const dx = this.x - mouseX
    const dy = screenY - mouseY
    const distance = Math.hypot(dx, dy)

    if (distance < repelRadius && distance > 0) {
      const force = (repelRadius - distance) / repelRadius
      const repelX = (dx / distance) * force * repelStrength
      const repelY = (dy / distance) * force * repelStrength

      this.vx += repelX
      this.vy += repelY
    }

    // 添加持续的随机扰动，保持长期运动
    const randomForce = 0.0001
    this.vx += (Math.random() - 0.5) * randomForce
    this.vy += (Math.random() - 0.5) * randomForce

    // 基础运动 - 更新世界坐标
    this.originalX += this.vx
    this.originalY += this.vy

    // 非常轻微的摩擦力
    this.vx *= 0.9995
    this.vy *= 0.9995

    // 限制最大速度
    const maxSpeed = 0.8
    const currentSpeed = Math.hypot(this.vx, this.vy)
    if (currentSpeed > maxSpeed) {
      this.vx = (this.vx / currentSpeed) * maxSpeed
      this.vy = (this.vy / currentSpeed) * maxSpeed
    }

    // 确保最小运动速度
    const minSpeed = 0.05
    if (currentSpeed < minSpeed && currentSpeed > 0) {
      this.vx = (this.vx / currentSpeed) * minSpeed
      this.vy = (this.vy / currentSpeed) * minSpeed
    }

    // 边界检查 - 基于实际文档高度
    const actualHeight = Math.max(totalHeight, canvasHeight * 3)
    if (this.originalX < 0 || this.originalX > canvasWidth) this.vx *= -1
    if (this.originalY < 0 || this.originalY > actualHeight) this.vy *= -1

    // 保持在世界坐标范围内
    this.originalX = Math.max(0, Math.min(canvasWidth, this.originalX))
    this.originalY = Math.max(0, Math.min(actualHeight, this.originalY))

    // 更新显示坐标
    this.x = this.originalX
    this.y = this.originalY
  }

  draw(ctx: CanvasRenderingContext2D, scrollY = 0) {
    // 计算屏幕坐标
    const screenY = this.y - scrollY

    ctx.globalAlpha = this.opacity
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(this.x, screenY, this.size, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  // 检查粒子是否在可见区域内
  isVisible(scrollY: number, viewHeight: number) {
    const margin = 100
    const screenY = this.y - scrollY
    return screenY >= -margin && screenY <= viewHeight + margin
  }

  // 获取屏幕坐标用于连线计算
  getScreenPosition(scrollY: number) {
    return {
      x: this.x,
      y: this.y - scrollY,
    }
  }
}

export const ParticleBackground: React.FC<ParticleBackgroundProps> = ({
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationIdRef = useRef<number>()
  const scrollYRef = useRef(0)
  const lastDocumentHeightRef = useRef(0)
  const particlesRef = useRef<Particle[]>([])
  const [mounted, setMounted] = useState(false)
  const lastFrameTimeRef = useRef(0)
  const visibleParticlesCacheRef = useRef<Particle[]>([])
  const frameSkipCounterRef = useRef(0)

  // 硬编码配置 - 基于视口面积密度，确保在不同设备上密度一致
  const PARTICLES_PER_VIEWPORT_AREA = 0.00002 // 每平方像素的粒子数量（视口单位）
  const MAX_PARTICLES = 500 // 增加最大粒子数以支持长页面
  const FPS_LIMIT = 60 // 限制帧率
  const CONNECTION_DISTANCE = 100 // 连线距离

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
        window.innerHeight * 5,
      )

      if (
        Math.abs(currentHeight - lastDocumentHeightRef.current) >
        window.innerHeight
      ) {
        lastDocumentHeightRef.current = currentHeight
        // 触发重新创建粒子
        const canvas = canvasRef.current
        if (canvas) {
          // 重新创建粒子
          particlesRef.current = []
          // 基于视口面积密度计算粒子总数：确保在不同设备上密度一致
          const viewportArea = window.innerWidth * window.innerHeight
          const viewportCount = Math.ceil(currentHeight / window.innerHeight)
          const particlesPerViewport = Math.floor(
            viewportArea * PARTICLES_PER_VIEWPORT_AREA,
          )
          const adjustedParticleCount = Math.min(
            viewportCount * particlesPerViewport,
            MAX_PARTICLES,
          )

          for (let i = 0; i < adjustedParticleCount; i++) {
            particlesRef.current.push(
              new Particle(
                window.innerWidth,
                window.innerHeight,
                currentHeight,
              ),
            )
          }
        }
      }
    }

    // 定期检查文档高度
    const interval = setInterval(checkDocumentHeight, 2000)

    return () => {
      clearInterval(interval)
    }
  }, [mounted])

  useEffect(() => {
    if (!mounted) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 设置画布尺寸
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.scale(dpr, dpr)

      // 重新创建粒子
      particlesRef.current = []

      // 获取真实的文档高度
      const getDocumentHeight = () => {
        return Math.max(
          document.body.scrollHeight || 0,
          document.body.offsetHeight || 0,
          document.documentElement.clientHeight || 0,
          document.documentElement.scrollHeight || 0,
          document.documentElement.offsetHeight || 0,
          window.innerHeight * 3, // 从5倍改为3倍
        )
      }

      const documentHeight = getDocumentHeight()

      // 基于视口面积密度计算粒子总数：确保在不同设备上密度一致
      const viewportArea = window.innerWidth * window.innerHeight
      const viewportCount = Math.ceil(documentHeight / window.innerHeight)
      const particlesPerViewport = Math.floor(
        viewportArea * PARTICLES_PER_VIEWPORT_AREA,
      )
      const adjustedParticleCount = Math.min(
        viewportCount * particlesPerViewport,
        MAX_PARTICLES,
      )

      for (let i = 0; i < adjustedParticleCount; i++) {
        particlesRef.current.push(
          new Particle(window.innerWidth, window.innerHeight, documentHeight),
        )
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // 鼠标位置追踪
    let mouseX = -1000
    let mouseY = -1000

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }

    const handleMouseLeave = () => {
      mouseX = -1000
      mouseY = -1000
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    // 动画循环
    const animate = (currentTime: number) => {
      // 帧率限制
      if (currentTime - lastFrameTimeRef.current < 1000 / FPS_LIMIT) {
        animationIdRef.current = requestAnimationFrame(animate)
        return
      }
      lastFrameTimeRef.current = currentTime

      // 每3帧更新一次可见粒子缓存以减少计算
      frameSkipCounterRef.current++
      const shouldUpdateCache = frameSkipCounterRef.current % 3 === 0

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      // 更新可见粒子缓存
      if (shouldUpdateCache) {
        visibleParticlesCacheRef.current = particlesRef.current.filter(
          (particle) =>
            particle.isVisible(scrollYRef.current, window.innerHeight),
        )
      }

      const visibleParticles: {
        particle: Particle
        screenPos: { x: number; y: number }
      }[] = []

      // 只更新和绘制可见粒子
      visibleParticlesCacheRef.current.forEach((particle) => {
        particle.updatePosition(scrollYRef.current)

        // 获取当前文档高度
        const currentDocumentHeight = Math.max(
          document.body.scrollHeight || 0,
          document.body.offsetHeight || 0,
          document.documentElement.clientHeight || 0,
          document.documentElement.scrollHeight || 0,
          document.documentElement.offsetHeight || 0,
          window.innerHeight * 3,
        )

        particle.update(
          mouseX,
          mouseY,
          window.innerWidth,
          window.innerHeight,
          scrollYRef.current,
          currentDocumentHeight,
        )

        const screenPos = particle.getScreenPosition(scrollYRef.current)
        visibleParticles.push({ particle, screenPos })
        particle.draw(ctx, scrollYRef.current)
      })

      // 优化的连线绘制 - 限制连线数量
      let connectionCount = 0
      const maxConnections = 50 // 限制同时显示的连线数量

      for (
        let i = 0;
        i < visibleParticles.length && connectionCount < maxConnections;
        i++
      ) {
        const { particle: particle1, screenPos: pos1 } = visibleParticles[i]

        for (
          let j = i + 1;
          j < visibleParticles.length && connectionCount < maxConnections;
          j++
        ) {
          const { particle: particle2, screenPos: pos2 } = visibleParticles[j]

          const dx = pos1.x - pos2.x
          const dy = pos1.y - pos2.y
          const distance = Math.hypot(dx, dy)

          if (distance < CONNECTION_DISTANCE) {
            ctx.globalAlpha =
              ((CONNECTION_DISTANCE - distance) / CONNECTION_DISTANCE) * 0.4
            ctx.strokeStyle = '#00D2FF'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(pos1.x, pos1.y)
            ctx.lineTo(pos2.x, pos2.y)
            ctx.stroke()
            ctx.globalAlpha = 1
            connectionCount++
          }
        }
      }

      animationIdRef.current = requestAnimationFrame(animate)
    }

    animate(0)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }, [mounted])

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

export default ParticleBackground
