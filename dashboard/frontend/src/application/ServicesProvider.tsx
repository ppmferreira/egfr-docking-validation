import type { ReactNode } from 'react'
import { ServicesContext, type Services } from './servicesContext'

/** The composition root hands the implementations of the domain's ports in; hooks and components read them from the context. */
export function ServicesProvider({ gateway, createRenderer, children }: Services & { children: ReactNode }) {
  return <ServicesContext.Provider value={{ gateway, createRenderer }}>{children}</ServicesContext.Provider>
}
