#!/usr/bin/env bash
# Runs Slither on this Hardhat 3 project.
#
# crytic-compile (as of 0.3.x) only understands Hardhat 2 build-info: a single
# JSON per compilation with both "input" and "output" keys, and on-disk source
# paths. Hardhat 3 splits build-info into <id>.json / <id>.output.json and uses
# virtual source names (npm/<pkg>@<version>/..., project/...). This script
# compiles, merges the split build-info into the HH2 shape with real paths, and
# runs slither with --ignore-compile against the merged artifact.
set -euo pipefail
cd "$(dirname "$0")/.."

npx hardhat compile

python3 - << 'EOF'
import glob, json, os, re

os.chdir('artifacts/build-info')
inputs = [f for f in glob.glob('solc-*.json') if not f.endswith('.output.json')]
for f in glob.glob('merged-*.json'):
    os.remove(f)

def fix(name):
    n = re.sub(r'^npm/(@?[^@/]+(?:/[^@/]+)?)@[^/]+/', r'node_modules/\1/', name)
    return re.sub(r'^project/', '', n)

for inp in inputs:
    base = inp[:-len('.json')]
    a = json.load(open(inp))
    b = json.load(open(base + '.output.json'))
    merged = {
        '_format': 'hh-sol-build-info-1',
        'id': a['id'],
        'solcVersion': a['solcVersion'],
        'solcLongVersion': a['solcLongVersion'],
        'input': a['input'],
        'output': b['output'],
    }
    merged['input']['settings'].setdefault('optimizer', {'enabled': False, 'runs': 200})
    merged['input']['sources'] = {fix(k): v for k, v in merged['input']['sources'].items()}
    for key in ('sources', 'contracts'):
        if key in merged['output']:
            merged['output'][key] = {fix(k): v for k, v in merged['output'][key].items()}
    # source names also appear inside ASTs and metadata strings
    s = json.dumps(merged)
    s = re.sub(r'npm/(@?[^@/"]+(?:/[^@/"]+)?)@[0-9][^/"]*/', r'node_modules/\1/', s)
    s = s.replace('"project/', '"')
    json.dump(json.loads(s), open('merged-' + base + '.json', 'w'))
    # crytic-compile chokes on the HH3-format originals, keep only the merged file
    os.remove(inp)
    os.remove(base + '.output.json')
EOF

slither . --ignore-compile --filter-paths node_modules "$@"
