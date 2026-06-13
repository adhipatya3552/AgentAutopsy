import re

def sanitize_text(text: str) -> str:
    if not text:
        return text
    
    # 1. Mask Groq API keys (gsk_...)
    text = re.sub(r'\bgsk_[a-zA-Z0-9]{40,}\b', '[REDACTED_API_KEY]', text)
    
    # 2. Mask Langfuse Keys (pk-lf-..., sk-lf-...)
    text = re.sub(r'\b(?:pk|sk)-lf-[a-zA-Z0-9\-]{20,}\b', '[REDACTED_LANGFUSE_KEY]', text)
    
    # 3. Mask Email addresses
    text = re.sub(r'\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b', '[REDACTED_EMAIL]', text)
    
    # 4. Mask IPv4 addresses
    text = re.sub(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', '[REDACTED_IP]', text)
    
    # 5. Mask Password assignments and common secret parameters (e.g. password=..., secret="...")
    text = re.sub(r'(?i)\b(password|pass|secret|token|key)\b\s*[:=]\s*["\']?[a-zA-Z0-9@#$_%\-]{6,}["\']?', r'\1=[REDACTED_SECRET]', text)
    
    return text

def sanitize_data(data: any) -> any:
    """Recursively traverses lists and dictionaries to sanitize all string elements."""
    if isinstance(data, dict):
        return {k: sanitize_data(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_data(item) for item in data]
    elif isinstance(data, str):
        return sanitize_text(data)
    return data
