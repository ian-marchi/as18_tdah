import os
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app import create_app


app = create_app()


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", "5000")),
        debug=os.getenv("FLASK_DEBUG") == "1",
    )
