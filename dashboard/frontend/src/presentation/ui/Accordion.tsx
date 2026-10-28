import { ChevronDown } from 'lucide-react'
import { Accordion as A } from 'radix-ui'
import type { ReactNode } from 'react'
import { cn } from './cn'

/** Radix Accordion with the panel's look. Items sit inside one bordered box. */
export function Accordion({ type = 'single', defaultValue, children, className, bare }: {
  type?: 'single' | 'multiple'; defaultValue?: string | string[]; children: ReactNode; className?: string; bare?: boolean
}) {
  const shared = { className: cn(!bare && 'overflow-hidden rounded-lg border border-line bg-panel', className) }
  return type === 'single'
    ? <A.Root type="single" collapsible defaultValue={defaultValue as string | undefined} {...shared}>{children}</A.Root>
    : <A.Root type="multiple" defaultValue={defaultValue as string[] | undefined} {...shared}>{children}</A.Root>
}

export function AccordionItem({ value, title, aside, children, className }: { value: string; title: ReactNode; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <A.Item value={value} className={cn('border-t border-line first:border-t-0', className)}>
      <A.Header className="m-0 flex">
        <A.Trigger className="group flex flex-1 cursor-pointer items-center gap-3 bg-transparent px-4 py-3 text-left font-medium outline-none hover:bg-docked/5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-docked">
          <span className="min-w-0 flex-1">{title}</span>
          {aside}
          <ChevronDown className="size-4 shrink-0 text-muted transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden />
        </A.Trigger>
      </A.Header>
      <A.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down motion-reduce:animate-none">
        <div className="px-4 pb-4 text-[13.5px] text-muted">{children}</div>
      </A.Content>
    </A.Item>
  )
}
