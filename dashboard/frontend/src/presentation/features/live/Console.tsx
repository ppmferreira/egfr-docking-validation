import { useEffect, useRef } from 'react'
import type { LogTail } from '../../../domain/entities'
import { ago } from '../../format'
import { Box } from '../../ui/Box'

/** The tail of a log file, kept scrolled to the newest line. */
export function Console({ file, age, tail }: LogTail) {
  const ref = useRef<HTMLPreElement>(null)
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight })
  return (
    <Box title={`${file} · atualizado ${ago(age)}`}>
      <pre ref={ref} className="m-0 max-h-[340px] overflow-auto rounded-b-lg bg-stage px-3.5 py-3 font-mono text-xs leading-normal break-words whitespace-pre-wrap text-[#c3d0d6]">{tail.join('\n')}</pre>
    </Box>
  )
}
