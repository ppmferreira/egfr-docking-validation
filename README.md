# EGFR Virtual Screening | Portfolio Starter

**Project:** Retrospective virtual screening of EGFR inhibitors using public biochemical activity measurements and structure-based docking.

**Author:** Pedro Paulo de Melo Ferreira  
**Research question:** Can a transparent cheminformatics filtering and docking workflow prioritize experimentally characterized EGFR inhibitors, and what are its limitations?

**What this is NOT:** Discovery or validation of a new drug; docking scores do not measure clinical effectiveness, selectivity, safety, or experimental binding affinity.

## Scientific choices

- **Target:** human epidermal growth factor receptor (EGFR), kinase domain, **wild-type structure**.
- **Protein structure:** [RCSB PDB 1M17](https://www.rcsb.org/structure/1M17), crystallized with **erlotinib (ligand code AQ4)**, resolution **2.60 Å**.
- **Biochemical reference data:** [ChEMBL](https://www.ebi.ac.uk/chembl/) activities for target **CHEMBL203** (EGFR/ERBB1). We restrict to numeric, exact `IC50` in `nM` and human target, then summarize multiple experimental measurements by median for **exploratory purposes only**.
- **Descriptor calculations:** [RDKit](https://www.rdkit.org/).
- **Optional docking:** [AutoDock Vina](https://vina.scripps.edu/) + [Meeko](https://meeko.readthedocs.io/).

## Recommended first session (60–120 minutes, depending on setup)

1. Install Python 3.10–3.12 (ideally via Miniforge) and create a new environment.
2. Download this folder and open a terminal inside it.
3. Install base dependencies:

   ```bash
   python -m pip install -r requirements-base.txt
   ```

4. Download 1M17 and compute a provisional docking search box centered on the co-crystal ligand:

   ```bash
   python scripts/01_target.py
   ```

5. Retrieve ChEMBL activity records and compute descriptors:

   ```bash
   python scripts/02_chembl.py --max-records 500
   ```

6. Generate 3D conformers (experimental structures are **not** inferred from these conformers):

   ```bash
   python scripts/03_ligands.py
   ```

Afterwards inspect `data/`, `figures/` and `results/`. It is normal for the ChEMBL query to take a little longer, and an Internet connection is required for scripts 01 and 02.

## Optional docking stage (requires additional environment preparation)

AutoDock Vina's command-line executable and Python bindings are not the same installation. Make sure `vina --help` works, and follow the official [installation docs](https://autodock-vina.readthedocs.io/en/latest/installation.html). Make sure `mk_prepare_ligand.py --help` and `mk_prepare_receptor.py --help` work; install Meeko and dependencies per the [official instructions](https://autodock-vina.readthedocs.io/en/latest/docking_requirements.html).

**Protein preparation is a scientific decision, not a file-conversion formality:** inspect 1M17 for missing residues/atoms, alt-locations, waters, protonation and relevant cofactors, and resolve any Meeko errors before docking. The starter script strips the crystallized ligand and other HETATM records to create a *provisional* protein PDB, **not** a validated docking receptor.

For an initial experiment, after reviewing the structure and completing necessary receptor preparation, this command may work:

```bash
mk_prepare_receptor.py --read_pdb data/egfr_protein_provisional.pdb --write_pdbqt data/egfr_receptor.pdbqt
```

Review any warnings/errors, generated atom types, charge/protonation, and target pocket coordinates. Only if receptor preparation succeeds:

```bash
python scripts/04_docking.py
```

`04_docking.py` prepares each ligand using Meeko, calls the `vina` command-line executable with a fixed seed, writes docking structures and saves a score table. Its comparison must be treated as **exploratory**. Scores (kcal/mol) are not measured ΔG values and cannot be directly converted to IC50.

**Before interpreting rankings, add a redocking validation:** remove the bound erlotinib from 1M17, prepare that ligand while preserving/reconstructing valid chemistry, dock it back, and compare the predicted pose to the crystallographic pose by an appropriate heavy-atom RMSD with chemically correct atom mapping (e.g. a commonly used working criterion is approximately 2 Å). Do not claim the protocol is validated until you have actually performed this test and documented its result. Docking known actives to their own target is a retrospective demonstration, not an independent prediction of novel actives.

## Dashboard

A React + FastAPI dashboard to browse complexes, poses and results lives in [`dashboard/`](dashboard/README.md).

## Folder structure

```text
scripts/01_target.py       Download structure and compute ligand-derived box
scripts/02_chembl.py       Curate activities and plot chemical descriptors
scripts/03_ligands.py      Generate ligand SDF 3D conformers
scripts/04_docking.py      OPTIONAL Meeko + Vina screen
scripts/05_analysis.py     OPTIONAL exploratory score comparison
data/                   Downloaded PDB, ChEMBL CSV and SDFs (generated)
figures/                Plots (generated)
results/                Rankings and observations (generated)
tests/                  Offline tests of core calculations
dashboard/              FastAPI backend + React frontend
```

## Questions to discuss in your write-up

1. What does the EGFR target do, and why is erlotinib a useful known ligand?
2. How many activities were downloaded, discarded, and retained, and why?
3. Are different IC50 assays comparable? (Not necessarily. Show assay/document provenance.)
4. How do molecular-weight and logP filters alter the compounds selected?
5. Does the docking protocol reproduce the experimentally observed binding mode of erlotinib?
6. Which predictions are uncertain (protonation, water molecules, protein flexibility, scoring function)?
7. Why would biochemical confirmation and selectivity/cellular assays be needed?

## Sharing the project on LinkedIn

A good first post after executing the scripts: *"I started a reproducible EGFR virtual-screening project to connect my pharmacy background with computational drug discovery. My first milestone was curating public EGFR IC50 measurements from ChEMBL and calculating molecular descriptors with RDKit. Next I will test whether molecular docking recovers a known erlotinib-bound structure (PDB 1M17), documenting failures and limitations as well as successes."*

Only claim numerical results after you have generated and checked them. Prefer an English README, method details, code screenshots, and the generated figure to generic claims about identifying new drugs.

## References

- [RCSB 1M17](https://www.rcsb.org/structure/1M17)
- [ChEMBL API](https://chembl.gitbook.io/chembl-interface-documentation/web-services/chembl-data-web-services)
- [RDKit documentation](https://www.rdkit.org/docs/)
- [AutoDock Vina documentation](https://autodock-vina.readthedocs.io/en/latest/)
- [Meeko](https://meeko.readthedocs.io/)

## License

Code is released under the [MIT License](LICENSE). Review and cite original data and software licensing/attribution terms before redistributing large data extracts or structure files.
