from __future__ import annotations

import json
import logging
from http import HTTPStatus
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from typing import Any

ROOT_DIR = Path(__file__).resolve().parent
DATA_PATH = ROOT_DIR / "data" / "menu-database.json"

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(message)s", datefmt="%H:%M:%S")


class MenuRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, directory=str(ROOT_DIR), **kwargs)

    def end_headers(self) -> None:
        # Prevent aggressive caching for API responses
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def do_OPTIONS(self) -> None:  # noqa: N802 (method name from base class)
        if self.path == "/api/dishes":
            self.send_response(HTTPStatus.NO_CONTENT)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.end_headers()
        else:
            super().do_OPTIONS()

    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/api/dishes":
            self._handle_get_dishes()
            return
        super().do_GET()

    def do_POST(self) -> None:  # noqa: N802
        if self.path == "/api/dishes":
            self._handle_save_dishes()
            return
        super().do_POST()

    def log_message(self, format: str, *args: Any) -> None:  # noqa: A003 - keep parent signature
        logging.info("%s - %s", self.address_string(), format % args)

    def _handle_get_dishes(self) -> None:
        if not DATA_PATH.exists():
            self.send_error(HTTPStatus.NOT_FOUND, "menu-database.json not found")
            return

        try:
            payload = DATA_PATH.read_text(encoding="utf-8")
        except OSError as exc:
            logging.exception("Failed to read %s", DATA_PATH)
            self.send_error(HTTPStatus.INTERNAL_SERVER_ERROR, explain=str(exc))
            return

        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(payload.encode("utf-8"))

    def _handle_save_dishes(self) -> None:
        length_header = self.headers.get("Content-Length")
        if length_header is None:
            self.send_error(HTTPStatus.LENGTH_REQUIRED)
            return

        try:
            length = int(length_header)
        except ValueError:
            self.send_error(HTTPStatus.BAD_REQUEST, "Invalid Content-Length")
            return

        raw_body = self.rfile.read(length)

        try:
            data = json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError as exc:
            self.send_error(HTTPStatus.BAD_REQUEST, f"Invalid JSON: {exc.msg}")
            return

        if not isinstance(data, list):
            self.send_error(HTTPStatus.BAD_REQUEST, "Payload must be a list")
            return

        for entry in data:
            if not isinstance(entry, dict):
                self.send_error(HTTPStatus.BAD_REQUEST, "Each item must be an object")
                return
            if "id" not in entry or not isinstance(entry["id"], str) or not entry["id"].strip():
                self.send_error(HTTPStatus.BAD_REQUEST, "Each item must contain a non-empty 'id'")
                return

        try:
            DATA_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        except OSError as exc:
            logging.exception("Failed to write %s", DATA_PATH)
            self.send_error(HTTPStatus.INTERNAL_SERVER_ERROR, explain=str(exc))
            return

        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(b'{"status":"ok"}')


def run_server(port: int = 8000) -> None:
    server_address = ("0.0.0.0", port)
    httpd = ThreadingHTTPServer(server_address, MenuRequestHandler)
    logging.info("Serving on http://127.0.0.1:%s (Ctrl+C to stop)", port)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        logging.info("Stopping server...")
    finally:
        httpd.server_close()


if __name__ == "__main__":
    run_server()
