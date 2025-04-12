from flask import Flask, request, jsonify
from flask_cors import CORS
from bs4 import BeautifulSoup
import requests
import pandas as pd
from google import genai
from google.genai import types
import json

app = Flask(__name__)
CORS(app)

def ai_maker(prompt):
    client = genai.Client(
        api_key="AIzaSyAuO5pj9LOM94s0QOzAUH6u5YImT0ZLbe4",
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
                        type = genai.types.Type.OBJECT,
                        required = ["classes"],
                        properties = {
                            "classes": genai.types.Schema(
                                type = genai.types.Type.ARRAY,
                                items = genai.types.Schema(
                                    type = genai.types.Type.OBJECT,
                                    required = ["crn", "courseNumber", "courseName", "professorName", "days", "time", "location"],
                                    properties = {
                                        "crn": genai.types.Schema(
                                            type = genai.types.Type.STRING,
                                        ),
                                        "courseNumber": genai.types.Schema(
                                            type = genai.types.Type.STRING,
                                        ),
                                        "courseName": genai.types.Schema(
                                            type = genai.types.Type.STRING,
                                        ),
                                        "professorName": genai.types.Schema(
                                            type = genai.types.Type.STRING,
                                        ),
                                        "days": genai.types.Schema(
                                            type = genai.types.Type.STRING,
                                        ),
                                        "time": genai.types.Schema(
                                            type = genai.types.Type.STRING,
                                        ),
                                        "location": genai.types.Schema(
                                            type = genai.types.Type.STRING,
                                        ),
                                    },
                                ),
                            ),
                        },
                    ),
        system_instruction=[
            types.Part.from_text(text="""Based on the user user's preferences of class schedule and the classes the user chooses with optional professor preference and the given timetable of classes for each course the user chooses find out the single and only best schedule that works out well for him based on his choices. Note if a schedule doesn't work out according to the user's preferences then you can choose to compromise based on priority and give the best schedule. give only one schedul"""),
        ],
    )

    responseText = ""
    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        responseText += chunk.text
    print(responseText)
    response_dict = json.loads(responseText)
    return response_dict

def courseDetailsExractor(department: str,coursenumber):
    url = "https://selfservice.banner.vt.edu/ssb/HZSKVTSC.P_ProcRequest"
    form_data = {
        "CAMPUS": "0",
        "TERMYEAR": "202509",
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
        exam_code = exam_cell.find('a').text.strip() if exam_cell and exam_cell.find('a') else ""
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
    ai_prompt+=f"<preferences_by_user>\n{preferences}\n</preferences_by_user>\n"
    for course in courses:
        ai_prompt+=f"<course_number>{course['department']+course['number']}</course_number>\n"
        ai_prompt+=f"<professor_preference>{course['professor']}</professor_preference>\n"
        ai_prompt+=f"<timetable_of_classes_for_the_course>\n"
        df = courseDetailsExractor(course['department'], course['number'])
        ai_prompt += df.to_csv(index=False)
        ai_prompt+="\n</timetable_of_classes_for_the_course>"
    schedule = ai_maker(ai_prompt)

    return jsonify(schedule)

if __name__ == '__main__':
    app.run(debug=True, port=8080)