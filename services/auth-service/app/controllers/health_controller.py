from app.locales import en


def health_check() -> dict[str, str]:
    return {"status": en.SUCCESS_STATUS}
