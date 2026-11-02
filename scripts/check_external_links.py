#!/usr/bin/env python3
"""External Link & Homepage-Redirect Verification Script (scripts/check_external_links.py): v6.6.0.

Scans documentation, references, and manifests for external http:// and https:// URLs.
Verifies HTTP reachability, flags dead deep-link homepage redirects (e.g. IASP),
and applies bot-challenge allowlists for Cloudflare-protected portals.
"""

from __future__ import annotations

import json
import os
import pathlib
import re
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT_DIR = pathlib.Path(__file__).resolve().parent.parent

# Pre-release bypass: skip unreleased tag/asset downloads on current dev version
SKIP_RELEASE_URL_PAT = re.compile(r"github\.com/[^/]+/Satori/releases/(?:download|tag|latest/download)/")

# Cloudflare bot-challenge allowlist: domains that return 403, 522, or timeouts to automated scripts
BOT_CHALLENGE_ALLOWLIST = {
    "help.openai.com",
    "support.claude.com",
    "text50808.ie",
    "crisistextline.ca",
    "telemanas.mohfw.gov.in",
}

# Scan targets
SCAN_TARGETS = [
    ROOT_DIR / "SKILL.md",
    ROOT_DIR / "compact" / "SKILL.md",
    ROOT_DIR / "README.md",
    ROOT_DIR / "SAFETY.md",
    ROOT_DIR / "PRIVACY.md",
    ROOT_DIR / "CONTRIBUTING.md",
    ROOT_DIR / "SECURITY.md",
    ROOT_DIR / "docs" / "index.html",
    ROOT_DIR / "docs" / "404.html",
    ROOT_DIR / "docs" / "architecture.md",
    ROOT_DIR / "references" / "crisis-sources.json",
    *list((ROOT_DIR / "references").glob("*.md")),
]

URL_REGEX = re.compile(r'https?://[^\s<>"\'`\)]+')


def extract_urls(content: str) -> set[str]:
    urls = set()
    for match in URL_REGEX.finditer(content):
        url = match.group(0).rstrip(".,;:\"')")
        # Ignore localhost, example domains, schema URLs, and font CDN preconnect roots
        if any(dom in url for dom in ("localhost", "127.0.0.1", "example.com", "schema.org")):
            continue
        if url in ("https://fonts.googleapis.com", "https://fonts.gstatic.com"):
            continue
        # Skip repo-internal GitHub blob links (covered by validate_skill.py Check 18)
        if "github.com/MetcalfSolutions/Satori/blob/" in url:
            continue
        urls.add(url)
    return urls


def check_url(url: str, timeout: int = 10, retries: int = 2) -> tuple[bool, str]:
    if SKIP_RELEASE_URL_PAT.search(url):
        return True, "skipped (pre-release target)"

    parsed = urllib.parse.urlparse(url)
    host = parsed.netloc.lower()
    initial_path = parsed.path.rstrip("/")

    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        },
        method="GET",
    )

    # SSL context with system certificates
    ctx = ssl.create_default_context()

    last_err = ""
    for attempt in range(1 + retries):
        try:
            with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
                status = resp.status
                final_url = resp.geturl()
                final_parsed = urllib.parse.urlparse(final_url)
                final_path = final_parsed.path.rstrip("/")

                # Homepage Redirect Guard:
                # If initial path had specific content but redirected to domain root "/", flag it
                if initial_path and initial_path != "" and final_path == "":
                    return False, f"homepage redirect: {url} -> {final_url}"

                if 200 <= status < 400:
                    return True, f"HTTP {status}"
                return False, f"unexpected HTTP {status}"
        except urllib.error.HTTPError as e:
            if e.code in (403, 503, 522) and any(allowed in host for allowed in BOT_CHALLENGE_ALLOWLIST):
                return True, f"[WARN] HTTP {e.code} on allowlisted support portal: {url} (bot challenge)"
            last_err = f"HTTP {e.code}: {e.reason}"
        except urllib.error.URLError as e:
            if "CERTIFICATE_VERIFY_FAILED" in str(e.reason):
                # Retry with unverified context for official government portals with self-signed/gov roots
                try:
                    unverified_ctx = ssl._create_unverified_context()
                    with urllib.request.urlopen(req, timeout=timeout, context=unverified_ctx) as resp:
                        if 200 <= resp.status < 400:
                            return True, f"[WARN] SSL certificate untrusted on official portal: {url} (HTTP {resp.status})"
                except Exception:
                    pass
            if any(allowed in host for allowed in BOT_CHALLENGE_ALLOWLIST):
                return True, f"[WARN] URLError on allowlisted portal: {url} ({e.reason})"
            last_err = f"URLError: {e.reason}"
        except Exception as e:
            if any(allowed in host for allowed in BOT_CHALLENGE_ALLOWLIST):
                return True, f"[WARN] Exception on allowlisted portal: {url} ({e})"
            last_err = f"Error: {e}"

        time.sleep(1.0 * (attempt + 1))

    return False, last_err


def main() -> int:
    all_urls: set[str] = set()
    for target in SCAN_TARGETS:
        if not target.exists():
            continue
        content = target.read_text(encoding="utf-8")
        extracted = extract_urls(content)
        all_urls.update(extracted)

    print(f"Discovered {len(all_urls)} unique external URLs across {len(SCAN_TARGETS)} files.")

    failures: list[tuple[str, str]] = []
    warnings: list[str] = []

    for url in sorted(all_urls):
        ok, reason = check_url(url)
        if ok:
            if "[WARN]" in reason:
                warnings.append(reason)
                print(f"WARN: {url} -> {reason}")
            else:
                print(f"PASS: {url} -> {reason}")
        else:
            failures.append((url, reason))
            print(f"FAIL: {url} -> {reason}", file=sys.stderr)

    print(f"\n--- Link Check Summary ---")
    print(f"Total checked: {len(all_urls)}")
    print(f"Passed: {len(all_urls) - len(failures)}")
    print(f"Warnings: {len(warnings)}")
    print(f"Failed: {len(failures)}")

    if failures:
        print("\nFailures:")
        for url, reason in failures:
            print(f"  - {url}: {reason}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
