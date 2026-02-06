"""
Utility functions for running the task agent.
Implements the run_task_agent function to process user queries with proper authentication context.
Uses OpenRouter's chat completions API as OpenRouter doesn't support Assistants API.
"""
import os
from openai import OpenAI
from typing import Dict, Any
from ..agents.todo_agent import get_todo_agent


def get_openrouter_client():
    """Create and return an OpenRouter client instance."""
    return OpenAI(
        api_key=os.getenv("OPENROUTER_API_KEY"),
        base_url="https://openrouter.ai/api/v1"
    )


async def run_task_agent(user_query: str, user_id: str) -> Dict[str, Any]:
    """
    Process a user's natural language query using the task management AI agent.
    Uses OpenRouter's chat completions API since OpenRouter doesn't support Assistants API.

    Args:
        user_query: Natural language query from the user (e.g., "I finished the milk task")
        user_id: Authenticated user's ID to bind to all operations

    Returns:
        Dict containing the agent's response and any relevant information
    """
    try:
        # Get the pre-configured agent instructions
        agent = get_todo_agent()

        # Get the OpenRouter client using the local function
        client = get_openrouter_client()

        # Get the agent instructions
        from ..agents.todo_agent import TODO_AGENT_INSTRUCTIONS
        agent_instructions = TODO_AGENT_INSTRUCTIONS

        # Create the system message with instructions and user context
        system_message = f"{agent_instructions}\n\nContext: The current user ID is {user_id}. All operations must be performed for this user only."

        # Make a request to the chat completions API
        # Since the OpenAI client is synchronous, we'll run it in a thread pool
        import asyncio
        loop = asyncio.get_event_loop()

        response = await loop.run_in_executor(
            None,
            lambda: client.chat.completions.create(
                model=os.getenv("OPENROUTER_MODEL", "modal:tngtech/deepseek-r1t2-chimera:free"),
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_query}
                ],
                temperature=0.7,
                max_tokens=1000
            )
        )

        # Extract the assistant's response
        assistant_response = response.choices[0].message.content

        return {
            "success": True,
            "response": assistant_response,
            "user_id": user_id,
            "status": "completed"
        }

    except Exception as e:
        return {
            "success": False,
            "response": f"An error occurred while processing your request: {str(e)}",
            "user_id": user_id,
            "status": "error"
        }


async def run_task_agent_with_context(user_query: str, user_id: str) -> Dict[str, Any]:
    """
    Alternative implementation that might be better for the MCP context.
    Processes a user's query with authentication context using MCP tools.

    Args:
        user_query: Natural language query from the user
        user_id: Authenticated user's ID to bind to all operations

    Returns:
        Dict containing the response from the agent
    """
    # This would integrate with the MCP framework to run tools with the proper context
    # For now, it delegates to the main run_task_agent function
    return await run_task_agent(user_query, user_id)