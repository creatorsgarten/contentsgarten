import Image from 'next/image'
import { Source_Sans_Pro } from 'next/font/google'

const sourceSansPro = Source_Sans_Pro({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
})

export default function Home() {
  return (
    <main className={sourceSansPro.className}>
      <div className="p-8">
        <article
          className="prose md:prose-lg max-w-[48rem] mx-auto"
          style={{ opacity: false ? 0.5 : 1 }}
        >
          <h1>Title</h1>
          <p>Content</p>
        </article>
      </div>
    </main>
  )
}
