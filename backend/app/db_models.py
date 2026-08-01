import datetime
from typing import List, Dict, Any, Optional

from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from .database import Base

class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(String(50), unique=True, index=True, nullable=False)
    sha256_hash = Column(String(64), nullable=False)
    submitted_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)
    submitted_by = Column(String(255), nullable=False)
    raw_text = Column(Text, nullable=False)
    entity_counts = Column(JSONB, default=dict)
    status = Column(String(50), default="PROCESSED")
    
    # Placeholders for future phases
    user_id = Column(Integer, nullable=True)
    crime_category = Column(String(100), nullable=True)

    entities = relationship("Entity", back_populates="case", cascade="all, delete-orphan")
    timeline_events = relationship("TimelineEvent", back_populates="case", cascade="all, delete-orphan")


class Entity(Base):
    __tablename__ = "entities"

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    
    entity_type = Column(String(100), nullable=False)
    value = Column(String(255), nullable=False)
    confidence = Column(Float, nullable=False)
    start_idx = Column(Integer, nullable=False)
    end_idx = Column(Integer, nullable=False)

    case = relationship("Case", back_populates="entities")


class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    
    timestamp = Column(String(100), nullable=False)
    action_context = Column(Text, nullable=False)
    entities_referenced = Column(JSONB, default=list)
    is_uncertain = Column(Boolean, default=False)
    uncertainty_reason = Column(Text, default="")

    case = relationship("Case", back_populates="timeline_events")
