import type { ComplexDetail, Dashboard, Live, Trajectory, Version } from './entities'

/** Port: how the application reads project data. Implemented by the infrastructure layer. */
export interface DashboardGateway {
  data(): Promise<Dashboard>
  version(): Promise<Version>
  live(): Promise<Live>
  complex(pdb: string): Promise<ComplexDetail>
  trajectory(pdb: string, rank: number): Promise<Trajectory>
}
