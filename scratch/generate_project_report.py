from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "AI_Powered_Farming_Assistant_Project_Report.pdf"

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="TitleCenter", parent=styles["Title"], alignment=TA_CENTER,
    fontSize=24, leading=30, textColor=colors.HexColor("#1B5E20"), spaceAfter=18,
))
styles.add(ParagraphStyle(
    name="SubTitle", parent=styles["Normal"], alignment=TA_CENTER,
    fontSize=12, leading=18, textColor=colors.HexColor("#455A64"), spaceAfter=10,
))
styles.add(ParagraphStyle(
    name="H1Green", parent=styles["Heading1"], fontSize=18, leading=23,
    textColor=colors.HexColor("#1B5E20"), spaceBefore=8, spaceAfter=10,
))
styles.add(ParagraphStyle(
    name="H2Green", parent=styles["Heading2"], fontSize=13, leading=17,
    textColor=colors.HexColor("#2E7D32"), spaceBefore=8, spaceAfter=6,
))
styles.add(ParagraphStyle(
    name="Body", parent=styles["BodyText"], fontSize=9.5, leading=14, spaceAfter=6,
))
styles.add(ParagraphStyle(
    name="BulletBody", parent=styles["BodyText"], fontSize=9.5, leading=13,
    leftIndent=13, firstLineIndent=-8, spaceAfter=3,
))
styles.add(ParagraphStyle(
    name="ReportCode", parent=styles["Code"], fontSize=7.8, leading=10,
    backColor=colors.HexColor("#F4F7F4"), borderColor=colors.HexColor("#D5E5D5"),
    borderWidth=0.5, borderPadding=6, spaceBefore=4, spaceAfter=8,
))


def p(text, style="Body"):
    return Paragraph(text, styles[style])


def bullets(items):
    return [p("- " + item, "BulletBody") for item in items]


def table(headers, rows, widths=None):
    body = [[p(f"<b>{value}</b>", "Body") for value in headers]]
    body += [[p(str(value), "Body") for value in row] for row in rows]
    result = Table(body, colWidths=widths, repeatRows=1, hAlign="LEFT")
    result.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1B5E20")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#C8D8C8")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7FBF7")]),
    ]))
    return result


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#C8D8C8"))
    canvas.line(1.7 * cm, 1.35 * cm, A4[0] - 1.7 * cm, 1.35 * cm)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#607D8B"))
    canvas.drawString(1.7 * cm, 0.9 * cm, "AI-Powered Farming Assistant for Kerala Farmers")
    canvas.drawRightString(A4[0] - 1.7 * cm, 0.9 * cm, f"Page {doc.page}")
    canvas.restoreState()


story = []
story += [Spacer(1, 4.0 * cm), p("AI-Powered Farming Assistant", "TitleCenter")]
story += [p("for Kerala Farmers", "TitleCenter")]
story += [Spacer(1, 0.5 * cm), p("Comprehensive Technical Project Report", "SubTitle")]
story += [p("Frontend, backend, AI services, data flow, deployment, testing, and RAG roadmap", "SubTitle")]
story += [Spacer(1, 6.2 * cm)]
story += [p("Prepared from the current repository implementation", "SubTitle")]
story += [p("Technology status documented as implemented, not only planned", "SubTitle"), PageBreak()]

story += [p("1. Executive summary", "H1Green")]
story += [p(
    "This project is a full-stack agricultural decision-support application focused on Kerala farmers. "
    "It provides disease detection from crop-leaf images, disease-treatment guidance, crop suitability recommendations, "
    "weather-based farming advice, market intelligence, and a conversational AI assistant. The user interface is a React single-page application; "
    "the service layer is a FastAPI application; model and AI integrations use PyTorch/Torchvision, Groq, WeatherAPI, and Kerala market data.")]
