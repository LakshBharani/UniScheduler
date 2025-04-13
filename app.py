from flask import Flask, request, jsonify
from flask_cors import CORS
from bs4 import BeautifulSoup
import requests
import pandas as pd
from google import genai
from google.genai import types
import json
from dotenv import load_dotenv
import os

app = Flask(__name__)
CORS(app)
load_dotenv()


def ai_maker(prompt):
    client = genai.Client(
        api_key=os.getenv("GEMINI_API_KEY"),
    )

    model = "gemini-2.0-flash"
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text=f"""{prompt}"""),
            ],
        ),
    ]
    generate_content_config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=genai.types.Schema(
            type=genai.types.Type.OBJECT,
            required=["classes"],
            properties={
                "classes": genai.types.Schema(
                    type=genai.types.Type.ARRAY,
                    items=genai.types.Schema(
                        type=genai.types.Type.OBJECT,
                        required=["crn", "courseNumber", "courseName",
                                  "professorName", "days", "time", "location"],
                        properties={
                            "crn": genai.types.Schema(
                                type=genai.types.Type.STRING,
                            ),
                            "courseNumber": genai.types.Schema(
                                type=genai.types.Type.STRING,
                            ),
                            "courseName": genai.types.Schema(
                                type=genai.types.Type.STRING,
                            ),
                            "professorName": genai.types.Schema(
                                type=genai.types.Type.STRING,
                            ),
                            "days": genai.types.Schema(
                                type=genai.types.Type.STRING,
                            ),
                            "time": genai.types.Schema(
                                type=genai.types.Type.STRING,
                            ),
                            "location": genai.types.Schema(
                                type=genai.types.Type.STRING,
                            ),
                        },
                    ),
                ),
            },
        ),
        system_instruction=[
            types.Part.from_text(text='''
You are a virtual timetable generator.
!!! IMPORTANT !!!
IF ANY COURSE IS CLASHING WITH ANOTHER COURSE, RETURN NOTHING AT ALL UNTIL THE CLASH IS RESOLVED.
                                 
Input:
- A list of required courses the user must take.
- A list of available sections. Each section includes:
    - CRN (Course Reference Number)
    - Course Code
    - Course Name
    - Instructor Name
    - Schedule Type
    - Days (e.g., M, T, W, R, F)
    - Start Time and End Time
    - Location

Special Handling for "* Additional Times *":
- Some sections may include rows labeled "* Additional Times *".
- These rows contain the actual **meeting days, time, and location**, but are missing other fields.
- If an entry is marked as "* Additional Times *", fetch the full course details (Course Code, Name, Instructor, etc.) from the matching CRN's main section.
- Treat these as valid class time blocks and combine them with the main row to form the complete schedule.

🚨 SUPER STRICT RULES (MUST NEVER BE BROKEN):

1. You must select **exactly one section (CRN)** per required course.
2. A selected CRN may have multiple time blocks (e.g., lecture + lab, or MWF) — you must include **all** of them.
3. **No two classes can overlap at all — even by a single minute.**  
   - Example: A class ending at 10:00AM and another starting at 10:00AM is a conflict.
4. There must be **at least a 5-minute gap** between any two consecutive classes.
5. If even a single course causes conflict (due to overlap or missing buffer), you must return **nothing at all** — no partial schedules.
6. If a CRN includes any "* Additional Time *" entries, those must be treated as part of that CRN. Do not exclude them.
7. You must never include only part of a CRN's time blocks — **include all or exclude all**.
8. If the course has a lab, you must include the lab section in the schedule.
9. If the course has a lecture, you must include the lecture section in the schedule.
10. Keep trying until the schedule is valid.
11. Keep 5 minutes gap between classes.

✨ Preferences (only if all strict rules are satisfied):
- Prefer professors mentioned by the user.
- Prefer morning or afternoon classes, if specified.
- Prioritize classes with cleaner or fewer blocks.

✅ Output Format:
If a valid, fully non-overlapping timetable is possible, return it in this format (one row per time block):

CRN    Course    Course Name    Instructor    Day    Start Time - End Time    Location

- One row per day — if a class meets on M/W/F, generate three separate rows.
- Use 12-hour format (e.g., 9:30AM - 10:45AM).
- Do not include headers, comments, or notes — just rows.

❌ If even one course makes the schedule invalid (due to overlap or timing), return **nothing at all**.
                                 
!!! IMPORTANT !!!
BEFORE RETURNING ANY SCHEDULE, CHECK IF THE SCHEDULE IS VALID (NO CLASHES).
IF ANY COURSE IS CLASHING WITH ANOTHER COURSE, RETURN NOTHING AT ALL UNTIL THE CLASH IS RESOLVED. KEEP TRYING UNTIL THE CLASH IS RESOLVED.
'''),
        ],
    )

    responseText = ""
    total_tokens = 0
    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        responseText += chunk.text
        if hasattr(chunk, 'usage_metadata'):
            total_tokens += chunk.usage_metadata.total_token_count
            print(f"Token usage: {total_tokens} tokens")

    print(f"Total token usage: {total_tokens} tokens")

    response_dict = json.loads(responseText)
    return response_dict


