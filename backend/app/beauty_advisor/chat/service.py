"""
service.py — Orkestrator Utama AI Beauty Advisor berbasis LangChain
Menghubungkan:
Input Guard -> Query Analyzer -> LangChain Document Retriever -> Recommendation Engine -> LangChain LCEL Chain (Prompt + Qwen + Output Parser) -> Output Guard -> Persistence
"""
import uuid
from typing import List, Optional, Tuple
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from langchain_core.messages import (
    BaseMessage,
    AIMessage as LCAIMessage,
    HumanMessage as LCHumanMessage,
    SystemMessage as LCSystemMessage,
)
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

import app.core.all_models  # noqa: F401
from app.beauty_advisor.models import AIConversation, AIMessage
from app.beauty_advisor.guardrails.input_guard import check_input_guard
from app.beauty_advisor.guardrails.output_guard import check_output_guard
from app.beauty_advisor.recommendation.analyzer import analyze_user_query
from app.beauty_advisor.recommendation.engine import RecommendationEngine
from app.beauty_advisor.prompts.system_prompt import BEAUTY_ADVISOR_BASE_PROMPT
from app.beauty_advisor.llm import get_llm_provider
from app.beauty_advisor.chat.schemas import (
    ChatMessageRequest,
    ChatResponse,
    RecommendedProductItem,
    ConversationDetailResponse,
    ConversationSummaryResponse,
    MessageHistoryItem,
)
from app.products.models import Product

recommendation_engine = RecommendationEngine()


