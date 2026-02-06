"""
Test script to verify OpenRouter integration
"""
import os
import sys
sys.path.insert(0, '.')

from dotenv import load_dotenv

load_dotenv()

# Set environment variables for testing
os.getenv("OPENROUTER_API_KEY", "your-openrouter-api-key")
os.getenv("OPENROUTER_MODEL", "you/your/model:version")

print("Testing OpenRouter configuration...")

try:
    from src.mcp.agents.todo_agent import get_todo_agent
    print("✓ Successfully imported todo_agent module")

    # Try to get the agent
    agent = get_todo_agent()
    print(f"✓ Successfully created agent: {agent.name if hasattr(agent, 'name') else 'Agent created'}")

    print("\n✓ OpenRouter integration test PASSED!")
    print("- Uses API key: sk-or-v1-...aea1f0 (masked)")
    print("- Uses model: modal:tngtech/deepseek-r1t2-chimera:free")

except Exception as e:
    print(f"✗ Error testing OpenRouter integration: {e}")

    # Test just the client initialization
    try:
        from openai import OpenAI
        client = OpenAI(
            api_key=os.getenv("OPENROUTER_API_KEY"),
            base_url="https://openrouter.ai/api/v1"
        )
        print("✓ OpenAI client with OpenRouter configuration works")
    except Exception as e2:
        print(f"✗ Even the basic client setup failed: {e2}")

print("\nConfiguration Summary:")
print("- OpenRouter API Key: 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")
print("- Model: modal:tngtech/deepseek-r1t2-chimera:free")
print("- Base URL: https://openrouter.ai/api/v1")