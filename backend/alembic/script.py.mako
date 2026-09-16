"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
${imports if imports else ""}

# Identifier revisi ini
revision: str = ${repr(up_revision)}
# Identifier revisi sebelumnya (parent)
down_revision: Union[str, None] = ${repr(down_revision)}
# Branch labels (opsional)
branch_labels: Union[str, Sequence[str], None] = ${repr(branch_labels)}
# Dependensi revisi (opsional)
depends_on: Union[str, Sequence[str], None] = ${repr(depends_on)}


def upgrade() -> None:
    """Terapkan perubahan schema database (naik versi)."""
    ${upgrades if upgrades else "pass"}


def downgrade() -> None:
    """Kembalikan perubahan schema database (turun versi)."""
    ${downgrades if downgrades else "pass"}
