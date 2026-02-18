from pathlib import Path

from src.scraper import TwikitAuthConfig, normalize_account


def test_normalize_account_removes_at_and_spaces() -> None:
    assert normalize_account("  @elonmusk ") == "elonmusk"


def test_twikit_auth_config_detects_credentials() -> None:
    auth = TwikitAuthConfig(auth_info_1="user", password="secret")
    assert auth.has_credentials() is True
    assert auth.is_configured() is True


def test_twikit_auth_config_detects_cookie_file(tmp_path: Path) -> None:
    cookies_file = tmp_path / "cookies.json"
    cookies_file.write_text("{}", encoding="utf-8")
    auth = TwikitAuthConfig(cookies_file=str(cookies_file))
    assert auth.has_cookie_file() is True
    assert auth.is_configured() is True
