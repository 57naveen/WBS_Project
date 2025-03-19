import google.generativeai as genai
import json
import datetime
import re
from django.conf import settings

# Initialize Gemini API client
genai.configure(api_key=settings.GEMINI_API_KEY)

def get_project_information_and_breakdown(project_name, project_description, deadline):
    """
    Uses Gemini 2.0 Flash model to generate daily tasks for the project until the deadline.
    Ensures correct date generation for each task, including required skills.
    """

    # Validate deadline
    project_start_date = datetime.date.today()
    try:
        deadline_date = datetime.datetime.strptime(deadline, "%Y-%m-%d").date()
    except ValueError:
        return {"error": "Invalid deadline format. Use YYYY-MM-DD."}

    total_days = (deadline_date - project_start_date).days
    if total_days <= 0:
        return {"error": "Deadline must be in the future."}

    prompt = f"""
    Given the project "{project_name}" with the description: "{project_description}",
    break it down into **daily tasks** so that each day has a detailed set of actions until the deadline: {deadline}.

    Each task must include:
    - A **step-by-step breakdown** of what needs to be done.
    - The **required skills** to complete the task (e.g., ["Python", "React", "Project Management"]).

    **Important Rules:**
    - Ensure tasks are assigned **only between {project_start_date} and {deadline_date}**.
    - Do NOT use any dates in the past or far future.
    - Use a **strict YYYY-MM-DD format** for dates.
    - Return only **valid JSON** with no extra text, no markdown formatting, and no explanations.

    **Example Output Format (valid JSON array only):**
    
    [
        {{"date": "YYYY-MM-DD", "tasks": [
            {{"task_name": "Task 1", "description": "Step 1: Do this. Step 2: Do that.", "required_skills": ["Python", "Django"]}},
            {{"task_name": "Task 2", "description": "Step 1: Research. Step 2: Develop.", "required_skills": ["React", "JavaScript"]}}
        ]}}
    ]
    """

    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)

        if not response or not hasattr(response, "text"):
            return {"error": "Invalid response from Gemini API"}

        # Extract raw response content
        task_text = response.text.strip()
        print("🔍 Raw LLM Response:", task_text)

        # Fix and parse JSON
        daily_tasks = fix_and_parse_json(task_text, project_start_date, deadline_date)

        # Validate final structure
        if not isinstance(daily_tasks, list):
            return {"error": "Parsed JSON is not a list", "details": daily_tasks}

        if not daily_tasks:
            return {"error": "No tasks generated by LLM"}

        return daily_tasks

    except Exception as e:
        return {"error": "Unexpected error occurred", "details": str(e)}

def fix_and_parse_json(raw_text, start_date, end_date):
    """
    Fixes common JSON formatting issues and ensures correct date generation.
    """

    try:
        # 1️⃣ Remove Markdown formatting
        raw_text = raw_text.replace("```json", "").replace("```", "").strip()

        # 2️⃣ Extract only the JSON part
        json_match = re.search(r"\[\s*{.*}\s*\]", raw_text, re.DOTALL)
        fixed_json = json_match.group(0).strip() if json_match else raw_text

        # 3️⃣ Fix common JSON issues

        # Remove extra trailing commas before closing brackets
        fixed_json = re.sub(r",\s*]", "]", fixed_json)  # Fix ", ]" -> "]"
        fixed_json = re.sub(r",\s*}", "}", fixed_json)  # Fix ", }" -> "}"

        # Fix misplaced colons inside text (like in "Set up the project structure,:create")
        fixed_json = re.sub(r":\s*([a-zA-Z])", r", \1", fixed_json)  # Fix ":word" -> ", word"

        # Ensure proper comma placement between objects
        fixed_json = re.sub(r"}\s*{", "}, {", fixed_json)

        # 4️⃣ Parse JSON
        parsed_data = json.loads(fixed_json)

        # 5️⃣ Fix Dates and Ensure `required_skills` Exists
        corrected_tasks = []
        current_date = start_date

        for task_entry in parsed_data:
            task_entry["date"] = current_date.strftime("%Y-%m-%d")

            # Ensure `tasks` exist
            task_entry["tasks"] = task_entry.get("tasks", [])

            # Ensure each task has `required_skills`
            for task in task_entry["tasks"]:
                if "required_skills" not in task or not isinstance(task["required_skills"], list):
                    task["required_skills"] = []  # Default to empty list if missing

            corrected_tasks.append(task_entry)

            # Increment date
            current_date += datetime.timedelta(days=1)
            if current_date > end_date:
                break  # Stop if we reach the deadline

        return corrected_tasks

    except json.JSONDecodeError as e:
        return {"error": "Failed to parse JSON", "details": str(e), "raw_text": raw_text}
