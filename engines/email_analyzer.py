import mailparser
import os
from dotenv import load_dotenv

try:
    from google import genai
except ImportError:
    genai = None

load_dotenv()


def _fallback_analysis(mail):
    """Basic local heuristic analysis used when Gemini is unavailable."""
    body_content = (mail.body or "").lower()
    sender = str(mail.from_ or "")
    subject = str(mail.subject or "")
    links = mail.links or []

    red_flags = []
    suspicious_terms = [
        "urgent",
        "verify your account",
        "password reset",
        "login now",
        "wire transfer",
        "gift card",
        "limited time",
    ]

    for term in suspicious_terms:
        if term in body_content:
            red_flags.append(f"Suspicious phrase detected: '{term}'")

    if links:
        red_flags.append(f"Email contains {len(links)} link(s).")

    if sender and ("reply" in sender.lower() or "support" in sender.lower()):
        red_flags.append("Sender display/source appears generic and should be verified.")

    is_fake = len(red_flags) >= 2
    risk_level = "High" if len(red_flags) >= 3 else ("Medium" if red_flags else "Low")

    return {
        "risk_level": risk_level,
        "is_fake": is_fake,
        "threats": red_flags,
        "summary": "Local heuristic analysis completed (Gemini API key not configured).",
    }


def _get_gemini_client():
    """Create Gemini client only when API key is present."""
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key or genai is None:
        return None
    return genai.Client(api_key=api_key)

def analyze_email_source(raw_content):
    """
    Parses raw email headers/body and uses Gemini to detect phishing.
    """
    try:
        # 1. Parse the email
        mail = mailparser.parse_from_string(raw_content)
        
        # 2. Prepare data for AI
        body_content = mail.body[:2000]  # Limit characters for speed
        sender = mail.from_
        subject = mail.subject
        links = mail.links

        # 3. Request Gemini analysis if configured, else local fallback
        client = _get_gemini_client()
        if client is None:
            local = _fallback_analysis(mail)
            return {
                "success": True,
                "analysis": local,
                "metadata": {
                    "sender": sender,
                    "links_count": len(links),
                    "has_attachments": len(mail.attachments) > 0,
                    "mode": "local_fallback",
                },
            }

        prompt = f"""
        TASK: Act as a Cyber Security Forensic Expert.
        Analyze this email for phishing, spoofing, or malicious intent.
        
        SENDER: {sender}
        SUBJECT: {subject}
        BODY: {body_content}
        LINKS FOUND: {links}

        Provide a JSON response with:
        - "risk_level": (Low/Medium/High/Critical)
        - "is_fake": (Boolean)
        - "threats": (List of specific red flags like 'spoofed domain', 'urgent tone')
        - "summary": (A 1-sentence explanation for the user)
        """

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )

        return {
            "success": True,
            "analysis": response.text,
            "metadata": {
                "sender": sender,
                "links_count": len(links),
                "has_attachments": len(mail.attachments) > 0,
                "mode": "gemini",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e)}