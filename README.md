# AI Resume Matcher
**Note:** This README was created with the help of AI tools.
***

AI Resume Matcher is a small web app that compares a resume with a job description. Upload both as PDFs, and the app extracts their text, calculates a similarity score, checks for supported skills, and gives suggestions for skills that were not found in the resume.

The project has a React and Vite frontend, a FastAPI backend, and a MySQL database for saving completed match results.

## What the app does

1. You upload a resume PDF and a job description PDF.
2. The backend extracts selectable text from each PDF.
3. You choose **Analyze Resume Match**.
4. The app compares the two texts and displays:
   - A text-similarity score from 0% to 100%.
   - Skills found in both documents.
   - Supported job-description skills not detected in the resume.
   - General suggestions for writing about those skills truthfully.
5. The backend saves the match score, extracted text, and skill lists in MySQL. The result includes a record ID.

You can close the results window and reopen it with **View Matching Results**. Each new analysis creates a separate database record.

## Important to know about the results

- The score is based on TF-IDF text vectors and cosine similarity. It is a text comparison, not a hiring decision or a guarantee that someone is qualified.
- Skills are checked against a fixed list in `backend/matcher.py`. A skill that is not on that list will not appear in the matched or missing skills lists.
- Skill detection looks for the skill name in the text. It does not understand context, synonyms, experience level, or whether a skill is used positively or negatively.
- Suggestions are general writing prompts. They are not proof that you have a skill. Only include experience you can honestly demonstrate.
- The app extracts text from PDFs; it does not run OCR. Scanned or image-only PDFs may produce no usable text.
- The uploaded PDF files are read for extraction and are not saved as files by the backend. When you run a match, the extracted resume and job-description text are saved in the configured database.

## Project layout

```text
ai-resume-matcher/
├── backend/
│   ├── database.py        # Database connection and SQLAlchemy setup
│   ├── main.py            # FastAPI app and API routes
│   ├── matcher.py         # Similarity scoring, skill detection, suggestions
│   ├── models.py          # Saved match-result model
│   └── requirements.txt   # Python dependencies
└── frontend/
    ├── index.html
    ├── package.json
    └── src/
        ├── App.jsx        # Upload flow and results display
        ├── App.css
        ├── index.css
        └── main.jsx
```

## Requirements

- Python and pip
- Node.js and npm
- A running MySQL server and a database created for this app

The API uses MySQL through SQLAlchemy and PyMySQL. The frontend and backend are configured for local development:

- Frontend: `http://localhost:5173`
- Backend API: `http://127.0.0.1:8000`

## Run the app locally

### 1. Create a MySQL database

Start your MySQL server and create an empty database, for example:

```sql
CREATE DATABASE ai_resume_matcher;
```

The database user in the connection string must have permission to use this database and create tables. The backend creates its `match_results` table when it starts, but it does not create the MySQL database itself.

### 2. Configure the backend

From the project root, create `backend/.env` and set `DATABASE_URL` to your MySQL connection string:

```env
DATABASE_URL=mysql+pymysql://YOUR_USER:YOUR_PASSWORD@localhost:3306/ai_resume_matcher
```

Replace `YOUR_USER` and `YOUR_PASSWORD` with your MySQL credentials. If your password contains URL-special characters, encode them in the connection string.

Create a Python virtual environment and install the backend requirements:

```bash
cd backend
python -m venv venv
```

Activate the environment:

```bash
# macOS or Linux
source venv/bin/activate

# Windows PowerShell
.\venv\Scripts\Activate.ps1
```

Then install the packages and start the API:

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

Keep this terminal open while using the app. The API is available at `http://127.0.0.1:8000`; interactive API documentation is at `http://127.0.0.1:8000/docs`.

### 3. Start the frontend

Open a second terminal from the project root and run:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

## Using the app

1. Select a text-based PDF for **Your Resume**.
2. Select a text-based PDF for **Job Description**.
3. Wait for both files to finish uploading and extracting.
4. Select **Analyze Resume Match**.
5. Review the score, skill lists, and suggestions. You can copy an individual suggestion or close and reopen the results.

Both files must be PDFs. The backend rejects empty files, password-protected PDFs, and PDFs with no extractable text. There is no configured file-size limit in the app.

## API overview

The API runs on port `8000` by default when started with the command above.

### `GET /`

Returns a short message confirming that the API is running.

### `POST /upload-resume`

Accepts one PDF in a multipart form field named `file`. Despite the route name, the frontend uses this endpoint for both the resume and the job-description PDF.

On success, the response contains:

```json
{
  "filename": "document.pdf",
  "pages": 2,
  "extracted_text": "Text read from the PDF..."
}
```

This route extracts text but does not save a match record.

### `POST /match-resume`

Accepts JSON containing non-empty text values:

```json
{
  "resume_text": "Text extracted from the resume...",
  "job_description": "Text extracted from the job description..."
}
```

On success, the response contains an `id`, `match_score`, `matched_skills`, `missing_skills`, and `recommendations`. A recommendation includes the skill, a general suggestion, a suggested resume section, and example wording guidance. This request saves the match result and both text inputs in MySQL.

Unsupported, empty, password-protected, or text-free PDFs return a `400` response. The match endpoint requires both text fields to be non-empty; request validation errors return `422`, while a matching or database failure returns `500`.

## Configuration notes

- `backend/.env` must define `DATABASE_URL`; the backend exits at startup if it is missing.
- The frontend API address is currently set to `http://127.0.0.1:8000` in `frontend/src/App.jsx`.
- The backend CORS configuration currently allows the frontend origin `http://localhost:5173`. If you change the frontend host or port, update the allowed origin in `backend/main.py` as well as the frontend API address if needed.
- The supported skill names and their suggestion text are maintained in `backend/matcher.py`.

## Common problems

### The frontend cannot connect to the API

Make sure the backend is running at `http://127.0.0.1:8000`. Check that the frontend API address and the backend CORS origin match the addresses you are using.

### The backend stops during startup

Check that `backend/.env` exists, `DATABASE_URL` is set correctly, MySQL is running, and the database named in the connection string already exists. Also check that the configured MySQL user can connect and create tables.

### A PDF upload fails or contains no text

Use a PDF that allows text selection. Password-protected PDFs and image-only scans are not supported. If the PDF is a scan, convert it to a text-based PDF before uploading.

### A skill is missing from the results

Only skills listed in `backend/matcher.py` are checked. The current matcher also uses simple text matching, so alternate names and synonyms may not be recognized.

## Development commands

From `frontend/`:

```bash
npm run dev      # Start the Vite development server
npm run build    # Build the frontend for production
npm run preview  # Preview the production build locally
npm run lint     # Run Oxlint
```

From `backend/`, activate the virtual environment first, then run:

```bash
uvicorn main:app --reload
```


