# Redocking validation of docking protocols for EGFR inhibitors

**Author:** Pedro Paulo de Melo Ferreira
**Status:** validation stage complete; the screening-power test (ranking actives above inactives) is **not done yet**.
**Scope:** retrospective, computational, exploratory. Nothing here discovers or validates a drug.

## 1. Summary

This stage asked a prerequisite question for virtual screening: can the docking protocol reproduce the experimental binding mode of known EGFR inhibitors? Two methods were compared on EGFR kinase-domain crystal structures: AutoDock Vina (given the binding pocket) and DiffDock (blind, no pocket given). A pose counts as correct when its heavy-atom RMSD to the crystal ligand is at most 2.0 Å.

- On **11 EGFR-inhibitor complexes released in 2022 or later**, Vina was correct for **10 of 11** (at least 2 of 3 seeds) and DiffDock for **8 of 11** (top-ranked pose).
- On the **three classic complexes** (1M17 erlotinib, 4WKQ gefitinib, 1XKK lapatinib), Vina missed the 2 Å limit for two of them (2.5 and 2.9 Å mean RMSD) and DiffDock was correct for all three (1.24, 0.94, 0.74 Å). These structures are old and probably in DiffDock's training data, so this result is weaker evidence than the blind set.
- **Vina results depend on the seed.** Two blind complexes had one failing seed out of three (5.8 Å and 13.3 Å). Single-run Vina results should not be trusted.
- **8SC7 failed for both methods.** It is the one complex where Vina failed in all three seeds (7.9 Å).
- A parameter sweep on 1M17 showed that a box of 20 Å worked best (2 of 3 seeds correct), whereas 16, 22 and 26 Å failed. This was tuned on one complex and should not be read as a general rule.
- Because the protocol had not been validated when the first ranking of 16 compounds was produced, **that ranking is not interpreted** (Section 5.1).

## 2. Question and scope

The project question (README) is whether a transparent cheminformatics and docking workflow can prioritize experimentally characterized EGFR inhibitors. Docking scores are not binding affinities. Before testing ranking performance, the protocol must at least recover the crystallographic pose of a known ligand; this report documents that step.

Not done: enrichment analysis with inactives and decoys, cross-docking (ligand into a different structure than its own), selectivity, mutants, cellular activity.

## 3. Data

- **Structures:** RCSB PDB, EGFR kinase domain, chain A. Classic set: 1M17 (erlotinib, 2.60 Å), 4WKQ (gefitinib, 1.85 Å), 1XKK (lapatinib, 2.40 Å).
- **Blind set:** selected from RCSB by search (UniProt P00533, X-ray diffraction, protein-only entry, at least one non-polymer, resolution at most 2.8 Å, initial release on or after 2022-01-01), which returned 108 entries. Rules, fixed before any docking (`scripts/07_blind_select.py`):
  1. chain A contains the hinge motif Gln-Leu-Met-Pro-Phe-Gly-Cys;
  2. a non-polymer residue of chain A with 18 to 70 heavy atoms and no phosphorus;
  3. that ligand makes a hinge hydrogen bond (an N or O atom within 3.5 Å of the Met backbone N or O);
  4. not covalently bound (no LINK record involving the ligand);
  5. one entry per ligand component, best resolution kept.

  Outcome: 21 entries rejected as covalent, 15 with no ligand at the hinge, 14 without the hinge motif in chain A, and 45 because no legacy PDB-format file exists (mmCIF only). **These 45 are the newest entries (2024 and 2025), so the blind set is limited to 2022 and 2023 structures.** Thirteen entries passed, giving 11 unique ligands.
- **Ligand chemistry:** SMILES with stereochemistry from the PDB Chemical Component Dictionary (blind set) or from the known drug structure (classic set). The crystal ligand was rebuilt from the PDB coordinates using RDKit `AssignBondOrdersFromTemplate`.
- **ChEMBL (first screening, exploratory):** target CHEMBL203, exact IC50 in nM, human. 500 records requested, 337 valid exact records, 236 unique compounds; 16 compounds were chosen for docking.

The date cut-off was chosen because DiffDock was trained on PDBBind-derived data, which predates 2022. I did not check the exact training cut-off against the DiffDock publication, so "blind" here means "released after the training data as I understand it".

## 4. Methods

