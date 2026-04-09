from datetime import timedelta


def parse_duration(duration_value: str) -> timedelta:
    if len(duration_value) < 2:
        raise ValueError("Duration format must include a numeric value and suffix")

    amount = int(duration_value[:-1])
    suffix = duration_value[-1].lower()

    if suffix == "s":
        return timedelta(seconds=amount)
    if suffix == "m":
        return timedelta(minutes=amount)
    if suffix == "h":
        return timedelta(hours=amount)
    if suffix == "d":
        return timedelta(days=amount)

    raise ValueError(f"Unsupported duration suffix: {suffix}")
