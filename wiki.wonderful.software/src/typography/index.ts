import { Source_Sans_Pro } from 'next/font/google'
import localFont from 'next/font/local'

export const sourceSansPro = Source_Sans_Pro({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-latin',
})

export const csChatThaiUi = localFont({
  src: [{ path: './CSChatThaiUI.otf', weight: '400', style: 'normal' }],
  variable: '--font-thai',
})
