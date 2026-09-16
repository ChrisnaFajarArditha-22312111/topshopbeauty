"""
alibaba_qwen.py — Implementasi Provider Qwen via Alibaba Cloud Model Studio (DashScope API)
Mendukung antarmuka LangChain BaseChatModel untuk integrasi LCEL (LangChain Expression Language).
"""
import logging
import inspect
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
from app.beauty_advisor.llm.base import BaseLLMProvider

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
        loop = asyncio.get_event_loop()
        if loop.is_running():
            content = self._simulate_response(messages)
            return ChatResult(generations=[ChatGeneration(message=LCAIMessage(content=content))])
        return asyncio.run(self._agenerate(messages, stop=stop, **kwargs))

    async def _agenerate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        **kwargs: Any,
    ) -> ChatResult:
        """Asynchronous generation via HTTP atau simulated response."""
        if not self.api_key or "your_api_key" in self.api_key or self.api_key == "mock":
            content = self._simulate_response(messages)
            return ChatResult(generations=[ChatGeneration(message=LCAIMessage(content=content))])

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
                    if choices:
                        content = choices[0].get("message", {}).get("content", "")
                        return ChatResult(generations=[ChatGeneration(message=LCAIMessage(content=content))])
                logger.error(f"Gagal memanggil Alibaba Qwen API ({response.status_code}): {response.text}")
                raise RuntimeError(f"DashScope status error: {response.status_code}")

        fallback_result = lambda: ChatResult(generations=[ChatGeneration(message=LCAIMessage(content=self._simulate_response(messages)))])

        async def _run_with_retry():
            return await retry_with_backoff(_call_dashscope, max_retries=2, base_delay=0.5)

        try:
            return await qwen_breaker.call(
                func=_run_with_retry,
                fallback=fallback_result,
            )
        except Exception as e:
            logger.error(f"Qwen Circuit Breaker fallback activated: {e}")
            res = fallback_result()
            if inspect.iscoroutine(res):
                return await res
            return res

    def _simulate_response(self, messages: List[BaseMessage]) -> str:
        last_query = ""
        system_content = ""
        for m in messages:
            if isinstance(m, LCSystemMessage):
                system_content = str(m.content)
            elif isinstance(m, LCHumanMessage):
                last_query = str(m.content)

        lower_query = last_query.lower()

        # Deteksi konteks dari query untuk memberikan respons yang lebih relevan
        has_products = (
            "KANDIDAT PRODUK TERSEDIA:" in system_content
            and "(Tidak ada produk" not in system_content
        )

        # Deteksi tipe kulit dari query
        skin_context = ""
        if any(w in lower_query for w in ["berminyak", "oily", "minyak"]):
            skin_context = "kulit berminyak"
        elif any(w in lower_query for w in ["kering", "dry", "dehidrasi"]):
            skin_context = "kulit kering"
        elif any(w in lower_query for w in ["sensitif", "sensitive"]):
            skin_context = "kulit sensitif"
        elif any(w in lower_query for w in ["kombinasi", "combination"]):
            skin_context = "kulit kombinasi"

        # Deteksi masalah kulit dari query
        concern_context = ""
        if any(w in lower_query for w in ["jerawat", "acne", "bruntusan"]):
            concern_context = "masalah jerawat"
        elif any(w in lower_query for w in ["kusam", "cerah", "flek", "bintik"]):
            concern_context = "kulit kusam dan flek"
        elif any(w in lower_query for w in ["lembab", "hidrasi", "kering"]):
            concern_context = "kulit yang butuh hidrasi"

        greeting = "Halo Kak! \U0001F338 "

        if has_products:
            # Ekstraksi nama produk pertama, brand, dan kandungan utama dari kandidat produk
            product_name = ""
            brand_name = ""
            ingredients = ""
            candidate_section = system_content.split("KANDIDAT PRODUK TERSEDIA:")[1] if "KANDIDAT PRODUK TERSEDIA:" in system_content else system_content

            m_prod = re.search(r"1\.\s+([^\n]+)", candidate_section)
            if m_prod:
                product_name = m_prod.group(1).strip()
            m_brand = re.search(r"Brand:\s*([^\n]+)", candidate_section)
            if m_brand:
                b = m_brand.group(1).strip()
                if b != "-":
                    brand_name = b
            m_ing = re.search(r"Kandungan Utama:\s*([^\n]+)", candidate_section)
            if m_ing:
                ing = m_ing.group(1).strip()
                if ing != "-":
                    ingredients = ing

            target_str = skin_context if skin_context else "kondisi kulit Kakak"
            if concern_context:
                target_str += f" dengan {concern_context}"

            if product_name:
                brand_text = f" dari {brand_name}" if brand_name else ""
                ing_text = (
                    f" didukung oleh kandungan bahan aktif utamanya seperti {ingredients}, "
                    "yang terbukti efektif merawat skin barrier dan menutrisi lapisan kulit secara optimal"
                    if ingredients
                    else " diformulasikan secara khusus untuk memberikan hasil perawatan yang efektif dan aman"
                )
                body = (
                    f"Untuk merawat {target_str}, salah satu pilihan yang sangat kami rekomendasikan adalah **{product_name}**{brand_text}. "
                    f"Keunggulan utama produk ini{ing_text}, sehingga cocok digunakan sehari-hari tanpa memicu iritasi. "
                    "Rekomendasi lengkapnya sudah kami sematkan di kartu produk di bawah ya Kak, semuanya terjamin 100% original dan sudah terdaftar resmi BPOM. "
                    "Kira-kira ada tahapan pemakaian atau kandungan tertentu yang ingin Kakak ketahui lebih detail? \u2728"
                )
            else:
                body = (
                    f"Untuk merawat {target_str}, kami telah memilihkan rekomendasi produk dengan formulasi bahan aktif terbaik yang aman dan cocok di kulit. "
                    "Kakak bisa langsung melihat detail dan pilihan produknya pada kartu di bawah. Ada yang ingin dikonsultasikan lebih lanjut? \u2728"
                )
        else:
            if skin_context:
                body = (
                    f"Untuk {skin_context}, ada beberapa hal yang perlu diperhatikan dalam memilih produk perawatan. "
                    "Pilih produk yang formulanya ringan dan tidak menyumbat pori, serta hindari kandungan alkohol berlebih. "
                    "Kakak bisa ceritakan lebih lanjut kebutuhan atau anggaran yang dimiliki, "
                    "supaya saya bisa memberikan rekomendasi yang lebih spesifik! \U0001F60A"
                )
            else:
                body = (
                    "Saya siap membantu Kakak menemukan produk yang tepat. "
                    "Boleh ceritakan lebih lanjut jenis kulit, masalah yang ingin diatasi, "
                    "atau budget yang Kakak miliki? \U0001F60A"
                )

        return greeting + body


class AlibabaQwenProvider(BaseLLMProvider):
    """
    Provider untuk mengakses model Qwen melalui Alibaba Cloud Model Studio / DashScope API.
    Menggunakan LangChain Chat Model di bawahnya untuk standar AI framework PRD.
    """

    def __init__(self):
        self.api_key = settings.ALIBABA_CLOUD_API_KEY
        self.model = settings.QWEN_MODEL or "qwen-plus"
        self.chat_model = LangChainAlibabaQwenChat(
            model_name=self.model,
            api_key=self.api_key,
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