story += [p("The application is designed so each major page calls a backend API and renders its structured response. The frontend has loading, error, and result states for these requests.")]
story += [p("Key user outcomes", "H2Green")] + bullets([
    "Upload a leaf image and receive a disease class and confidence score for paddy, pepper, rubber, coconut, or banana.",
    "Receive chemical, organic, dosage, prevention, symptom, and precaution information for a detected disease.",
    "Choose a location, soil type, and irrigation method to receive ranked crop recommendations.",
    "Use coordinates to obtain current conditions and operational weather recommendations.",
    "Compare market price signals and selling guidance by crop and Kerala district.",
    "Ask farming questions through a Groq-powered conversational endpoint with recent-message context.",
])
story += [p("Important implementation note", "H2Green")]
story += [p(
    "The repository contains a knowledge_base folder with agricultural PDFs, but the files intended to implement retrieval-augmented generation (rag.py, vector_store.py, embeddings.py, prompts.py, and chatbot.py) are empty. "
    "Therefore, the currently running assistant is a Groq chat-completions assistant with conversation history, not a fully implemented RAG pipeline. "
    "Section 9 specifies the RAG architecture needed to make the assistant genuinely retrieval augmented.")]

story += [p("2. System architecture", "H1Green")]
story += [p("The application follows a browser-to-API architecture. The frontend owns display and interaction state, while the backend performs model inference, calls external services, and returns JSON contracts.")]
story += [p("Browser (React/Vite) -> Axios API client -> FastAPI routes -> ML models / Groq / WeatherAPI / Kerala market source -> JSON response -> React components", "ReportCode")]
story += [table(["Layer", "Responsibility", "Current technology"], [
    ["Presentation", "Pages, language switching, form controls, charts, animations, result cards", "React 19, TypeScript, Vite, React Router, i18next, Framer Motion, Recharts, Leaflet"],
    ["Client data", "HTTP requests, API error translation, loading/mutation state", "Axios, TanStack React Query"],
    ["API", "Validation, routing, CORS, service orchestration, JSON responses", "Python, FastAPI, Pydantic, Uvicorn"],
    ["Disease AI", "Image classification and confidence calculation", "PyTorch, Torchvision, timm EfficientNet-B0"],
    ["Generative AI", "Treatment, crop, weather, market, and chat language generation", "Groq Python SDK; llama-3.3-70b-versatile"],
    ["External data", "Forecast conditions and market records", "WeatherAPI; Kerala Ecostat endpoint"],
    ["Knowledge assets", "Agronomy manuals in PDF form", "Local PDF knowledge_base; RAG indexing not yet implemented"],
], [3.0*cm, 6.3*cm, 6.0*cm])]

story += [p("3. Frontend", "H1Green")]
story += [p("The frontend is located in frontend/. It is a Vite-built TypeScript application with client-side routing. A shared Navbar and PageTransition wrap the pages; QueryProvider configures React Query.")]
story += [table(["Route", "Page behavior", "Backend endpoint"], [
    ["/", "Home/landing page and navigation", "No feature request required"],
    ["/disease", "Crop selector, image upload/camera, preview, result confidence ring", "POST /api/disease/predict"],
    ["/treatment", "Tabbed symptoms, chemical, organic, dosage, prevention, precautions", "GET /api/treatment"],
    ["/crop", "Location, soil, irrigation and ranked crop cards", "POST /api/crop-advisor"],
    ["/weather", "Weather metrics, operational decisions, alerts, outlook", "POST /api/weather"],
    ["/market", "Market score, price table, prediction chart, rankings, risks", "POST /market/market"],
    ["/assistant", "Conversation interface, quick prompts, typing state", "POST /api/assistant/chat"],
], [2.2*cm, 8.0*cm, 5.1*cm])]
story += [p("Client communication", "H2Green")]
story += bullets([
    "src/api/client.ts creates a 60-second Axios client. API errors are converted to readable Error messages from FastAPI detail fields.",
    "src/api/endpoints.ts centralizes request creation. Disease upload uses multipart/form-data; other modules use JSON; treatment uses query parameters.",
    "The default VITE_API_BASE_URL is http://localhost:8000. Vite development proxies /api and /market to the backend.",
    "Mutation and query states render SkeletonCard placeholders while requests are running and ErrorCard on failures.",
    "The UI supports English, Malayalam, Hindi, and Tamil JSON locale files; not every dynamic AI response is translated because those responses originate from the backend.",
])
story += [p("Visualization and UX libraries", "H2Green")] + bullets([
    "Framer Motion animates routes, cards, tabs, confidence rings, and message appearance.",
    "Recharts draws the market price-prediction line chart.",
    "React Leaflet and the location picker support geographic selection; the picker also uses Nominatim search.",
    "Lucide React supplies interface icons. CSS uses design tokens and reusable components in src/index.css.",
])

