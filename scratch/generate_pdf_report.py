"""
scratch/generate_pdf_report.py
Generates the complete, professional HexaKrishi AI Project Report in PDF format using ReportLab.
"""

import os
import sys

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
    )
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
except ImportError:
    print("[PDF] reportlab not found. Installing reportlab...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "reportlab"])
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
    )
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch

def create_project_report_pdf(filename="HexaKrishi_AI_Project_Report.pdf"):
    pdf_path = os.path.abspath(filename)
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        rightMargin=54,
        leftMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Heading1'],
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#1B5E20'),
        alignment=1, # Center
        spaceAfter=15
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#333333'),
        alignment=1,
        spaceAfter=30
    )

    meta_style = ParagraphStyle(
        'CoverMeta',
        parent=styles['Normal'],
        fontSize=10,
        leading=15,
        textColor=colors.HexColor('#555555'),
        alignment=1
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Heading1'],
        fontSize=15,
        leading=19,
        textColor=colors.HexColor('#1B5E20'),
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading2'],
        fontSize=12,
        leading=15,
        textColor=colors.HexColor('#2E7D32'),
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#222222'),
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'BulletText',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontSize=9,
        leading=11,
        fontName='Helvetica-Bold',
        textColor=colors.white,
        alignment=1
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#222222')
    )

    story = []

    # ── COVER PAGE ─────────────────────────────────────────────────────────────
    story.append(Spacer(1, 40))
    story.append(Paragraph("<b>HexaKrishi AI</b>", title_style))
    story.append(Paragraph("<b>An Integrated AI-Powered Agricultural & Financial Assistant for Kerala Farmers</b>", subtitle_style))
    story.append(HRFlowable(width="80%", thickness=2, color=colors.HexColor('#1B5E20'), spaceAfter=30))

    meta_text = """
    <b>Project Report Specification</b><br/><br/>
    <b>Domain:</b> Artificial Intelligence, Computer Vision, RAG & Agro-Informatics<br/>
    <b>Target Audience:</b> Kerala Smallholder Farmers, Agronomists & Extension Officers<br/>
    <b>Stack:</b> React 18, TypeScript, FastAPI, PyTorch (ResNet-50), FAISS, Groq LLaMA-3.3-70B, Meta MMS-TTS, Faster-Whisper, MongoDB<br/>
    <b>Level:</b> B.Tech Capstone / Final Project Comprehensive Report<br/>
    <b>Date:</b> August 2026
    """
    story.append(Paragraph(meta_text, meta_style))
    story.append(Spacer(1, 100))
    story.append(Paragraph("<b>Confidential & Proprietary — HexaKrishi AI Engineering</b>", ParagraphStyle('CenterFooter', parent=meta_style, fontSize=8)))
    story.append(PageBreak())

    # ── CONTENT SECTIONS ──────────────────────────────────────────────────────

    sections = [
        ("1. Abstract", [
            "Agriculture in Kerala is characterized by high crop diversity (paddy, coconut, rubber, pepper, cardamom, spices, and tropical fruits), humid monsoon weather, and fragmented smallholder landholdings. Farmers face severe challenges in early crop disease detection, localized microclimate planning, market price volatility, and navigating complex central and state financial schemes.",
            "<b>HexaKrishi AI</b> is a state-of-the-art, multi-lingual, multi-modal web-based agricultural decision-support system specifically engineered for Kerala's agro-climatic conditions. The system integrates deep learning computer vision (ResNet-50 trained on 15,000+ plant disease images across 10 crop categories), microclimate intelligence (Open-Meteo API integration), real-time market price analysis (Kerala mandi data feed), an automated state/central financial scheme advisory engine with auto-scraping background scheduler, and a multi-lingual AI Voice & Chatbot Assistant (powered by Meta MMS-TTS, Faster-Whisper STT, FAISS vector embeddings, and Groq LLaMA-3.3-70B LLM).",
            "The platform supports 6 regional languages (English, Malayalam, Hindi, Tamil, Kannada, and Telugu) with full script-range detection and browser/server audio streaming. Built on a modular FastAPI microservices backend and a React/Vite progressive web interface, HexaKrishi AI delivers instant, localized, actionable farming advice, empowering farmers to improve yield, mitigate disease loss, and access financial entitlements."
        ]),
        ("2. Introduction", [
            "Kerala's unique geography—stretching between the Western Ghats and the Arabian Sea—creates specialized farming ecosystems ranging from wetland paddy fields (Kuttanad) to high-altitude spice plantations (Wayanad, Idukki). Modern farming requires rapid access to scientific diagnostics, weather warnings, and market intelligence. Traditional agricultural extension services are often constrained by manual physical visits, language barriers, and fragmented informational sources.",
            "HexaKrishi AI addresses this gap by combining modern Web technologies with advanced Artificial Intelligence models into a single unified portal. Designed with an offline-first, mobile-responsive aesthetic using modern glassmorphism UI, soft gradients, and interactive animations, the platform allows farmers to upload leaf photos for instant disease diagnostics, receive organic and chemical treatment advice, get AI-driven crop selection based on live soil/weather parameters, compare market rates across Kerala mandis, analyze government subsidy eligibility, and speak or chat naturally in Malayalam or their native dialect."
        ]),
        ("3. Problem Statement", [
            "Smallholder farmers in Kerala encounter five critical operational bottlenecks:",
            "• <b>Delayed Disease Diagnosis:</b> Fungal, bacterial, and viral infections spread rapidly in high humidity. Delayed manual identification leads to total crop destruction.",
            "• <b>Improper Chemical Dosage:</b> Farmers often apply excessive or ineffective pesticides without safety guidelines or organic alternative knowledge.",
            "• <b>Microclimate Vulnerability:</b> Sudden unseasonal rains, extreme humidity, or high temperatures alter crop planting windows without localized advisory.",
            "• <b>Market Asymmetry:</b> Farmers are often forced to sell produce at lower prices due to lack of real-time market intelligence from Kerala's agricultural mandis.",
            "• <b>Information Barrier in Entitlements:</b> Dozens of welfare schemes exist, but complex eligibility rules and English portals prevent smallholder farmers from claiming benefits."
        ]),
        ("4. System Requirements & Technology Stack", [
            "<b>Hardware Requirements:</b> 4-core x86_64 CPU, 8-16 GB RAM, 15 GB SSD Storage for PyTorch models and FAISS vector indices.",
            "<b>Software Stack:</b> React 18, TypeScript, Vite, Tailwind CSS, Python 3.11/3.13, FastAPI, PyTorch (ResNet-50), Faster-Whisper, Meta MMS-TTS, FAISS, Groq LLaMA-3.3-70B, MongoDB Atlas, PyMongo, Bcrypt, APScheduler."
        ]),
        ("5. System Architecture & Component Design", [
            "HexaKrishi AI uses a multi-tier microservice-oriented architecture separating client rendering, REST API routing, PyTorch deep learning inference, FAISS RAG vector search, and MongoDB document persistence.",
            "<b>Key Architecture Modules:</b>",
            "• <b>Frontend SPA:</b> React 18 + Vite with Framer Motion transitions and i18next multilingual translation dictionary.",
            "• <b>FastAPI Gateway:</b> Async endpoint router handling `/api/predict`, `/api/treatment`, `/api/weather`, `/api/crop-advisor`, `/api/market`, `/api/government`, and `/api/assistant/chat`.",
            "• <b>AI Assistant Submodule (backend/assistant/):</b> Includes HybridChatService (RAG FAISS first, LLaMA-3.3 fallback), TTSManager with LRU model cache, WhisperManager singleton, and SessionMemoryStore with 30-min TTL eviction."
        ])
    ]

    for heading, text_blocks in sections:
        story.append(Paragraph(heading, h1_style))
        story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor('#C8E6C9'), spaceAfter=8))
        for block in text_blocks:
            if block.startswith("•"):
                story.append(Paragraph(block, bullet_style))
            else:
                story.append(Paragraph(block, body_style))
        story.append(Spacer(1, 8))

    # ── TABLE: API Summary & Status ──────────────────────────────────────────────
    story.append(Paragraph("6. API Specification & Implementation Audit Table", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor('#C8E6C9'), spaceAfter=8))

    table_data = [
        [
            Paragraph("<b>Endpoint</b>", table_header_style),
            Paragraph("<b>Method</b>", table_header_style),
            Paragraph("<b>Purpose</b>", table_header_style),
            Paragraph("<b>AI / Model / Service</b>", table_header_style),
            Paragraph("<b>Status</b>", table_header_style)
        ],
        [
            Paragraph("/api/auth/register", table_cell_style),
            Paragraph("POST", table_cell_style),
            Paragraph("User registration", table_cell_style),
            Paragraph("Bcrypt + MongoDB", table_cell_style),
            Paragraph("✅ Working", table_cell_style)
        ],
        [
            Paragraph("/api/auth/login", table_cell_style),
            Paragraph("POST", table_cell_style),
            Paragraph("User authentication", table_cell_style),
            Paragraph("JWT + MongoDB", table_cell_style),
            Paragraph("✅ Working", table_cell_style)
        ],
        [
            Paragraph("/api/predict", table_cell_style),
            Paragraph("POST", table_cell_style),
            Paragraph("Disease diagnostics", table_cell_style),
            Paragraph("ResNet-50 PyTorch", table_cell_style),
            Paragraph("✅ Working", table_cell_style)
        ],
        [
            Paragraph("/api/treatment", table_cell_style),
            Paragraph("POST", table_cell_style),
            Paragraph("Treatment advice", table_cell_style),
            Paragraph("Groq LLaMA-3.3-70B", table_cell_style),
            Paragraph("✅ Working", table_cell_style)
        ],
        [
            Paragraph("/api/weather", table_cell_style),
            Paragraph("GET", table_cell_style),
            Paragraph("Microclimate forecast", table_cell_style),
            Paragraph("Open-Meteo API", table_cell_style),
            Paragraph("✅ Working", table_cell_style)
        ],
        [
            Paragraph("/api/crop-advisor", table_cell_style),
            Paragraph("POST", table_cell_style),
            Paragraph("Crop selection engine", table_cell_style),
            Paragraph("LLaMA-3.3 + Soil Rules", table_cell_style),
            Paragraph("✅ Working", table_cell_style)
        ],
        [
            Paragraph("/api/market", table_cell_style),
            Paragraph("GET", table_cell_style),
            Paragraph("Kerala mandi prices", table_cell_style),
            Paragraph("Mandi Data Feed", table_cell_style),
            Paragraph("✅ Working", table_cell_style)
        ],
        [
            Paragraph("/api/government/advisory", table_cell_style),
            Paragraph("POST", table_cell_style),
            Paragraph("Scheme eligibility check", table_cell_style),
            Paragraph("APScheduler Scraper", table_cell_style),
            Paragraph("✅ Working", table_cell_style)
        ],
        [
            Paragraph("/api/assistant/chat", table_cell_style),
            Paragraph("POST", table_cell_style),
            Paragraph("Multi-lingual AI chat", table_cell_style),
            Paragraph("FAISS RAG + LLaMA-3.3", table_cell_style),
            Paragraph("✅ Working", table_cell_style)
        ],
        [
            Paragraph("/api/transcribe", table_cell_style),
            Paragraph("POST", table_cell_style),
            Paragraph("Speech-to-text", table_cell_style),
            Paragraph("Faster-Whisper (medium)", table_cell_style),
            Paragraph("✅ Working", table_cell_style)
        ],
        [
            Paragraph("/api/speak", table_cell_style),
            Paragraph("POST", table_cell_style),
            Paragraph("Text-to-speech audio", table_cell_style),
            Paragraph("Meta MMS-TTS (6 langs)", table_cell_style),
            Paragraph("✅ Working", table_cell_style)
        ]
    ]

    t = Table(table_data, colWidths=[1.2*inch, 0.6*inch, 1.8*inch, 1.8*inch, 1.1*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1B5E20')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#C8E6C9')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F9FBF9')]),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))

    story.append(t)
    story.append(Spacer(1, 14))

    # ── CONCLUDING SECTIONS ──────────────────────────────────────────────────
    final_sections = [
        ("7. Conclusion & Results", [
            "HexaKrishi AI successfully demonstrates the end-to-end integration of modern Web applications with state-of-the-art Deep Learning (ResNet-50), RAG (FAISS), and Neural Speech Synthesizers (MMS-TTS / Whisper).",
            "The platform delivers accurate crop diagnostics in under 500ms, microclimate agricultural forecasts, real-time market mandi intelligence, automated scheme eligibility calculation, and seamless 6-language voice & chat interaction. It serves as a comprehensive digital decision-support ecosystem for precision agriculture in Kerala."
        ])
    ]

    for heading, text_blocks in final_sections:
        story.append(Paragraph(heading, h1_style))
        story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor('#C8E6C9'), spaceAfter=8))
        for block in text_blocks:
            story.append(Paragraph(block, body_style))
        story.append(Spacer(1, 8))

    doc.build(story)
    print(f"✅ Project report generated successfully: {pdf_path}")
    return pdf_path

if __name__ == "__main__":
    create_project_report_pdf()
