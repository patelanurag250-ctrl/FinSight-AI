import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List

app = FastAPI(
    title="FinSight AI Backend Service",
    description="Production-grade AI-powered personal finance and spending analytics API",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "FinSight AI FastAPI",
        "environment": os.getenv("ENVIRONMENT", "production")
    }

@app.get("/api/info")
def service_info():
    return {
        "name": "FinSight AI",
        "version": "1.0.0",
        "ml_models": ["TF-IDF Categorizer", "OLS Trend Forecaster", "Isolation/Z-Score Anomaly Engine"],
        "generative_ai": "Google Gemini 2.5 Flash"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
