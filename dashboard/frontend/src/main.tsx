import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ServicesProvider } from './application/ServicesProvider'
import { HttpDashboardGateway } from './infrastructure/http/HttpDashboardGateway'
import { ComplexViewer } from './infrastructure/viewer/ComplexViewer'
import App from './presentation/App'
import './presentation/styles/index.css'

// Composition root: the only place that knows which implementations the app runs with.
const gateway = new HttpDashboardGateway()
const createRenderer = (host: HTMLElement, palette: ConstructorParameters<typeof ComplexViewer>[1]) => new ComplexViewer(host, palette)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ServicesProvider gateway={gateway} createRenderer={createRenderer}>
      <App />
    </ServicesProvider>
  </StrictMode>,
)
