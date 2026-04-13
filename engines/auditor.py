import io
import os
import re
import time
import zipfile

try:
    import fitz
    FITZ_AVAILABLE = True
except Exception:
    fitz = None
    FITZ_AVAILABLE = False

service_account = None
vision = None
GOOGLE_VISION_AVAILABLE = False

try:
    from google.oauth2 import service_account
    from google.cloud import vision

    GOOGLE_VISION_AVAILABLE = True
except Exception:
    service_account = None
    vision = None


class DocumentAuditor:
    def __init__(self):
        self.client = None
        self.init_error = None

        if not GOOGLE_VISION_AVAILABLE:
            self.init_error = "Cloud Vision SDK is not installed in this environment."
            return

        key_path = (
            os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
            or os.getenv("EYES_KEY_PATH")
            or os.getenv("BRAIN_KEY_PATH")
        )

        if not key_path:
            self.init_error = "Cloud Vision credentials path is missing from environment settings."
            return

        if not os.path.exists(key_path):
            self.init_error = f"Cloud Vision credential file not found at: {key_path}"
            return

        try:
            creds = service_account.Credentials.from_service_account_file(key_path)
            self.client = vision.ImageAnnotatorClient(credentials=creds)
        except Exception as exc:
            self.init_error = f"Cloud Vision client initialization failed: {exc}"
            self.client = None

    def _render_pdf_pages(self, document_bytes, max_pages=2):
        if not FITZ_AVAILABLE:
            raise RuntimeError("PyMuPDF is not available for PDF rendering.")

        rendered_images = []
        with fitz.open(stream=document_bytes, filetype="pdf") as pdf_doc:
            page_total = min(len(pdf_doc), max_pages)
            for idx in range(page_total):
                page = pdf_doc.load_page(idx)
                pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
                rendered_images.append(pixmap.tobytes("png"))

        if not rendered_images:
            raise RuntimeError("No renderable pages found in PDF.")

        return rendered_images

    def _content_risk_signals(self, extracted_text):
        text = (extracted_text or "").lower()
        if not text:
            return 0, []

        signals = [
            "specimen",
            "for testing purposes only",
            "not a real document",
            "sample only",
            "dummy",
            "training copy",
            "for demo use only",
        ]

        matched = [signal for signal in signals if signal in text]
        if not matched:
            return 0, []

        details = [
            "Document text contains test/specimen disclaimer markers.",
            f"Matched content indicators: {', '.join(matched)}",
        ]

        # Treat explicit specimen/test-only language as high-risk in fraud workflows.
        return 2, details

    def audit_document(self, document_bytes, filename):
        lower_name = (filename or "").lower()
        is_pdf = lower_name.endswith(".pdf") or document_bytes.startswith(b"%PDF")
        is_docx = lower_name.endswith(".docx")
        is_doc = lower_name.endswith(".doc") or document_bytes.startswith(b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1")
        is_xlsx = lower_name.endswith(".xlsx")
        is_xls = lower_name.endswith(".xls") and not is_doc
        is_csv = lower_name.endswith(".csv")
        is_zip = lower_name.endswith(".zip")
        is_image = lower_name.endswith((".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp"))

        local_metadata = self._inspect_local_metadata(document_bytes, filename)
        local_details = list(local_metadata["details"])
        local_details.insert(0, "Local heuristics completed as the first validation pass.")

        result = {
            "is_tampered": local_metadata["is_tampered"],
            "filename": filename,
            "extracted_text": local_metadata["extracted_text"],
            "metadata_integrity": not local_metadata["is_tampered"],
            "details": local_details,
            "metadata": {
                **local_metadata["metadata"],
                "validation_stages": ["local"],
                "local_fallback_used": True,
                "cloud_vision_attempted": False,
                "cloud_vision_status": "not_attempted",
                "cloud_vision_used": False,
                "vertex_review_attempted": False,
                "vertex_review_status": "not_attempted",
                "blocks_detected": None,
                "mode": "document",
            },
        }

        if not self.client:
            time.sleep(0.8)
            if self.init_error:
                result["details"].insert(1, self.init_error)
            result["details"].insert(2, "Cloud Vision API unavailable; local heuristics are the only validation pass.")
            result["metadata"]["cloud_vision_status"] = "unavailable"
            return result

        result["metadata"]["cloud_vision_attempted"] = True
        result["metadata"]["validation_stages"].append("cloud_vision")

        cloud_details = []
        cloud_success = False

        try:
            if is_pdf:
                rendered_pages = self._render_pdf_pages(document_bytes, max_pages=2)
                page_texts = []
                for page_number, page_bytes in enumerate(rendered_pages, start=1):
                    page_image = vision.Image(content=page_bytes)
                    page_response = self.client.document_text_detection(image=page_image)
                    if page_response.error.message:
                        raise RuntimeError(page_response.error.message)

                    page_text = page_response.full_text_annotation.text if page_response.full_text_annotation else ""
                    if page_text:
                        page_texts.append(page_text)
                    cloud_details.append(f"Cloud Vision OCR completed for PDF page {page_number}.")

                    safe_search = self.client.safe_search_detection(image=page_image)
                    if safe_search.safe_search_annotation and safe_search.safe_search_annotation.spoof in [
                        vision.Likelihood.LIKELY,
                        vision.Likelihood.VERY_LIKELY,
                    ]:
                        result["is_tampered"] = True
                        result["metadata_integrity"] = False
                        cloud_details.append(f"Cloud Vision page {page_number} flagged likely spoof/tampering signals.")

                extracted = "\n\n".join(page_texts).strip()
                if extracted:
                    result["extracted_text"] = extracted[:1000] + ("..." if len(extracted) > 1000 else "")

                result["metadata"]["blocks_detected"] = len(page_texts)
                result["metadata"]["mode"] = "pdf"
                cloud_details.insert(0, "Cloud Vision PDF OCR completed after local heuristics.")
                cloud_success = True
            else:
                image = vision.Image(content=document_bytes)
                response = self.client.document_text_detection(image=image)
                if response.error.message:
                    raise RuntimeError(response.error.message)

                extracted = response.full_text_annotation.text if response.full_text_annotation else ""
                if extracted:
                    result["extracted_text"] = extracted[:1000] + ("..." if len(extracted) > 1000 else "")

                if is_image:
                    safe_search = self.client.safe_search_detection(image=image)
                    if safe_search.safe_search_annotation:
                        if safe_search.safe_search_annotation.spoof in [vision.Likelihood.LIKELY, vision.Likelihood.VERY_LIKELY]:
                            result["is_tampered"] = True
                            result["metadata_integrity"] = False
                            cloud_details.append("Cloud Vision SafeSearch flagged likely spoof/tampering signals.")
                        else:
                            cloud_details.append("Cloud Vision SafeSearch did not flag spoofing artifacts.")

                result["metadata"]["blocks_detected"] = len(response.text_annotations) if response.text_annotations else 0
                result["metadata"]["mode"] = "image" if is_image else "document"
                cloud_details.insert(0, "Cloud Vision analysis completed after local heuristics.")
                cloud_success = True

            if cloud_success:
                result["metadata"]["cloud_vision_status"] = "success"
                result["metadata"]["cloud_vision_used"] = True
                result["metadata"]["validation_stages"].append("cloud_vision_success")
                result["metadata"]["vision_processing_status"] = "Success"
            else:
                result["metadata"]["cloud_vision_status"] = "fallback"

        except Exception as cloud_error:
            result["metadata"]["cloud_vision_status"] = "fallback"
            cloud_details.append(f"Cloud Vision review could not fully process this document: {cloud_error}")

        content_score, content_details = self._content_risk_signals(result.get("extracted_text", ""))
        if content_score > 0:
            result["is_tampered"] = True
            result["metadata_integrity"] = False
            result["metadata"]["local_metadata_score"] = min(
                5,
                int(result["metadata"].get("local_metadata_score", 0)) + content_score,
            )
            result["metadata"]["content_indicator_score"] = content_score
            result["metadata"]["content_indicator_hit"] = True
            result["details"].extend(content_details)
        else:
            result["metadata"]["content_indicator_score"] = 0
            result["metadata"]["content_indicator_hit"] = False

        result["details"].extend(cloud_details)
        return result

    def _inspect_local_metadata(self, document_bytes, filename):
        """Lightweight metadata checks that work without cloud credentials."""
        lower_name = (filename or "").lower()
        text = document_bytes.decode("latin-1", errors="ignore")
        lower_text = text.lower()

        details = []
        score = 0

        is_pdf = lower_name.endswith(".pdf") or document_bytes.startswith(b"%PDF")
        is_docx = lower_name.endswith(".docx")
        is_doc = lower_name.endswith(".doc") or document_bytes.startswith(b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1")
        is_xlsx = lower_name.endswith(".xlsx")
        is_xls = lower_name.endswith(".xls") and not is_doc
        is_csv = lower_name.endswith(".csv")
        is_zip = lower_name.endswith(".zip")
        is_png = lower_name.endswith(".png") or document_bytes.startswith(b"\x89PNG\r\n\x1a\n")
        is_tiff = lower_name.endswith((".tif", ".tiff")) or document_bytes.startswith(b"II*\x00") or document_bytes.startswith(b"MM\x00*")

        if is_pdf:
            creator_match = re.search(r"/Creator\s*\((.*?)\)", text, re.IGNORECASE)
            producer_match = re.search(r"/Producer\s*\((.*?)\)", text, re.IGNORECASE)
            mod_match = re.search(r"/ModDate\s*\((.*?)\)", text, re.IGNORECASE)
            creation_match = re.search(r"/CreationDate\s*\((.*?)\)", text, re.IGNORECASE)

            if creator_match:
                details.append(f"PDF Creator: {creator_match.group(1)}")
            if producer_match:
                details.append(f"PDF Producer: {producer_match.group(1)}")
            if mod_match:
                details.append(f"PDF Modified Date: {mod_match.group(1)}")
            if creation_match:
                details.append(f"PDF Creation Date: {creation_match.group(1)}")

            suspicious_markers = ["javascript", "/js", "/openaction", "/launch", "/aa", "/xfa"]
            if any(marker in lower_text for marker in suspicious_markers):
                score += 2
                details.append("Suspicious interactive PDF markers detected.")

            if creator_match and producer_match and creator_match.group(1).strip() != producer_match.group(1).strip():
                score += 1
                details.append("Creator and producer metadata do not match.")

            if creation_match and mod_match and creation_match.group(1).strip() == mod_match.group(1).strip():
                details.append("Creation and modification timestamps are identical.")

            if not creator_match and not producer_match:
                score += 1
                details.append("PDF metadata is sparse or missing.")

        elif is_docx:
            try:
                with zipfile.ZipFile(io.BytesIO(document_bytes)) as docx_zip:
                    names = set(docx_zip.namelist())
                    if "docProps/core.xml" in names:
                        core_xml = docx_zip.read("docProps/core.xml").decode("utf-8", errors="ignore")
                        creator = re.search(r"<dc:creator>(.*?)</dc:creator>", core_xml, re.IGNORECASE)
                        modified = re.search(r"<dcterms:modified[^>]*>(.*?)</dcterms:modified>", core_xml, re.IGNORECASE)
                        created = re.search(r"<dcterms:created[^>]*>(.*?)</dcterms:created>", core_xml, re.IGNORECASE)
                        if creator:
                            details.append(f"DOCX Creator: {creator.group(1)}")
                        if created:
                            details.append(f"DOCX Created: {created.group(1)}")
                        if modified:
                            details.append(f"DOCX Modified: {modified.group(1)}")
                        if not creator:
                            score += 1
                            details.append("DOCX creator metadata missing.")
                    else:
                        score += 1
                        details.append("DOCX core metadata file missing.")

                    if "word/document.xml" in names:
                        doc_xml = docx_zip.read("word/document.xml").decode("utf-8", errors="ignore")
                        if len(doc_xml.strip()) < 80:
                            score += 1
                            details.append("DOCX body content appears unexpectedly short.")
                        extracted_text = re.sub(r"<[^>]+>", " ", doc_xml)
                    else:
                        score += 2
                        details.append("DOCX main document content missing.")
                        extracted_text = ""

                    suspicious_markers = ["vba", "macro", "oleobject", "externaldata"]
                    if any(marker in " ".join(names).lower() for marker in suspicious_markers):
                        score += 2
                        details.append("DOCX contains macro/embedded object indicators.")

            except Exception as e:
                score += 2
                details.append(f"DOCX structure parsing failed: {e}")
                extracted_text = ""

        elif is_doc:
            if "author" in lower_text:
                details.append("DOC metadata markers found.")
            else:
                score += 1
                details.append("DOC metadata markers are sparse.")

            suspicious_markers = ["macro", "vba", "autoopen", "document_open"]
            if any(marker in lower_text for marker in suspicious_markers):
                score += 2
                details.append("DOC contains potential macro execution markers.")

            extracted_text = "Local DOC binary metadata scan complete."

        elif is_xlsx:
            try:
                with zipfile.ZipFile(io.BytesIO(document_bytes)) as xlsx_zip:
                    names = set(xlsx_zip.namelist())
                    if "xl/workbook.xml" not in names:
                        score += 2
                        details.append("XLSX workbook structure missing.")
                    else:
                        details.append("XLSX workbook structure detected.")

                    if "docProps/core.xml" in names:
                        core_xml = xlsx_zip.read("docProps/core.xml").decode("utf-8", errors="ignore")
                        creator = re.search(r"<dc:creator>(.*?)</dc:creator>", core_xml, re.IGNORECASE)
                        if creator:
                            details.append(f"XLSX Creator: {creator.group(1)}")
                        else:
                            score += 1
                            details.append("XLSX creator metadata missing.")
                    else:
                        score += 1
                        details.append("XLSX core metadata file missing.")

                    if "xl/sharedStrings.xml" not in names:
                        details.append("XLSX shared strings missing (may still be valid).")

                    suspicious_markers = ["vba", "macro", "externalLink", "connections"]
                    if any(marker.lower() in " ".join(names).lower() for marker in suspicious_markers):
                        score += 2
                        details.append("XLSX contains macro/external-link indicators.")

                extracted_text = "Local XLSX structure scan complete."
            except Exception as e:
                score += 2
                details.append(f"XLSX structure parsing failed: {e}")
                extracted_text = ""

        elif is_xls:
            if "workbook" in lower_text or "worksheet" in lower_text:
                details.append("XLS workbook markers found.")
            else:
                score += 1
                details.append("XLS workbook markers are sparse.")

            suspicious_markers = ["macro", "vba", "auto_open", "xlm"]
            if any(marker in lower_text for marker in suspicious_markers):
                score += 2
                details.append("XLS contains potential macro execution markers.")

            extracted_text = "Local XLS binary metadata scan complete."

        elif is_csv:
            lines = [line for line in text.splitlines() if line.strip()]
            if len(lines) < 2:
                score += 1
                details.append("CSV has very few populated rows.")

            comma_counts = [line.count(",") for line in lines[:30]]
            if comma_counts and (max(comma_counts) - min(comma_counts) > 5):
                score += 1
                details.append("CSV column count varies heavily across rows.")

            suspicious_markers = ["=cmd(", "=powershell", "=http", "=calc", "=char("]
            if any(marker in lower_text for marker in suspicious_markers):
                score += 2
                details.append("CSV formula-injection markers detected.")

            extracted_text = "Local CSV consistency scan complete."

        elif is_zip:
            try:
                with zipfile.ZipFile(io.BytesIO(document_bytes)) as bundle:
                    names = bundle.namelist()
                    details.append(f"ZIP entries detected: {len(names)}")
                    if len(names) == 0:
                        score += 2
                        details.append("ZIP is empty.")

                    risky_entries = [n for n in names if ".." in n or n.startswith("/") or n.startswith("\\")]
                    if risky_entries:
                        score += 2
                        details.append("ZIP path traversal-style entries detected.")

                    extension_hist = [os.path.splitext(n)[1].lower() for n in names if not n.endswith("/")]
                    if not extension_hist:
                        score += 1
                        details.append("ZIP has no regular files.")
            except Exception as e:
                score += 2
                details.append(f"ZIP parsing failed: {e}")

            extracted_text = "Local ZIP package scan complete."

        elif is_png or is_tiff:
            details.append("Scanned image document detected; OCR/tamper checks rely on Cloud Vision path when available.")
            extracted_text = "Scanned document format recognized."

        else:
            details.append("Unsupported document type for deep metadata checks.")
            score += 1

        is_tampered = score >= 2
        extracted_text = locals().get("extracted_text", "")
        if is_pdf:
            extracted_text = "Local PDF metadata scan complete."

        return {
            "is_tampered": is_tampered,
            "extracted_text": extracted_text,
            "details": details,
            "metadata": {
                "local_metadata_score": score,
                "document_type": (
                    "pdf" if is_pdf
                    else "docx" if is_docx
                    else "doc" if is_doc
                    else "xlsx" if is_xlsx
                    else "xls" if is_xls
                    else "csv" if is_csv
                    else "zip" if is_zip
                    else "scanned_image" if (is_png or is_tiff)
                    else "other"
                ),
            },
        }
