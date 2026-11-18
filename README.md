# 🌱 HexaKrishi – AI-Powered Personal Farming Assistant

An intelligent, AI-powered farming assistance platform designed to help farmers make better agricultural decisions through crop recommendations, plant disease detection, weather information, market insights, government schemes, and conversational AI.

---

## 📌 1. Project Overview

**HexaKrishi – AI-Powered Personal Farming Assistant for Kerala Farmers** is a web-based agricultural assistance platform that brings multiple farming support services together in one place.

Farmers often face challenges such as identifying crop diseases, selecting suitable crops for their region, accessing reliable agricultural information, understanding market conditions, and discovering government support schemes.

HexaKrishi aims to address these challenges through Artificial Intelligence, Machine Learning, Retrieval-Augmented Generation (RAG), and web technologies.

The platform provides:

- AI-based crop recommendations.
- Plant disease detection using image classification.
- Regional crop disease intelligence and visualization.
- Crop treatment and prevention guidance.
- Weather-based agricultural advisory.
- Agricultural market insights.
- Government schemes and loan information.
- Equipment-sharing support.
- AI-powered conversational farming assistance.
- Voice-based interaction.

**Primary goal:** To make agricultural information more accessible, understandable, and actionable for farmers.

---

## 🎯 2. Project Objectives

1. Help farmers identify suitable crops based on their agricultural conditions.
2. Detect crop diseases using machine learning and image classification.
3. Provide crop-specific disease information based on the selected geographical region.
4. Offer practical disease prevention and treatment guidance.
5. Help farmers understand weather conditions that may affect cultivation.
6. Provide agricultural market information to support selling decisions.
7. Improve awareness of government agricultural schemes and loans.
8. Provide an AI assistant capable of answering farming-related questions.
9. Make the platform more accessible through voice interaction.
10. Integrate multiple farming support services into a unified application.

---

## 🛠️ 3. Technology Stack

### Frontend

| Technology | Purpose |
|---|---|
| React.js | Frontend application |
| TypeScript | Type-safe development |
| Vite | Development server and build tool |
| Tailwind CSS / CSS | Styling and responsive UI |
| Axios | Backend API communication |
| React Router | Application navigation |
| React Query | API data fetching and state management |
| Recharts | Dashboard visualizations |

### Backend

| Technology | Purpose |
|---|---|
| Python | Backend development |
| FastAPI | REST API framework |
| Pydantic | Request and response validation |
| Uvicorn | ASGI server |
| PyMongo | MongoDB connectivity |
| Python-dotenv | Environment configuration |

### Artificial Intelligence and Machine Learning

| Technology | Purpose |
|---|---|
| TensorFlow / Keras | Deep learning and image classification |
| CNN | Crop disease image classification |
| EfficientNet | Transfer learning experiments |
| Scikit-learn | Machine learning utilities |
| NumPy | Numerical computation |
| Pandas | Dataset processing |
| Matplotlib | Data visualization |
| Sentence Transformers | Text embeddings |
| FAISS | Vector similarity search |
| LangChain | LLM and retrieval integration |
| Groq API | LLM-powered responses |

### Database and Storage

- MongoDB Atlas – User and application data persistence.
- FAISS – Vector-based document retrieval.
- Local agricultural knowledge-base documents and datasets.

### Additional Technologies

- Whisper / Faster-Whisper – Speech-to-text support.
- Meta MMS-TTS – Text-to-speech support.
- Edge TTS – Speech synthesis support.
- Git and GitHub – Version control and collaboration.

---

## 🏗️ 4. System Architecture

The application follows a frontend-backend architecture.

```text
                    FARMER / USER
                          |
                          v
                REACT + TYPESCRIPT
                    FRONTEND
                          |
                          | REST API
                          v
                    FASTAPI
                    BACKEND
                          |
          +---------------+----------------+
          |               |                |
          v               v                v
      AUTHENTICATION   AI SERVICES      AGRICULTURE
          |               |                |
          v               v                v
       MongoDB       Groq / RAG       Crop Advisory
                     FAISS            Disease Detection
                     Embeddings       Weather Advisory
                                      Market Insights
                                      Government Schemes
                                      Equipment Sharing
                          |
                          v
                  RESPONSE TO FRONTEND
                          |
                          v
                    FARMER / USER
```

### Application Flow

1. The farmer interacts with the React frontend.
2. The frontend sends requests to the FastAPI backend.
3. FastAPI validates requests using Pydantic schemas.
4. The appropriate backend service processes the request.
5. Depending on the module, the backend communicates with MongoDB, ML models, external services, or the RAG pipeline.
6. The processed result is returned to the frontend.
7. The frontend displays the result through dashboards, charts, cards, or conversational responses.