def generate_suggested_followups(analysis, candidates: list = None) -> List[str]:
    """
    Menghasilkan saran pertanyaan lanjutan yang kontekstual dan alami
    berdasarkan apa yang baru saja dibahas user.
    """
    followups = []
    category = analysis.product_category
    skin_type = analysis.skin_type
    concerns = analysis.skin_concerns  # list of concern strings

    # === BLOK A: Berdasarkan KATEGORI PRODUK yang baru dibahas ===
    if category == "Sunscreen":
        if skin_type:
            followups.append(f"Berapa SPF yang direkomendasikan untuk kulit {skin_type.lower()} sehari-hari?")
        else:
            followups.append("Sunscreen PA+++ vs SPF 50 — apa bedanya dan mana yang lebih baik?")
        followups.append("Apakah sunscreen harus dipakai ulang setiap 2 jam meski di dalam ruangan?")

    elif category == "Serum":
        if concerns:
            concern_label = concerns[0].lower()
            followups.append(f"Kandungan aktif apa yang paling efektif mengatasi {concern_label}?")
        else:
            followups.append("Serum Vitamin C atau Niacinamide — mana yang lebih cocok untuk pemula?")
        followups.append("Boleh tidak pakai lebih dari satu serum dalam satu rutinitas?")

    elif category == "Moisturizer":
        if skin_type == "Oily":
            followups.append("Kulit berminyak tetap perlu pelembab, mengapa?")
        elif skin_type == "Dry":
            followups.append("Apa bedanya moisturizer gel, lotion, dan cream untuk kulit kering?")
        else:
            followups.append("Bagaimana cara memilih tekstur moisturizer yang tepat sesuai cuaca tropis?")
        followups.append("Apakah moisturizer perlu diganti antara pagi dan malam hari?")

    elif category == "Cleanser":
        followups.append("Double cleansing itu wajib atau opsional? Kapan sebaiknya dilakukan?")
        if skin_type:
            followups.append(f"Sabun wajah dengan kandungan apa yang aman untuk kulit {skin_type.lower()}?")
        else:
            followups.append("Micellar water vs facial wash — mana yang lebih bersih membersihkan wajah?")

    elif category in ("Lip", "Make Up"):
        followups.append("Bagaimana cara merawat bibir agar tidak kering dan tetap lembab seharian?")
        followups.append("Skincare apa yang perlu dipakai sebelum makeup agar lebih tahan lama?")

    elif category == "Mask":
        followups.append("Seberapa sering sebaiknya memakai masker wajah dalam seminggu?")
        followups.append("Sheet mask vs clay mask — kapan waktu terbaik masing-masing dipakai?")

    elif category in ("Body Care",):
        followups.append("Kapan waktu terbaik memakai body lotion agar penyerapannya maksimal?")
        followups.append("Apakah body lotion yang mengandung SPF cukup dipakai sebagai sunscreen tubuh?")

    elif category == "Toner":
        followups.append("Toner hydrating vs toner exfoliating — apa bedanya dan kapan dipakai?")
        followups.append("Bolehkah toner dipakai pagi dan malam sekaligus?")

    elif category in ("Skincare", None):
        # Tidak ada kategori spesifik — pakai concern atau skin type
        if concerns:
            concern_label = concerns[0].lower()
            followups.append(f"Urutan skincare yang tepat untuk mengatasi {concern_label} seperti apa?")
        elif skin_type:
            followups.append(f"Apa rutinitas skincare pagi dan malam yang ideal untuk kulit {skin_type.lower()}?")
        else:
            followups.append("Bagaimana cara membangun rutinitas skincare dari nol untuk pemula?")

    # === BLOK B: Pertanyaan kedua berbasis SKIN CONCERN (jika belum ditambahkan) ===
    if len(followups) < 2:
        if len(concerns) >= 2:
            followups.append(f"Apakah aman mengatasi {concerns[0].lower()} dan {concerns[1].lower()} sekaligus?")
        elif concerns:
            followups.append(f"Berapa lama biasanya {concerns[0].lower()} mulai membaik dengan perawatan rutin?")
        elif skin_type:
            followups.append(f"Bahan aktif apa yang sebaiknya dihindari untuk kulit {skin_type.lower()}?")
        else:
            followups.append("Bahan aktif apa yang cocok untuk pemula yang baru mulai skincare?")

    # === BLOK C: Pertanyaan ketiga kontekstual — rotasi berbasis kombinasi context ===
    if len(followups) < 3:
        # Prioritas: ada concerns + skin type → safety question
        if concerns and skin_type:
            followups.append(f"Apakah produk yang direkomendasikan tadi aman untuk kulit {skin_type.lower()} yang {concerns[0].lower()}?")
        # Ada budget concern (max_price)
        elif analysis.max_price:
            followups.append("Apakah ada alternatif produk serupa dengan harga yang lebih terjangkau?")
        # Kandidat ada → tanya tentang ingredients
        elif candidates:
            followups.append("Kandungan bahan aktif apa yang paling penting untuk diperhatikan dari produk ini?")
        # General fallback yang bervariatif berdasarkan query length
        elif len(analysis.raw_query) > 50:
            followups.append("Ada produk lain yang bisa melengkapi rutinitas perawatan ini?")
        else:
            followups.append("Apakah ada perbedaan rutinitas skincare untuk pagi dan malam hari?")

    return followups[:3]



