import unittest

from backend.app.services.quiz_repository import load_quiz_config
from backend.app.services.scoring import QuizValidationError, calculate_result


class ScoringServiceTests(unittest.TestCase):
    def setUp(self):
        self.config = load_quiz_config()

    def build_answers(self, value: int):
        return [
            {"questionId": question["id"], "value": value}
            for question in self.config["questions"]
        ]

    def test_calculate_result_for_high_band(self):
        result = calculate_result(self.config, self.build_answers(4))

        self.assertEqual(result["scoreTotal"], 80)
        self.assertEqual(result["percentageTotal"], 100)
        self.assertEqual(result["resultBand"]["key"], "alto")
        self.assertTrue(all(area["percentage"] == 100 for area in result["areas"]))
        self.assertTrue(all(area["bandKey"] == "alta" for area in result["areas"]))
        self.assertTrue(all(area["insight"] for area in result["areas"]))

    def test_calculate_result_for_middle_band(self):
        result = calculate_result(self.config, self.build_answers(2))

        self.assertEqual(result["scoreTotal"], 40)
        self.assertEqual(result["percentageTotal"], 50)
        self.assertEqual(result["resultBand"]["key"], "sinais")
        self.assertTrue(all(area["bandKey"] == "moderada" for area in result["areas"]))

    def test_raises_for_incomplete_answers(self):
        with self.assertRaises(QuizValidationError):
            calculate_result(self.config, self.build_answers(1)[:-1])


if __name__ == "__main__":
    unittest.main()
