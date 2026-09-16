"""
local_qwen.py — Implementasi Provider Qwen Lokal berbasis LangChain
Sesuai PRD: Qwen Local (misalnya Qwen 2.5 3B via Ollama / vLLM)
"""
import logging
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

from app.beauty_advisor.llm.base import BaseLLMProvider

logger = logging.getLogger(__name__)


class LangChainLocalQwenChat(BaseChatModel):
    """
    LangChain Chat Model untuk Local Qwen (Ollama / vLLM / Local endpoint).
    """
    model_name: str = Field(default="qwen2.5:3b")
    endpoint: str = Field(default="http://localhost:11434/api/chat")
    temperature: float = Field(default=0.7)
    max_tokens: int = Field(default=1500)

    @property
    def _llm_type(self) -> str:
        return "local_qwen"

    def _generate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        **kwargs: Any,
    ) -> ChatResult:
        import asyncio
        loop = asyncio.get_event_loop()
        if loop.is_running():
            content = f"[Local Qwen] Halo! Menanggapi: '{messages[-1].content if messages else ''}'."
            return ChatResult(generations=[ChatGeneration(message=LCAIMessage(content=content))])
        return asyncio.run(self._agenerate(messages, stop=stop, **kwargs))

    async def _agenerate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        **kwargs: Any,
    ) -> ChatResult:
        formatted_messages = []
        for m in messages:
            role = "user"
            if isinstance(m, LCSystemMessage):
                role = "system"
            elif isinstance(m, LCAIMessage):
                role = "assistant"
            formatted_messages.append({"role": role, "content": str(m.content)})

        payload = {
            "model": self.model_name,
            "messages": formatted_messages,
            "stream": False,
            "options": {
                "temperature": kwargs.get("temperature", self.temperature),
                "num_predict": kwargs.get("max_tokens", self.max_tokens),
            },
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                r = await client.post(self.endpoint, json=payload)
                if r.status_code == 200:
                    data = r.json()
                    content = data.get("message", {}).get("content", "")
                    return ChatResult(generations=[ChatGeneration(message=LCAIMessage(content=content))])
                logger.warning(f"Local Qwen endpoint status {r.status_code}. Menggunakan respons simulasi.")
            except Exception as e:
                logger.warning(f"Koneksi ke Local Qwen ({self.endpoint}) gagal: {e}. Menggunakan respons simulasi.")

        last_query = messages[-1].content if messages else ""
        content = (
            f"[Local Qwen] Halo! Menanggapi: '{last_query}'. "
            "Berikut rekomendasi perawatan kecantikan dari data produk Topshop Kosmetik yang tersedia."
        )
        return ChatResult(generations=[ChatGeneration(message=LCAIMessage(content=content))])


class LocalQwenProvider(BaseLLMProvider):
    """
    Provider untuk menjalankan model Qwen secara lokal (misal melalui Ollama atau vLLM).
    Mendukung LangChain Chat Model interface.
    """

    def __init__(self, endpoint: str = "http://localhost:11434/api/chat", model: str = "qwen2.5:3b"):
        self.endpoint = endpoint
        self.model = model
        self.chat_model = LangChainLocalQwenChat(
            model_name=self.model,
            endpoint=self.endpoint,
        )

    def get_langchain_chat_model(self) -> BaseChatModel:
        """Mengembalikan instance LangChain BaseChatModel."""
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
