from __future__ import annotations

import io
import re
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from pypdf.generic import DecodedStreamObject, NameObject
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


PACK_DIR = (
    Path(__file__).resolve().parents[1]
    / "material_packs"
    / "hermes_first_audit"
)
ROUTE_FILES = (
    "01_Komu_predlozhit_Hermes_audit.pdf",
    "02_Offer_dlya_biznesa.pdf",
    "03_Hermes_Audit_Kit.pdf",
    "04_Ot_otcheta_k_sdelke_i_RKO.pdf",
)
PLAYBOOK_FILE = "Hermes_First_Audit_Playbook.pdf"
FONT_PATH = Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf")
FONT_NAME = "HermesOverlayBold"


def _without_broken_label_blocks(page_data: bytes) -> tuple[bytes, bool]:
    text = page_data.decode("latin1")
    changed = False
    for y in (407, 183):
        pattern = re.compile(
            rf"q\n1 0 0 1 192 {y} cm\nq\n.*?\nQ\nQ\n",
            re.DOTALL,
        )
        text, replacements = pattern.subn("", text, count=1)
        changed = changed or replacements == 1
    return text.encode("latin1"), changed


def _label_overlay() -> PdfReader:
    if not FONT_PATH.exists():
        raise FileNotFoundError(f"Required font is missing: {FONT_PATH}")
    pdfmetrics.registerFont(TTFont(FONT_NAME, str(FONT_PATH)))

    buffer = io.BytesIO()
    overlay = canvas.Canvas(buffer, pagesize=(720, 960))
    overlay.setFillColorRGB(0.043137, 0.070588, 0.12549)
    overlay.setFont(FONT_NAME, 22)
    overlay.drawString(192, 431, "Последствия")
    overlay.drawString(192, 215, "Следующий")
    overlay.drawString(192, 188, "шаг")
    overlay.save()
    buffer.seek(0)
    return PdfReader(buffer)


def fix_route_four() -> bool:
    route_path = PACK_DIR / ROUTE_FILES[-1]
    reader = PdfReader(route_path)
    if len(reader.pages) != 5:
        raise ValueError(f"{route_path.name}: expected 5 pages")

    page = reader.pages[1]
    clean_data, changed = _without_broken_label_blocks(
        page.get_contents().get_data()
    )
    if not changed:
        return False

    stream = DecodedStreamObject()
    stream.set_data(clean_data)
    page[NameObject("/Contents")] = stream
    page.merge_page(_label_overlay().pages[0])

    writer = PdfWriter()
    for current_page in reader.pages:
        writer.add_page(current_page)
    if reader.metadata:
        writer.add_metadata(reader.metadata)

    temp_path = route_path.with_suffix(".fixed.pdf")
    with temp_path.open("wb") as output:
        writer.write(output)
    temp_path.replace(route_path)
    return True


def rebuild_playbook() -> int:
    writer = PdfWriter()
    page_counts = []
    for filename in ROUTE_FILES:
        reader = PdfReader(PACK_DIR / filename)
        page_counts.append(len(reader.pages))
        for page in reader.pages:
            writer.add_page(page)

    if page_counts != [4, 4, 5, 5]:
        raise ValueError(f"Unexpected route page counts: {page_counts}")

    output_path = PACK_DIR / PLAYBOOK_FILE
    temp_path = output_path.with_suffix(".rebuilt.pdf")
    with temp_path.open("wb") as output:
        writer.write(output)
    temp_path.replace(output_path)
    return sum(page_counts)


def main() -> None:
    fixed = fix_route_four()
    pages = rebuild_playbook()
    print(f"route_04_fixed={str(fixed).lower()}")
    print(f"playbook_pages={pages}")


if __name__ == "__main__":
    main()
