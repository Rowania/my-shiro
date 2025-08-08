import { Manrope, Noto_Serif_SC } from 'next/font/google'

const sansFont = Manrope({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-sans',
  display: 'optional', // 如果网络不好会快速降级到 fallback
  fallback: ['system-ui', '-apple-system', 'PingFang SC', 'Microsoft YaHei'],
})

const serifFont = Noto_Serif_SC({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-serif',
  display: 'optional', // 如果网络不好会快速降级到 fallback
  adjustFontFallback: false,
  fallback: [
    'Noto Serif CJK SC',
    'Source Han Serif SC',
    'SongTi SC',
    'SimSun',
    'serif',
  ],
})

export { sansFont, serifFont }