---

## 🌾 5. Application Modules

### 5.1 User Authentication

Provides user registration, login, and authentication functionality.

**Features:**
- User registration.
- Secure password hashing using bcrypt.
- Login authentication.
- Token-based authentication.
- User profile retrieval.
- Language preference updates.

**Backend endpoints:**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PATCH /api/auth/language`

**Database:** MongoDB.

### 5.2 AI-Based Crop Recommendation

Helps farmers identify crops suitable for their agricultural conditions.

**Inputs may include:**
- Location.
- Soil type.
- Irrigation availability.
- Other agricultural parameters supported by the recommendation service.

**Outputs include:**
- Recommended crops.
- Crop suitability and ranking.
- Recommended varieties.
- Sowing information.
- Crops that may not be suitable.

The recommendation module helps farmers make more informed cultivation decisions.

**Endpoint:**
- `POST /api/crop-advisor`

Additional crop-related functionality:
- `GET /api/crop-history`

### 5.3 Regional Crop Disease Intelligence Dashboard

This feature connects crop recommendations with regional disease information.

**Problem addressed:**

A farmer selecting Chilli as a recommended crop should see diseases associated with Chilli in the selected region, not diseases belonging to an unrelated crop such as Black Pepper.

**How it works:**

1. The farmer selects a location.
2. The crop recommendation module provides suitable crops.
3. The farmer selects a crop in the regional disease section.
4. The frontend sends the selected location and crop to the backend.
5. The backend retrieves the corresponding crop disease information.
6. The frontend displays the results through a visualization dashboard.

**Dashboard features:**
- Crop-specific disease information.
- Regional disease summaries.
- Disease risk categories.
- Horizontal bar-chart visualization.
- Disease descriptions.
- Seasonal information.
- Prevention recommendations.
- Navigation to the Disease Detection module where supported.

**Risk categories:**
- High
- Medium
- Low

These are categorical risk representations, not measured infection percentages.

**Data provenance:**

The backend distinguishes the geographical level of the available information:

| Data level | Meaning |
|---|---|
| District | District-level supporting information is available |
| State | State-level agricultural baseline information is used |
| Unavailable | Verified information is not available for the requested crop and region |

The system should not present state-level information as district-level disease statistics.

**Important:** The dashboard provides curated agricultural disease-risk intelligence. It should not be interpreted as a live disease surveillance system or a statistical record of actual infected farms.

**Endpoint:**
- `POST /api/crop-disease-intelligence`

Example request:

```json
{
  "location": "Coimbatore, Tamil Nadu",
  "crop": "Chilli"
}
```

The response contains the selected crop, geographical information, data level, regional summary, and crop-specific disease entries.

### 5.4 Plant Disease Detection

Uses machine learning and image classification to identify diseases from uploaded crop images.

**Workflow:**

1. Farmer opens the Disease Detection module.
2. Farmer uploads an image of an affected plant or leaf.
3. The backend processes the image.
4. The trained classification model predicts the disease class.
5. The result is returned to the frontend.

**Model development:**
- Image preprocessing.
- Dataset preparation.
- Training and validation.
- Deep learning-based classification.
- Model inference.

**Current model-supported crop groups:**
- Black Pepper.
- Paddy.
- Coconut.
- Banana.
- Rubber.

The actual disease classes depend on the corresponding trained model and its available labels.

**Endpoint:**
- `POST /api/disease/predict`
- `GET /api/disease/history`

**Note:** Regional disease intelligence supports a broader crop catalog than the image-classification models. A crop appearing in the regional dashboard does not automatically mean that an image-classification model is trained for that crop.

### 5.5 Treatment Recommendation

Provides agricultural treatment and prevention guidance for crop-related problems.

The module supports farmers in understanding possible treatments and preventive practices.

**Features:**
- Disease-related treatment guidance.
- Crop protection recommendations.
- Prevention information.
- Agricultural advisory responses.

**Endpoint:**
- `GET /api/treatment`

### 5.6 Weather Advisory

Provides weather-related information to support agricultural planning.

Weather conditions can affect irrigation, sowing, harvesting, and disease development.

**Features:**
- Weather-related advisory.
- Location-based agricultural guidance.
- Weather-aware farming recommendations.

**Endpoint:**
- `POST /api/weather`

### 5.7 Agricultural Market Intelligence

Helps farmers understand agricultural market information.

**Features:**
- Market-related insights.
- Agricultural selling guidance.
- Market information based on the supported backend service.

**Endpoint:**
- `POST /market/market`

### 5.8 Government Schemes and Loan Advisory

Provides information about government support available to farmers.

**Features:**
- Government agricultural schemes.
- Loan-related information.
- Scheme discovery.
- Data freshness information.
- Government information refresh functionality.

**Endpoints:**
- `POST /api/government/advisory`
- `POST /api/government/refresh`
- `GET /api/government/freshness`
- `GET /api/government/schemes`
- `GET /api/government/loans`

### 5.9 Equipment Sharing

Supports the equipment-sharing functionality of the application.

The module is intended to help farmers access agricultural equipment through the platform.

Its exact available operations depend on the current equipment API implementation.

**Note:** Refer to the latest backend OpenAPI documentation for the complete equipment endpoint list.

### 5.10 AI-Powered Farming Assistant

The AI Assistant allows farmers to ask agriculture-related questions using natural language.

It is designed to provide understandable and actionable responses.

**Features:**
- Farming-related question answering.
- Agricultural advisory.
- Conversational interaction.
- Context-aware response generation.
- Integration with the backend AI service.

**Technology:**
- Groq API.
- LangChain.
- Python.
- FastAPI.

**Endpoint:**
- `POST /api/assistant/chat`

### 5.11 RAG-Based Agricultural Chatbot

The platform also includes a Retrieval-Augmented Generation (RAG) chatbot.

RAG combines document retrieval with language-model generation.

**How it works:**

1. Agricultural documents are prepared as the knowledge base.
2. Documents are divided into smaller chunks.
3. Sentence Transformer models generate embeddings.
4. FAISS stores and indexes the document vectors.
5. When a farmer asks a question, the system retrieves relevant document chunks.
6. The retrieved information is provided to the language model.
7. The model generates a response based on the retrieved context.

**Technology:**
- LangChain.
- Sentence Transformers.
- FAISS.
- Groq LLM.
- Agricultural PDF documents.

**Benefits:**
- Uses agricultural reference material.
- Supports document-based question answering.
- Can return source information with responses.
- Reduces dependence on general model knowledge alone.

**Endpoint:**
- `POST /api/chat`

**Important distinction:**

The RAG vector database stores document embeddings and associated content. It is not the same as conversational memory. Conversation history and vector-document retrieval are separate concepts.

### 5.12 Voice Interaction

Voice interaction makes the application more accessible to farmers who prefer speaking rather than typing.

**Speech-to-Text (STT):**
- Converts spoken input into text.
- Uses browser speech recognition where supported and server-side transcription functionality.

**Text-to-Speech (TTS):**
- Converts assistant responses into audio.
- Supports generated speech responses.

**Technology:**
- Whisper / Faster-Whisper.
- Meta MMS-TTS.
- Edge TTS.
- Browser Web Speech API.

**Endpoints:**
- `POST /api/transcribe`
- `POST /api/speak`

---

## 🔌 6. Important Backend API Endpoints

The following are the main known application routes. The live `/openapi.json` specification should be used to confirm the exact route inventory for the currently checked-out version.

| Module | Method | Endpoint |
|---|---|---|
| Home | GET | `/` |
| Health | GET | `/health` |
| Auth | POST | `/api/auth/register` |
| Auth | POST | `/api/auth/login` |
| Auth | GET | `/api/auth/me` |
| Auth | PATCH | `/api/auth/language` |
| Disease | POST | `/api/disease/predict` |
| Disease | GET | `/api/disease/history` |
| Treatment | GET | `/api/treatment` |
| Weather | POST | `/api/weather` |
| Crop Advisory | POST | `/api/crop-advisor` |
| Crop History | GET | `/api/crop-history` |
| Regional Disease Intelligence | POST | `/api/crop-disease-intelligence` |
| Market | POST | `/market/market` |
| AI Assistant | POST | `/api/assistant/chat` |
| RAG Chatbot | POST | `/api/chat` |
| Government Advisory | POST | `/api/government/advisory` |
| Government Refresh | POST | `/api/government/refresh` |
| Government Freshness | GET | `/api/government/freshness` |
| Government Schemes | GET | `/api/government/schemes` |
| Government Loans | GET | `/api/government/loans` |
| Voice Transcription | POST | `/api/transcribe` |
| Voice Speech | POST | `/api/speak` |

Equipment-related endpoints are documented in the live API specification.

---

## 🗂️ 7. Project Structure

The project is organized into separate frontend and backend applications.

```text
AI_powered_farming_assistant_for_kerala_farmers/
│
├── backend/
│   │
│   ├── app.py
│   │
│   ├── api/
│   │   ├── auth_api.py
│   │   ├── chatbot_api.py
│   │   ├── crop_advisor_api.py
│   │   ├── disease_api.py
│   │   ├── government_api.py
│   │   ├── weather_api.py
│   │   └── ...
│   │
│   ├── assistant/
│   │   ├── chat/
│   │   ├── memory/
│   │   ├── prompts/
│   │   ├── rag/
│   │   └── ...
│   │
│   ├── database/
│   │   └── mongo.py
│   │
│   ├── models/
│   │   ├── chatbot/
│   │   └── disease/
│   │
│   ├── schemas/
│   │   ├── chatbot_schema.py
│   │   └── crop_advisor_schema.py
│   │
│   ├── services/
│   │   ├── disease_intelligence_service.py
│   │   ├── groq_services.py
│   │   ├── scheme_fetcher_service.py
│   │   ├── loan_fetcher_service.py
│   │   └── ...
│   │
│   ├── dataset/
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   │
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── ...
│   │
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── .env
│
├── .gitignore
└── README.md
```

*The structure above is a high-level representation. Individual files and folders may differ in the latest repository version.*

---

## ⚙️ 8. Installation and Setup

### Prerequisites

Install the following before running the project:

- Python 3.11 (recommended for the existing ML environment).
- Node.js and npm.
- Git.
- MongoDB Atlas account or an appropriately configured MongoDB instance.
- Required API credentials.

### Step 1: Clone the repository

```bash
git clone https://github.com/Hadeedullakhan24/AI_powered_farming_assistant_for_kerala_farmers.git
```

Navigate into the project:

```bash
cd AI_powered_farming_assistant_for_kerala_farmers
```

### Step 2: Create a Python virtual environment

```powershell
python -m venv .venv
```

Activate it:

```powershell
.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, use:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.venv\Scripts\Activate.ps1
```

### Step 3: Install backend dependencies

```powershell
pip install -r backend/requirements.txt
```

### Step 4: Configure backend environment variables

Create `backend/.env` and configure the required credentials.

Example:

```env
GROQ_API_KEY=your_groq_api_key
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
WEATHER_API_KEY=your_weather_api_key
```

Additional environment variables may be required by individual integrations.

**Security:**
- Never upload `.env` files to GitHub.
- Never share API keys publicly.
- Keep credentials in environment variables.
- Use the actual variable names expected by the backend configuration.

### Step 5: Start the FastAPI backend

From the project root:

```powershell
python -m uvicorn backend.app:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger API documentation:

