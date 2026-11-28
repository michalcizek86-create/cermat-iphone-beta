"""Run after editing the student build to refresh its offline asset checksums."""
import hashlib
import json
from pathlib import Path
import re


def digest(data):
    return hashlib.sha256(data).hexdigest()


def set_constant(source, name, value):
    result, count = re.subn(rf"^const {name} = .*;$", lambda _: f"const {name} = {value};", source, flags=re.M)
    if count != 1:
        raise ValueError(f"Expected one {name} constant, found {count}")
    return result


root = Path(__file__).resolve().parent
worker = root / "service-worker.js"
shell = root / "index.html"
verification = root / "VERIFICATION.json"
source = worker.read_text(encoding="utf-8")
files = json.loads(re.search(r"^const FILES = (.*);$", source, re.M)[1])
update_script = "./subjects/update.js"
if update_script not in files:
    files.append(update_script)

hashes = {path: digest((root / path).read_bytes()) for path in files if path != "./index.html"}
shell_html = re.sub(r'(\./subjects/update\.js)(?:\?v=[a-f0-9]+)?(?=")', rf'\g<1>?v={hashes[update_script][:12]}',
                    shell.read_text(encoding="utf-8"))
tag = r'(<meta name="cermat-release" content=")[a-f0-9]+(">)'
neutral_html = re.sub(tag, r"\g<1>0000000000000000\2", shell_html)
neutral_worker = set_constant(set_constant(source, "RELEASE", "'0000000000000000'"), "ASSET_HASHES", "{}")
neutral_worker = set_constant(neutral_worker, "FILES", json.dumps(files, separators=(",", ":")))
release = digest((neutral_html + neutral_worker + json.dumps(hashes, sort_keys=True)).encode())[:16]

shell_html = re.sub(tag, rf"\g<1>{release}\2", shell_html)
hashes["./index.html"] = digest(shell_html.encode())
worker.write_text(set_constant(set_constant(neutral_worker, "RELEASE", repr(release)), "ASSET_HASHES",
                               json.dumps(hashes, separators=(",", ":"))), encoding="utf-8")
shell.write_text(shell_html, encoding="utf-8")
meta = json.loads(verification.read_text(encoding="utf-8"))
meta.update(release=release, offlineResources=len(files))
verification.write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
print(release)
