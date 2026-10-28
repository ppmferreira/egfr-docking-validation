"""Property-matched, topologically dissimilar decoys for the enrichment test (DUD-E-style, built from ChEMBL).

DUD-E itself could not be reached from this machine, so decoys are drawn from random ChEMBL small molecules:
  * pool: random pages of the ChEMBL molecule table (seed 42), 15-60 heavy atoms, elements C H N O S F Cl Br I;
  * dissimilar: Morgan-2 Tanimoto < 0.30 to EVERY EGFR active (IC50 <= 100 nM, from the ChEMBL download in
    script 10) and to every EGFR compound kept in chembl_actives_inactives.csv;
  * matched: for each active, the closest unused pool molecules in standardised (MW, logP, HBD, HBA, RotB) space.
Decoys are ASSUMED inactive (not measured), as in DUD-E. They are not DUD-E decoys.
Output: data/enrichment/decoys.csv
"""
from __future__ import annotations
import argparse
import random
from pathlib import Path
import numpy as np
import pandas as pd
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from rdkit import Chem, DataStructs
from rdkit.Chem import Descriptors, rdFingerprintGenerator, rdMolDescriptors
from rdkit.Chem.MolStandardize import rdMolStandardize

ROOT = Path(__file__).resolve().parents[1]
API = 'https://www.ebi.ac.uk/chembl/api/data/molecule.json'
ALLOWED = {'C', 'N', 'O', 'S', 'F', 'Cl', 'Br', 'I', 'H'}
PROPS = ['MW', 'logP', 'HBD', 'HBA', 'RotB']


def props(mol):
    return {'MW': Descriptors.MolWt(mol), 'logP': Descriptors.MolLogP(mol), 'HBD': rdMolDescriptors.CalcNumHBD(mol),
            'HBA': rdMolDescriptors.CalcNumHBA(mol), 'RotB': rdMolDescriptors.CalcNumRotatableBonds(mol)}


_GEN = rdFingerprintGenerator.GetMorganGenerator(radius=2, fpSize=2048)


def fp(mol):
    return _GEN.GetFingerprint(mol)


def pool(pages, seed):
    s = requests.Session()
    s.mount('https://', HTTPAdapter(max_retries=Retry(total=4, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])))
    rng = random.Random(seed)
    rows = []
    for i in range(pages):
        off = rng.randrange(0, 2_300_000, 1000)
        try:
            r = s.get(API, params={'molecule_type': 'Small molecule', 'limit': 1000, 'offset': off,
                                   'only': 'molecule_chembl_id,molecule_structures'}, timeout=120)
            r.raise_for_status()
        except requests.RequestException as exc:
            print(f'  page {i} skipped: {exc}', flush=True); continue
        for m in r.json().get('molecules', []):
            st = m.get('molecule_structures') or {}
            if st.get('canonical_smiles'):
                rows.append((m['molecule_chembl_id'], st['canonical_smiles']))
        print(f'  page {i + 1}/{pages}: pool {len(rows)}', flush=True)
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--pages', type=int, default=60)
    ap.add_argument('--per-active', type=int, default=3)
    args = ap.parse_args()
    data = ROOT / 'data' / 'enrichment'
    sel = pd.read_csv(data / 'chembl_actives_inactives.csv')
    actives = sel[sel.label == 'active']
    ref_fps = [fp(Chem.MolFromSmiles(s)) for s in sel.smiles]          # all EGFR compounds we kept
    cand = []
    for cid, smi in pool(args.pages, 42):
        mol = Chem.MolFromSmiles(smi)
        if mol is None:
            continue
        mol = rdMolStandardize.LargestFragmentChooser().choose(mol)
        if not 15 <= mol.GetNumHeavyAtoms() <= 60 or any(a.GetSymbol() not in ALLOWED for a in mol.GetAtoms()):
            continue
        cand.append((cid, Chem.MolToSmiles(mol), mol))
    print(f'pool after filters: {len(cand)}', flush=True)
    keep = []
    for cid, smi, mol in cand:
        if max(DataStructs.BulkTanimotoSimilarity(fp(mol), ref_fps)) < 0.30:
            keep.append({'chembl_id': cid, 'smiles': smi, 'heavy_atoms': mol.GetNumHeavyAtoms(), **props(mol)})
    pool_df = pd.DataFrame(keep).drop_duplicates('smiles').reset_index(drop=True)
    print(f'pool after dissimilarity filter: {len(pool_df)}', flush=True)
    sd = pool_df[PROPS].std().replace(0, 1)
    X = ((pool_df[PROPS] - pool_df[PROPS].mean()) / sd).to_numpy()
    used, chosen = set(), []
    for a in actives.itertuples():
        pa = np.array([(getattr(a, p) - pool_df[p].mean()) / sd[p] for p in PROPS])
        order = np.argsort(((X - pa) ** 2).sum(axis=1))
        n = 0
        for i in order:
            if i in used:
                continue
            used.add(i); chosen.append(i); n += 1
            if n == args.per_active:
                break
    dec = pool_df.loc[chosen].assign(label='decoy')
    dec.to_csv(data / 'decoys.csv', index=False)
    print(f'Saved {len(dec)} decoys. Median properties, decoys vs actives:')
    print(pd.DataFrame({'decoys': dec[PROPS].median(), 'actives': actives[PROPS].median()}).round(1).to_string())


if __name__ == '__main__':
    main()
