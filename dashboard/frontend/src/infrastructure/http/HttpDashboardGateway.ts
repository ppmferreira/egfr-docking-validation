import type { ComplexDetail, Dashboard, Live, Trajectory, Version } from '../../domain/entities'
import type { DashboardGateway } from '../../domain/gateway'
import { getJSON } from './http'

/** Reads project data from the FastAPI backend (dashboard/backend). */
export class HttpDashboardGateway implements DashboardGateway {
  data = () => getJSON<Dashboard>('/api/data')
  version = () => getJSON<Version>('/api/version')
  live = () => getJSON<Live>('/api/live')
  complex = (pdb: string) => getJSON<ComplexDetail>(`/api/complexes/${pdb}`)
  trajectory = (pdb: string, rank: number) => getJSON<Trajectory>(`/api/complexes/${pdb}/trajectory/${rank}`)
}
