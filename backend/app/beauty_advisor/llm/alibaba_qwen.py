"""
alibaba_qwen.py — Implementasi Provider Qwen via Alibaba Cloud Model Studio (DashScope API)
Mendukung antarmuka LangChain BaseChatModel untuk integrasi LCEL (LangChain Expression Language).
"""
import logging
import re
from typing import List, Dict, Any, Optional
import httpx

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import (
    BaseMessage,
    AIMessage as LCAIMessage,
    HumanMessage as LCHumanMessage,
    SystemMessage as LCSystemMessage,
)
from langchain_core.outputs import ChatResult, ChatGeneration
from pydantic import Field

from app.core.config import settings
from app.beauty_advisor.llm.base import BaseLLMProvider, AIUnavailableError

logger = logging.getLogger(__name__)


class LangChainAlibabaQwenChat(BaseChatModel):
    """
    LangChain Chat Model untuk Qwen melalui Alibaba Cloud Model Studio / DashScope.
    """
    model_name: str = Field(default="qwen-plus")
    api_key: str = Field(default="")
    api_url: str = Field(default="")
    temperature: float = Field(default=0.7)
    max_tokens: int = Field(default=800)

    def __init__(self, **data):
        super().__init__(**data)
        if not self.api_url:
            base_url = (getattr(settings, "ALIBABA_CLOUD_BASE_URL", "") or "https://dashscope-intl.aliyuncs.com/compatible-mode/v1").rstrip("/")
            self.api_url = f"{base_url}/chat/completions"

    @property
    def _llm_type(self) -> str:
        return "alibaba_qwen"

    def _generate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        **kwargs: Any,
    ) -> ChatResult:
        """Synchronous generation (fallback)."""
        import asyncio
        try:
            asyncio.get_running_loop()
        except RuntimeError:
            return asyncio.run(self._agenerate(messages, stop=stop, **kwargs))
        raise AIUnavailableError("Gunakan antarmuka async dalam event loop")

    async def _agenerate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        **kwargs: Any,
    ) -> ChatResult:
        """Asynchronous generation via HTTP atau simulated response."""
        if not self.api_key or "your_api_key" in self.api_key or self.api_key == "mock":
            raise AIUnavailableError("Kredensial AI tidak tersedia")

        formatted_messages = []
        for m in messages:
            if isinstance(m, LCSystemMessage):
                formatted_messages.append({"role": "system", "content": m.content})
            elif isinstance(m, LCHumanMessage):
                formatted_messages.append({"role": "user", "content": m.content})
            elif isinstance(m, LCAIMessage):
                formatted_messages.append({"role": "assistant", "content": m.content})
            else:
                formatted_messages.append({"role": "user", "content": str(m.content)})

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model_name,
            "messages": formatted_messages,
            "temperature": kwargs.get("temperature", self.temperature),
            "max_tokens": kwargs.get("max_tokens", self.max_tokens),
        }

        from app.core.resilience import qwen_breaker, retry_with_backoff

        async def _call_dashscope():
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(self.api_url, json=payload, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    choices = data.get("choices", [])
                    if choices and choices[0].get("message", {}).get("content", "").strip():
                        content = choices[0].get("message", {}).get("content", "")
                        return ChatResult(generations=[ChatGeneration(message=LCAIMessage(content=content))])
                logger.error("Gagal memanggil Qwen API: HTTP %s", response.status_code)
                raise RuntimeError(f"DashScope status error: {response.status_code}")

        async def _run_with_retry():
            return await retry_with_backoff(_call_dashscope, max_retries=2, base_delay=0.5)

        try:
            return await qwen_breaker.call(func=_run_with_retry)
        except Exception as exc:
            logger.warning("Qwen tidak tersedia: %s", type(exc).__name__)
            raise AIUnavailableError("Layanan AI sedang mengalami gangguan. Silakan coba kembali.") from exc


class AlibabaQwenProvider(BaseLLMProvider):
    """
    Provider untuk mengakses model Qwen melalui Alibaba Cloud Model Studio / DashScope API.
    Menggunakan LangChain Chat Model di bawahnya untuk standar AI framework PRD.
    """

    def __init__(self):
        self.api_key = settings.ALIBABA_CLOUD_API_KEY
        self.model = settings.QWEN_MODEL or "qwen-turbo"
        base_url = (getattr(settings, "ALIBABA_CLOUD_BASE_URL", "") or "https://dashscope-intl.aliyuncs.com/compatible-mode/v1").rstrip("/")
        self.api_url = f"{base_url}/chat/completions"
        self.chat_model = LangChainAlibabaQwenChat(
            model_name=self.model,
            api_key=self.api_key,
            api_url=self.api_url,
            temperature=0.7,
        )

    def get_langchain_chat_model(self) -> BaseChatModel:
        """Mengembalikan instance LangChain BaseChatModel untuk LCEL chain."""
        return self.chat_model

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1500,
    ) -> str:
        lc_messages: List[BaseMessage] = []
        if system_prompt:
            lc_messages.append(LCSystemMessage(content=system_prompt))

        for m in messages:
            role = m.get("role", "user")
            content = m.get("content", "")
            if role == "system":
                lc_messages.append(LCSystemMessage(content=content))
            elif role == "assistant":
                lc_messages.append(LCAIMessage(content=content))
            else:
                lc_messages.append(LCHumanMessage(content=content))

        result = await self.chat_model._agenerate(
            messages=lc_messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return result.generations[0].message.content