async def process_chat_message(
    db: AsyncSession,
    user_id: Optional[uuid.UUID],
    data: ChatMessageRequest,
) -> ChatResponse:
    """
    Memproses konsultasi pesan pengguna melalui alur lengkap AI Beauty Advisor
    menggunakan LangChain RAG & LCEL Chain Pipeline.
    """
    user_message = data.message.strip()

    # 1. INPUT GUARD — Validasi keamanan dan relevansi domain kosmetik
    guard_result = check_input_guard(user_message)
    if not guard_result.is_valid:
        conversation = await _get_or_create_conversation(db, user_id, data.conversation_id, user_message)

        u_msg = AIMessage(conversation_id=conversation.id, role="user", content=user_message)
        a_msg = AIMessage(conversation_id=conversation.id, role="assistant", content=guard_result.refusal_message)
        db.add_all([u_msg, a_msg])
        await db.commit()

        return ChatResponse(
            conversation_id=conversation.id,
            message_id=a_msg.id,
            reply=guard_result.refusal_message,
            recommended_products=[],
            suggested_followups=generate_suggested_followups(
                analyze_user_query(""), candidates=[]
            ),
        )

    # 2. QUERY ANALYZER — Ekstraksi entitas kecantikan terstruktur
    analysis = analyze_user_query(user_message)

    # 3. KLARIFIKASI — Jika query ambigu (tidak ada kategori produk), tanya dulu sebelum rekomendasikan
    if analysis.needs_clarification and analysis.clarification_question:
        conversation = await _get_or_create_conversation(db, user_id, data.conversation_id, user_message)
        u_msg = AIMessage(conversation_id=conversation.id, role="user", content=user_message)
        a_msg = AIMessage(conversation_id=conversation.id, role="assistant", content=analysis.clarification_question)
        db.add_all([u_msg, a_msg])
        await db.commit()

        return ChatResponse(
            conversation_id=conversation.id,
            message_id=a_msg.id,
            reply=analysis.clarification_question,
            recommended_products=[],
            suggested_followups=generate_suggested_followups(analysis, candidates=[]),
        )

    # 4. RECOMMENDATION ENGINE & RAG — Hanya dijalankan jika user meminta rekomendasi/info produk
    candidates: list = []
    formatted_candidates_text: str = "(Tidak ada produk yang dibutuhkan untuk pertanyaan ini)"
    if analysis.is_product_request:
        candidates, formatted_candidates_text = await recommendation_engine.get_recommended_candidates(
            db, analysis, top_k=4
        )


    # 4. CONVERSATION MANAGEMENT — Ambil atau buat sesi percakapan
    conversation = await _get_or_create_conversation(db, user_id, data.conversation_id, user_message)

    # Ambil riwayat percakapan untuk multi-turn memory
    hist_stmt = (
        select(AIMessage)
        .where(AIMessage.conversation_id == conversation.id)
        .order_by(desc(AIMessage.created_at))
        .limit(6)
    )
    hist_res = await db.execute(hist_stmt)
    recent_messages = list(reversed(hist_res.scalars().all()))

    # 5. LANGCHAIN LCEL PIPELINE (ChatPromptTemplate | ChatModel | StrOutputParser)
    langchain_history: List[BaseMessage] = []
    for m in recent_messages:
        if m.role == "assistant":
            langchain_history.append(LCAIMessage(content=m.content))
        else:
            langchain_history.append(LCHumanMessage(content=m.content))

    chat_prompt = ChatPromptTemplate.from_messages([
        ("system", BEAUTY_ADVISOR_BASE_PROMPT),
        MessagesPlaceholder(variable_name="history"),
        ("human", "{input}"),
    ])

    llm_provider = get_llm_provider()

    # Periksa apakah provider memiliki LangChain chat model
    if hasattr(llm_provider, "get_langchain_chat_model"):
        chat_model = llm_provider.get_langchain_chat_model()
        chain = chat_prompt | chat_model | StrOutputParser()
        raw_response = await chain.ainvoke({
            "candidate_products": formatted_candidates_text,
            "history": langchain_history,
            "input": user_message,
        })
    else:
        # Fallback kompatibilitas provider
        system_prompt = BEAUTY_ADVISOR_BASE_PROMPT.format(candidate_products=formatted_candidates_text).strip()
        messages_dict = [{"role": m.role, "content": m.content} for m in recent_messages]
        messages_dict.append({"role": "user", "content": user_message})
        raw_response = await llm_provider.generate_response(
            messages=messages_dict,
            system_prompt=system_prompt,
            temperature=0.6,
        )

    # 6. OUTPUT GUARD — Sanitasi dan penambahan disclaimer medis jika dibutuhkan
    final_reply = check_output_guard(raw_response, user_query=user_message)

    # 7. PERSISTENCE — Simpan pesan pengguna dan balasan asisten ke database
    candidate_ids = [str(p.id) for p in candidates]
    u_msg = AIMessage(conversation_id=conversation.id, role="user", content=user_message)
    a_msg = AIMessage(
        conversation_id=conversation.id,
        role="assistant",
        content=final_reply,
        recommended_product_ids=candidate_ids,
    )
    db.add_all([u_msg, a_msg])
    await db.commit()
    await db.refresh(a_msg)

    # Hanya sertakan kartu produk jika user memang meminta rekomendasi produk
    recommended_product_items = []
    if analysis.is_product_request:
        recommended_product_items = [
            RecommendedProductItem(
                id=p.id,
                nama_produk=p.nama_produk,
                brand=p.brand.name if p.brand else None,
                category=p.category.name if p.category else None,
                harga=float(p.harga),
                rating=float(p.rating),
                foto_utama=p.foto_utama,
                stok=p.stok,
            )
            for p in candidates
        ]

    followups = generate_suggested_followups(analysis, candidates=candidates)

    return ChatResponse(
        conversation_id=conversation.id,
        message_id=a_msg.id,
        reply=final_reply,
        recommended_products=recommended_product_items,
        suggested_followups=followups,
    )


