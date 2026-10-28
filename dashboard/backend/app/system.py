"""What the machine is doing right now: running pipeline jobs, GPU, logs and recently written result files."""
from __future__ import annotations
import subprocess
import time
from pathlib import Path
from .config import ROOT

WATCH = ['results/*.csv', 'results/*.log', 'results/redocking/*', 'data/*.csv', 'data/*.txt', 'data/*.json',
         'figures/*.png']
SKIP = ('dashboard.log',)


def watched_files():
    files = []
    for pattern in WATCH:
        files += [f for f in ROOT.glob(pattern) if f.is_file() and f.name not in SKIP]
    return files


def running_jobs():
    """Pipeline scripts and docking engines currently running on this machine."""
    try:
        out = subprocess.run(['ps', '-eo', 'etimes=,args='], capture_output=True, text=True, timeout=5).stdout
    except (OSError, subprocess.SubprocessError):
        return []
    jobs = []
    for line in out.splitlines():
        secs, _, args = line.strip().partition(' ')
        args = args.strip()
        if 'uvicorn' in args or not secs.isdigit():
            continue
        for part in args.split():
            name = Path(part).name
            if part.startswith(('scripts/', str(ROOT / 'scripts'))) and name.endswith('.py') and name[:2].isdigit():
                jobs.append({'name': name, 'seconds': int(secs)}); break
            if name == 'vina' and part == args.split()[0]:
                jobs.append({'name': 'vina (docking)', 'seconds': int(secs)}); break
    seen, uniq = set(), []
    for j in jobs:
        if j['name'] not in seen:
            seen.add(j['name']); uniq.append(j)
    return uniq


def version():
    files = watched_files()
    stamp = max((f.stat().st_mtime for f in files), default=0)
    count = len(files)
    return {'stamp': round(stamp, 3), 'files': count, 'jobs': running_jobs()}


def gpu_stats():
    exe = '/usr/lib/wsl/lib/nvidia-smi'
    try:
        out = subprocess.run([exe, '--query-gpu=name,utilization.gpu,memory.used,memory.total,temperature.gpu',
                              '--format=csv,noheader,nounits'], capture_output=True, text=True, timeout=5).stdout.strip()
        name, util, used, total, temp = [x.strip() for x in out.split(',')]
        return {'name': name, 'util': int(util), 'mem_used': int(used), 'mem_total': int(total), 'temp': int(temp)}
    except (OSError, ValueError, subprocess.SubprocessError):
        return None


def log_tails(max_files=3, lines=60, recent_s=900):
    """Tail of the most recently written logs. tqdm bars rewrite one line with \\r, so split on both."""
    now = time.time()
    cands = list((ROOT / 'results').glob('*.log')) + list((ROOT / 'results').glob('diffdock/*.log'))
    cands = [f for f in cands if f.name != 'dashboard.log' and now - f.stat().st_mtime < recent_s]
    out = []
    for f in sorted(cands, key=lambda f: f.stat().st_mtime, reverse=True)[:max_files]:
        text = f.read_text(errors='replace')[-12000:]
        parts = [p for p in text.replace('\r', '\n').split('\n') if p.strip()]
        out.append({'file': str(f.relative_to(ROOT)), 'age': int(now - f.stat().st_mtime), 'tail': parts[-lines:]})
    return out


def live():
    return {'jobs': running_jobs(), 'gpu': gpu_stats(), 'logs': log_tails()}


def activity(limit=10):
    now = time.time()
    rows = sorted(watched_files(), key=lambda f: f.stat().st_mtime, reverse=True)[:limit]
    return [{'file': str(f.relative_to(ROOT)), 'age': int(now - f.stat().st_mtime),
             'kb': round(f.stat().st_size / 1024, 1)} for f in rows]
