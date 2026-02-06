from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import List, Optional
from uuid import UUID
from sqlmodel.ext.asyncio.session import AsyncSession
from ...models import (
    Conversation, Message, ConversationCreate, ConversationPublic,
    MessageCreate, MessagePublic, User
)
from ...services.chat_service import ChatService
from ...utils.database import get_async_session
from ...utils.logging_config import get_logger
from ...api.deps import get_current_user, verify_user_owns_resource

router = APIRouter(prefix="/api/{user_id}", tags=["chat"])
logger = get_logger(__name__)


@router.post("/conversations", response_model=ConversationPublic, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    request: Request,
    user_id: UUID,
    conversation_data: ConversationCreate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
) -> ConversationPublic:
    """
    Create a new conversation for a user.
    """
    # Verify that the user_id in the token matches the user_id in the URL path
    await verify_user_owns_resource(request, str(user_id))

    try:
        logger.info(f"Received request to create conversation for user {user_id}")

        # Override the user_id from the path to prevent mismatch
        conversation_data.user_id = user_id

        conversation = await ChatService.create_conversation(session, conversation_data)
        logger.info(f"Successfully created conversation {conversation.id} for user {user_id}")
        return conversation
    except Exception as e:
        logger.error(f"Error creating conversation for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating conversation"
        )


@router.get("/conversations", response_model=List[ConversationPublic])
async def get_user_conversations(
    request: Request,
    user_id: UUID,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
) -> List[ConversationPublic]:
    """
    Get all conversations for a specific user.
    """
    # Verify that the user_id in the token matches the user_id in the URL path
    await verify_user_owns_resource(request, str(user_id))

    try:
        logger.info(f"Received request to get conversations for user {user_id}")
        conversations = await ChatService.get_user_conversations(session, user_id)
        logger.info(f"Returning {len(conversations)} conversations for user {user_id}")
        return conversations
    except Exception as e:
        logger.error(f"Error retrieving conversations for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving conversations"
        )


@router.get("/conversations/{conversation_id}", response_model=ConversationPublic)
async def get_conversation(
    request: Request,
    user_id: UUID,
    conversation_id: UUID,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
) -> ConversationPublic:
    """
    Get a specific conversation by ID for a user.
    """
    # Verify that the user_id in the token matches the user_id in the URL path
    await verify_user_owns_resource(request, str(user_id))

    try:
        logger.info(f"Received request to get conversation {conversation_id} for user {user_id}")
        conversation = await ChatService.get_conversation_by_id(session, user_id, conversation_id)

        if not conversation:
            logger.warning(f"Conversation {conversation_id} not found for user {user_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )

        logger.info(f"Successfully retrieved conversation {conversation_id} for user {user_id}")
        return conversation
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving conversation {conversation_id} for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving conversation"
        )


@router.post("/conversations/{conversation_id}/messages", response_model=MessagePublic)
async def add_message_to_conversation(
    request: Request,
    user_id: UUID,
    conversation_id: UUID,
    message_data: MessageCreate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
) -> MessagePublic:
    """
    Add a message to a specific conversation.
    """
    # Verify that the user_id in the token matches the user_id in the URL path
    await verify_user_owns_resource(request, str(user_id))

    try:
        logger.info(f"Received request to add message to conversation {conversation_id} for user {user_id}")

        # Override the conversation_id from the path to prevent mismatch
        message_data.conversation_id = conversation_id

        # Validate role is either 'user' or 'assistant'
        if message_data.role not in ['user', 'assistant']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role must be either 'user' or 'assistant'"
            )

        message = await ChatService.add_message_to_conversation(session, message_data)
        logger.info(f"Successfully added message {message.id} to conversation {conversation_id}")
        return message
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding message to conversation {conversation_id} for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error adding message to conversation"
        )


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessagePublic])
async def get_conversation_messages(
    request: Request,
    user_id: UUID,
    conversation_id: UUID,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
) -> List[MessagePublic]:
    """
    Get all messages for a specific conversation.
    """
    # Verify that the user_id in the token matches the user_id in the URL path
    await verify_user_owns_resource(request, str(user_id))

    try:
        logger.info(f"Received request to get messages for conversation {conversation_id} for user {user_id}")
        messages = await ChatService.get_conversation_messages(session, user_id, conversation_id)

        logger.info(f"Returning {len(messages)} messages for conversation {conversation_id}")
        return messages
    except Exception as e:
        logger.error(f"Error retrieving messages for conversation {conversation_id} for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving messages"
        )


@router.post("/chat", response_model=MessagePublic)
async def chat_endpoint(
    request: Request,
    user_id: UUID,
    message_data: MessageCreate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
) -> MessagePublic:
    """
    Main chat endpoint that handles conversation with AI agent.
    This endpoint creates or continues a conversation, runs the agent, and saves the exchange.
    """
    # Verify that the user_id in the token matches the user_id in the URL path
    await verify_user_owns_resource(request, str(user_id))

    try:
        logger.info(f"Received chat request from user {user_id}")

        # Create or get conversation based on message_data
        conversation_id = message_data.conversation_id
        if not conversation_id:
            # Create a new conversation
            conversation_data = ConversationCreate(
                title=message_data.content[:50] + "..." if len(message_data.content) > 50 else message_data.content,
                user_id=user_id
            )
            conversation = await ChatService.create_conversation(session, conversation_data)
            conversation_id = conversation.id
        else:
            # Verify the user owns this conversation
            conversation = await ChatService.get_conversation_by_id(session, user_id, conversation_id)
            if not conversation:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Conversation not found"
                )

        # Add user message to the conversation
        user_message_data = MessageCreate(
            conversation_id=conversation_id,
            role="user",
            content=message_data.content,
            tool_calls=message_data.tool_calls
        )
        user_message = await ChatService.add_message_to_conversation(session, user_message_data)

        # Get conversation history (last 15 messages for context)
        history_messages = await ChatService.get_recent_conversation_messages(session, conversation_id, limit=15)

        # Get the agent instance
        from ...mcp.agents.todo_agent import get_todo_agent
        agent = get_todo_agent()

        # Prepare context for the agent (convert SQLModel messages to dict format)
        context = []
        for msg in history_messages:
            context.append({
                "role": msg.role,
                "content": msg.content,
                "tool_calls": msg.tool_calls
            })

        # Get AI response using the task agent with the conversation history
        # For now, use the current message and user context (in a real implementation, you would provide the full history)
        from ...mcp.runners.task_runner import run_task_agent

        # Run the AI agent to process the user message
        agent_response = await run_task_agent(user_message.content, str(user_id))

        if agent_response["success"]:
            ai_response = agent_response["response"]
        else:
            # Handle error case
            ai_response = "Sorry, I encountered an error processing your request. Please try again."
            logger.error(f"Agent error for user {user_id}: {agent_response['response']}")

        # Add AI response to the conversation
        ai_message_data = MessageCreate(
            conversation_id=conversation_id,
            role="assistant",
            content=ai_response,
            tool_calls=None  # Assuming the response doesn't need tool calls
        )
        ai_message = await ChatService.add_message_to_conversation(session, ai_message_data)

        logger.info(f"Successfully processed chat request for user {user_id}, conversation {conversation_id}")
        return ai_message

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing chat request for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing chat request"
        )