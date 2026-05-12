from datetime import datetime
from sqlalchemy import Integer, String, Float, Boolean, DateTime, Text
from sqlalchemy.orm import mapped_column, Mapped
from database import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id:            Mapped[int]      = mapped_column(Integer, primary_key=True, index=True)
    campaign_name: Mapped[str]      = mapped_column(String(120))
    goal_usd:      Mapped[float]    = mapped_column(Float)
    duration_days: Mapped[int]      = mapped_column(Integer)
    main_category: Mapped[str]      = mapped_column(String(50))
    category:      Mapped[str]      = mapped_column(String(50))
    country:       Mapped[str]      = mapped_column(String(5))
    probability:   Mapped[float]    = mapped_column(Float)
    prediction:    Mapped[str]      = mapped_column(String(20))
    model_version: Mapped[str]      = mapped_column(String(10), default="v1")
    via_llm:       Mapped[bool]     = mapped_column(Boolean, default=False)
    filename:      Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at:    Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
