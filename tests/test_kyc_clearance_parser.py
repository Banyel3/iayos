"""
Parser-level tests for NBI/Police clearance OCR mapping.
Can run with pytest or as a standalone script.
"""

import os
import sys

ROOT_DIR = os.path.dirname(os.path.dirname(__file__))
BACKEND_SRC = os.path.join(ROOT_DIR, "apps", "backend", "src")
if BACKEND_SRC not in sys.path:
    sys.path.insert(0, BACKEND_SRC)

from accounts.kyc_extraction_parser import get_kyc_parser


def test_nbi_clearance_mapping():
    parser = get_kyc_parser()
    sample_text = """
    NATIONAL BUREAU OF INVESTIGATION
    NBI ID NO. C654BVBN50-R92684150
    FAMILY NAME CORNELIO
    FIRST NAME VANIEL JOHN
    MIDDLE NAME GARCIA
    DATE ISSUED Friday, September 19, 2026
    NO DEROGATORY RECORD
    """

    result = parser.parse_clearance_text(sample_text, "NBI")

    assert result["clearance_number"] == "C654BVBN50-R92684150"
    assert "Vaniel" in result["holder_name"]
    assert "Cornelio" in result["holder_name"]
    assert result["issue_date"] == "2026-09-19"


def test_police_clearance_mapping_spaced_date():
    parser = get_kyc_parser()
    sample_text = """
    POLICE CLEARANCE CERTIFICATE
    NAME
    JUAN DELA CRUZ
    Reg. Six Isssue 214720265
    DATE 07 /22 /2025
    FINDINGS NO DEROGATORY RECORD/INFORMATION
    """

    result = parser.parse_clearance_text(sample_text, "POLICE")

    assert result["clearance_number"] == "214720265"
    assert "Juan" in result["holder_name"]
    assert result["issue_date"] == "2025-07-22"


if __name__ == "__main__":
    test_nbi_clearance_mapping()
    test_police_clearance_mapping_spaced_date()
    print("✅ test_kyc_clearance_parser: all checks passed")
