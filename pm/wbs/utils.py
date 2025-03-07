# import requests

# GROQ_API_KEY = "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" # Store API key in environment variables
# GROQ_API_URL = "https://api.groq.com/v1/chat/completions"  # Groq API endpoint

# def call_llm_for_task_assignment(tasks, employees):
#     """
#     Calls Groq LLM API to intelligently assign tasks to employees.
#     """
#     prompt = generate_prompt(tasks, employees)  # Generate structured prompt

#     headers = {
#         "Authorization": f"Bearer {GROQ_API_KEY}",
#         "Content-Type": "application/json"
#     }

#     payload = {
#         "model": "mixtral-8x7b",  # Use Groq's best model
#         "messages": [{"role": "system", "content": "You are an AI that assigns tasks to employees based on skills, workload, and availability."},
#                      {"role": "user", "content": prompt}],
#         "temperature": 0.5
#     }

#     response = requests.post(GROQ_API_URL, json=payload, headers=headers)

#     if response.status_code == 200:
#         return process_llm_response(response.json())
#     else:
#         print(f"Error: {response.status_code} - {response.text}")
#         return {}