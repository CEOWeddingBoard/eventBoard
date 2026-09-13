from __future__ import annotations

import base64
import mimetypes
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "product-guide" / "instrukcja-planera.html"
OUTPUT = ROOT / "docs" / "product-guide" / "instrukcja-planera-standalone.html"
ZIP_OUTPUT = ROOT / "docs" / "product-guide" / "instrukcja-planera-standalone.zip"


def to_data_uri(path: Path) -> str:
    mime = mimetypes.guess_type(str(path))[0] or "application/octet-stream"
    payload = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{payload}"


def main() -> None:
    html = SOURCE.read_text(encoding="utf-8")

    def replace_css_url(match: re.Match[str]) -> str:
        rel = match.group(1)
        path = (SOURCE.parent / rel).resolve()
        return f'url("{to_data_uri(path)}")'

    def replace_img_src(match: re.Match[str]) -> str:
        rel = match.group(1)
        path = (SOURCE.parent / rel).resolve()
        return f'src="{to_data_uri(path)}"'

    # Embed every local CSS background URL (including background image).
    html = re.sub(r'url\("([^"]+)"\)', replace_css_url, html)
    # Embed screenshot references.
    html = re.sub(r'src="(\./assets/[^"]+)"', replace_img_src, html)

    OUTPUT.write_text(html, encoding="utf-8")

    # Create a ZIP that contains only the standalone file.
    import zipfile

    with zipfile.ZipFile(ZIP_OUTPUT, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.write(OUTPUT, arcname=OUTPUT.name)

    print(f"Standalone HTML: {OUTPUT}")
    print(f"ZIP package: {ZIP_OUTPUT}")


if __name__ == "__main__":
    main()
