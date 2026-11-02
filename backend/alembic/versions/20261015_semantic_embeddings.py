"""Tambahkan embedding semantik 1024 dimensi tanpa mengubah kolom legacy.

Revision ID: 20261015_semantic
Revises: None
"""
from alembic import op
revision = "20261015_semantic"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS semantic_embedding vector(1024)")
    op.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS embedding_source varchar(100)")
    op.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS embedding_content_hash varchar(64)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_products_semantic_embedding ON products USING hnsw (semantic_embedding vector_cosine_ops)")

    # Embedding tidak boleh tetap dianggap mutakhir setelah isi katalog berubah.
    op.execute("""CREATE OR REPLACE FUNCTION invalidate_product_semantic_embedding() RETURNS trigger AS $$
    BEGIN
        NEW.semantic_embedding := NULL;
        NEW.embedding_source := NULL;
        NEW.embedding_content_hash := NULL;
        RETURN NEW;
    END; $$ LANGUAGE plpgsql""")
    op.execute("DROP TRIGGER IF EXISTS product_semantic_content_changed ON products")
    op.execute("""CREATE TRIGGER product_semantic_content_changed BEFORE UPDATE OF
        nama_produk, search_document, brand_id, category_id, sub_category_id, harga,
        rating, terjual, texture, usage_time ON products FOR EACH ROW
        EXECUTE FUNCTION invalidate_product_semantic_embedding()""")
    op.execute("""CREATE OR REPLACE FUNCTION invalidate_related_product_embedding() RETURNS trigger AS $$
    BEGIN
        IF TG_OP IN ('DELETE', 'UPDATE') THEN
            UPDATE products SET semantic_embedding = NULL, embedding_source = NULL, embedding_content_hash = NULL
            WHERE id = OLD.product_id;
        END IF;
        IF TG_OP IN ('INSERT', 'UPDATE') THEN
            UPDATE products SET semantic_embedding = NULL, embedding_source = NULL, embedding_content_hash = NULL
            WHERE id = NEW.product_id;
        END IF;
        RETURN NULL;
    END; $$ LANGUAGE plpgsql""")
    for table in ("product_ingredients", "product_skin_types", "product_skin_concerns"):
        op.execute(f"DROP TRIGGER IF EXISTS related_embedding_changed ON {table}")
        op.execute(f"CREATE TRIGGER related_embedding_changed AFTER INSERT OR UPDATE OR DELETE ON {table} FOR EACH ROW EXECUTE FUNCTION invalidate_related_product_embedding()")


def downgrade():
    # Pertahankan data embedding saat rollback aplikasi; tidak ada penghapusan otomatis.
    pass
