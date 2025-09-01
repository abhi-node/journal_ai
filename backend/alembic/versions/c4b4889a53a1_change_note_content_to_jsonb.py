"""change_note_content_to_jsonb

Revision ID: c4b4889a53a1
Revises: 3e8512c99a87
Create Date: 2025-09-01 14:08:08.124743

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.sql import table, column
from datetime import datetime
import json

# revision identifiers, used by Alembic.
revision: str = 'c4b4889a53a1'
down_revision: Union[str, None] = '3e8512c99a87'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # First, add a temporary JSONB column
    op.add_column('notes', sa.Column('content_json', postgresql.JSONB(), nullable=True))
    
    # Migrate existing data from TEXT to JSONB format
    connection = op.get_bind()
    
    # Get all existing notes
    result = connection.execute(sa.text("SELECT id, content, created_at FROM notes WHERE content IS NOT NULL"))
    notes = result.fetchall()
    
    # Convert each note's content to the new JSONB format
    for note_id, content, created_at in notes:
        if content:
            # Create the new JSON structure
            # For existing notes, we'll create a single entry with the creation timestamp
            json_content = {
                "entries": [
                    {
                        "timestamp": created_at.isoformat() if created_at else datetime.utcnow().isoformat(),
                        "content": content
                    }
                ]
            }
            
            # Update the new column
            connection.execute(
                sa.text("UPDATE notes SET content_json = :json_content::jsonb WHERE id = :note_id"),
                {"json_content": json.dumps(json_content), "note_id": note_id}
            )
    
    # Drop the old content column
    op.drop_column('notes', 'content')
    
    # Rename content_json to content
    op.alter_column('notes', 'content_json', new_column_name='content')
    
    # Make the column non-nullable with a default empty JSON
    op.alter_column('notes', 'content',
                    nullable=False,
                    existing_type=postgresql.JSONB(),
                    server_default='{"entries": []}')


def downgrade() -> None:
    # Add temporary TEXT column
    op.add_column('notes', sa.Column('content_text', sa.TEXT(), nullable=True))
    
    # Convert JSONB back to TEXT
    connection = op.get_bind()
    result = connection.execute(sa.text("SELECT id, content FROM notes WHERE content IS NOT NULL"))
    notes = result.fetchall()
    
    for note_id, json_content in notes:
        if json_content and 'entries' in json_content:
            # Concatenate all entries back into a single text
            text_parts = []
            for entry in json_content['entries']:
                if 'content' in entry:
                    text_parts.append(entry['content'])
            
            combined_text = '\n\n'.join(text_parts)
            
            connection.execute(
                sa.text("UPDATE notes SET content_text = :text_content WHERE id = :note_id"),
                {"text_content": combined_text, "note_id": note_id}
            )
    
    # Drop the JSONB column
    op.drop_column('notes', 'content')
    
    # Rename content_text to content
    op.alter_column('notes', 'content_text', new_column_name='content')
    
    # Make it non-nullable
    op.alter_column('notes', 'content',
                    nullable=False,
                    existing_type=sa.TEXT(),
                    server_default='')