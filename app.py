from datetime import datetime, timezone
import ast
from uuid import uuid4
import random
import matplotlib.colors as mcolors
import matplotlib.pyplot as plt
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from bs4 import BeautifulSoup
import requests
import pandas as pd
import google.generativeai as genai
import json
from dotenv import load_dotenv
import os
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
import io
import matplotlib
matplotlib.use('Agg')


app = Flask(__name__)
CORS(app)
load_dotenv()

# json_doc_loc = "invite_codes.json"

log_file = "server_logs.json"
if not os.path.exists(log_file):
    with open(log_file, 'w') as f:
        json.dump([], f)

# Token total file for running total
TOKEN_TOTAL_FILE = "token_total.json"
if not os.path.exists(TOKEN_TOTAL_FILE):
    with open(TOKEN_TOTAL_FILE, 'w') as f:
        json.dump({"total_tokens": 0}, f)


def save_log_entry(timestamp=datetime.now(timezone.utc), message=""):
    log_entry = {
        timestamp.isoformat(): message
    }
    with open(log_file, 'r+') as f:
        logs = json.load(f)
        logs.append(log_entry)
        f.seek(0)
        json.dump(logs, f, indent=4)


def load_json_file(file_path):
    with open(file_path, 'r') as file:
        data = json.load(file)
    return data


def save_json_file(file_path, data):
    with open(file_path, 'w') as file:
        json.dump(data, file, indent=4)


# def verify_invite_code(code: str) -> bool:
#     data = load_json_file(json_doc_loc)
#     if code in data:
#         return True
#     else:
#         return False


# def add_invite_code(username: str, password: str, name: str, email: str) -> str:
#     credentials_str = os.getenv("AUTHORIZED_USERS")
#     auth_users_credentials = ast.literal_eval(credentials_str)

#     if username not in auth_users_credentials or password != auth_users_credentials[username]:
#         return "0"

#     data = load_json_file(json_doc_loc)

#     # Check if email already exists
#     for code, info in data.items():
#         if info.get("email") == email:
#             return code  # Return existing code if email matches

#     # Otherwise, create a new code
#     code = str(uuid4())
#     while code in data:
#         code = str(uuid4())

#     data[code] = {"name": name, "email": email}
#     save_json_file(json_doc_loc, data)
#     save_log_entry(message=f"New invite code generated for {name} ({email}) with code {code}")
#     return code


# def remove_invite_code(code: str, username: str, password: str) -> bool:
#     data = load_json_file(json_doc_loc)
#     credentials_str = os.getenv("AUTHORIZED_USERS")
#     auth_users_credentials = ast.literal_eval(credentials_str)
#     if username not in auth_users_credentials or password != auth_users_credentials[username]:
#         return False
#     if code in data:
#         del data[code]
#         save_json_file(json_doc_loc, data)
#         return True
#     else:
#         return False


def generate_schedule_pdf(schedule_data, inputColors):
    try:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []
        elements.append(Paragraph("Course Schedule", styles["Title"]))
        elements.append(Spacer(1, 12))

        table_data = [["Course", "Number", "CRN",
                       "Day", "Time", "Location", "Professor"]]
        for cls in schedule_data:
            table_data.append([
                cls["courseName"], cls["courseNumber"], cls["crn"],
                cls["days"], cls["time"], cls["location"], cls["professorName"]
            ])

        table = Table(table_data, repeatRows=1)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 20))

        create_calendar_plot(schedule_data, inputColors, "calendar_plot.png")
        from reportlab.platypus import Image
        elements.append(Image("calendar_plot.png", width=500, height=300))

        doc.build(elements)
        buffer.seek(0)
        os.remove("calendar_plot.png")
        save_log_entry(message="PDF generated successfully")
        return buffer
    except Exception as e:
        save_log_entry(message=f"Error generating PDF: {str(e)}")


