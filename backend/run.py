from pathlib import Path
import sys


BASE_DIR = Path(__file__).resolve().parents[1]
LOCAL_PACKAGE_DIRS = [BASE_DIR / ".pydeps", BASE_DIR / ".packages"]


def has_valid_local_flask(package_dir: Path) -> bool:
    try:
        return (package_dir / "flask" / "__init__.py").is_file()
    except PermissionError:
        return False


for package_dir in LOCAL_PACKAGE_DIRS:
    if has_valid_local_flask(package_dir):
        sys.path.insert(0, str(package_dir))
        break

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app import create_app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True)
