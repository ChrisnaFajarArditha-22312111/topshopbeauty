"""
base.py — Abstract Base Class untuk LLM Provider
Memastikan kemudahan swap antara Alibaba Cloud Qwen dan Local Qwen
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional


class BaseLLMProvider(ABC):
    """
    Interface abstrak untuk provider LLM.
    Semua implementasi (Alibaba Cloud Qwen API, Local Qwen) wajib mengimplementasikan method ini.
    """

    @abstractmethod
    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1500,
    ) -> str:
        """
        Menghasilkan balasan teks dari model LLM.

        Args:
            messages: List pesan sebelumnya [{"role": "user"|"assistant", "content": "..."}]
            system_prompt: Petunjuk dan aturan persona AI
            temperature: Derajat kreativitas model (0.0 - 1.0)
            max_tokens: Batas panjang token output

        Returns:
            String teks respons yang dihasilkan model
        """
        pass
