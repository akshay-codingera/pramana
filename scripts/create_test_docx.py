# scripts/create_test_docx.py
import zipfile
import os
import re

source_text_path = "data/processed/extracted_text/year=2026/2026_10_118_131_EN.txt"
with open(source_text_path, "r", encoding="utf-8") as f:
    text = f.read()

# Strip invalid XML 1.0 control characters
text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', text)

paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]

doc_xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n<w:body>\n'
for p in paragraphs:
    clean_p = p.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    doc_xml += f'<w:p><w:r><w:t>{clean_p}</w:t></w:r></w:p>\n'
doc_xml += '</w:body>\n</w:document>'

content_types = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n<Default Extension="xml" ContentType="application/xml"/>\n<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>\n</Types>'

rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>\n</Relationships>'

out_docx = "data/raw_data/authentic_sc_2026.docx"
os.makedirs("data/raw_data", exist_ok=True)

with zipfile.ZipFile(out_docx, "w", zipfile.ZIP_DEFLATED) as z:
    z.writestr("[Content_Types].xml", content_types)
    z.writestr("_rels/.rels", rels)
    z.writestr("word/document.xml", doc_xml)

print(f"Created authentic DOCX judgment: {out_docx} ({os.path.getsize(out_docx)} bytes)")
