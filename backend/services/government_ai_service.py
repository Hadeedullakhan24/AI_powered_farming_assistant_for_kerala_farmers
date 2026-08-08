import json
from backend.schemas.government_schema import FarmerProfileRequest
from backend.services.groq_services import client, _safe_parse_json


def generate_government_advisory(
    profile: FarmerProfileRequest,
    eligible_schemes: list,
    eligible_loans: list,
    score_data: dict
) -> dict:
    """Invokes Groq AI to perform deep financial analysis of eligible schemes and loans and return dynamic AI advisory."""

    # Compact representations of pre-filtered candidates for AI selection
    schemes_summary = [
        {
            "scheme_id": s.get("scheme_id"),
            "scheme_name": s.get("scheme_name"),
            "applicable_crops": s.get("applicable_crops"),
            "benefits": s.get("benefits"),
            "eligibility": s.get("eligibility"),
            "state": s.get("state"),
            "district": s.get("district"),
            "official_website": s.get("official_website"),
            "official_apply_link": s.get("official_apply_link")
        }
        for s in eligible_schemes
    ]

    loans_summary = [
        {
            "loan_id": l.get("loan_id"),
            "loan_name": l.get("loan_name"),
            "bank_organization": l.get("bank_organization"),
            "maximum_amount": l.get("maximum_amount"),
            "interest_rate": l.get("interest_rate"),
            "repayment_details": l.get("repayment_details"),
            "official_website": l.get("official_website"),
            "official_apply_link": l.get("official_apply_link")
        }
        for l in eligible_loans
    ]

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
- Current Ongoing Loan: {profile.current_loan or 'None'}
- Baseline Financial Score: {score_data['score']}/100 ({score_data['level']})

Eligible Government Schemes (Ranked by relevance):
{json.dumps(schemes_summary, indent=2)}

Eligible Loan Options:
{json.dumps(loans_summary, indent=2)}

TASK:
1. Select the SINGLE BEST government scheme for this specific farmer profile.
   CRITICAL BIAS PREVENTION: Prioritize crop-specific Kerala & Central schemes tailored to {profile.crop} (e.g. Keragramam for Coconut, Paddy Royalty for Paddy, Rubber Board for Rubber, Spices Board for Spices) over generic baseline schemes like PM-KISAN, unless no crop-specific scheme exists.
2. Select the SINGLE BEST loan option suited to their financial status and land holding ({profile.land_area} Acres).
3. Generate dynamic, highly specific recommendations, document checklists, urgent local farming alerts, and step-by-step application guidance.

IMPORTANT:
- Use exact scheme_id and loan_id from the lists provided.
- Do NOT output template placeholders. Generate specific, genuine AI advice.

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
    "scheme_id": "EXACT_SCHEME_ID",
    "scheme_name": "",
    "reason": "Detailed reason why this scheme specifically benefits a {profile.crop} farmer in {profile.district}.",
    "benefits": "",
    "priority": "High",
    "estimated_financial_impact": "Specific financial subsidy estimate",
    "official_website": "",
    "official_apply_link": ""
  }},

  "eligible_schemes": {json.dumps(eligible_schemes)},

  "best_loan": {{
    "loan_id": "EXACT_LOAN_ID",
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
    "Specific document 1 for selected scheme",
    "Specific document 2",
    "AIMS Karshak ID / Land Revenue Receipt",
    "Aadhaar Card & Bank Passbook"
  ],

  "government_alerts": [
    "Specific alert regarding upcoming subsidy application window or Krishi Bhavan verification in {profile.district}",
    "Specific alert regarding interest subvention or insurance deadline for {profile.crop}"
  ],

  "next_steps": [
    "Step 1: Specific action point",
    "Step 2: Specific action point",
    "Step 3: Submit application to Krishi Bhavan or official online portal"
  ],

  "ai_explanation": {{
    "why_best_scheme": "Comprehensive AI explanation of why this scheme provides the highest economic impact for {profile.crop} in {profile.district}.",
    "why_best_loan": "Clear AI explanation of why this loan structure suits their land holding and income level.",
    "financial_benefit_breakdown": "Specific financial subsidy or interest subvention savings breakdown.",
    "other_schemes_note": "Brief guidance on secondary eligible schemes."
  }}
}}

