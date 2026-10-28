"""Build the actives / experimental-inactives sets for the enrichment test (ChEMBL, target CHEMBL203).

Design fixed before any docking:
  * biochemical assays only (assay_type B), human EGFR, IC50 in nM, no data-validity flags;
  * active:   median of exact (=) IC50 values <= 100 nM  (pIC50 >= 7);
  * inactive: median of exact IC50 >= 10 000 nM, or no exact value and every censored value is '>' >= 10 000 nM
              (pIC50 <= 5);  compounds in between are excluded as ambiguous;
  * largest fragment, 15-60 heavy atoms, <= 15 rotatable bonds, elements C H N O S F Cl Br I, one entry per
    canonical SMILES;
  * fixed random subsample (seed 42): up to N actives and N inactives.
Output: data/enrichment/chembl_actives_inactives.csv
"""
from __future__ import annotations
import argparse
import math
from pathlib import Path
import time
import pandas as pd
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from rdkit import Chem
from rdkit.Chem import Descriptors, rdMolDescriptors
from rdkit.Chem.MolStandardize import rdMolStandardize

ROOT = Path(__file__).resolve().parents[1]
API = 'https://www.ebi.ac.uk/chembl/api/data/activity.json'
ALLOWED = {'C', 'N', 'O', 'S', 'F', 'Cl', 'Br', 'I', 'H'}


def fetch_all():
    s = requests.Session()
    s.mount('https://', HTTPAdapter(max_retries=Retry(total=4, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])))
    params = {'target_chembl_id': 'CHEMBL203', 'standard_type': 'IC50', 'standard_units': 'nM', 'assay_type': 'B',
              'limit': 1000, 'offset': 0}
    rows = []
    while True:
        r = s.get(API, params=params, timeout=120); r.raise_for_status()
        j = r.json()
        rows += j['activities']
        print(f'  {len(rows)} records', flush=True)
        if not j['page_meta'].get('next'):
            break
        params['offset'] += params['limit']; time.sleep(0.2)
    return rows


def clean(smiles):
    mol = Chem.MolFromSmiles(smiles) if smiles else None
    if mol is None:
        return None
    mol = rdMolStandardize.LargestFragmentChooser().choose(mol)
    if not 15 <= mol.GetNumHeavyAtoms() <= 60 or rdMolDescriptors.CalcNumRotatableBonds(mol) > 15:
        return None
    if any(a.GetSymbol() not in ALLOWED for a in mol.GetAtoms()):
        return None
    return mol


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--n', type=int, default=100, help='actives and inactives to keep (each)')
    args = ap.parse_args()
    out = ROOT / 'data' / 'enrichment'; out.mkdir(parents=True, exist_ok=True)
    raw = fetch_all()
    (out / 'chembl_ic50_raw_count.txt').write_text(f'{len(raw)} IC50 records downloaded (target CHEMBL203, assay_type B, nM)\n')
    recs = []
    for r in raw:
        if r.get('target_organism') != 'Homo sapiens' or r.get('data_validity_comment') not in (None, '', 'Manually validated'):
            continue
        try:
            v = float(r['standard_value'])
        except (TypeError, ValueError):
            continue
        if not math.isfinite(v) or v <= 0 or not r.get('canonical_smiles') or not r.get('molecule_chembl_id'):
            continue
        recs.append({'chembl_id': r['molecule_chembl_id'], 'smiles': r['canonical_smiles'], 'value': v,
                     'relation': (r.get('standard_relation') or '').strip()})
    df = pd.DataFrame(recs)
    rows = []
    for cid, g in df.groupby('chembl_id'):
        exact = g[g.relation == '='].value
        cens = g[g.relation == '>'].value
        if len(exact):
            med = float(exact.median())
            label = 'active' if med <= 100 else 'inactive' if med >= 10000 else None
            n_exact = len(exact)
        elif len(cens) and cens.min() >= 10000 and (g.relation == '>').all():
            med, label, n_exact = float(cens.median()), 'inactive', 0
        else:
            continue
        if label:
            rows.append({'chembl_id': cid, 'smiles': g.smiles.iloc[0], 'label': label, 'ic50_nM': med, 'n_exact': n_exact,
                         'n_measurements': len(g)})
    comp = pd.DataFrame(rows)
    keep = []
    for r in comp.itertuples():
        mol = clean(r.smiles)
        if mol is None:
            continue
        keep.append({**r._asdict(), 'smiles': Chem.MolToSmiles(mol), 'heavy_atoms': mol.GetNumHeavyAtoms(),
                     'MW': round(Descriptors.MolWt(mol), 1), 'logP': round(Descriptors.MolLogP(mol), 2),
                     'HBD': rdMolDescriptors.CalcNumHBD(mol), 'HBA': rdMolDescriptors.CalcNumHBA(mol),
                     'RotB': rdMolDescriptors.CalcNumRotatableBonds(mol)})
    comp = pd.DataFrame(keep).drop(columns=['Index']).drop_duplicates('smiles')
    print(comp.label.value_counts().to_dict(), 'after filters (before subsampling)')
    pick = pd.concat([comp[comp.label == k].sample(n=min(args.n, (comp.label == k).sum()), random_state=42)
                      for k in ('active', 'inactive')])
    pick.to_csv(out / 'chembl_actives_inactives.csv', index=False)
    print(pick.groupby('label')[['heavy_atoms', 'MW', 'logP']].median().round(1).to_string())
    print(f'Saved {len(pick)} compounds to data/enrichment/chembl_actives_inactives.csv')


if __name__ == '__main__':
    main()