- **Receptor:** chain A, alternate location A, no waters, no heteroatoms, prepared with Meeko (`--default_altloc A`). For 4WKQ and 1XKK, Meeko needed `--allow_bad_res`, which removed 16 of 296 and 22 of 289 residues with missing atoms. The removed residue closest to the ligand was 6.9 Å away (4WKQ) and 10.9 Å (1XKK). Blind-set receptors were prepared the same way; three of them also needed `--allow_bad_res`: 7ZYQ (18 residues removed, closest 6.4 Å from the ligand), 8G63 (5 residues, closest 9.0 Å) and **8TO3 (3 residues, one of them 3.8 Å from the ligand, inside the pocket)**. The other eight prepared without removing anything.
- **Vina** (AutoDock Vina f458505-mod): box of 20 Å centred on the centroid of the crystal ligand, exhaustiveness 32, 9 modes, seeds 1 to 3. The ligand starts from a fresh RDKit ETKDGv3 conformer (seed 42, MMFF-optimized), not from the crystal pose. **Vina was told where the pocket is.**
- **DiffDock** (commit `85c49b6`, default inference configuration, 20 steps): protein and ligand SMILES only, 10 samples per complex, batch size 5, poses ranked by the confidence model. **No pocket information was given.** The top-ranked pose is the one reported.
- **RMSD:** heavy atoms, symmetry-aware (RDKit `CalcRMS`), no realignment, in the receptor frame.
- **Success rules:** DiffDock, top-ranked pose at most 2.0 Å. Vina, at least 2 of 3 seeds with the top-ranked pose at most 2.0 Å.
- **Software:** Python 3.12, RDKit 2026.03.1, Meeko 0.8.0; DiffDock environment with PyTorch 1.13.1+cu117 on an NVIDIA RTX 3050 (8 GB), under WSL2.

## 5. Results

![Redocking summary](figures/redocking_summary.png)

*Top-ranked-pose RMSD per complex. Vina: median of 3 seeds. DiffDock: one run. Dashed line: 2 Å.*

### 5.1 First screening of 16 compounds (not interpreted)

Sixteen ChEMBL compounds (12 with pIC50 at least 7, 4 weaker) were docked with Vina into 1M17 before the protocol was validated. The Spearman correlation between Vina score and pIC50 was -0.22 (n = 16). The compound set was chosen by potency with no inactives or decoys, so the number cannot show whether docking separates actives from inactives. It is reported only to make the pipeline's output transparent.

### 5.2 Erlotinib redocking into 1M17 and parameter sweep

With the first protocol (box of 22 Å), Vina's top pose was 5.93 Å from the crystal, while the closest of the 9 poses was 1.34 Å (rank 9): the method sampled the right pose but ranked it low. A sweep over box size, exhaustiveness and crystallographic waters (3 seeds each, erlotinib only):

| Waters | Box (Å) | Exhaustiveness | Mean top RMSD (Å) | Seeds ≤ 2 Å |
|---|---|---|---|---|
| none | 20 | 32 | 3.92 | 2/3 |
| none | 20 | 64 | 3.90 | 2/3 |
| none | 20 | 8 | 5.24 | 1/3 |
| near ligand (≤ 6 Å) | 22 | 32 | 6.25 | 1/3 |
| all chain A | 22 | 32 | 7.95 | 0/3 |
| none | 16, 22, 26 | 8, 32, 64 | 6.83 to 8.03 | 0/3 |

Raising exhaustiveness from 32 to 64 changed nothing. The box effect is large and non-monotonic, which suggests the result is sensitive to where the box lies relative to the ligand. The box of 20 Å was selected on this same complex, so it is a tuned value.

### 5.3 Classic complexes

| PDB | Ligand | Vina mean RMSD (Å) | Vina seeds ≤ 2 Å | DiffDock RMSD (Å) |
|---|---|---|---|---|
| 1M17 | erlotinib | 3.92 | 2/3 | 1.24 |
| 1XKK | lapatinib | 2.91 | 0/3 | 0.74 |
| 4WKQ | gefitinib | 2.51 | 0/3 | 0.94 |

For gefitinib and lapatinib, Vina was consistently 2.5 to 2.9 Å away, close to but outside the limit. My hypothesis is that the error sits in the flexible side chains rather than the quinazoline core. I did not test this (a core-only RMSD would).

### 5.4 Blind complexes (released 2022 or later)

| PDB | Ligand | Vina RMSD per seed (Å) | Vina | DiffDock RMSD (Å) | DiffDock | DiffDock best of 10 (Å) |
|---|---|---|---|---|---|---|
| 7KXZ | XA4 | 1.21, 0.79, 1.05 | yes | 1.77 | yes | 1.77 (rank 1) |
| 7U99 | M0R | 0.73, 0.86, 0.62 | yes | 3.03 | no | 2.91 (rank 5) |
| 7U9A | M19 | 0.40, 0.38, 0.37 | yes | 0.45 | yes | 0.44 (rank 7) |
| 7ZYQ | V58 | 0.86, 0.83, 0.78 | yes | 0.99 | yes | 0.96 (rank 3) |
| 8D73 | QCR | 0.50, 5.82, 0.49 | yes (2/3) | 1.33 | yes | 0.79 (rank 2) |
| 8D76 | QFO | 1.80, 1.83, 1.84 | yes | 1.57 | yes | 1.36 (rank 2) |
| 8F1Z | X9B | 0.64, 0.64, 0.65 | yes | 1.04 | yes | 0.71 (rank 4) |
| 8G63 | YXT | 0.70, 0.75, 0.73 | yes | 0.70 | yes | 0.62 (rank 8) |
| 8SC7 | D0D | 7.89, 7.91, 7.90 | **no** | 2.92 | **no** | 1.88 (rank 7) |
| 8TO3 | IXC | 13.28, 0.68, 0.93 | yes (2/3) | 1.51 | yes | 1.42 (rank 5) |
| 9BY4 | Q6K | 1.16, 0.96, 1.04 | yes | 3.35 | no | 2.06 (rank 4) |

