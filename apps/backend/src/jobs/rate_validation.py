from decimal import Decimal
from typing import Iterable, Optional


def _to_decimal(value) -> Decimal:
    return Decimal(str(value))


def _specialization_name(specialization) -> str:
    return getattr(specialization, "specializationName", "this category")


def get_specialization_minimum_rate(specialization) -> Decimal:
    minimum_rate = getattr(specialization, "minimumRate", None)
    if minimum_rate is None:
        return Decimal("0.00")
    return _to_decimal(minimum_rate)


def validate_daily_rate_for_specialization(
    *,
    daily_rate: Decimal,
    specialization,
    field_name: str,
    field_label: str,
) -> Optional[dict]:
    minimum_rate = get_specialization_minimum_rate(specialization)
    if minimum_rate <= 0:
        return None

    rate_value = _to_decimal(daily_rate)
    if rate_value >= minimum_rate:
        return None

    category_name = _specialization_name(specialization)
    return {
        "error": (
            f"{field_label} cannot be less than P{minimum_rate:,.2f} "
            f"(DOLE minimum rate for {category_name})."
        ),
        "error_code": "DAILY_RATE_BELOW_MINIMUM",
        "field": field_name,
        "minimum_rate": float(minimum_rate),
        "category": category_name,
    }


def validate_daily_rate_for_specializations(
    *,
    daily_rate: Decimal,
    specializations: Iterable,
    field_name: str,
    field_label: str,
) -> Optional[dict]:
    for specialization in specializations:
        error = validate_daily_rate_for_specialization(
            daily_rate=daily_rate,
            specialization=specialization,
            field_name=field_name,
            field_label=field_label,
        )
        if error:
            return error
    return None
