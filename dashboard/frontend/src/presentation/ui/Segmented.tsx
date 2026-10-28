import { ToggleGroup } from 'radix-ui'

interface Props<T extends string> { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string }

/** A row of mutually exclusive choices (Radix ToggleGroup, so arrow keys and screen readers work). */
export function Segmented<T extends string>({ value, onChange, options, label }: Props<T>) {
  return (
    <ToggleGroup.Root type="single" value={value} onValueChange={v => v && onChange(v as T)} aria-label={label}
      className="inline-flex overflow-hidden rounded-md border border-line">
      {options.map(o => (
        <ToggleGroup.Item key={o.value} value={o.value}
          className="cursor-pointer border-r border-line bg-paper px-3 py-1 text-[12.5px] font-medium text-muted outline-none last:border-r-0 hover:text-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-docked data-[state=on]:bg-docked/15 data-[state=on]:text-ink data-[state=on]:shadow-[inset_0_-2px_0_var(--docked)]">
          {o.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  )
}
