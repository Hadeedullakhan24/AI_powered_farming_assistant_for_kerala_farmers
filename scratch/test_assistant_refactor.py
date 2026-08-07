"""
scratch/test_assistant_refactor.py
Verification script for refactored AI Assistant module.
"""

import sys
import os

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

def test_health():
    print("\n--- 1. Testing Assistant Health Service ---")
    from backend.assistant.services.health import get_assistant_health
    health = get_assistant_health()
    print("Health result:", health)
    assert "status" in health
    assert "components" in health
    print("✅ Health check passed!")

def test_language_detector():
    print("\n--- 2. Testing Language Detector ---")
    from backend.assistant.translation.detector import detect_language
    assert detect_language("എന്റെ തക്കാളി ചെടി വാടുന്നു") == "ml"
    assert detect_language("என் தக்காளி செடி ஏன் வாடுகிறது?") == "ta"
    assert detect_language("How to control pest in coffee?") == "en"
    print("✅ Language detector passed!")

def test_hybrid_chat():
    print("\n--- 3. Testing Hybrid Chat (RAG + LLM Fallback) ---")
    from backend.assistant.chat.service import get_chat_service
    service = get_chat_service()

    # Test Non-RAG crop (Coffee) -> should use LLM fallback instead of saying "not found"
    res_coffee = service.generate_response("How to control leaf rust disease in coffee?", lang="en")
    print(f"Coffee Query Source: {res_coffee['source']}")
    print(f"Coffee Reply snippet: {res_coffee['reply'][:150]}...")
    assert len(res_coffee['reply']) > 50
    assert "not found in" not in res_coffee['reply'].lower()

    # Test RAG query (Paddy/Rice)
    res_paddy = service.generate_response("How to manage rice blast disease?", lang="en")
    print(f"Paddy Query Source: {res_paddy['source']}")
    print(f"Paddy Reply snippet: {res_paddy['reply'][:150]}...")

    print("✅ Hybrid Chat Service passed!")

def test_memory_store():
    print("\n--- 4. Testing Session Memory Store ---")
    from backend.assistant.memory.store import get_memory_store
    store = get_memory_store()
    mem = store.get_or_create("test-session-123")
    mem.add_user_message("Hello")
    mem.add_ai_message("Hi farmer!")
    history = mem.get_formatted_history()
    print("Formatted History:\n", history)
    assert "Hello" in history
    assert store.active_session_count() >= 1
    print("✅ Session Memory Store passed!")

def test_tts_manager():
    print("\n--- 5. Testing TTS Manager LRU Cache ---")
    from backend.assistant.speech.tts import get_tts_manager
    tts = get_tts_manager()
    print("Cached languages before call:", tts.cached_languages())
    print("✅ TTS Manager test passed!")

if __name__ == "__main__":
    try:
        test_health()
        test_language_detector()
        test_memory_store()
        test_tts_manager()
        test_hybrid_chat()
        print("\n🎉 ALL REFACTOR TESTS PASSED SUCCESSFULLY!")
    except Exception as e:
        print("\n❌ TEST FAILED:", e)
        import traceback
        traceback.print_exc()
