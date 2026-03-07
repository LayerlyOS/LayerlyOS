#!/usr/bin/env python3
"""
Bambu Lab cloud login with 2FA (like ha-bambulab).
Uses curl_cffi or cloudscraper to bypass Cloudflare on bambulab.com/api/sign-in/tfa.
Usage: bambu_login.py <email> <password> [tfa_code]
Output: access token on stdout, or exit 1 + stderr message.
Exit codes: 0 = token printed, 1 = need 2FA (tfa_code missing or wrong), 2 = other error.
"""
from __future__ import annotations

import json
import sys
import urllib.parse

# Prefer curl_cffi (bypasses Cloudflare), then cloudscraper
curl_available = False
cloudscraper_available = False
try:
    from curl_cffi import requests as curl_requests
    curl_available = True
except ImportError:
    pass
try:
    import cloudscraper
    cloudscraper_available = True
except ImportError:
    pass

API_LOGIN = "https://api.bambulab.com/v1/user-service/user/login"
SIGN_IN_PAGE = "https://bambulab.com/en/sign-in"
TFA_LOGIN = "https://bambulab.com/api/sign-in/tfa"

BBL_HEADERS = {
    "User-Agent": "bambu_network_agent/01.09.05.01",
    "X-BBL-Client-Name": "OrcaSlicer",
    "X-BBL-Client-Type": "slicer",
    "X-BBL-Client-Version": "01.09.05.51",
    "X-BBL-Language": "en-US",
    "X-BBL-OS-Type": "linux",
    "X-BBL-OS-Version": "6.2.0",
    "X-BBL-Agent-Version": "01.09.05.01",
    "Accept": "application/json",
    "Content-Type": "application/json",
}


def main() -> None:
    if len(sys.argv) < 3:
        print("Usage: bambu_login.py <email> <password> [tfa_code]", file=sys.stderr)
        sys.exit(2)
    email = sys.argv[1].strip()
    password = sys.argv[2].strip()
    tfa_code = sys.argv[3].strip() if len(sys.argv) > 3 else ""

    # Step 1: POST api.bambulab.com login (no Cloudflare)
    payload = {"account": email, "password": password}
    if tfa_code:
        payload["tfa_code"] = tfa_code

    session, impersonate = _session()
    try:
        r = session.post(API_LOGIN, json=payload, headers=BBL_HEADERS, timeout=15)
    except Exception as e:
        print(f"Login request failed: {e}", file=sys.stderr)
        sys.exit(2)

    try:
        data = r.json()
    except Exception:
        print(f"Invalid JSON: {r.text[:200]}", file=sys.stderr)
        sys.exit(2)

    token = (
        data.get("accessToken")
        or data.get("access_token")
        or data.get("token")
    )
    if token and isinstance(token, str):
        print(token.strip())
        return

    login_type = data.get("loginType") or ""
    if login_type == "verifyCode":
        print("Email verification code required (not supported by this script).", file=sys.stderr)
        sys.exit(1)
    if login_type == "tfa":
        tfa_key = data.get("tfaKey") or data.get("tfa_key") or ""
        if not tfa_key:
            print("TFA required but no tfaKey in response.", file=sys.stderr)
            sys.exit(1)
        if not tfa_code:
            print("REQUIRE_2FA", file=sys.stderr)
            sys.exit(1)

        # Step 2: GET sign-in page to get session cookie (bypass Cloudflare)
        # Step 3: POST TFA with that session
        tfa_body = {"tfaKey": tfa_key, "tfaCode": tfa_code}
        extra = {"impersonate": impersonate} if impersonate else {}
        try:
            session.get(SIGN_IN_PAGE, timeout=15, **extra)
        except Exception as e:
            print(f"Sign-in page request failed: {e}", file=sys.stderr)
            sys.exit(2)
        try:
            r2 = session.post(TFA_LOGIN, json=tfa_body, timeout=15, **extra)
        except Exception as e:
            print(f"TFA request failed: {e}", file=sys.stderr)
            sys.exit(2)

        if r2.status_code == 403:
            print("Cloudflare blocked TFA request (curl_cffi/cloudscraper not available?).", file=sys.stderr)
            sys.exit(2)

        token_from_cookie = None
        for c in getattr(r2, "cookies", []) or []:
            if getattr(c, "name", None) == "token":
                token_from_cookie = getattr(c, "value", None)
                break
        if not token_from_cookie and hasattr(r2, "cookies"):
            jar = r2.cookies
            if hasattr(jar, "get_dict"):
                token_from_cookie = jar.get_dict().get("token")
            elif hasattr(jar, "get"):
                token_from_cookie = jar.get("token")

        if token_from_cookie:
            print(urllib.parse.unquote(token_from_cookie))
            return

        try:
            j = r2.json()
            token_from_json = j.get("accessToken") or j.get("token") or j.get("access_token")
            if token_from_json:
                print(token_from_json)
                return
        except Exception:
            pass

        if r2.status_code == 400:
            code = (r2.json() or {}).get("code")
            if code == 1:
                print("TFA code expired. Use a fresh code.", file=sys.stderr)
            elif code == 2:
                print("Incorrect TFA code.", file=sys.stderr)
            else:
                print(r2.text[:200], file=sys.stderr)
            sys.exit(1)
        print(f"TFA failed: HTTP {r2.status_code} - {r2.text[:200]}", file=sys.stderr)
        sys.exit(2)
    else:
        print(f"Unexpected loginType: {login_type}", file=sys.stderr)
        sys.exit(2)


def _session():
    """Returns (session, impersonate_key or None). impersonate_key is passed as kwargs to get/post for curl_cffi."""
    if curl_available:
        return curl_requests.Session(), "chrome"
    if cloudscraper_available:
        return cloudscraper.create_scraper(), None
    import requests
    return requests.Session(), None


if __name__ == "__main__":
    main()