Return ONLY valid JSON.
"""

    parsed = None
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are India's leading AI agricultural financial analyst. Generate structured, highly personalized scheme and loan advisory in clear JSON format."
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

    except Exception as e:
        print("Groq Government Advisory AI Error:", e)

    # If AI failed or returned empty JSON, construct dynamic baseline using top eligible items
    if not parsed or not isinstance(parsed, dict):
        top_s = eligible_schemes[0] if eligible_schemes else {}
        top_l = eligible_loans[0] if eligible_loans else {}

        parsed = {
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
                "scheme_id": top_s.get("scheme_id", "SCH001"),
                "scheme_name": top_s.get("scheme_name", "PM-KISAN"),
                "reason": f"Highest direct financial support suitable for {profile.crop} farming in {profile.district}.",
                "benefits": top_s.get("benefits", "Direct input support"),
                "priority": "High",
                "estimated_financial_impact": "Direct Subsidy & Input Grant",
                "official_website": top_s.get("official_website", "https://pmkisan.gov.in"),
                "official_apply_link": top_s.get("official_apply_link", "https://pmkisan.gov.in")
            },
            "eligible_schemes": eligible_schemes,
            "best_loan": {
                "loan_id": top_l.get("loan_id", "LOAN001"),
                "loan_name": top_l.get("loan_name", "Kisan Credit Card (KCC)"),
                "bank_organization": top_l.get("bank_organization", "Commercial & Co-operative Banks"),
                "maximum_amount": top_l.get("maximum_amount", "Up to Rs 3 Lakhs"),
                "interest_rate": top_l.get("interest_rate", "4% per annum"),
                "repayment": top_l.get("repayment_details", "Post-harvest 12 months"),
                "risk_level": "Low",
                "official_website": top_l.get("official_website", "https://kisan.gov.in"),
                "official_apply_link": top_l.get("official_apply_link", "https://kisan.gov.in")
            },
            "loan_options": eligible_loans,
            "documents_required": [
                "Aadhaar Card & Active Mobile Number",
                "Bank Account Passbook",
                "Land Revenue Receipt / Possession Certificate",
                "AIMS Kerala Registration ID"
            ],
            "government_alerts": [
                f"Active subsidy options available for {profile.crop} growers in {profile.district}.",
                "Check AIMS Kerala portal for Krishi Bhavan subsidy verification.",
                "Ensure Aadhaar is linked to bank account for DBT subsidy credit."
            ],
            "next_steps": [
                "Step 1: Organize required land tax receipt and Aadhaar documents.",
                "Step 2: Access official online portal via application link below.",
                "Step 3: Submit application to local Krishi Bhavan office for verification."
            ],
            "ai_explanation": {
                "why_best_scheme": f"{top_s.get('scheme_name')} matches your category ({profile.farmer_category}) and land area ({profile.land_area} Acres).",
                "why_best_loan": f"{top_l.get('loan_name')} offers low-interest credit suited for seasonal agricultural requirements.",
                "financial_benefit_breakdown": "Delivers direct financial subsidy and concessional credit support.",
                "other_schemes_note": "Additional eligible schemes offer equipment subsidies and crop insurance coverage."
            }
        }

    # ── Post-processing: Enforce 100% exact link integrity from DB ─────────────
    # Always keep full eligible lists intact
    parsed["eligible_schemes"] = eligible_schemes
    parsed["loan_options"] = eligible_loans

    # Map best_scheme to exact verified candidate
    best_s_id = parsed.get("best_scheme", {}).get("scheme_id")
    matched_scheme = next((s for s in eligible_schemes if s.get("scheme_id") == best_s_id), None)
    if not matched_scheme and eligible_schemes:
        matched_scheme = eligible_schemes[0]

    if matched_scheme:
        b_scheme = parsed.get("best_scheme", {})
        b_scheme["scheme_id"] = matched_scheme.get("scheme_id")
        b_scheme["scheme_name"] = matched_scheme.get("scheme_name")
        b_scheme["official_website"] = matched_scheme.get("official_website")
        b_scheme["official_apply_link"] = (
            matched_scheme.get("official_apply_link")
            or matched_scheme.get("official_website")
            or ""
        )
        if not b_scheme.get("benefits"):
            b_scheme["benefits"] = matched_scheme.get("benefits")
        parsed["best_scheme"] = b_scheme

    # Map best_loan to exact verified candidate
    best_l_id = parsed.get("best_loan", {}).get("loan_id")
    matched_loan = next((l for l in eligible_loans if l.get("loan_id") == best_l_id), None)
    if not matched_loan and eligible_loans:
        matched_loan = eligible_loans[0]

    if matched_loan:
        b_loan = parsed.get("best_loan", {})
        b_loan["loan_id"] = matched_loan.get("loan_id")
        b_loan["loan_name"] = matched_loan.get("loan_name")
        b_loan["bank_organization"] = matched_loan.get("bank_organization")
        b_loan["maximum_amount"] = matched_loan.get("maximum_amount")
        b_loan["interest_rate"] = matched_loan.get("interest_rate")
        b_loan["repayment"] = matched_loan.get("repayment_details", b_loan.get("repayment", ""))
        b_loan["official_website"] = matched_loan.get("official_website")
        b_loan["official_apply_link"] = (
            matched_loan.get("official_apply_link")
            or matched_loan.get("official_website")
            or ""
        )
        parsed["best_loan"] = b_loan

    return parsed
