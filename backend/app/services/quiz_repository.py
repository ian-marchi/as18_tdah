import json
from functools import lru_cache
from pathlib import Path

from ..config import CONTENT_PATH


def load_quiz_config(path: Path | None = None) -> dict:
    source_path = path or CONTENT_PATH
    with source_path.open("r", encoding="utf-8") as file_handle:
        return json.load(file_handle)


@lru_cache(maxsize=1)
def get_quiz_config() -> dict:
    return load_quiz_config()


def clear_quiz_config_cache() -> None:
    get_quiz_config.cache_clear()

