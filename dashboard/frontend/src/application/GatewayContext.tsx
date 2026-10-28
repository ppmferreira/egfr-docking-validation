import { createContext, useContext, type ReactNode } from 'react'
import type { DashboardGateway } from '../domain/gateway'

const GatewayContext = createContext<DashboardGateway | null>(null)

/** Composition root hands the gateway implementation in; hooks read it from here. */
export function GatewayProvider({ gateway, children }: { gateway: DashboardGateway; children: ReactNode }) {
  return <GatewayContext.Provider value={gateway}>{children}</GatewayContext.Provider>
}

export function useGateway(): DashboardGateway {
  const g = useContext(GatewayContext)
  if (!g) throw new Error('GatewayProvider is missing')
  return g
}
