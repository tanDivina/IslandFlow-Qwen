import os
import logging
import datetime
import json
import requests
from dotenv import load_dotenv

# Import tools from our mcp_server
from mcp_server import (
    get_tours, get_bookings, check_weather, add_booking, 
    reschedule_booking, generate_itinerary, clear_execution_logs, 
    execution_logs, cancel_booking, update_guest_profile, 
    get_current_coastal_advisory
)
from db import save_conversational_memory, get_conversational_memories

load_dotenv()

logger = logging.getLogger("agent")

SYSTEM_PROMPT = """You are the Bocas del Toro Eco-Tourism Concierge & Logistics Dispatcher.
Your persona is warm, welcoming, and hospitable, reflecting the authentic Afro-Caribbean local spirit of Bocas del Toro, Panama.
You treat guests like family. Use local warmth in your tone (occasional light island phrasing like "welcome to paradise", "respect", "Pura vida", "no stress", but keep it highly professional, clear, and action-oriented).

Your primary responsibilities are:
1. Help guests view and manage their tour schedules. Use the `current_date` provided in the Guest Context prefix block as "today's" date to resolve relative terms like "today", "tomorrow", "yesterday", or "day after tomorrow". Do NOT ask the guest what today's date is!
2. Ground your answers ONLY in verified data retrieved from the tools (like tours, bookings, and weather).
3. Handle the full booking lifecycle:
   - **Booking New Activities:** You are fully empowered and authorized to book new activities for guests from scratch. If a guest asks to book a new activity or says "yes" to scheduling a recommended tour, you MUST immediately call the `add_booking` tool with the appropriate `guest_id`, `tour_id`, `date`, and `slot` parameters, and then compile their updated schedule using the `generate_itinerary` tool. Never tell the guest that you lack a booking tool or cannot book new reservations!
   - **Rescheduling Activities:** If weather alerts are triggered (e.g. heavy rain or wave warning on a day they have an outdoor tour):
     a. Find their bookings for that day using `get_bookings`.
     b. Identify if any are outdoor tours.
     c. Search for indoor alternative tours that match their stay period and slot (morning/afternoon) using `get_tours`.
     d. Formulate a reschedule proposal. If changing the tour, explain the details and why it is a great option.
     e. Ask the guest for their approval (human-in-the-loop). DO NOT execute the database update until they agree!
     f. Once they agree (represented by their chat response or an API button click), run the `reschedule_booking` tool, confirm the slots, and generate their updated itinerary document using `generate_itinerary`.
   - **Cancelling Activities:** If a guest wants to cancel a scheduled tour, you MUST call the `cancel_booking` tool with the appropriate `booking_id` to release the slot and notify the captain.
4. Manage Conversational Memories:
   - You have access to the guest's persistent memories in the Guest Context block. You must proactively customize all scheduling recommendations, restaurant reviews, or alternative proposals to respect these memories (e.g. if memories say they have a seafood allergy or hate snorkeling, never recommend snorkeling or seafood meals).
   - If the guest mentions a new preference, constraint, allergy, or hate/dislike during your chat, you MUST immediately call the `save_conversational_memory` tool to store this persistent preference in their profile. Do NOT wait, do it immediately so it is saved for future sessions.

Always check the guest's bookings first using get_bookings, check weather forecasts using check_weather, and browse available activities using get_tours.
Be proactive. If you see a logistics conflict (like rain for a snorkeling trip), bring it up and offer the solution.

5. Weather-Intelligent Spatial Logistics & Yacht Matchmaking Rules:
   - **Resort Island Location vs. Tour Island Location:**
     * Guests stay at hotels located on specific islands (e.g., "Isla Colon", "Isla Bastimentos", "Isla Carenero", "Isla San Cristóbal").
     * Tours also occur on specific islands.
     * ALWAYS inspect the guest's hotel location and the tour location.
     * **Zero-Transit Bypass Rule:** If both the guest's hotel and their tour are on the SAME island (specifically if both are on the main island "Isla Colon"), then NO water transit is needed. In this case, inform the guest that they can travel on foot or by land vehicle, and no boat ride/water taxi dispatch is required!
   - **Vessel Sizing & High Wave Action (Waves 1.0m to 1.5m):**
     * High waves are dangerous for small open boats ("Pangas").
     * When checking the weather forecast and seeing wave heights between 1.0m and 1.5m (moderate waves), tell the guest that they are being automatically upgraded to a robust, larger wave-fit vessel (like Aqua Express or Bocas Explorer) for their safety and comfort. Assure them they are in safe hands with a wave-fit vessel!
   - **Extreme Weather / Severe Swell (Waves > 1.5m):**
     * When waves exceed 1.5m, water travel is strictly halted and outdoor tours are cancelled.
     * If such weather occurs or is predicted, proactively advise the guest to stay on their resort's island and propose local resort activities. Look up their hotel's local activities from their tenant-brand configuration and recommend those hotel-specific activities instead of water transit!

Respect the guest's constraints:
- Slot capacity: Do not book tours that have 0 slots left.
- ABSOLUTE MANDATE: NO DUPLICATE BOOKINGS / NO RE-RECOMMENDING. Each tour or activity is a unique, one-time experience per guest stay.
  * You MUST call `get_bookings` first to inspect the guest's entire stay before making any suggestions.
  * You MUST always call `get_tours(guest_id=...)` passing the active guest's ID (e.g., 'g1', 'g2', etc.) as the `guest_id` parameter to automatically retrieve only tours that they have not already booked.
  * Once a guest has booked or scheduled an activity on ANY day of their stay, that activity is PERMANENTLY RETIRED.
  * Under no circumstances can you ever list, suggest, recommend, or reschedule them into an activity they have already booked on another day.
  * You must completely omit retired tours from all suggestions. Do NOT say "though you have it on June 9th, it's still an option" or similar. Once booked, act as if that activity no longer exists for future dates. Offer only the remaining available options that they have not experienced at all (e.g., if Finca Montezuma Chocolate Workshop and Afro-Caribbean Cooking Masterclass are already booked, recommend Carenero Island Spa & Massage as the ONLY remaining indoor option).

Safety & Formatting Rules:
- STRICT PERSONA AND TONE GUARDRAILS:
  * Do NOT start consecutive sentences, lines, or paragraphs with repetitive greetings or clichés like "respect", "my friend", "respect, my friend", "Pura vida", or "no stress".
  * NEVER begin consecutive lines or paragraphs with the same introductory clichés or words. Keep your opening lines direct, helpful, and completely unique.
  * It is okay to use a local warm island phrase ONCE in an entire response (for example, as a warm sign-off at the very end of your response), but NEVER at the start of consecutive segments.
  * Keep the majority of your sentences focused, helpful, professional, and clear.
  * Avoid any repetitive or cliché language. The butler must sound reliable, intelligent, and refined to preserve a premium 5-star resort feel.
- Never expose technical database IDs (such as 't1', 't4', 'b1', 'b2') to the guest in your chat messages. Refer to tours and bookings by their names only.
"""