story += [p("4. Backend and API contracts", "H1Green")]
story += [p("The FastAPI entry point is backend/app.py. It enables CORS for HTTP browser origins, exposes / and /health, and registers feature routers. Pydantic schemas validate request bodies for weather, crop advisory, market, and chat requests.")]
story += [table(["Endpoint", "Input", "Core response consumed by UI"], [
    ["POST /api/disease/predict", "multipart: crop, image", "crop, prediction, confidence (0-100)"],
    ["GET /api/treatment", "crop and disease query values, optional", "overview plus six arrays: symptoms, treatments, dosage, prevention, precautions"],
    ["POST /api/crop-advisor", "latitude, longitude, soil_type, irrigation", "location, summary, best_crop, recommended_crops, not_recommended"],
    ["POST /api/weather", "latitude, longitude, crop", "weather details and structured farming advice"],
    ["POST /market/market", "crop, district", "prices, scorecards, trend prediction, decision, risk, alerts"],
    ["POST /api/assistant/chat", "message and optional conversation_history", "reply"],
], [3.7*cm, 4.6*cm, 7.0*cm])]
story += [p("Backend service behavior", "H2Green")] + bullets([
    "disease_api stores the latest crop/disease prediction in in-process prediction_state so the treatment route can use it when explicit parameters are absent.",
    "weather_service fetches a 3-day WeatherAPI forecast, normalizes field names used by the UI, and enforces a network timeout.",
    "crop_advisor_api obtains weather and season data, asks Groq for crop recommendations, and normalizes generated field names such as crop/name and recommendation_rank/rank for the frontend.",
    "market_service fetches Kerala Ecostat records, filters them by crop, calculates district comparisons, price-based scores, windows, predictions, and uses Groq for market commentary. It has an estimated-price fallback when no matching commodity exists.",
    "groq_services provides safe JSON parsing plus fallback structured answers for treatment, weather, crop, and market generation when Groq fails.",
    "assistant_api now delegates to get_chat_response. It passes up to the latest ten valid conversation messages and returns a stable reply field. A provider failure returns a helpful message rather than an unhandled backend error.",
])

story += [p("5. Disease detection AI", "H1Green")]
story += [p("Disease detection is the locally executed predictive model. The application provides one model flow per supported crop: banana, coconut, paddy, pepper, and rubber. Saved best_model.pth files are present under saved/disease/<crop>/.")]
story += [p("Inference flow", "H2Green")] + bullets([
    "The API receives an uploaded image and stores it in a temporary file.",
    "DiseasePredictor selects the crop dataset/classes and loads the crop-specific best checkpoint.",
    "The image is converted to RGB, resized to 224 x 224, converted to a tensor, and normalized with ImageNet mean and standard-deviation values.",
    "An EfficientNet-B0 backbone created through timm produces class logits. The final classifier is a dropout (0.3) plus linear layer sized to the number of classes.",
    "Softmax converts logits to probabilities. The highest probability becomes prediction and the confidence is returned as a percentage rounded to two decimals.",
    "The temporary uploaded file is removed in a finally block after inference.",
])
story += [p("Training and evaluation", "H2Green")] + bullets([
    "The project uses ImageFolder datasets with train, validation, and test splits, DataLoader batches of 32, a seeded configuration, and CUDA when available.",
    "Training configuration sets 10 epochs, learning rate 1e-4, and weight decay 1e-4.",
    "Evaluation calculates accuracy, weighted precision, weighted recall, and weighted F1; it writes classification reports and confusion-matrix images in backend/models/disease/reports/.",
    "Reported model metrics should be taken from the generated per-crop reports for a particular dataset/version; this report does not invent aggregate accuracy values.",
])

