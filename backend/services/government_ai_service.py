import json
from backend.schemas.government_schema import FarmerProfileRequest
from backend.services.groq_services import client, _safe_parse_json


# ── Verified apply link lookup (fallback when AI doesn't supply one) ──────────
# Format: scheme_id/loan_id → confirmed working apply URL
VERIFIED_APPLY_LINKS: dict[str, str] = {
    # Government Schemes
    "SCH001": "https://pmkisan.gov.in",
    "SCH002": "https://pmfby.gov.in",
    "SCH003": "https://aims.kerala.gov.in",
    "SCH004": "https://aims.kerala.gov.in",
    "SCH005": "https://aims.kerala.gov.in",
    "SCH006": "https://agrimachinery.nic.in",
    "SCH007": "https://pgsindia-ncof.gov.in",
    "SCH008": "https://midh.gov.in",
    "SCH009": "https://pmksy.gov.in",
    "SCH010": "https://coconutboard.gov.in",
    "SCH011": "https://indianspices.com",
    "SCH012": "https://pmkusum.mnre.gov.in",
    "SCH013": "https://shm.kerala.gov.in",
    "SCH014": "https://pmfme.mofpi.gov.in",
    "SCH015": "https://karshakakshema.kerala.gov.in",
    "SCH016": "https://agriinfra.gov.in",
    "SCH017": "https://soilhealth.dac.gov.in",
    "SCH018": "https://rubberboard.gov.in",
    "SCH019": "https://vfpck.org",
    "SCH020": "https://aims.kerala.gov.in",
    "SCH021": "https://pmmsy.dof.gov.in",
    "SCH022": "https://dairy.kerala.gov.in",
    "SCH023": "https://nbhm.gov.in",
    "SCH024": "https://maandhan.in",
    "SCH025": "https://aims.kerala.gov.in",
    # Loans — JanSamarth is the official GOI portal for credit-linked schemes
    "LOAN001": "https://www.jansamarth.in",
    "LOAN002": "https://keralabank.co.in",
    "LOAN003": "https://agriinfra.gov.in",
    "LOAN004": "https://www.jansamarth.in",
    "LOAN005": "https://www.jansamarth.in",
    "LOAN006": "https://www.jansamarth.in",
}


def generate_government_advisory(
    profile: FarmerProfileRequest,
    eligible_schemes: list,
    eligible_loans: list,
    score_data: dict
) -> dict:
    """Invokes Groq AI to perform deep financial analysis of eligible schemes and loans and return dynamic AI advisory."""

    # Compact representations for AI — no official_apply_link passed in (AI generates its own)
    schemes_summary = [
        {
            "scheme_id": s.get("scheme_id"),
            "scheme_name": s.get("scheme_name"),
            "applicable_crops": s.get("applicable_crops"),
            "benefits": s.get("benefits"),
            "eligibility": s.get("eligibility"),
            "state": s.get("state"),
            "district": s.get("district"),
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
   CRITICAL BIAS PREVENTION: Prioritize crop-specific Kerala & Central schemes tailored to {profile.crop}
   (e.g. Keragramam for Coconut, Paddy Royalty for Paddy, Rubber Board for Rubber, Spices Board for Spices)
   over generic schemes like PM-KISAN unless no crop-specific scheme exists.
2. Select the SINGLE BEST loan option suited to their financial status and land holding ({profile.land_area} Acres).
3. Generate dynamic, highly specific recommendations, document checklists, urgent local farming alerts, and step-by-step guidance.
4. For EACH recommended scheme and loan, use YOUR OWN TRAINING KNOWLEDGE to provide the single best verified official apply URL:
   - Use the most specific working page you know (e.g. pmkisan.gov.in for PM-KISAN, aims.kerala.gov.in for Kerala schemes)
   - For credit-linked Central schemes / loans: use https://www.jansamarth.in
   - If unsure of a specific sub-page, use only the root domain — do NOT fabricate sub-pages

ELIGIBILITY FAIRNESS RULES (CRITICAL — violations will be rejected):
- Do NOT restrict any scheme eligibility beyond its actual official criteria
- Do NOT exclude tenant farmers, sharecroppers, or women farmers unless the scheme legally excludes them
- Do NOT bias selections based on income unless the scheme has explicit statutory income cut-offs
- Report eligibility criteria exactly as defined by the actual scheme rules

IMPORTANT:
- Use exact scheme_id and loan_id from the lists provided above.
- Do NOT output template placeholders. Generate specific, genuine AI advice tailored to this farmer.

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
    "scheme_id": "EXACT_SCHEME_ID_FROM_LIST",
    "scheme_name": "Full scheme name",
    "reason": "Detailed reason why this scheme specifically benefits a {profile.crop} farmer in {profile.district}.",
    "benefits": "Full benefits text",
    "priority": "High",
    "estimated_financial_impact": "Specific financial subsidy estimate in rupees",
    "official_website": "REAL working root domain URL from your knowledge",
    "official_apply_link": "REAL working apply URL from your knowledge"
  }},

  "eligible_schemes": {json.dumps(eligible_schemes)},

  "best_loan": {{
    "loan_id": "EXACT_LOAN_ID_FROM_LIST",
    "loan_name": "Full loan name",
    "bank_organization": "Issuing bank or institution",
    "maximum_amount": "Loan ceiling",
    "interest_rate": "Rate per annum",
    "repayment": "Repayment terms",
    "risk_level": "Low/Medium/High",
    "official_website": "REAL working root domain URL from your knowledge",
    "official_apply_link": "REAL working apply URL from your knowledge"
  }},

  "loan_options": {json.dumps(eligible_loans)},

  "documents_required": [
    "Specific document 1 for the recommended scheme",
    "Specific document 2",
    "AIMS Karshak ID / Land Revenue Receipt",
    "Aadhaar Card & Bank Passbook"
  ],

  "government_alerts": [
    "Specific alert about upcoming subsidy window or Krishi Bhavan verification in {profile.district}",
    "Specific alert about interest subvention or insurance deadline for {profile.crop}"
  ],

  "next_steps": [
    "Step 1: Specific action to take first",
    "Step 2: Specific action to take next",
    "Step 3: Submit application to Krishi Bhavan or official online portal"
  ],

  "ai_explanation": {{
    "why_best_scheme": "Comprehensive explanation of why this scheme gives the highest economic impact for {profile.crop} in {profile.district}.",
    "why_best_loan": "Clear explanation of why this loan structure suits their land holding and income level.",
    "financial_benefit_breakdown": "Specific subsidy or interest subvention savings in rupees.",
    "other_schemes_note": "Brief guidance on other eligible schemes the farmer can explore."
  }}
}}

