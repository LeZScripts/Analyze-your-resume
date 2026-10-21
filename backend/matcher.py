
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

SKILLS = [
    "python", "java", "javascript", "react", "node.js",
    "express", "fastapi", "flask", "sql", "mysql",
    "mongodb", "docker", "aws", "git", "github",
    "html", "css", "machine learning", "scikit-learn",
    "pandas", "numpy", "nlp", "rest api", "linux",
    "ci/cd", "tensorflow", "pytorch", "pytest",
    "jwt", "tailwind css", "typescript", "kubernetes"
]

# General suggestions for skills that appear in a job description.
# These are suggestions to verify, not claims about the candidate.
SUGGESTIONS = {
    "python": "Mention relevant Python projects, scripts, or automation you have implemented.",
    "java": "Add Java projects or programming experience that demonstrates your Java skills.",
    "javascript": "Highlight features you built using JavaScript, including API calls or interactive UI.",
    "react": "Describe React components, state management, forms, or interfaces you have built.",
    "node.js": "Mention backend services or APIs you implemented using Node.js.",
    "express": "Describe Express routes, middleware, or REST APIs you implemented.",
    "fastapi": "Mention FastAPI endpoints, request validation, and backend integration you implemented.",
    "flask": "Highlight applications or APIs you built using Flask.",
    "sql": "Describe SQL queries, joins, database design, or data retrieval you have performed.",
    "mysql": "Mention tables, relationships, queries, and database integration you implemented in MySQL.",
    "mongodb": "Describe MongoDB collections, schemas, or CRUD operations you implemented.",
    "docker": "If applicable, describe how you containerized your application using Docker.",
    "aws": "If applicable, mention the AWS services you used and what you deployed or configured.",
    "git": "Highlight your use of Git for version control, branching, and collaboration.",
    "github": "Mention relevant repositories and the code or documentation you contributed.",
    "html": "Describe semantic HTML and page structures you built.",
    "css": "Highlight responsive layouts, styling, and UI improvements you implemented.",
    "machine learning": "Describe the ML problem, dataset, model, evaluation, and results of a real project.",
    "scikit-learn": "Mention preprocessing, model training, or evaluation you performed with scikit-learn.",
    "pandas": "Describe data cleaning, transformation, or analysis performed with Pandas.",
    "numpy": "Mention numerical processing or array operations used in your projects.",
    "nlp": "Describe text preprocessing, feature extraction, or NLP techniques you implemented.",
    "rest api": "Mention API endpoints, HTTP methods, validation, and error handling you implemented.",
    "linux": "Highlight relevant Linux commands, environment setup, or troubleshooting experience.",
    "ci/cd": "If applicable, describe a CI/CD workflow, including automated tests or deployment steps.",
    "tensorflow": "Describe the model and task you implemented using TensorFlow.",
    "pytorch": "Describe the model and task you implemented using PyTorch.",
    "pytest": "Mention automated tests you wrote and what functionality they verify.",
    "jwt": "Describe authentication and token validation you implemented, if applicable.",
    "tailwind css": "Highlight responsive components or layouts you styled using Tailwind CSS.",
    "typescript": "Mention typed components, interfaces, or application features you implemented.",
    "kubernetes": "If applicable, describe workloads or deployments you configured with Kubernetes."
}


def extract_skills(text):
    text_lower = text.lower()
    found = []

    for skill in SKILLS:
        if skill in text_lower:
            found.append(skill)

    return found


def match_resume(resume_text, job_description):
    resume_text = resume_text.strip()
    job_description = job_description.strip()

    if not resume_text or not job_description:
        raise ValueError(
            "Resume text and job description are required."
        )

    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2)
    )

    vectors = vectorizer.fit_transform(
        [resume_text, job_description]
    )

    score = (
        cosine_similarity(vectors[0:1], vectors[1:2])[0][0]
        * 100
    )

    resume_skills = set(extract_skills(resume_text))
    job_skills = set(extract_skills(job_description))

    print("Resume characters:", len(resume_text))
    print("JD characters:", len(job_description))
    print("Resume skills:", sorted(resume_skills))
    print("JD skills:", sorted(job_skills))

    matched_skills = sorted(resume_skills & job_skills)
    missing_skills = sorted(job_skills - resume_skills)

    recommendations = []

    for skill in missing_skills:
        recommendations.append({
            "skill": skill,
            "suggestion": SUGGESTIONS.get(
                skill,
                f"Review the job requirement for {skill} and identify relevant experience or projects you can truthfully demonstrate."
            ),
            "section": "Skills or Projects",
            "example": (
                f"Add {skill} to your resume only if you have used it. "
                "Describe the specific task you completed and the result."
            )
        })

    return {
        "match_score": round(float(score), 2),
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "recommendations": recommendations
    }