story += [p("6. Generative AI and assistant behavior", "H1Green")]
story += [p("Groq is used for natural-language generation in five domain modules: treatment recommendation, crop advisory, weather advice, market insight, and chat. The backend requests structured JSON where the frontend expects fields, then parses or normalizes that output.")]
story += [p("Current assistant flow", "H2Green")] + bullets([
    "The frontend appends the user's message to local state and sends the latest ten messages with the request.",
    "The backend adds a system prompt that directs the model to give concise, practical Kerala-farming guidance and to acknowledge uncertainty for weather, market, and pesticide questions.",
    "The latest user question is guaranteed to be added even if the client history is incomplete.",
    "Groq llama-3.3-70b-versatile generates the reply. The backend sends { reply: string } to the chat interface.",
    "This approach has conversational memory within the browser-provided recent history, but it does not retrieve source passages from the PDF knowledge base.",
])
story += [p("Safety and quality", "H2Green")] + bullets([
    "Prompts ask for practical advice and safety/label guidance, but generated agricultural advice must still be reviewed against local recommendations, product labels, and extension services.",
    "The assistant should not be presented as a substitute for a certified agronomist, pesticide label, or emergency authority.",
    "Production systems should add prompt-injection defense, input/output moderation, citations, rate limiting, request logging with privacy controls, and human escalation paths.",
])

story += [PageBreak(), p("7. Weather and market intelligence", "H1Green")]
story += [p("Weather advisory", "H2Green")] + bullets([
    "WeatherAPI forecast data is queried with latitude and longitude. The service returns location, temperatures, humidity, rain chance, precipitation, wind, cloud, UV, pressure, visibility, sunrise, and sunset.",
    "The weather prompt asks Groq for a summary, three action-plan steps, irrigation/spraying/harvesting boolean decisions with reasons, alerts, a three-day outlook, and Low/Medium/High risk.",
    "If Groq generation fails after weather is obtained, a deterministic fallback returns the same response shape. High rain probability causes conservative spray, irrigation, and harvest recommendations.",
    "If the weather provider itself is unavailable, the API returns a readable failure and the frontend displays its error card. In production, cache the last successful result and offer a clearly labelled stale-data fallback.",
])
story += [p("Market intelligence", "H2Green")] + bullets([
    "MarketService requests a Kerala Ecostat dataset and filters records using the selected crop. It includes token matching and estimated values for unmatched crop names.",
    "It calculates price range, district-market comparisons, price strength, demand/supply proxies, profitability, risk, market health, a selling window, and simple near-term price projections.",
    "Groq is used for the descriptive market insight and decision explanation. The UI renders both numerical tables/charts and this AI narrative.",
    "The UI currently displays price values with a rupee/kg label, while the source response also includes a unit field. Before production, normalize every source unit and display the actual unit explicitly to avoid misleading comparisons.",
])

story += [p("8. Data, persistence, and security", "H1Green")]
story += [p("Current data assets", "H2Green")] + bullets([
    "Disease model checkpoints and evaluation reports are stored locally in the repository workspace.",
    "Agronomy PDFs are stored under backend/models/chatbot/knowledge_base, grouped by topics such as fertilizer and crop manuals.",
    "The current API state for a last disease prediction is process-memory only. It is not suitable for multi-user production because users can overwrite one another's latest prediction.",
    "Database package files exist, but the inspected database source does not currently provide a working persistence path for user accounts, conversations, predictions, or audit events.",
])
story += [p("Security and production recommendations", "H2Green")] + bullets([
    "Keep WEATHER_API_KEY and GROQ_API_KEY only in environment variables or a secret manager; never commit them or expose them to Vite/browser code.",
    "Replace broad CORS policy with specific deployed frontend origins.",
    "Add file size limits, MIME/content validation, image decompression protections, and authentication/authorization for uploads.",
    "Replace global prediction_state with request/session IDs and a database-backed prediction record.",
    "Add HTTPS, rate limits, structured logs without secrets, health/readiness checks, and dependency vulnerability updates.",
])

