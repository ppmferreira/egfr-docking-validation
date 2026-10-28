"""Retrieve and curate public EGFR IC50 values; calculate descriptors and plots.
Data are heterogeneous experimental measurements and NOT ground truth for binding.
"""
from __future__ import annotations
import argparse
import math
from pathlib import Path
import time
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from rdkit import Chem
from rdkit.Chem import Descriptors, rdMolDescriptors
from rdkit.Chem.MolStandardize import rdMolStandardize

ROOT = Path(__file__).resolve().parents[1]
API = 'https://www.ebi.ac.uk/chembl/api/data/activity.json'


def fetch_activities(n: int):
    session = requests.Session()
    retry = Retry(total=3, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])
    session.mount('https://', HTTPAdapter(max_retries=retry))
    records, offset = [], 0
    while len(records) < n:
        page_size = min(500, n - len(records))
        params = {'target_chembl_id': 'CHEMBL203', 'standard_type': 'IC50',
                  'limit': page_size, 'offset': offset}
        response = session.get(API, params=params, timeout=90)
        response.raise_for_status()
        payload = response.json()
        batch = payload.get('activities', [])
        if not batch:
            break
        records.extend(batch)
        offset += len(batch)
        print(f'Downloaded {len(records)} activity records...', flush=True)
        if not payload.get('page_meta', {}).get('next'):
            break
        time.sleep(0.1)
    return records[:n]


def describe_record(r):
    # Exact units and relation prevent treating censored measurements as exact.
    if str(r.get('standard_type', '')).upper() != 'IC50':
        return None
    if str(r.get('standard_units', '')).lower() != 'nm':
        return None
    if str(r.get('standard_relation', '')).strip() != '=':
        return None
    if r.get('target_organism') != 'Homo sapiens':
        return None
    if str(r.get('target_chembl_id', '')) != 'CHEMBL203':
        return None
    if r.get('data_validity_comment') not in (None, '', 'Manually validated'):
        return None
    smiles, compound = r.get('canonical_smiles'), r.get('molecule_chembl_id')
    if not smiles or not compound:
        return None
    try:
        ic50 = float(r.get('standard_value'))
        if not math.isfinite(ic50) or ic50 <= 0:
            return None
        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            return None
        # Largest fragment removes detached small counterions for descriptor comparison.
        mol = rdMolStandardize.LargestFragmentChooser().choose(mol)
        if mol.GetNumHeavyAtoms() < 6:
            return None
        smiles = Chem.MolToSmiles(mol, isomericSmiles=True)
        mw = Descriptors.MolWt(mol)
        logp = Descriptors.MolLogP(mol)
        hbd = rdMolDescriptors.CalcNumHBD(mol)
        hba = rdMolDescriptors.CalcNumHBA(mol)
        rotb = rdMolDescriptors.CalcNumRotatableBonds(mol)
    except (ValueError, TypeError, RuntimeError, OverflowError):
        return None
    return {'chembl_id': compound, 'smiles': smiles, 'ic50_nM': ic50,
            'pIC50': 9 - math.log10(ic50), 'MW': round(mw, 2),
            'logP': round(logp, 2), 'HBD': hbd, 'HBA': hba, 'RotB': rotb,
            'assay_id': r.get('assay_chembl_id'), 'assay_type': r.get('assay_type'),
            'document_id': r.get('document_chembl_id')}


def choose_shortlist(df, max_n=16):
    # Demonstration subset includes different potency ranges; not an unbiased benchmark.
    ok = df[(df.MW.between(150, 550)) & (df.logP.between(-1, 6)) &
            (df.HBD <= 5) & (df.HBA <= 12) & (df.RotB <= 12)].copy()
    if ok.empty:
        raise ValueError('No molecules remain after filtering; inspect ChEMBL data.')
    hi = ok[ok.pIC50 >= 7].sort_values('pIC50', ascending=False).head(max_n // 2)
    low = ok[ok.pIC50 <= 6].sort_values('pIC50', ascending=True).head(max_n // 4)
    selected = pd.concat([hi, low]).drop_duplicates('chembl_id')
    mids = ok.loc[~ok.chembl_id.isin(selected.chembl_id)].sort_values('pIC50', ascending=False)
    selected = pd.concat([selected, mids.head(max_n - len(selected))]).head(max_n)
    return selected.sort_values('pIC50', ascending=False)


def curate(activities):
    rows = [describe_record(r) for r in activities]
    raw = pd.DataFrame([r for r in rows if r is not None])
    if raw.empty:
        raise ValueError('No valid EGFR records found. Verify the API fields/availability.')
    # Use median to summarize repeated measures, retain count and assay heterogeneity.
    core = raw.groupby('chembl_id', as_index=False).agg(
        smiles=('smiles', 'first'), ic50_nM=('ic50_nM', 'median'),
        MW=('MW', 'first'), logP=('logP', 'first'), HBD=('HBD', 'first'),
        HBA=('HBA', 'first'), RotB=('RotB', 'first'),
        n_measurements=('ic50_nM', 'size'), n_assays=('assay_id', 'nunique'))
    core['pIC50'] = 9 - core.ic50_nM.map(math.log10)
    return raw, core


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--max-records', type=int, default=500)
    args = ap.parse_args()
    if args.max_records < 10:
        ap.error('--max-records must be >= 10')
    data = ROOT / 'data'; figures = ROOT / 'figures'; results = ROOT / 'results'
    for d in (data, figures, results): d.mkdir(exist_ok=True)
    activities = fetch_activities(args.max_records)
    raw, curated = curate(activities)
    raw.to_csv(data / 'egfr_activities_filtered.csv', index=False)
    curated.to_csv(data / 'egfr_compounds_curated.csv', index=False)
    shortlist = choose_shortlist(curated)
    shortlist.to_csv(results / 'docking_shortlist.csv', index=False)
    plt.figure(figsize=(7, 5))
    sc = plt.scatter(curated.MW, curated.logP, c=curated.pIC50,
                     cmap='viridis', s=24, alpha=0.8)
    plt.colorbar(sc, label='pIC50 (median IC50; exploratory)')
    plt.xlabel('Molecular weight (g/mol)')
    plt.ylabel('Crippen logP (RDKit)')
    plt.title('EGFR compounds from ChEMBL | exploratory chemical space')
    plt.tight_layout()
    plt.savefig(figures / 'egfr_chemical_space.png', dpi=200)
    plt.close()
    print(f'Raw activities requested: {len(activities)}; valid exact records: {len(raw)}; unique compounds: {len(curated)}')
    print(f'Shortlist for demonstration: {len(shortlist)} compounds')
    print('Outputs: data/egfr_compounds_curated.csv; results/docking_shortlist.csv; figures/egfr_chemical_space.png')


if __name__ == '__main__':
    main()
