# Painel do projeto

Backend e frontend separados:

```
dashboard/
  backend/    FastAPI (Python): lê results/ e data/, monta as estruturas 3D com RDKit/Meeko
    app/main.py        rotas da API
    app/results.py     tabelas (CSV) no formato que o frontend usa
    app/structures.py  proteína, cristal e poses (DiffDock e Vina) de cada complexo
    app/system.py      jobs rodando, GPU, logs
  frontend/   React + Vite + TypeScript (3Dmol.js para o 3D)
    src/tabs/          uma pasta ou arquivo por aba; Complexos fica em tabs/complexes/
  legacy/     painel antigo em um único index.html (pode apagar)
```

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
