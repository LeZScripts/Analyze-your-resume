
from sqlalchemy import Column, Integer, Text, Float
from database import Base


class MatchResult(Base):
    __tablename__ = "match_results"

    id = Column(Integer, primary_key=True, index=True)
    resume_text = Column(Text, nullable=False)
    job_description = Column(Text, nullable=False)
    match_score = Column(Float, nullable=False)
    matched_skills = Column(Text, nullable=False)
    missing_skills = Column(Text, nullable=False)
