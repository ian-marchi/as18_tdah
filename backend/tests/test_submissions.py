import sqlite3
import unittest
from contextlib import closing
from pathlib import Path
from unittest.mock import patch

from backend.app.services.database import initialize_database
from backend.app.services.submissions import get_submission_detail, save_submission


class SubmissionServiceTests(unittest.TestCase):
    def setUp(self):
        self.database_path = Path("backend/tests/.submissions-test.sqlite3")
        self.csv_path = Path("backend/tests/.submissions-legacy.csv")
        self.jsonl_path = Path("backend/tests/.submissions-legacy.jsonl")

        for path in [self.database_path, self.csv_path, self.jsonl_path]:
            if path.exists():
                path.unlink()

        self.patches = [
            patch("backend.app.services.database.DATABASE_PATH", self.database_path),
            patch("backend.app.services.database.LEADS_SPREADSHEET_PATH", self.csv_path),
            patch("backend.app.services.database.LEADS_PATH", self.jsonl_path),
        ]

        for active_patch in self.patches:
            active_patch.start()

    def tearDown(self):
        for active_patch in reversed(self.patches):
            active_patch.stop()

        for path in [self.database_path, self.csv_path, self.jsonl_path]:
            if path.exists():
                path.unlink()

    def test_save_submission_persists_contact_and_result(self):
        initialize_database()

        submission = save_submission(
            {
                "name": "Maria Silva",
                "email": "maria@example.com",
                "phone": "(11) 99999-1234",
                "ageRange": "25 a 34 anos",
                "answers": [
                    {"questionId": "atencao_01", "value": 2},
                    {"questionId": "atencao_02", "value": 2},
                    {"questionId": "atencao_03", "value": 2},
                    {"questionId": "atencao_04", "value": 2},
                    {"questionId": "atencao_05", "value": 2},
                    {"questionId": "execucao_01", "value": 2},
                    {"questionId": "execucao_02", "value": 2},
                    {"questionId": "execucao_03", "value": 2},
                    {"questionId": "execucao_04", "value": 2},
                    {"questionId": "execucao_05", "value": 2},
                    {"questionId": "emocional_01", "value": 2},
                    {"questionId": "emocional_02", "value": 2},
                    {"questionId": "emocional_03", "value": 2},
                    {"questionId": "emocional_04", "value": 2},
                    {"questionId": "emocional_05", "value": 2},
                    {"questionId": "sobrecarga_01", "value": 2},
                    {"questionId": "sobrecarga_02", "value": 2},
                    {"questionId": "sobrecarga_03", "value": 2},
                    {"questionId": "sobrecarga_04", "value": 2},
                    {"questionId": "sobrecarga_05", "value": 2},
                ],
            }
        )

        self.assertEqual(submission["name"], "Maria Silva")
        self.assertEqual(submission["percentageTotal"], 50)
        self.assertEqual(submission["resultBandKey"], "sinais")
        self.assertEqual(len(submission["areas"]), 4)
        self.assertEqual(len(submission["answers"]), 20)
        self.assertFalse(submission["isLegacy"])

        saved_submission = get_submission_detail(submission["id"])
        self.assertIsNotNone(saved_submission)
        self.assertEqual(saved_submission["email"], "maria@example.com")

    def test_initialize_database_imports_legacy_records_once(self):
        self.csv_path.write_text(
            "\n".join(
                [
                    "name,email,phone,ageRange,phoneDigits,source,submittedAtUtc",
                    "Maria Silva,maria@example.com,(11) 99999-1234,25 a 34 anos,11999991234,quiz-precheck,2026-05-01T12:00:00+00:00",
                ]
            ),
            encoding="utf-8",
        )
        self.jsonl_path.write_text(
            '{"name":"Maria Silva","email":"maria@example.com","phone":"(11) 99999-1234","ageRange":"25 a 34 anos","phoneDigits":"11999991234","source":"quiz-precheck","submittedAtUtc":"2026-05-01T12:00:00+00:00"}\n',
            encoding="utf-8",
        )

        initialize_database()
        initialize_database()

        with closing(sqlite3.connect(self.database_path)) as connection:
            row = connection.execute("SELECT COUNT(*) FROM submissions").fetchone()
            legacy_row = connection.execute(
                "SELECT is_legacy, legacy_note FROM submissions LIMIT 1"
            ).fetchone()

        self.assertEqual(row[0], 1)
        self.assertEqual(legacy_row[0], 1)
        self.assertEqual(legacy_row[1], "resultado_indisponivel")


if __name__ == "__main__":
    unittest.main()
