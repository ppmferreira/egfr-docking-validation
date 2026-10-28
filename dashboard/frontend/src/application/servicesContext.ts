import { createContext, useContext } from 'react'
import type { DashboardGateway } from '../domain/gateway'
import type { StructureRendererFactory } from '../domain/rendering'

export interface Services { gateway: DashboardGateway; createRenderer: StructureRendererFactory }

export const ServicesContext = createContext<Services | null>(null)

function useServices(): Services {
  const s = useContext(ServicesContext)
  if (!s) throw new Error('ServicesProvider is missing')
  return s
}

export const useGateway = (): DashboardGateway => useServices().gateway
export const useRendererFactory = (): StructureRendererFactory => useServices().createRenderer