Return ONLY valid JSON. No markdown, no commentary.
"""

    parsed = None
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are India's leading AI agricultural financial analyst. "
                        "Generate structured, highly personalized scheme and loan advisory in JSON format. "
                        "Always use real, verified official government portal URLs from your training knowledge. "
                        "Never fabricate sub-page paths — if unsure, use only the root domain."
                    )
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

    # If AI failed, build a safe baseline from top eligible items
    if not parsed or not isinstance(parsed, dict):
        top_s = eligible_schemes[0] if eligible_schemes else {}
        top_l = eligible_loans[0] if eligible_loans else {}
        sid = top_s.get("scheme_id", "SCH001")
        lid = top_l.get("loan_id", "LOAN001")

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
                "scheme_id": sid,
                "scheme_name": top_s.get("scheme_name", "PM-KISAN"),
                "reason": f"Best available support for {profile.crop} farming in {profile.district}.",
                "benefits": top_s.get("benefits", "Direct input support"),
                "priority": "High",
                "estimated_financial_impact": "Direct Subsidy & Input Grant",
                "official_website": VERIFIED_APPLY_LINKS.get(sid, "https://pmkisan.gov.in"),
                "official_apply_link": VERIFIED_APPLY_LINKS.get(sid, "https://pmkisan.gov.in")
            },
            "eligible_schemes": eligible_schemes,
            "best_loan": {
                "loan_id": lid,
                "loan_name": top_l.get("loan_name", "Kisan Credit Card (KCC)"),
                "bank_organization": top_l.get("bank_organization", "Commercial & Co-operative Banks"),
                "maximum_amount": top_l.get("maximum_amount", "Up to Rs 3 Lakhs"),
                "interest_rate": top_l.get("interest_rate", "4% per annum"),
                "repayment": top_l.get("repayment_details", "Post-harvest 12 months"),
                "risk_level": "Low",
                "official_website": VERIFIED_APPLY_LINKS.get(lid, "https://www.jansamarth.in"),
                "official_apply_link": VERIFIED_APPLY_LINKS.get(lid, "https://www.jansamarth.in")
            },
            "loan_options": eligible_loans,
            "documents_required": [
                "Aadhaar Card & Active Mobile Number",
                "Bank Account Passbook",
                "Land Revenue Receipt / Possession Certificate",
                "AIMS Kerala Registration ID"
            ],
            "government_alerts": [
                f"Active subsidy options are available for {profile.crop} growers in {profile.district}. Contact your Krishi Bhavan for verification.",
                "Ensure Aadhaar is linked to your bank account for DBT subsidy credit."
            ],
            "next_steps": [
                "Step 1: Organize land tax receipt, Aadhaar, and bank passbook.",
                "Step 2: Visit the official apply link below or approach your local Krishi Bhavan.",
                "Step 3: Submit completed application with required documents."
            ],
            "ai_explanation": {
                "why_best_scheme": f"{top_s.get('scheme_name', 'This scheme')} is the best match for your crop ({profile.crop}) and land area ({profile.land_area} Acres).",
                "why_best_loan": f"{top_l.get('loan_name', 'This loan')} offers low-interest credit suited for seasonal agricultural requirements in {profile.district}.",
                "financial_benefit_breakdown": "Delivers direct financial subsidy and concessional credit support.",
                "other_schemes_note": "Additional eligible schemes offer equipment subsidies, crop insurance, and organic farming support."
            }
        }

    # ── Post-processing: always keep full eligible lists ──────────────────────
    parsed["eligible_schemes"] = eligible_schemes
    parsed["loan_options"] = eligible_loans

    # ── Validate best_scheme: fill metadata from DB but KEEP AI-generated URLs ──
    best_s_id = parsed.get("best_scheme", {}).get("scheme_id")
    matched_scheme = next((s for s in eligible_schemes if s.get("scheme_id") == best_s_id), None)
    if not matched_scheme and eligible_schemes:
        matched_scheme = eligible_schemes[0]

    if matched_scheme:
        b_scheme = parsed.get("best_scheme", {})
        sid = matched_scheme.get("scheme_id", "")
        b_scheme["scheme_id"] = sid
        b_scheme["scheme_name"] = matched_scheme.get("scheme_name")

        # AI URL takes priority; only override if it's missing or clearly broken
        ai_apply = b_scheme.get("official_apply_link", "").strip()
        ai_web = b_scheme.get("official_website", "").strip()
        b_scheme["official_apply_link"] = (
            ai_apply if (ai_apply.startswith("http") and "example" not in ai_apply)
            else VERIFIED_APPLY_LINKS.get(sid, matched_scheme.get("official_website", "https://www.jansamarth.in"))
        )
        b_scheme["official_website"] = (
            ai_web if (ai_web.startswith("http") and "example" not in ai_web)
            else matched_scheme.get("official_website", VERIFIED_APPLY_LINKS.get(sid, ""))
        )
        if not b_scheme.get("benefits"):
            b_scheme["benefits"] = matched_scheme.get("benefits", "")
        if not b_scheme.get("eligibility"):
            b_scheme["eligibility"] = matched_scheme.get("eligibility", "")
        b_scheme["helpline"] = matched_scheme.get("helpline", "")
        b_scheme["deadline"] = matched_scheme.get("deadline", "")
        b_scheme["state"] = matched_scheme.get("state", "")
        parsed["best_scheme"] = b_scheme

    # ── If loan is not required, ensure loan fields are cleared ─────────────────
    is_loan_req = (profile.loan_required or "").strip().lower() in ("yes", "true", "1", "required")
    if not is_loan_req or not eligible_loans:
        parsed["best_loan"] = {}
        parsed["loan_options"] = []
        if isinstance(parsed.get("ai_explanation"), dict):
            parsed["ai_explanation"].pop("why_best_loan", None)
    else:
        # ── Validate best_loan: fill metadata from DB but KEEP AI-generated URLs ──
        best_l_id = parsed.get("best_loan", {}).get("loan_id")
        matched_loan = next((l for l in eligible_loans if l.get("loan_id") == best_l_id), None)
        if not matched_loan and eligible_loans:
            matched_loan = eligible_loans[0]

        if matched_loan:
            b_loan = parsed.get("best_loan", {})
            lid = matched_loan.get("loan_id", "")
            b_loan["loan_id"] = lid
            b_loan["loan_name"] = matched_loan.get("loan_name")
            b_loan["bank_organization"] = matched_loan.get("bank_organization")
            b_loan["maximum_amount"] = matched_loan.get("maximum_amount")
            b_loan["interest_rate"] = matched_loan.get("interest_rate")
            b_loan["repayment"] = matched_loan.get("repayment_details", b_loan.get("repayment", ""))

            ai_l_apply = b_loan.get("official_apply_link", "").strip()
            ai_l_web = b_loan.get("official_website", "").strip()
            b_loan["official_apply_link"] = (
                ai_l_apply if (ai_l_apply.startswith("http") and "example" not in ai_l_apply)
                else VERIFIED_APPLY_LINKS.get(lid, "https://www.jansamarth.in")
            )
            b_loan["official_website"] = (
                ai_l_web if (ai_l_web.startswith("http") and "example" not in ai_l_web)
                else matched_loan.get("official_website", VERIFIED_APPLY_LINKS.get(lid, ""))
            )
            parsed["best_loan"] = b_loan

    return parsed
