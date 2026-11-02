"""
__init__.py — Inisialisasi modul LLM dan Factory Provider
"""
from app.core.config import settings
from app.beauty_advisor.llm.base import BaseLLMProvider
from app.beauty_advisor.llm.alibaba_qwen import AlibabaQwenProvider
from app.beauty_advisor.llm.local_qwen import LocalQwenProvider


def get_llm_provider() -> BaseLLMProvider:
    """
    Factory function untuk mendapatkan instance AI Provider sesuai setting environment.
    AI_PROVIDER=alibaba (default) -> AlibabaQwenProvider
    AI_PROVIDER=local             -> LocalQwenProvider
    """
    provider_type = (settings.AI_PROVIDER or "alibaba").lower().strip()
    if provider_type == "local":
        return LocalQwenProvider()
    return AlibabaQwenProvider()


__all__ = ["BaseLLMProvider", "AlibabaQwenProvider", "LocalQwenProvider", "get_llm_provider"]