def create_calendar_plot(classes, inputColors, filename):
    days_map = {'M': 0, 'T': 1, 'W': 2, 'R': 3, 'F': 4}
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.set_xlim(0, 5)
    ax.set_ylim(7, 21)  # 7 AM to 9 PM
    ax.set_xticks(range(5))
    for i, day in enumerate(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']):
        ax.text(i + 0.5, 6.9, day, ha='center',
                va='bottom', fontsize=10, fontweight='bold')
    ax.set_yticks(range(7, 22))
    ax.set_yticklabels([f"{h}:00" for h in range(7, 22)])
    ax.grid(True)
    ax.invert_yaxis()

    # Assign a unique color per courseNumber
    color_choices = list(mcolors.TABLEAU_COLORS.values())
    random.shuffle(color_choices)
    course_colors = {}
    color_index = 0

    for cls in classes:
        try:
            course_number = cls["courseNumber"]
            if course_number not in course_colors:
                course_colors[course_number] = mcolors.to_rgb(
                    inputColors[cls['crn']])
                color_index += 1

            color = course_colors[course_number]

            start_time, end_time = cls["time"].split(" - ")
            start_hour = convert_to_24hr(start_time)
            end_hour = convert_to_24hr(end_time)

            # Only show classes between 7AM and 9PM
            if start_hour < 7 or end_hour > 21:
                continue

            for day in cls["days"]:
                day_index = days_map.get(day)
                if day_index is not None:
                    ax.add_patch(plt.Rectangle(
                        (day_index, start_hour),
                        1, end_hour - start_hour,
                        color=color, alpha=1.0, zorder=2
                    ))
                    ax.text(
                        day_index + 0.5,
                        start_hour + (end_hour - start_hour) / 2,
                        f"{cls['courseNumber']}\n{cls['location']}",
                        ha='center',
                        va='center',
                        fontsize=8,
                        wrap=True
                    )
        except Exception as e:
            save_log_entry(message=f"Error plotting class {cls}: {e}")

    plt.title("Weekly Calendar View", pad=20)
    plt.tight_layout()
    plt.subplots_adjust(top=0.90)
    plt.savefig(filename)
    plt.close()


def convert_to_24hr(time_str):
    return datetime.strptime(time_str, "%I:%M%p").hour + datetime.strptime(time_str, "%I:%M%p").minute / 60


def get_total_tokens():
    with open(TOKEN_TOTAL_FILE, 'r') as f:
        data = json.load(f)
    return data.get("total_tokens", 0)


def update_total_tokens(tokens):
    total = get_total_tokens() + tokens
    with open(TOKEN_TOTAL_FILE, 'w') as f:
        json.dump({"total_tokens": total}, f)
    return total


def ai_maker(prompt, courses):
    # Configure the API key
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

    # Use the model from environment variable
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")

    max_retries = 5  # Maximum number of retries to find a non-overlapping schedule
    retry_count = 0
    total_tokens = 0

    while retry_count < max_retries:
        # Create the structured output schema
        schema = {
            "type": "object",
            "properties": {
                "classes": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "crn": {"type": "string"},
                            "courseNumber": {"type": "string"},
                            "courseName": {"type": "string"},
                            "professorName": {"type": "string"},
                            "days": {"type": "string"},
                            "time": {"type": "string"},
                            "location": {"type": "string"},
                            "isLab": {"type": "boolean"}
                        },
                        "required": ["crn", "courseNumber", "courseName", "professorName", "days", "time", "location"]
                    }
                }
            },
            "required": ["classes"]
        }

        try:
            # Create the model
            model = genai.GenerativeModel(model_name)

            # Generate content with structured output
            response = model.generate_content(
                f"""You are a virtual timetable generator.
!!! IMPORTANT !!!
IF ANY COURSE IS CLASHING WITH ANOTHER COURSE, RETURN NOTHING AT ALL UNTIL THE CLASH IS RESOLVED.

🚨 CRITICAL FORMAT REQUIREMENT:
- Course codes MUST be in the format: DEPARTMENTNUMBER (e.g., "ENGL1106", "CS2114")
- DO NOT use hyphens in course codes (e.g., do NOT use "ENGL-1106" or "CS-2114")
                                 
Input:
- A list of required courses the user must take.
- A list of available sections. Each section includes:
    - CRN (Course Reference Number)
    - Course Code
    - Course Name
    - Instructor Name
    - Schedule Type (Lecture, Lab, etc.)
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
8. For courses with both lecture and lab components:
   - You MUST include both components in the schedule
   - If you cannot fit both components without conflicts, return nothing
   - Do not create a schedule with only lecture or only lab
9. For courses with only lecture or only lab:
   - You MUST include that component
   - If you cannot fit it without conflicts, return nothing
10. Keep trying different combinations until you find a valid schedule
11. If no valid schedule is possible after trying all combinations, return "NO_VALID_SCHEDULE_FOUND"

✨ Preferences (only if all strict rules are satisfied):
- Prefer professors mentioned by the user
- Prefer morning or afternoon classes, if specified
- Prioritize classes with cleaner or fewer blocks

✅ Output Format:
If a valid, fully non-overlapping timetable is possible, return it in this format (one row per time block):

CRN    Course    Course Name    Instructor    Day    Start Time - End Time    Location

- One row per day — if a class meets on M/W/F, generate three separate rows
- Use 12-hour format (e.g., 9:30AM - 10:45AM)
- Do not include headers, comments, or notes — just rows
- Course codes MUST be in the format: DEPARTMENTNUMBER (e.g., "ENGL1106", "CS2114")
- DO NOT use hyphens in course codes

❌ If even one course makes the schedule invalid (due to overlap or timing), return **nothing at all**.

!!! IMPORTANT !!!
BEFORE RETURNING ANY SCHEDULE:
1. Check for any time overlaps between all classes
2. Verify that all required components (lecture/lab) are included
3. Ensure there is at least a 5-minute gap between consecutive classes
4. If any of these checks fail, return nothing and try another combination
5. If no valid combination is found after trying all possibilities, return "NO_VALID_SCHEDULE_FOUND"

{prompt}""",
                generation_config=genai.types.GenerationConfig(
                    response_mime_type="application/json",
                    response_schema=schema
                )
            )

            responseText = response.text
            total_tokens = response.usage_metadata.total_token_count if response.usage_metadata else 0
            print(f"Total token usage: {total_tokens} tokens")

            try:
                response_dict = json.loads(responseText)

                # If we got a valid schedule, check for overlaps and completeness
                if "classes" in response_dict and response_dict["classes"]:
                    # First, check if all requested courses are included
                    requested_courses = set()
                    for course in courses:
                        requested_courses.add(
                            course['department'] + course['number'])

                    scheduled_courses = set()
                    for cls in response_dict["classes"]:
                        # Normalize course number by removing hyphens
                        course_number = cls["courseNumber"].replace("-", "")
                        scheduled_courses.add(course_number)

                    if requested_courses != scheduled_courses:
                        print(
                            f"Missing courses in schedule. Requested: {requested_courses}, Scheduled: {scheduled_courses}")
                        retry_count += 1
                        continue

                    # Convert time strings to minutes for easier comparison
                    def time_to_minutes(time_str):
                        # Handle different time formats
                        if ' ' in time_str:
                            time, period = time_str.split()
                        else:
                            # If no space, find where the time ends and period begins
                            for i, char in enumerate(time_str):
                                if char.isalpha():
                                    time = time_str[:i]
                                    period = time_str[i:]
                                    break
                            else:
                                # If no period found, assume 24-hour format
                                time = time_str
                                period = ''

                        # Parse hours and minutes
                        if ':' in time:
                            hours, minutes = map(int, time.split(':'))
                        else:
                            hours = int(time)
                            minutes = 0

                        # Convert to 24-hour format
                        if period:
                            if period.upper() == 'PM' and hours != 12:
                                hours += 12
                            elif period.upper() == 'AM' and hours == 12:
                                hours = 0

                        return hours * 60 + minutes

                    # Group classes by day
                    classes_by_day = {}
                    for cls in response_dict["classes"]:
                        try:
                            days = list(cls["days"])
                            # Log the time string for debugging
                            print(f"Processing time string: {cls['time']}")

                            # Split time string and handle potential errors
                            time_parts = cls["time"].split(" - ")
                            if len(time_parts) != 2:
                                print(f"Invalid time format: {cls['time']}")
                                continue

                            start_time, end_time = time_parts

                            for day in days:
                                if day not in classes_by_day:
                                    classes_by_day[day] = []
                                classes_by_day[day].append({
                                    "start": time_to_minutes(start_time),
                                    "end": time_to_minutes(end_time),
                                    "crn": cls["crn"],
                                    "course": cls["courseNumber"]
                                })
                        except Exception as e:
                            save_log_entry(
                                message=f"Error processing class {cls['courseNumber']}: {str(e)}")
                            continue

                    # Check for overlaps in each day
                    has_overlap = False
                    for day, classes in classes_by_day.items():
                        # Sort classes by start time
                        classes.sort(key=lambda x: x["start"])

                        # Check each consecutive pair
                        for i in range(len(classes) - 1):
                            current = classes[i]
                            next_class = classes[i + 1]

                            # Check for overlap or insufficient gap
                            if current["end"] > next_class["start"] or \
                               (next_class["start"] - current["end"]) < 5:  # 5-minute gap requirement
                                has_overlap = True
                                print(
                                    f"Overlap found on {day} between {current['course']} and {next_class['course']}")
                                break

                        if has_overlap:
                            break

                    if not has_overlap:
                        return response_dict, total_tokens
                    else:
                        print("Overlap detected, retrying...")
                        retry_count += 1
                        continue
                else:
                    return response_dict, total_tokens

            except json.JSONDecodeError:
                save_log_entry(message="Invalid JSON response, retrying...")
                retry_count += 1
                continue
            except Exception as e:
                save_log_entry(message=f"Error processing response: {str(e)}")
                retry_count += 1
                continue

        except Exception as e:
            save_log_entry(message=f"Error calling Gemini API: {str(e)}")
            retry_count += 1
            continue

    # If we've exhausted all retries
    return {"classes": []}, total_tokens


