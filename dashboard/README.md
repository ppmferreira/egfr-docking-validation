# Painel do projeto

Backend e frontend separados:

```
dashboard/
  backend/    FastAPI (Python): lê results/ e data/, monta as estruturas 3D com RDKit/Meeko
    app/main.py        rotas da API
    app/results.py     tabelas (CSV) no formato que o frontend usa
    app/structures.py  proteína, cristal e poses (DiffDock e Vina) de cada complexo
    app/system.py      jobs rodando, GPU, logs
  frontend/   React + Vite + TypeScript (3Dmol.js para o 3D), em camadas (veja abaixo)
  legacy/     painel antigo em um único index.html (pode apagar)
```

## Arquitetura do frontend

`frontend/src` segue as camadas da Clean Architecture. A regra é de dependência: cada camada só importa das que estão
abaixo dela na lista, e `npm run lint` falha se isso for violado (`scripts/check-layers.mjs`).

```
src/
  domain/           regras e dados puros, sem React, sem fetch, sem biblioteca 3D
    entities.ts       formato dos dados do projeto
    rmsd.ts           o que conta como acerto (RMSD <= 2 Å)
    benchmark.ts      resumo do Vina, lista de complexos, contagem de acertos
    sweep.ts, trajectory.ts, stats.ts, layers.ts
    gateway.ts        PORTA: como ler os dados
    rendering.ts      PORTA: como desenhar um complexo
  application/      casos de uso, em hooks React
    useDashboard, useComplexExplorer, useComplexDetail, useTrajectoryPlayer, useLiveStatus, routes
    servicesContext / ServicesProvider   entrega as implementações das portas
  infrastructure/   implementações das portas
    http/HttpDashboardGateway.ts         fala com o backend FastAPI
    viewer/ComplexViewer.ts              adaptador do 3Dmol.js
  presentation/     componentes React, estilizados com Tailwind CSS
    styles/           tokens.css (cores, fontes) e index.css (Tailwind + tema)
    ui/               peças reutilizáveis (Box, Answer, Tag, Accordion, Slider, ...)
    layout/           Header, Sidebar, Toast, AppShell
    features/         uma pasta por tela: complexes, validation, docking, chem, guide, summary, roadmap, live
  main.tsx          raiz de composição: o único lugar que escolhe as implementações
```

O estilo é feito com classes do Tailwind direto no componente. As cores e fontes ficam só em `styles/tokens.css`
e viram utilitários (`bg-panel`, `text-muted`, `border-line`, ...), então o tema escuro vale sem `dark:` em lugar nenhum.

### Bibliotecas (todas de licença livre)

| Biblioteca | Para quê | Licença |
|---|---|---|
| Tailwind CSS v4 | estilos | MIT |
| Radix UI | acordeão, slider, tooltip e seletor, com acessibilidade pronta | MIT |
| Lucide | ícones | ISC |
| Recharts | gráfico de barras do Resumo | MIT |
| Motion | contagem animada dos números | MIT |
| 3Dmol.js | cena 3D | BSD-3 |
| clsx, tailwind-merge | juntar classes sem conflito | MIT |

## Rodar em desenvolvimento

Dois terminais, a partir desta pasta:

```bash
cd backend && conda run -n egfr-vs uvicorn app.main:app --port 8000 --reload
```

```bash
cd frontend && npm install && npm run dev
```

Abra http://localhost:5173. O Vite encaminha `/api` para a porta 8000.

## Rodar como um só servidor

```bash
cd frontend && npm run build
cd ../backend && conda run -n egfr-vs uvicorn app.main:app --port 8000
```

Abra http://localhost:8000: a API serve o `frontend/dist` junto.

## API

| Rota | O que devolve |
|---|---|
| `GET /api/data` | tudo que as abas de resultado usam (tabelas, etapas, teste cego) |
| `GET /api/version` | carimbo dos arquivos e jobs em execução; o painel recarrega quando muda |
| `GET /api/live` | jobs, GPU e final dos logs |
| `GET /api/complexes/{pdb}` | proteína, cristal e todas as poses do DiffDock e do Vina |
| `GET /api/complexes/{pdb}/trajectory/{rank}` | passos da difusão do DiffDock (só complexos de treino) |
| `GET /api/figures/{name}` | figuras de `figures/` |
