import unittest
from pathlib import Path
from unittest.mock import patch

from backend.app import create_app
from backend.app.services.database import initialize_database
from backend.app.services.submissions import save_submission


class AdminRoutesTests(unittest.TestCase):
    def setUp(self):
        self.database_path = Path("backend/tests/.admin-test.sqlite3")
        self.csv_path = Path("backend/tests/.admin-legacy.csv")
        self.jsonl_path = Path("backend/tests/.admin-legacy.jsonl")

        for path in [self.database_path, self.csv_path, self.jsonl_path]:
            if path.exists():
                path.unlink()

        self.patches = [
            patch("backend.app.services.database.DATABASE_PATH", self.database_path),
            patch("backend.app.services.database.LEADS_SPREADSHEET_PATH", self.csv_path),
            patch("backend.app.services.database.LEADS_PATH", self.jsonl_path),
            patch("backend.app.ADMIN_EMAIL", "admin@admin.com"),
            patch("backend.app.ADMIN_PASSWORD", "admin#22018@"),
            patch("backend.app.FLASK_SECRET_KEY", "test-secret-key"),
        ]

        for active_patch in self.patches:
            active_patch.start()

        self.app = create_app()
        self.client = self.app.test_client()

    def tearDown(self):
        for active_patch in reversed(self.patches):
            active_patch.stop()

        for path in [self.database_path, self.csv_path, self.jsonl_path]:
            if path.exists():
                path.unlink()

    def build_answers(self):
        return [
            {"questionId": "atencao_01", "value": 3},
            {"questionId": "atencao_02", "value": 3},
            {"questionId": "atencao_03", "value": 3},
            {"questionId": "atencao_04", "value": 3},
            {"questionId": "atencao_05", "value": 3},
            {"questionId": "execucao_01", "value": 3},
            {"questionId": "execucao_02", "value": 3},
            {"questionId": "execucao_03", "value": 3},
            {"questionId": "execucao_04", "value": 3},
            {"questionId": "execucao_05", "value": 3},
            {"questionId": "emocional_01", "value": 3},
            {"questionId": "emocional_02", "value": 3},
            {"questionId": "emocional_03", "value": 3},
            {"questionId": "emocional_04", "value": 3},
            {"questionId": "emocional_05", "value": 3},
            {"questionId": "sobrecarga_01", "value": 3},
            {"questionId": "sobrecarga_02", "value": 3},
            {"questionId": "sobrecarga_03", "value": 3},
            {"questionId": "sobrecarga_04", "value": 3},
            {"questionId": "sobrecarga_05", "value": 3},
        ]

    def test_dashboard_requires_authentication(self):
        response = self.client.get("/api/admin/dashboard")
        self.assertEqual(response.status_code, 401)

    def test_admin_can_login_and_read_dashboard(self):
        initialize_database()
        save_submission(
            {
                "name": "Maria Silva",
                "email": "maria@example.com",
                "phone": "(11) 99999-1234",
                "ageRange": "25 a 34 anos",
                "answers": self.build_answers(),
            }
        )

        login_response = self.client.post(
            "/api/admin/session",
            json={
                "email": "admin@admin.com",
                "password": "admin#22018@",
            },
        )
        self.assertEqual(login_response.status_code, 200)

        dashboard_response = self.client.get("/api/admin/dashboard")
        self.assertEqual(dashboard_response.status_code, 200)
        dashboard_payload = dashboard_response.get_json()
        self.assertEqual(dashboard_payload["totals"]["all"], 1)
        self.assertEqual(len(dashboard_payload["volume"]["day"]), 14)

        list_response = self.client.get("/api/admin/submissions")
        self.assertEqual(list_response.status_code, 200)
        items = list_response.get_json()["items"]
        self.assertEqual(len(items), 1)

        detail_response = self.client.get(f"/api/admin/submissions/{items[0]['id']}")
        self.assertEqual(detail_response.status_code, 200)
        detail_payload = detail_response.get_json()
        self.assertEqual(detail_payload["name"], "Maria Silva")
        self.assertFalse(detail_payload["isLegacy"])

    def test_admin_login_accepts_whitespace_and_quoted_environment_values(self):
        self.app.config["ADMIN_EMAIL"] = ' "admin@admin.com" '
        self.app.config["ADMIN_PASSWORD"] = " 'admin#22018@' "

        login_response = self.client.post(
            "/api/admin/session",
            json={
                "email": " admin@admin.com ",
                "password": " admin#22018@ ",
            },
        )

        self.assertEqual(login_response.status_code, 200)


if __name__ == "__main__":
    unittest.main()
