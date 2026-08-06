import json
from backend.schemas.government_schema import FarmerProfileRequest
from backend.services.groq_services import client, _safe_parse_json


def generate_government_advisory(
    profile: FarmerProfileRequest,
    eligible_schemes: list,
    eligible_loans: list,
    score_data: dict
) -> dict:
    """Invokes Groq AI to analyze eligible schemes and loans and return structured financial advisory."""

    target_lang = profile.language or "English"

    prompt = f"""
You are a Senior Agricultural Financial Advisor and Government Scheme Specialist for Kerala Farmers.

Farmer Profile:
- District: {profile.district}
- Primary Crop: {profile.crop}
- Land Area: {profile.land_area} Acres
- Land Ownership: {profile.land_ownership}
- Farmer Category: {profile.farmer_category}
- Annual Income: ₹{profile.annual_income:,.2f}
- Loan Required: {profile.loan_required}
- Current Loan: {profile.current_loan or 'None'}
- Calculated Baseline Financial Score: {score_data['score']}/100 ({score_data['level']})
- Output Language Request: {target_lang}

Eligible Government Schemes (Pre-filtered):
{json.dumps(eligible_schemes, indent=2)}

Eligible Loan Options (Pre-filtered):
{json.dumps(eligible_loans, indent=2)}

Task:
Analyze the farmer profile and select the SINGLE BEST government scheme and SINGLE BEST loan option from the provided eligible lists. Generate an AI decision support advisory.

IMPORTANT RULES:
1. Do NOT invent fake URLs or external links. Copy the exact "official_website" and "official_apply_link" strings from the provided JSON.
2. Produce all explanations, reasons, benefits, alerts, next_steps, and summaries in {target_lang}. Keep scheme names in their standard recognizable form.
3. Return ONLY valid JSON matching the exact schema below.

JSON Output Schema:
{{
  "profile_summary": {{
    "district": "{profile.district}",
    "crop": "{profile.crop}",
    "land_area": "{profile.land_area} Acres",
    "category": "{profile.farmer_category}",
    "income": "₹{profile.annual_income:,.0f}"
  }},
  "financial_score": {score_data['score']},
  "financial_score_level": "{score_data['level']}",

  "best_scheme": {{
    "scheme_id": "",
    "scheme_name": "",
    "reason": "",
    "benefits": "",
    "priority": "High",
    "estimated_financial_impact": "",
    "official_website": "",
    "official_apply_link": ""
  }},

  "eligible_schemes": {json.dumps(eligible_schemes)},

  "best_loan": {{
    "loan_id": "",
    "loan_name": "",
    "bank_organization": "",
    "maximum_amount": "",
    "interest_rate": "",
    "repayment": "",
    "risk_level": "Low",
    "official_website": "",
    "official_apply_link": ""
  }},

  "loan_options": {json.dumps(eligible_loans)},

  "documents_required": [
    "Aadhaar Card",
    "Bank Account Passbook",
    "Land Possession Certificate / Revenue Receipt",
    "AIMS Kerala Registration ID"
  ],

  "government_alerts": [
    "Alert 1 regarding subsidy or deadline",
    "Alert 2 regarding loan subvention"
  ],

  "next_steps": [
    "Step 1: Gather required documents",
    "Step 2: Submit online application via official portal"
  ],

  "ai_explanation": {{
    "why_best_scheme": "Clear 2-sentence explanation why this is the highest impact scheme for this farmer.",
    "why_best_loan": "Clear 2-sentence explanation of interest subvention and suitability.",
    "financial_benefit_breakdown": "Estimated total financial benefit from subsidies and concessional loan.",
    "other_schemes_note": "Brief note on why other schemes offer secondary or supplementary support."
  }}
}}

Return ONLY valid JSON. No markdown wrappers.
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": f"You are India's top agricultural financial advisor. Provide structured government scheme and loan advisory in {target_lang}. Return valid JSON only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2,
            max_tokens=2500
        )

        result_text = response.choices[0].message.content.strip()
        parsed = _safe_parse_json(result_text)

        # Preserve exact raw lists if AI returned incomplete lists
        if "eligible_schemes" not in parsed or not isinstance(parsed["eligible_schemes"], list):
            parsed["eligible_schemes"] = eligible_schemes
        if "loan_options" not in parsed or not isinstance(parsed["loan_options"], list):
            parsed["loan_options"] = eligible_loans

        return parsed

    except Exception as e:
        print("Groq Government Advisory Error:", e)

        # Robust Fallback
        top_scheme = eligible_schemes[0] if eligible_schemes else {
            "scheme_id": "SCH001",
            "scheme_name": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
            "benefits": "Rs 6,000 direct income support per year",
            "official_website": "https://pmkisan.gov.in",
            "official_apply_link": "https://pmkisan.gov.in/RegistrationFormNew.aspx"
        }

        top_loan = eligible_loans[0] if eligible_loans else {
            "loan_id": "LOAN001",
            "loan_name": "Kisan Credit Card (KCC) Short-Term Crop Loan",
            "bank_organization": "Nationalized & Regional Rural Banks",
            "maximum_amount": "Up to Rs 3,00,000",
            "interest_rate": "4% Effective Interest Rate",
            "official_website": "https://kisan.gov.in",
            "official_apply_link": "https://pmkisan.gov.in/KCC.aspx"
        }

        return {
            "profile_summary": {
                "district": profile.district,
                "crop": profile.crop,
                "land_area": f"{profile.land_area} Acres",
                "category": profile.farmer_category,
                "income": f"₹{profile.annual_income:,.0f}"
            },
            "financial_score": score_data["score"],
            "financial_score_level": score_data["level"],
            "best_scheme": {
                "scheme_id": top_scheme.get("scheme_id", "SCH001"),
                "scheme_name": top_scheme.get("scheme_name", "PM-KISAN"),
                "reason": f"Highest direct financial support suitable for {profile.crop} farming in {profile.district}.",
                "benefits": top_scheme.get("benefits", "Direct input support"),
                "priority": "High",
                "estimated_financial_impact": "Direct Subsidy & Input Grant",
                "official_website": top_scheme.get("official_website", "https://pmkisan.gov.in"),
                "official_apply_link": top_scheme.get("official_apply_link", "https://pmkisan.gov.in")
            },
            "eligible_schemes": eligible_schemes,
            "best_loan": {
                "loan_id": top_loan.get("loan_id", "LOAN001"),
                "loan_name": top_loan.get("loan_name", "Kisan Credit Card (KCC)"),
                "bank_organization": top_loan.get("bank_organization", "Commercial & Co-operative Banks"),
                "maximum_amount": top_loan.get("maximum_amount", "Up to Rs 3 Lakhs"),
                "interest_rate": top_loan.get("interest_rate", "4% per annum"),
                "repayment": top_loan.get("repayment_details", "Post-harvest 12 months"),
                "risk_level": "Low",
                "official_website": top_loan.get("official_website", "https://kisan.gov.in"),
                "official_apply_link": top_loan.get("official_apply_link", "https://kisan.gov.in")
            },
            "loan_options": eligible_loans,
            "documents_required": [
                "Aadhaar Card",
                "Bank Account Passbook",
                "Land Revenue Receipt / Possession Certificate",
                "AIMS Kerala Registration ID",
                "Passport Size Photographs"
            ],
            "government_alerts": [
                f"Active subsidy schemes open for {profile.crop} growers in {profile.district}.",
                "KCC 3% interest subvention active for prompt repayments.",
                "Ensure your AIMS portal profile is updated before Krishi Bhavan verification."
            ],
            "next_steps": [
                "Step 1: Check required documents (Aadhaar, Land Receipt, Bank Passbook).",
                "Step 2: Visit the official government application link provided below.",
                "Step 3: Submit application to Krishi Bhavan or portal online.",
                "Step 4: Track application status with your registration reference number."
            ],
            "ai_explanation": {
                "why_best_scheme": f"{top_scheme.get('scheme_name')} matches your category ({profile.farmer_category}) and land area ({profile.land_area} Acres).",
                "why_best_loan": f"{top_loan.get('loan_name')} offers the lowest effective interest rate with government interest subvention.",
                "financial_benefit_breakdown": "Provides direct financial support and low-interest credit for seasonal farming expenses.",
                "other_schemes_note": "Other eligible schemes are secondary subsidies for equipment and crop insurance."
            }
        }