# Tool schemas for OpenAI-compatible (Qwen) API
QWEN_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_tours",
            "description": "Retrieve all available eco-tourism tours and activities in Bocas del Toro, including indoor/outdoor status and pricing. Pass guest_id to automatically filter out tours they have already booked on any day of their stay.",
            "parameters": {
                "type": "object",
                "properties": {
                    "guest_id": {
                        "type": "string",
                        "description": "Optional guest ID to filter out tours they already booked."
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_bookings",
            "description": "Fetch the active tour itinerary/bookings for a specific guest by their guest_id.",
            "parameters": {
                "type": "object",
                "properties": {
                    "guest_id": {
                        "type": "string",
                        "description": "The unique guest ID."
                    }
                },
                "required": ["guest_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "check_weather",
            "description": "Check the simulated or real weather forecast and wave heights for a specific date in Bocas del Toro. Automatically falls back to high-accuracy live Open-Meteo APIs (9.3403° N, 82.2420° W) if no manual simulator storms are active.",
            "parameters": {
                "type": "object",
                "properties": {
                    "date": {
                        "type": "string",
                        "description": "The target date in YYYY-MM-DD format."
                    }
                },
                "required": ["date"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "add_booking",
            "description": "Creates a new booking for a guest for a specific activity on a given date and slot (morning/afternoon). Adjusts inventory/slots and registers dispatch accordingly.",
            "parameters": {
                "type": "object",
                "properties": {
                    "guest_id": {
                        "type": "string",
                        "description": "The unique guest ID."
                    },
                    "tour_id": {
                        "type": "string",
                        "description": "The unique tour ID (e.g. t1, t2)."
                    },
                    "date": {
                        "type": "string",
                        "description": "The target date in YYYY-MM-DD format."
                    },
                    "slot": {
                        "type": "string",
                        "description": "The session slot, either 'morning' or 'afternoon'.",
                        "enum": ["morning", "afternoon"]
                    }
                },
                "required": ["guest_id", "tour_id", "date"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "reschedule_booking",
            "description": "Reschedules an existing booking to a new date, and optionally shifts it to a different activity (alternative_tour_id). Adjusts inventory/slots accordingly.",
            "parameters": {
                "type": "object",
                "properties": {
                    "booking_id": {
                        "type": "string",
                        "description": "The unique booking ID (e.g. b1, b2)."
                    },
                    "new_date": {
                        "type": "string",
                        "description": "The new date in YYYY-MM-DD format."
                    },
                    "alternative_tour_id": {
                        "type": "string",
                        "description": "Optional tour ID if changing the activity during rescheduling."
                    }
                },
                "required": ["booking_id", "new_date"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "generate_itinerary",
            "description": "Generate a clean, professional customer itinerary text in Markdown format for the guest's stay.",
            "parameters": {
                "type": "object",
                "properties": {
                    "guest_id": {
                        "type": "string",
                        "description": "The unique guest ID."
                    }
                },
                "required": ["guest_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "cancel_booking",
            "description": "Cancel an existing activity booking, release the reserved slot back into the inventory (+1 available slots), and cancel the associated captain's water taxi dispatch order.",
            "parameters": {
                "type": "object",
                "properties": {
                    "booking_id": {
                        "type": "string",
                        "description": "The unique booking ID to cancel."
                    }
                },
                "required": ["booking_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_guest_profile",
            "description": "Update a guest's profile preferences and safety/health restrictions (such as food allergies or physical limitations) directly in the database to ensure personalized and safe scheduling.",
            "parameters": {
                "type": "object",
                "properties": {
                    "guest_id": {
                        "type": "string",
                        "description": "The unique guest ID."
                    },
                    "preferences": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Updated preferences tags (e.g., ['wildlife', 'food'])."
                    },
                    "restrictions": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Updated safety/health restrictions tags."
                    }
                },
                "required": ["guest_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_current_coastal_advisory",
            "description": "Retrieve the live regional maritime bulletin and safety advisories issued by the Panama National Civil Protection Service (SINAPROC) and the Coastal Port Guard for Bocas del Toro.",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "save_conversational_memory",
            "description": "Save or record a persistent guest preference, constraint, allergy, or scheduling choice into the conversational memory database so that it persists across chat sessions.",
            "parameters": {
                "type": "object",
                "properties": {
                    "guest_id": {
                        "type": "string",
                        "description": "The unique guest ID (e.g., 'g1')."
                    },
                    "memory_text": {
                        "type": "string",
                        "description": "The specific preference or constraint summary to record (e.g., 'Alex Mercer has a mild seafood allergy and dislikes snorkeling')."
                    }
                },
                "required": ["guest_id", "memory_text"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_conversational_memories",
            "description": "Retrieve all saved persistent conversational memories/preferences for a given guest.",
            "parameters": {
                "type": "object",
                "properties": {
                    "guest_id": {
                        "type": "string",
                        "description": "The unique guest ID."
                    }
                },
                "required": ["guest_id"]
            }
        }
    }
]

TOOL_FUNCTIONS = {
    "get_tours": get_tours,
    "get_bookings": get_bookings,
    "check_weather": check_weather,
    "add_booking": add_booking,
    "reschedule_booking": reschedule_booking,
    "generate_itinerary": generate_itinerary,
    "cancel_booking": cancel_booking,
    "update_guest_profile": update_guest_profile,
    "get_current_coastal_advisory": get_current_coastal_advisory,
    "save_conversational_memory": save_conversational_memory,
    "get_conversational_memories": get_conversational_memories
}

# --- Gemini ADK Setup ---
try:
    from google.adk import Agent, Runner
    from google.adk.sessions import InMemorySessionService
    from google.genai import types
    session_service = InMemorySessionService()
    runner = None
except ImportError:
    # Fail gracefully if ADK is not installed (e.g. on a lightweight Qwen setup)
    Agent = None
    Runner = None
    types = None
    session_service = None
    runner = None

def get_runner():
    global runner
    if Agent is None or Runner is None:
        raise ValueError("Google ADK SDK is not available in this environment.")
        
    if runner is None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY is not set. Please add it to your backend/.env file.")
        
        adk_agent = Agent(
            name="BocasEcoConciergeAgent",
            model="gemini-3.1-flash-lite",
            instruction=SYSTEM_PROMPT,
            tools=[
                get_tours, get_bookings, check_weather, add_booking, 
                reschedule_booking, generate_itinerary, cancel_booking, 
                update_guest_profile, get_current_coastal_advisory
            ]
        )
        
        runner = Runner(
            agent=adk_agent,
            app_name="BocasConciergeApp",
            session_service=session_service,
            auto_create_session=True
        )
    return runner

def clear_adk_session(guest_id: str):
    """Deletes the ADK sessions associated with the user/guest to start fresh."""
    if session_service is None:
        return
    try:
        session_id = f"session_{guest_id}"
        session_service.delete_session_sync(
            app_name="BocasConciergeApp",
            user_id=guest_id,
            session_id=session_id
        )
        logger.info(f"Deleted ADK session '{session_id}' for guest '{guest_id}'.")
    except Exception as e:
        logger.error(f"Error deleting ADK session: {e}")

# --- Qwen / OpenAI-Compatible Agent Loop ---
def run_qwen_agent(guest_id: str, user_message: str, history: list = None) -> tuple[str, list]:
    clear_execution_logs()
    
    api_key = os.getenv("DASHSCOPE_API_KEY") or os.getenv("OPENAI_API_KEY")
    if not api_key:
        return "Respect, my friend! I need a valid `DASHSCOPE_API_KEY` or `OPENAI_API_KEY` to talk to you via Qwen. Please set it up in the `backend/.env` file and let's get going! 🌴", list(execution_logs)
        
    api_base = os.getenv("OPENAI_API_BASE", "https://dashscope-intl.aliyuncs.com/compatible-mode/v1")
    model_name = os.getenv("QWEN_MODEL", "qwen3.7-plus")
    
    # 1. Build messages list starting with system prompt
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    
    # 2. Add history
    if history:
        for h in history:
            role = "user" if h.get("role") == "user" else "assistant"
            content = h.get("text") or h.get("content") or ""
            if content:
                messages.append({"role": role, "content": content})
                
    # 3. Add current user message with memories pre-fetched and injected for high-performance zero-shot memory retrieval
    current_date = datetime.date.today().strftime("%Y-%m-%d")
    try:
        memories = get_conversational_memories(guest_id)
        memories_str = "; ".join(memories) if memories else "None recorded yet."
    except Exception as mem_ex:
        logger.error(f"Failed to pre-fetch conversational memories: {mem_ex}")
        memories_str = "None recorded yet."
        
    contextualized_prompt = f"[Guest Context: guest_id='{guest_id}', current_date='{current_date}', Guest Persistent Memories: {memories_str}]\nUser message: {user_message}"
    messages.append({"role": "user", "content": contextualized_prompt})
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # 4. Tool Execution Loop
    max_turns = 10
    current_turn = 0
    
    while current_turn < max_turns:
        payload = {
            "model": model_name,
            "messages": messages,
            "tools": QWEN_TOOLS
        }
        
        try:
            logger.info(f"Sending request to Qwen API ({model_name})...")
            response = requests.post(f"{api_base}/chat/completions", headers=headers, json=payload, timeout=30)
            if response.status_code != 200:
                logger.error(f"Qwen API returned error status {response.status_code}: {response.text}")
                return f"I'm having a brief connection issue with my island signals, my friend. Let's try again in a moment. (HTTP {response.status_code})", list(execution_logs)
                
            res_json = response.json()
            choice = res_json.get("choices", [{}])[0]
            message = choice.get("message", {})
            content = message.get("content") or ""
            tool_calls = message.get("tool_calls")
            
            if not tool_calls:
                # No more tools requested. Return the final content.
                return content, list(execution_logs)
                
            # If tool calls are requested, append assistant message with tool calls to history
            messages.append(message)
            
            # Execute tool calls
            for tc in tool_calls:
                tc_id = tc.get("id")
                func_info = tc.get("function", {})
                func_name = func_info.get("name")
                arguments_str = func_info.get("arguments", "{}")
                
                args = {}
                if isinstance(arguments_str, dict):
                    args = arguments_str
                elif isinstance(arguments_str, str):
                    try:
                        args = json.loads(arguments_str)
                    except Exception as json_err:
                        logger.error(f"Failed to parse tool arguments JSON: {json_err} (Arguments: {arguments_str})")
                        args = {}
                        
                logger.info(f"Executing tool {func_name} with arguments {args}")
                
                if func_name in TOOL_FUNCTIONS:
                    try:
                        tool_result = TOOL_FUNCTIONS[func_name](**args)
                    except Exception as tool_ex:
                        logger.error(f"Error executing tool {func_name}: {tool_ex}")
                        tool_result = f"Error executing tool: {str(tool_ex)}"
                else:
                    tool_result = f"Error: Tool {func_name} is not available."
                    
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc_id,
                    "name": func_name,
                    "content": str(tool_result)
                })
                
            current_turn += 1
            
        except Exception as e:
            logger.error(f"Failed to call Qwen API or execute tool: {e}")
            return f"I'm having a brief connection issue with my island signals, my friend. Let's try again in a moment. (Error: {str(e)})", list(execution_logs)
            
    return "I apologize, my friend. We had too many coordination steps. Let's try simplifying the requests. Pura vida!", list(execution_logs)

# --- Dispatcher ---
def run_concierge_agent(guest_id: str, user_message: str, history: list = None) -> tuple[str, list]:
    """
    Runs the appropriate agent loop depending on LLM_PROVIDER.
    """
    provider = os.getenv("LLM_PROVIDER", "qwen").lower()
    
    if provider == "qwen":
        return run_qwen_agent(guest_id, user_message, history)
    else:
        # Default/Fallback to Gemini ADK Agent
        clear_execution_logs()
        try:
            current_runner = get_runner()
        except ValueError as ve:
            logger.error(str(ve))
            return "Respect, my friend! I need a valid `GEMINI_API_KEY` to talk to you. Please set it up in the `backend/.env` file and let's get going! 🌴", list(execution_logs)

        session_id = f"session_{guest_id}"

        # If the history is empty, clear the ADK session so that we start fresh.
        if not history:
            clear_adk_session(guest_id)

        # In ADK, we construct a types.Content object as the new user message.
        # We inject the guest context context silently in the background.
        current_date = datetime.date.today().strftime("%Y-%m-%d")
        contextualized_prompt = f"[Guest Context: guest_id='{guest_id}', current_date='{current_date}']\nUser message: {user_message}"
        
        new_message = types.Content(
            role="user",
            parts=[types.Part.from_text(text=contextualized_prompt)]
        )

        try:
            # Run ADK agent turn
            events = current_runner.run(
                user_id=guest_id,
                session_id=session_id,
                new_message=new_message
            )
            
            events_list = list(events)
            final_text = ""
            
            # Extract the final response text from the events list
            for event in events_list:
                if event.is_final_response() and event.content and event.content.parts:
                    text_parts = [part.text for part in event.content.parts if part.text]
                    if text_parts:
                        final_text = "".join(text_parts)
                        
            # Fallback if no is_final_response event has content
            if not final_text:
                for event in reversed(events_list):
                    if event.content and event.content.parts and event.content.role == "model":
                        text_parts = [part.text for part in event.content.parts if part.text]
                        if text_parts:
                            final_text = "".join(text_parts)
                            break
                            
            if not final_text:
                final_text = "I processed your request, my friend. Let know what else I can do for you. Pura vida! 🌴"
                
            return final_text, list(execution_logs)

        except Exception as e:
            logger.error(f"ADK Runner execution failed: {e}")
            return f"I'm having a brief connection issue with my island signals, my friend. Let's try again in a moment. (Error: {str(e)})", list(execution_logs)
