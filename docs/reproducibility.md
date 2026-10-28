# Reprodutibilidade

## Ambiente

```bash
conda env create -f environment.yml   # Python 3.12, RDKit, Vina, Meeko, Open Babel, FastAPI
conda activate egfr-vs
```

Só a parte cheminformática, sem docking: `python -m pip install -r requirements-base.txt`.

O DiffDock roda em um ambiente conda separado (`diffdock`) e fica fora deste repositório, em `../tools/DiffDock`.

## Executar o pipeline

```bash
python scripts/01_target.py
python scripts/02_chembl.py --max-records 500
python scripts/03_ligands.py
# preparar o receptor (revisar avisos do Meeko) e então:
python scripts/04_docking.py
python scripts/04b_redocking.py
python scripts/04d_redock_multi.py
python scripts/07_blind_select.py && python scripts/08_blind_run.py
```

Os scripts 01, 02, 04d e 07 precisam de internet.

## Testes

```bash
pytest tests/
```

## Dashboard

Veja [dashboard/README.md](../dashboard/README.md).

## O que é versionado

Código, tabelas pequenas (`data/*.csv`, `results/*.csv`) e figuras. PDBs baixados, poses, saídas do DiffDock e do teste cego e logs são regenerados pelos scripts e ficam fora do git (`.gitignore`).

## Licenças e atribuição

Código sob licença MIT. Cite e respeite os termos de ChEMBL, RCSB PDB, RDKit, Vina, Meeko e DiffDock ao redistribuir dados ou estruturas.