async def _get_or_create_conversation(
    db: AsyncSession,
    user_id: Optional[uuid.UUID],
    conversation_id: Optional[uuid.UUID],
    first_message: str,
) -> AIConversation:
    """Mengambil percakapan aktif atau membuat percakapan baru dengan judul cerdas."""
    if conversation_id:
        stmt = select(AIConversation).where(AIConversation.id == conversation_id)
        res = await db.execute(stmt)
        conv = res.scalar_one_or_none()
        if conv:
            return conv

    title = first_message[:45] + ("..." if len(first_message) > 45 else "")
    conv = AIConversation(user_id=user_id, title=title)
    db.add(conv)
    await db.flush()
    return conv


async def get_user_conversations(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> List[ConversationSummaryResponse]:
    """Mengambil seluruh riwayat sesi percakapan milik user."""
    stmt = (
        select(AIConversation)
        .options(selectinload(AIConversation.messages))
        .where(AIConversation.user_id == user_id)
        .order_by(desc(AIConversation.created_at))
    )
    res = await db.execute(stmt)
    convs = res.scalars().all()

    result = []
    for c in convs:
        last_msg = c.messages[-1].content[:60] if c.messages else None
        result.append(
            ConversationSummaryResponse(
                id=c.id,
                title=c.title,
                last_message=last_msg,
                created_at=c.created_at,
            )
        )
    return result


async def get_conversation_detail(
    db: AsyncSession,
    user_id: uuid.UUID,
    conversation_id: uuid.UUID,
) -> ConversationDetailResponse:
    """Mengambil riwayat lengkap satu sesi percakapan."""
    stmt = (
        select(AIConversation)
        .options(selectinload(AIConversation.messages))
        .where(AIConversation.id == conversation_id, AIConversation.user_id == user_id)
    )
    res = await db.execute(stmt)
    conv = res.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Percakapan tidak ditemukan")

    return ConversationDetailResponse(
        id=conv.id,
        title=conv.title,
        created_at=conv.created_at,
        messages=[
            MessageHistoryItem(
                id=m.id,
                role=m.role,
                content=m.content,
                created_at=m.created_at,
            )
            for m in conv.messages
        ],
    )


async def delete_conversation(
    db: AsyncSession,
    user_id: uuid.UUID,
    conversation_id: uuid.UUID,
) -> None:
    """Menghapus satu sesi percakapan."""
    stmt = select(AIConversation).where(AIConversation.id == conversation_id, AIConversation.user_id == user_id)
    res = await db.execute(stmt)
    conv = res.scalar_one_or_none()
    if conv:
        await db.delete(conv)
        await db.commit()
