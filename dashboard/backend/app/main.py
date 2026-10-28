"""Dashboard API. Run from dashboard/backend:  uvicorn app.main:app --port 8000

Reads the project's result files on every request, so the dashboard follows the pipeline while it runs.
If the frontend has been built (dashboard/frontend/dist), it is served from the same port.
"""
from __future__ import annotations
import re
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from .config import ROOT
from .results import dashboard_data
from .structures import cx_payload, diffdock_vis
from .system import live, version

app = FastAPI(title='EGFR screening dashboard')
PDB_ID = re.compile(r'^[0-9A-Za-z]{4}$')


def pdb_or_404(pdb: str) -> str:
    if not PDB_ID.match(pdb):
        raise HTTPException(404, 'unknown structure')
    return pdb.upper()


@app.get('/api/data')
def data():
    return dashboard_data()


@app.get('/api/version')
def current_version():
    return version()


@app.get('/api/live')
def live_status():
    return live()


@app.get('/api/complexes/{pdb}')
def complex_detail(pdb: str):
    payload = cx_payload(pdb_or_404(pdb))
    if payload is None:
        raise HTTPException(404, 'complex not available')
    return payload


@app.get('/api/complexes/{pdb}/trajectory/{rank}')
def trajectory(pdb: str, rank: int):
    return diffdock_vis(pdb_or_404(pdb), rank)


@app.get('/api/figures/{name}')
def figure(name: str):
    f = ROOT / 'figures' / Path(name).name
    if not f.is_file():
        raise HTTPException(404, 'figure not found')
    return FileResponse(f)


DIST = Path(__file__).resolve().parents[2] / 'frontend' / 'dist'
if DIST.is_dir():
    app.mount('/', StaticFiles(directory=DIST, html=True), name='frontend')
