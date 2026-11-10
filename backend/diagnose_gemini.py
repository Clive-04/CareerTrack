"""Check Gemini access without displaying credentials or using stored resumes."""
import json
import sys
from unittest.mock import patch
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from fastapi import HTTPException

from app.core.config import settings
from app.core import gemini


def main():
    key = settings.GEMINI_API_KEY.get_secret_value()
    print("Configured model:", settings.GEMINI_MODEL)
    print("API key present:", bool(key))
    if not key:
        return
    if "--validated-generation" in sys.argv:
        try:
            result = gemini.analyze(
                "Fictional candidate has three years of Python development experience building SQL databases, REST APIs, and unit tests for web services.",
                "Fictional role requires Python development, SQL database design, REST API implementation, automated unit testing, version control, documentation, debugging, secure coding, and collaboration with product designers and engineering teams.",
            )
            print("Validated generation accepted; score:", result.score)
        except HTTPException as error:
            print("Validated generation failed:", error.status_code, error.detail)
            raise SystemExit(2)
        return
    request = Request(
        "https://generativelanguage.googleapis.com/v1beta/models/" + settings.GEMINI_MODEL,
        headers={"x-goog-api-key": key},
    )
    if "--generation" in sys.argv:
        captured = []

        def capture(value, **kwargs):
            captured.append(value)
            raise RuntimeError("Captured request")

        with patch.object(gemini, "urlopen", side_effect=capture):
            try:
                gemini.analyze(
                    "Fictional sample: Python developer with SQL and REST API project experience.",
                    "Sample job requires Python, SQL database design, REST APIs and unit testing.",
                )
            except RuntimeError:
                pass
        request = captured[0]
    try:
        with urlopen(request, timeout=60 if "--generation" in sys.argv else 20) as response:
            data = json.load(response)
        if "--generation" in sys.argv:
            print("Generation accepted; finish reason:", data.get("candidates", [{}])[0].get("finishReason"))
        else:
            print("Model accessible:", data.get("name"))
            print("Generation supported:", "generateContent" in data.get("supportedGenerationMethods", []))
    except HTTPError as error:
        body = json.loads(error.read()).get("error", {})
        print("HTTP status:", error.code)
        print("Provider status:", body.get("status"))
        print("Provider message:", str(body.get("message", "")).replace(key, "[REDACTED]"))
    except TimeoutError:
        print("Gemini request timed out.")
        raise SystemExit(2)
    except URLError:
        print("Network connection failed.")
        raise SystemExit(2)


if __name__ == "__main__":
    main()
