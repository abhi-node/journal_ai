# Import all the models, so that Base has them before being
# imported by Alembic
from app.db.base_class import Base  # noqa
from app.models.user import User  # noqa
from app.models.note import Note  # noqa
from app.models.review import Review  # noqa
from app.models.refresh_token import RefreshToken  # noqa