def courseDetailsExractor(department: str, coursenumber, term_year: str):
    try:
        url = "https://selfservice.banner.vt.edu/ssb/HZSKVTSC.P_ProcRequest"
        form_data = {
            "CAMPUS": "0",
            "TERMYEAR": term_year,
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
    except Exception as e:
        save_log_entry(message=f"Error extracting course details: {str(e)}")


@app.route("/api/generate_schedule", methods=['POST'])
def generate_schedule():
    print("Starting AI schedule generation")
    data = request.json
    courses = data.get("courses", [])
    preferences = data.get("preferences", "")
    email = data.get("email", None)
    ai_prompt = ""
    ai_prompt += f"<preferences_by_user>\n{preferences}\n</preferences_by_user>\n"
    for course in courses:
        ai_prompt += f"<course_number>{course['department']+course['number']}</course_number>\n"
        ai_prompt += f"<professor_preference>{course['professor']}</professor_preference>\n"
        ai_prompt += f"<timetable_of_classes_for_the_course>\n"
        df = courseDetailsExractor(
            course['department'], course['number'], data['term_year'])
        ai_prompt += df.to_csv(index=False)
        ai_prompt += "\n</timetable_of_classes_for_the_course>"
    schedule, tokens_used = ai_maker(ai_prompt, courses)
    total_tokens = update_total_tokens(tokens_used)
    log_msg = f"AI schedule generation completed with {len(schedule['classes'])} classes | tokens used: {tokens_used} | total tokens: {total_tokens}"
    if email:
        log_msg += f" | email: {email}"
    save_log_entry(message=log_msg)
    return jsonify(schedule)


@app.route("/api/downloadSchedule", methods=['POST'])
def downloadSchedule():
    try:
        schedule = request.json.get("schedule", [])
        schedule = schedule['classes']
        colorsV = request.json.get("crnColors")
        pdf_buffer = generate_schedule_pdf(schedule, colorsV)
        save_log_entry(message="PDF generated successfully")
        return send_file(pdf_buffer, as_attachment=True, download_name="schedule.pdf", mimetype='application/pdf')
    except Exception as e:
        save_log_entry(message=e)
        return {"error": str(e)}, 500


@app.route("/api/get_logs", methods=['POST'])
def get_logs():
    try:
        data = request.json
        username = data.get("username", None)
        password = data.get("password", None)
        if not username or not password:
            return jsonify({"error": "Username and password are required"}), 400
        # Load users from security_config.json
        with open("security_config.json", 'r') as sec_file:
            sec_data = json.load(sec_file)
            users = sec_data.get("users", [])
        # Check if user exists and password matches
        authorized = any(
            u["username"] == username and u["password"] == password for u in users)
        if not authorized:
            return jsonify({"error": "Unauthorized"}), 401
        with open(log_file, 'r') as f:
            logs = json.load(f)
        logs = logs[-10:] if len(logs) > 10 else logs
        return jsonify(logs), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(debug=False, host="0.0.0.0", port=port)