```text
http://127.0.0.1:8000/docs
```

Health check:

```text
http://127.0.0.1:8000/health
```

### Step 6: Install frontend dependencies

Open another terminal:

```powershell
cd frontend
npm install
```

### Step 7: Configure frontend environment variables

Create or update `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

The exact frontend configuration should match the current API client implementation.

### Step 8: Start the frontend

```powershell
npm run dev
```

The frontend will normally run at:

```text
http://localhost:5173
```

Open the URL in your browser.

---

## 🧪 9. Testing and Verification

### Backend compilation

From the project root:

```powershell
python -m compileall backend
```

### Frontend production build

```powershell
cd frontend
npm run build
```

### Backend API documentation

Open:

```text
http://127.0.0.1:8000/docs
```

### Health check

```text
http://127.0.0.1:8000/health
```

### Important test scenarios

| Test | Expected behavior |
|---|---|
| User registration | User is registered and stored |
| User login | Valid credentials authenticate |
| Crop recommendation | Suitable crops are returned |
| Crop disease intelligence | Diseases match the selected crop |
| Location change | Regional information refreshes |
| Unsupported crop | Explicit unavailable response |
| Disease detection | Model returns a prediction for supported classes |
| Weather advisory | Weather-related response is returned |
| Market intelligence | Market insight is returned |
| Government schemes | Scheme information is returned |
| AI assistant | Conversational response is generated when the LLM service is available |
| RAG chatbot | Relevant document-based response is generated |
| Voice interaction | Speech input/output works where supported |

---

## 🔐 10. Security and Environment Configuration

The project uses environment variables to protect sensitive credentials.

Examples include:

- `GROQ_API_KEY`
- `MONGO_URI`
- `JWT_SECRET`
- `WEATHER_API_KEY`

Security practices:

1. Keep all secrets inside environment files.
2. Add `.env` files to `.gitignore`.
3. Do not hardcode API keys in source files.
4. Use password hashing for user credentials.
5. Validate API requests using Pydantic.
6. Configure CORS for trusted frontend origins.
7. Avoid printing sensitive credentials in application logs.

---

## 🚀 11. Current Development Status

The following table summarizes the modules developed in the project.

| Module | Development status |
|---|---|
| User Authentication | Implemented |
| MongoDB Integration | Implemented |
| Crop Recommendation | Implemented |
| Regional Crop Disease Intelligence | Implemented |
| Disease Visualization Dashboard | Implemented |
| Disease Image Classification | Implemented for supported crop classes |
| Treatment Recommendation | Implemented |
| Weather Advisory | Implemented |
| Market Intelligence | Implemented |
| Government Schemes and Loans | Implemented |
| Equipment Sharing | Integrated module; verify current functionality |
| AI Farming Assistant | Implemented |
| RAG Chatbot | Implemented |
| Voice STT | Integrated |
| Voice TTS | Integrated |
| WhatsApp Integration | Abandoned and removed from the intended application |

**External service dependency:** Some AI responses depend on the configured Groq account and its API limits. If the provider returns a rate-limit error, live LLM generation may temporarily be unavailable even when the backend is running correctly.

---

## 👥 12. Team Development Guidelines

To avoid conflicts while multiple team members work on the project:

### Before starting development

```bash
git pull origin main
```

### Check your working tree

```bash
git status
```

### Create a separate feature branch

```bash
git checkout -b feature/your-feature-name
```

### After completing changes

```bash
git add .
git commit -m "Describe your changes"
git push origin feature/your-feature-name
```

Create a Pull Request on GitHub and merge after review.

### Important collaboration rules

- Do not directly overwrite another teammate's module.
- Avoid modifying shared API schemas without coordinating with the team.
- Keep frontend API types synchronized with backend response schemas.
- Do not commit `.env` files.
- Test the backend and frontend before creating a Pull Request.
- Do not delete files without checking whether another module imports them.

---

## 🔮 13. Future Enhancements

Potential future improvements include:

- Expansion of disease image-classification models to additional crops.
- More verified district-level agricultural disease datasets.
- Live agricultural disease surveillance using field reports.
- Improved multilingual support for farmers.
- More regional weather-based crop risk prediction.
- Advanced crop price trend analysis.
- Farmer community and expert consultation features.
- Improved offline accessibility.
- More comprehensive agricultural document coverage for the RAG chatbot.
- Better mobile responsiveness and accessibility.

These are potential enhancements, not claims of currently implemented functionality.

---

## 🌍 14. Project Impact

HexaKrishi aims to support farmers by bringing multiple agricultural services into a single platform.

Its key contributions are:

- **Better crop selection:** Agricultural recommendations based on cultivation conditions.
- **Early disease awareness:** Image-based disease identification for supported crops.
- **Regional disease awareness:** Crop-specific disease intelligence based on available regional agricultural information.
- **Accessible knowledge:** Document-based AI question answering.
- **Improved decision support:** Weather and market-related information.
- **Government awareness:** Easier access to scheme and loan information.
- **Accessibility:** Voice-based interaction.

---

## 👨‍💻 15. Project Information

**Project Name:** HexaKrishi – AI-Powered Personal Farming Assistant

**Project Domain:** Artificial Intelligence, Machine Learning, Agriculture Technology

**Application Type:** Full-Stack Web Application

**Backend:** Python + FastAPI

**Frontend:** React + TypeScript + Vite

**Database:** MongoDB

**AI Technologies:** TensorFlow, LangChain, FAISS, Sentence Transformers, Groq

**Repository:**

[GitHub – AI-Powered Personal Farming Assistant for Kerala Farmers](https://github.com/Hadeedullakhan24/AI_powered_farming_assistant_for_kerala_farmers)

---

## 📄 16. Conclusion

HexaKrishi is designed as an integrated AI-powered agricultural assistance platform that combines machine learning, natural language processing, document retrieval, and web-based technologies.

Instead of requiring farmers to use separate platforms for different agricultural needs, HexaKrishi brings crop recommendation, disease identification, regional disease intelligence, weather advisory, market insights, government information, and AI assistance into a unified application.

The long-term vision is to make agricultural knowledge more accessible and help farmers make informed decisions through intelligent, technology-driven support.

**HexaKrishi – Smarter Farming Through Artificial Intelligence.** 🌱