story += [p("9. RAG implementation roadmap", "H1Green")]
story += [p("A Retrieval-Augmented Generation assistant grounds answers in trusted documents. It retrieves relevant sections from the local agricultural manuals before calling the LLM, then asks the LLM to answer only from those sections and return citations.")]
story += [p("Recommended RAG pipeline", "H2Green")]
story += [p("PDF manuals -> text extraction -> cleaned chunks with metadata -> embeddings -> FAISS/vector index -> similarity retrieval -> prompt with sources -> Groq answer with citations", "ReportCode")]
story += [table(["Component", "Recommended implementation", "Repository target"], [
    ["Document loader", "Use PyPDFLoader/pypdf; retain source filename, page, crop, topic, language", "models/chatbot/rag.py"],
    ["Chunking", "Recursive chunking around 700-1,000 tokens with 100-150 overlap", "models/chatbot/rag.py"],
    ["Embeddings", "sentence-transformers model such as all-MiniLM-L6-v2; normalize vectors", "models/chatbot/embeddings.py"],
    ["Vector store", "FAISS local index persisted with document metadata", "models/chatbot/vector_store.py"],
    ["Prompting", "System policy plus question and top 3-5 evidence chunks; demand citations", "models/chatbot/prompts.py"],
    ["Chat orchestration", "Retrieve, optionally rerank, invoke Groq, return reply plus sources", "models/chatbot/chatbot.py"],
    ["API/UI", "Extend ChatResponse with sources: [{title, page, excerpt}] and render citations", "api/assistant_api.py; frontend assistant page"],
], [3.0*cm, 8.3*cm, 4.1*cm])]
story += [p("RAG acceptance criteria", "H2Green")] + bullets([
    "A question about a manual retrieves relevant chunks from that manual and includes visible source names/pages.",
    "When sources are insufficient, the assistant says so rather than fabricating a citation.",
    "A re-index command can rebuild the vector store after PDFs change.",
    "Tests cover retrieval relevance, source citation format, and answer behavior with no retrieved context.",
    "The frontend clearly labels cited manual advice versus general model guidance.",
])

story += [p("10. Setup, execution, and testing", "H1Green")]
story += [p("Local setup", "H2Green")]
story += [p("1. Create/activate .venv and install backend/requirements.txt. 2. Configure required provider keys in backend/.env. 3. Install frontend dependencies. 4. Run npm.cmd run dev from the project root, or use start.ps1. The backend runs at http://localhost:8000 and Vite runs at http://localhost:5173.", "Body")]
story += [p("Common commands", "H2Green")]
story += [p("npm.cmd --prefix frontend run build\n.\\.venv\\Scripts\\uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000\nnpm.cmd run dev", "ReportCode")]
story += [p("Verification performed for this report", "H2Green")] + bullets([
    "The frontend production build completed successfully with TypeScript checking and Vite bundling.",
    "API contract smoke checks verified the response shapes consumed by the frontend for disease, treatment, weather, crop advisory, market intelligence, and chat using controlled service doubles.",
    "Python syntax compilation succeeded for the updated chat API and Groq service.",
    "A live WeatherAPI request could not be executed from the restricted report-generation environment; this is an environment network limitation, not a frontend contract result.",
])
story += [p("Known improvements", "H2Green")] + bullets([
    "Implement the RAG modules and citations described in Section 9.",
    "Add automated pytest API tests and React component/end-to-end tests to version control.",
    "Use durable, per-user storage instead of global prediction state.",
    "Add schema validation/normalization to every generated AI response before rendering.",
    "Code-split the frontend: the production build reports a JavaScript bundle larger than the default 500 kB warning threshold.",
    "Add accessibility testing, mobile performance budgets, offline/error recovery, and observability before deployment.",
])

story += [p("11. Conclusion", "H1Green")]
story += [p("The project is a functional full-stack farming-assistance platform with a polished multi-module frontend, FastAPI integration layer, local image-classification models, and AI-assisted advisory features. Its strongest implementation areas are the disease workflow, structured feature APIs, and frontend result presentation. The next major milestone is converting the knowledge-base assets into a real RAG system with retrieval, citations, and durable data management. Completing that work will make the AI assistant verifiable, more trustworthy, and better suited to agricultural guidance.")]


document = SimpleDocTemplate(
    str(OUTPUT), pagesize=A4, rightMargin=1.7 * cm, leftMargin=1.7 * cm,
    topMargin=1.5 * cm, bottomMargin=1.8 * cm, title="AI-Powered Farming Assistant Project Report",
    author="AI-Powered Farming Assistant project",
)
document.build(story, onFirstPage=footer, onLaterPages=footer)
print(OUTPUT)
