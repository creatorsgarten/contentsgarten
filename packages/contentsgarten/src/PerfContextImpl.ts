import { PerfContext, PerfEntry } from './RequestContext'

export class PerfContextImpl implements PerfContext {
  private begin = performance.now()
  private beginTime = new Date()
  private data: { start: number; finish?: number; text: string }[] = []
  async measure<T>(
    name: string,
    fn: (entry: PerfEntry) => PromiseLike<T>,
  ): Promise<T> {
    const entry: (typeof this.data)[number] = {
      start: performance.now(),
      text: name,
    }
    this.data.push(entry)
    try {
      return await fn({
        addInfo: (info) => {
          entry.text += ` (${info})`
        },
      })
    } finally {
      entry.finish = performance.now()
    }
  }
  log(name: string): void {
    this.data.push({ start: performance.now(), text: name })
  }
  toMessageArray() {
    const out: string[] = []
    out.push(`start: ${this.beginTime.toISOString()}`)
    const begin = this.begin
    const fmt = (d: number) => `${(d / 1000).toFixed(3)}s`
    const t = (ts: number) => fmt(ts - begin)
    for (const { start, finish, text } of this.data) {
      if (finish) {
        out.push(
          `${t(start)} ~ ${t(finish)} | ${text} (took ${fmt(finish - start)})`,
        )
      } else {
        out.push(`${t(start)} | ${text}`)
      }
    }
    const finish = performance.now()
    out.push(`${t(finish)} | finish (total ${fmt(finish - begin)}))`)
    return out
  }
}