Totals: Vina 10 of 11 complexes, and 28 of 33 individual runs at most 2 Å; DiffDock 8 of 11. DiffDock's three failures are 7U99 (a macrocycle), 8SC7 and 9BY4. For 8SC7 the best of its 10 poses is 1.88 Å, so the model proposed a correct pose but did not rank it first.

### 5.5 Is the hinge hydrogen bond enough to pick the right pose?

For the 9 Vina poses of erlotinib in 1M17, the minimum ligand N or O to Met769 backbone N or O distance was at most 3.5 Å in 6 poses. Poses 1, 2, 3 and 6 satisfy it but are 5.9 to 8.6 Å from the crystal pose. So the hinge contact alone does not discriminate correct from incorrect poses. (Computed for one complex.)

## 6. Interpretation

- Vina reproduces crystal poses well on this set **when the pocket is supplied and several seeds are run**. Failures are not rare enough to ignore (1 complex of 11 fully, 2 more with one bad seed).
- DiffDock is competitive without a pocket (8 of 11), and its failures are often ranking failures: a good pose exists among its 10 samples.
- The two methods fail on the same difficult complex (8SC7), which would be worth examining structurally.
- The earlier near-misses of Vina on gefitinib and lapatinib were specific to those three older complexes, not a general failure of the protocol.

## 7. Limitations

1. **Redocking, not cross-docking.** Each ligand returns to its own structure, the easiest case. A real screen docks into a structure that did not contain the ligand.
2. **Small sample (11 complexes)**, restricted to 2022 and 2023 because 45 newer entries have no PDB-format file.
3. **Unequal information.** Vina knew the pocket; DiffDock did not.
4. **Tuned parameters.** The 20 Å box was chosen on 1M17 before being tested elsewhere; the blind set did not tune anything.
5. **Training overlap.** The classic complexes are probably in DiffDock's training data; the blind-date assumption was not verified against the DiffDock publication.
6. **Receptor preparation.** Residues with missing atoms were dropped for five receptors (4WKQ, 1XKK, 7ZYQ, 8G63, 8TO3). In 8TO3 a residue 3.8 Å from the ligand was dropped, which may explain the one failing Vina seed (13.3 Å) in that complex; this was not tested. Waters and protonation were not optimized.
7. **Pose accuracy is not screening power.** Correct poses do not imply that scores rank compounds by activity.
8. **Selection filters.** The blind set excludes covalent ligands and ligands without a hinge hydrogen bond, which are common among EGFR inhibitors.
9. Single DiffDock run per complex (no repeat), single machine.

## 8. Reproducibility

```bash
conda env create -f environment.yml                       # egfr-vs: RDKit, Vina, Meeko
python scripts/01_target.py && python scripts/02_chembl.py --max-records 500 && python scripts/03_ligands.py
mk_prepare_receptor.py --read_pdb data/egfr_protein_provisional.pdb --write_pdbqt data/egfr_receptor.pdbqt --default_altloc A
python scripts/04_docking.py && python scripts/05_analysis.py        # exploratory first screening
python scripts/04b_redocking.py                                      # erlotinib redocking (Vina)
python scripts/04c_redocking_sweep.py                                # box / exhaustiveness / waters
python scripts/04d_redock_multi.py                                   # 1M17, 4WKQ, 1XKK (Vina)
python scripts/06_diffdock.py --vis                                  # DiffDock in its own env, see below
python scripts/07_blind_select.py && python scripts/08_blind_run.py  # blind set
python scripts/09_report_figures.py                                  # figure and tables of this report
```

DiffDock needs a separate environment (Python 3.9, PyTorch 1.13.1+cu117, a CUDA GPU) and a clone of the DiffDock repository at commit `85c49b6` in `../tools/DiffDock`; `scripts/06_diffdock.py` expects both. Tables used here are regenerated in `results/report_tables.md`.

## 9. Suggested next steps

1. **Enrichment test:** ChEMBL actives (pIC50 at least 7), inactives (pIC50 below 5) and decoys; report ROC AUC and EF1% with the validated Vina protocol (several seeds), against a trivial baseline such as molecular weight.
2. **Cross-docking** with the blind-set ligands into non-cognate EGFR structures.
3. **Extend the blind set** by converting mmCIF entries from 2024 and 2025.
4. A core-only RMSD to test the flexible-tail hypothesis for gefitinib and lapatinib.
5. Investigate 8SC7, where both methods fail.