def courseDetailsExractor(department: str, coursenumber):
    url = "https://selfservice.banner.vt.edu/ssb/HZSKVTSC.P_ProcRequest"
    form_data = {
        "CAMPUS": "0",
        "TERMYEAR": "202501",
        "CORE_CODE": "AR%",
        "subj_code": department.upper(),
        "SCHDTYPE": "%",
        "CRSE_NUMBER": coursenumber,
        "crn": "",
        "open_only": "",
        "disp_comments_in": "Y",
        "sess_code": "%",
        "BTN_PRESSED": "FIND class sections",
        "inst_name": ""
    }
    response = requests.post(url=url, data=form_data)
    html = response.text
    soup = BeautifulSoup(html, 'html.parser')
    courses_data = []
    rows = soup.find_all('tr')
    for row in rows:
        crn_cell = row.find('a', href=lambda x: x and 'CRN=' in x)
        if not crn_cell:
            continue
        cells = row.find_all('td')
        if len(cells) < 12:
            continue
        crn = crn_cell.find('b').text.strip() if crn_cell.find('b') else ""
        course_cell = cells[1]
        course = course_cell.text.strip()
        title = cells[2].text.strip()
        schedule_type = cells[3].text.strip()
        modality = cells[4].text.strip()
        cr_hrs = cells[5].text.strip()
        capacity = cells[6].text.strip()
        instructor = cells[7].text.strip()
        days = cells[8].text.strip()
        begin_time = cells[9].text.strip()
        end_time = cells[10].text.strip()
        location = cells[11].text.strip()
        exam_cell = cells[12] if len(cells) > 12 else None
        exam_code = exam_cell.find('a').text.strip(
        ) if exam_cell and exam_cell.find('a') else ""
        courses_data.append({
            'CRN': crn,
            'Course': course,
            'Title': title,
            'Schedule Type': schedule_type,
            'Modality': modality,
            'Credit Hours': cr_hrs,
            'Capacity': capacity,
            'Instructor': instructor,
            'Days': days,
            'Begin Time': begin_time,
            'End Time': end_time,
            'Location': location,
            'Exam Code': exam_code
        })
    return pd.DataFrame(courses_data)


@app.route("/api/generate_schedule", methods=['POST'])
def generate_schedule():
    data = request.json
    courses = data.get("courses", [])
    preferences = data.get("preferences", "")
    ai_prompt = ""
    ai_prompt += f"<preferences_by_user>\n{preferences}\n</preferences_by_user>\n"
    for course in courses:
        ai_prompt += f"<course_number>{course['department']+course['number']}</course_number>\n"
        ai_prompt += f"<professor_preference>{course['professor']}</professor_preference>\n"
        ai_prompt += f"<timetable_of_classes_for_the_course>\n"
        df = courseDetailsExractor(course['department'], course['number'])
        ai_prompt += df.to_csv(index=False)
        ai_prompt += "\n</timetable_of_classes_for_the_course>"
    schedule = ai_maker(ai_prompt)

    return jsonify(schedule)


if __name__ == '__main__':
    app.run(debug=True, port=8080)
