from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel, Field
from matcher import match_resume
from fastapi import FastAPI, UploadFile, File, HTTPException
from pypdf import PdfReader
from io import BytesIO

from contextlib import asynccontextmanager
from database import Base, engine, SessionLocal
from models import MatchResult

import json

from contextlib import asynccontextmanager
from sqlalchemy.orm import Session
from database import Base, engine, SessionLocal
from models import MatchResult
Base.metadata.create_all(bind=engine)

import traceback

app = FastAPI(
    title="AI Resume Intelligence & Job Matching System",
    version="1.0.0",
    description="Resume parsing and job matching API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "AI Resume Matcher API is running"
    }


@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF resume."
        )

    try:
        content = await file.read()

        if not content:
            raise HTTPException(
                status_code=400,
                detail="The uploaded file is empty."
            )

        reader = PdfReader(BytesIO(content))

        if reader.is_encrypted:
            raise HTTPException(
                status_code=400,
                detail="Password-protected PDFs are not supported."
            )

        text = "\n".join(
            page.extract_text() or "" for page in reader.pages
        ).strip()

        if not text:
            raise HTTPException(
                status_code=400,
                detail="No extractable text found in this PDF."
            )

        return {
            "filename": file.filename,
            "pages": len(reader.pages),
            "extracted_text": text
        }

    except HTTPException:
        raise
    except Exception:
        traceback.print_exc()
        raise
        
    finally:
        await file.close()


class MatchRequest(BaseModel):
    resume_text: str = Field(min_length=1)
    job_description: str = Field(min_length=1)




@app.post("/match-resume")
def match_resume_endpoint(request: MatchRequest):
    db: Session = SessionLocal()

    try:
        result = match_resume(
            request.resume_text,
            request.job_description
        )

        record = MatchResult(
            resume_text=request.resume_text,
            job_description=request.job_description,
            match_score=result["match_score"],
            matched_skills=json.dumps(result["matched_skills"]),
            missing_skills=json.dumps(result["missing_skills"])
        )

        db.add(record)
        db.commit()
        db.refresh(record)

        return {
            "id": record.id,
            **result
        }

    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

    except Exception as error:
        db.rollback()
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Matching failed: {str(error)}"
        )

    finally:
        db.close()
