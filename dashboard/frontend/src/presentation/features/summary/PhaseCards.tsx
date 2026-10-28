import type { TabId } from '../../../application/routes'
import type { Step } from '../../../domain/entities'
import { summarizePhases } from '../../../domain/pipeline'
import { cn } from '../../ui/cn'
import { Progress } from '../../ui/Progress'
import { StatusIcon } from '../../ui/StatusIcon'
import { stepTarget } from './stepTarget'

function StepRow({ step, onGo }: { step: Step; onGo: (t: TabId) => void }) {
  const to = stepTarget(step.id)
  const p = step.progress
  return (
    <li className="flex items-start gap-2.5 py-1.5">
      <span className="pt-0.5"><StatusIcon status={step.status} /></span>
      <div className="min-w-0 flex-1">
        {to
          ? <button type="button" onClick={() => onGo(to)} className="cursor-pointer bg-transparent p-0 text-left text-sm text-ink underline decoration-line underline-offset-[3px] hover:decoration-docked">{step.name}</button>
          : <span className="text-sm">{step.name}</span>}
        <div className="font-mono text-[11.5px] text-muted">{step.script}</div>
        {step.status === 'running' && p && (
          <div className="mt-1 flex items-center gap-2"><Progress value={100 * p.done / p.total} className="flex-1" label={step.name} /><span className="font-mono text-[11.5px] text-muted">{p.done}/{p.total}</span></div>
        )}
      </div>
    </li>
  )
}

/** The pipeline in three phases, each with its own progress. */
export function PhaseCards({ steps, onGo }: { steps: Step[]; onGo: (t: TabId) => void }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(290px,1fr))] items-start gap-3">
      {summarizePhases(steps).map(ph => {
        const complete = ph.done === ph.total
        return (
          <div key={ph.title} className="rounded-lg border border-line bg-panel p-4">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="m-0 text-base font-semibold">{ph.title}</h3>
              <span className={cn('rounded-full border px-2 py-0.5 font-mono text-xs', complete ? 'border-pass text-pass' : ph.running ? 'border-warn text-warn' : 'border-line text-muted')}>{ph.done}/{ph.total}</span>
            </div>
            <p className="mt-0.5 mb-2 text-[13px] text-muted">{ph.blurb}</p>
            <Progress value={ph.total ? 100 * ph.done / ph.total : 0} tone={complete ? 'pass' : 'docked'} label={ph.title} />
            <ul className="m-0 mt-2 list-none p-0">{ph.steps.map(s => <StepRow key={s.id} step={s} onGo={onGo} />)}</ul>
          </div>
        )
      })}
    </div>
  )
}
