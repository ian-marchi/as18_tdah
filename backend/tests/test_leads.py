import unittest
from pathlib import Path
from unittest.mock import patch

from backend.app.services.leads import (
    LeadValidationError,
    save_lead,
    validate_lead_payload,
)


class LeadServiceTests(unittest.TestCase):
    def test_validate_lead_payload_normalizes_fields(self):
        lead = validate_lead_payload(
            {
                "name": "  Maria  Silva ",
                "email": "  MARIA@example.com ",
                "phone": " (11) 99999-1234 ",
            }
        )

        self.assertEqual(lead["name"], "Maria Silva")
        self.assertEqual(lead["email"], "maria@example.com")
        self.assertEqual(lead["phoneDigits"], "11999991234")

    def test_validate_lead_payload_rejects_invalid_email(self):
        with self.assertRaises(LeadValidationError):
            validate_lead_payload(
                {
                    "name": "Maria Silva",
                    "email": "maria.example.com",
                    "phone": "(11) 99999-1234",
                }
            )

    def test_save_lead_appends_jsonl_record(self):
        temp_path = Path("backend/tests/.lead-test-output.jsonl")
        temp_csv_path = Path("backend/tests/.lead-test-output.csv")
        try:
            if temp_path.exists():
                temp_path.unlink()
            if temp_csv_path.exists():
                temp_csv_path.unlink()

            with (
                patch("backend.app.services.leads.LEADS_PATH", temp_path),
                patch("backend.app.services.leads.LEADS_SPREADSHEET_PATH", temp_csv_path),
            ):
                lead = save_lead(
                    {
                        "name": "Maria Silva",
                        "email": "maria@example.com",
                        "phone": "(11) 99999-1234",
                    }
                )

            self.assertTrue(temp_path.exists())
            written = temp_path.read_text(encoding="utf-8")
            self.assertIn('"name": "Maria Silva"', written)
            self.assertIn('"email": "maria@example.com"', written)
            self.assertIn(lead["submittedAtUtc"], written)

            self.assertTrue(temp_csv_path.exists())
            written_csv = temp_csv_path.read_text(encoding="utf-8")
            self.assertIn("name,email,phone,phoneDigits,source,submittedAtUtc", written_csv)
            self.assertIn("Maria Silva", written_csv)
            self.assertIn("maria@example.com", written_csv)
        finally:
            if temp_path.exists():
                temp_path.unlink()
            if temp_csv_path.exists():
                temp_csv_path.unlink()


if __name__ == "__main__":
    unittest.main()
