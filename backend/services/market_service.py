import requests
from datetime import datetime, timedelta

from backend.services.groq_services import get_market_insight


class MarketService:

    URL = "https://www.ecostat.kerala.gov.in/api/data-subset/481"

    def to_float(self, value):
        try:
            return float(value)
        except Exception:
            return 0.0

    def get_market_data(self, crop: str, district: str):

        response = requests.get(self.URL)

        if response.status_code != 200:
            raise Exception("Unable to fetch Kerala Market Data")

        records = response.json().get("records", [])

        crop_lower = crop.lower()

        filtered = []
        district_comparison = []

        for item in records:
            commodity = str(item.get("dim_3_name", "")).lower()

            if crop_lower in commodity:
                filtered.append({
                    "commodity": item.get("dim_3_name", ""),
                    "average_price": self.to_float(item.get("measure_1")),
                    "market_price": self.to_float(item.get("measure_2")),
                    "min_price": self.to_float(item.get("measure_3")),
                    "max_price": self.to_float(item.get("measure_4")),
                    "unit": "Rs.",
                    "date": item.get("date", "")
                })

                district_comparison.append({
                    "district": item.get("dim_2_name", "Unknown"),
                    "commodity": item.get("dim_3_name", ""),
                    "market_price": self.to_float(item.get("measure_2")),
                    "average_price": self.to_float(item.get("measure_1"))
                })

        if not filtered:
            raise Exception(f"No Market Data Found For {crop}")

        highest = max(filtered, key=lambda x: x["market_price"])

        # -----------------------------
        # District Comparison
        # -----------------------------

        district_comparison = sorted(
            district_comparison,
            key=lambda x: x["market_price"],
            reverse=True
        )

        for index, entry in enumerate(district_comparison):
            entry["rank"] = index + 1

        district_comparison = district_comparison[:5]

        best_district = district_comparison[0]["district"] if district_comparison else None
        best_price = district_comparison[0]["market_price"] if district_comparison else None

        analysis = get_market_insight(
            crop=crop.title(),
            district=district.title(),
            price_data=filtered
        )

        score = analysis.get("market_score", 50)

        # -----------------------------
        # Market Status
        # -----------------------------

        if score >= 80:
            market_status = "Excellent Time To Sell"
            score_color = "#28A745"
        elif score >= 60:
            market_status = "Good Opportunity"
            score_color = "#FFC107"
        elif score >= 40:
            market_status = "Average Market"
            score_color = "#FD7E14"
        else:
            market_status = "Poor Market"
            score_color = "#DC3545"

        # -----------------------------
        # Profitability
        # -----------------------------

        profitability = {
            "level": analysis.get("profitability", "Moderate"),
            "confidence": f"{score}%",
            "expected_margin": (
                "20-30%" if score >= 80 else
                "10-20%" if score >= 60 else
                "5-10%" if score >= 40 else
                "0-5%"
            )
        }

        # -----------------------------
        # Market Health
        # -----------------------------

        health_score = min(score + 20, 100)

        if health_score >= 80:
            health_label = "Healthy"
            health_color = "Green"
        elif health_score >= 60:
            health_label = "Stable"
            health_color = "Yellow"
        else:
            health_label = "Weak"
            health_color = "Red"

        # -----------------------------
        # Market Scorecard
        # -----------------------------

        demand = analysis.get("demand", "Medium")
        supply = analysis.get("supply", "Medium")
        profit = analysis.get("profitability", "Moderate")

        price_strength = min(score + 5, 100)

        demand_strength = {
            "High": 90,
            "Medium": 70,
            "Low": 45
        }.get(demand, 70)

        supply_health = {
            "Low": 90,
            "Medium": 70,
            "High": 45
        }.get(supply, 70)

        profit_potential = {
            "High": 90,
            "Moderate": 70,
            "Low": 45
        }.get(profit, 70)

        risk_index = 100 - score

        ai_confidence = min(score + 12, 100)

        market_scorecard = {
            "price_strength": price_strength,
            "demand_strength": demand_strength,
            "supply_health": supply_health,
            "profit_potential": profit_potential,
            "risk_index": risk_index,
            "ai_confidence": ai_confidence
        }

        # -----------------------------
        # Farmer Decision
        # -----------------------------

        farmer_decision = {
            "action": analysis.get("farmer_action", "WAIT"),
            "confidence": f"{score}%",
            "priority": (
                "HIGH" if score >= 80 else
                "MEDIUM" if score >= 60 else
                "LOW"
            ),
            "reasons": [
                analysis.get("key_reason", ""),
                f"Demand : {analysis.get('demand')}",
                f"Supply : {analysis.get('supply')}",
                f"Trend : {analysis.get('price_trend')}"
            ]
        }

        # -----------------------------
        # AI Price Prediction
        # -----------------------------

        today = highest["market_price"]

        forecast = analysis.get("price_forecast", "Stable")

        if forecast.lower() == "increasing":
            tomorrow = today * 1.02
            next_week = today * 1.06
        elif forecast.lower() == "decreasing":
            tomorrow = today * 0.98
            next_week = today * 0.94
        else:
            tomorrow = today * 1.01
            next_week = today * 1.02

        price_prediction = {
            "today": round(today, 2),
            "tomorrow": round(tomorrow, 2),
            "next_week": round(next_week, 2),
            "trend": forecast
        }

        # -----------------------------
        # Market Risk
        # -----------------------------

        market_risk = {
            "level": analysis.get("risk_level", "Medium"),
            "risk_score": 100 - score,
            "reason": analysis.get("key_reason", "AI generated risk analysis.")
        }

        # -----------------------------
        # Best Market Opportunity
        # -----------------------------

        best_market = {
            "commodity": highest["commodity"],
            "price": highest["market_price"],
            "reason": "Highest traded commodity today."
        }

        # -----------------------------
        # Selling Window
        # -----------------------------

        today_date = datetime.today()

        selling_window = {
            "from_date": today_date.strftime("%d %b %Y"),
            "to_date": (today_date + timedelta(days=5)).strftime("%d %b %Y"),
            "recommendation": analysis.get("best_selling_time", "Current Week")
        }

        # -----------------------------
        # Market Alerts
        # -----------------------------

        alerts = analysis.get("market_alerts")

        if not alerts:
            alerts = [
                "Market remains stable.",
                "Demand is unchanged.",
                "No major alerts."
            ]

        return {
            "crop": crop.title(),
            "district": district.title(),
            "price_data": filtered,
            "highest_priced_commodity": highest["commodity"],
            "highest_price": highest["market_price"],

            "ai_insight": {
                "summary": analysis.get("summary"),
                "recommendation": analysis.get("recommendation"),
                "price_trend": analysis.get("price_trend"),
                "demand": analysis.get("demand"),
                "supply": analysis.get("supply"),
                "best_selling_time": analysis.get("best_selling_time"),
                "market_sentiment": analysis.get("market_sentiment"),
                "price_forecast": analysis.get("price_forecast"),
                "key_reason": analysis.get("key_reason"),
                "market_score": score
            },

            "market_score": score,
            "market_status": market_status,
            "score_color": score_color,
            "profitability": profitability,

            "district_comparison": district_comparison,
            "best_district": best_district,
            "best_district_price": best_price,

            "market_health": {
                "score": health_score,
                "label": health_label,
                "color": health_color
            },

            "market_scorecard": market_scorecard,
            "farmer_decision": farmer_decision,
            "price_prediction": price_prediction,
            "market_risk": market_risk,
            "best_market_opportunity": best_market,
            "selling_window": selling_window,
            "market_alerts": alerts,
            "last_updated": filtered[0]["date"]
        }
