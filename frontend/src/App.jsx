
import { useEffect, useState } from "react";
import axios from "axios";
import {
  FileText,
  Briefcase,
  Search,
  LoaderCircle,
  Upload,
  CheckCircle2,
  FileCheck2,
  X,
} from "lucide-react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

export default function App() {
  // Resume upload state
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  // Job description upload state
  const [jdFile, setJdFile] = useState(null);
  const [jdUploading, setJdUploading] = useState(false);
  const [jdUploadMessage, setJdUploadMessage] = useState("");

  // Analysis state
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Automatically upload and extract either PDF
  async function uploadPdf(selectedFile, type) {
    if (!selectedFile) return;

    const isResume = type === "resume";

    if (isResume) {
      setFile(selectedFile);
      setUploading(true);
      setUploadMessage("");
      setResumeText("");
    } else {
      setJdFile(selectedFile);
      setJdUploading(true);
      setJdUploadMessage("");
      setJobDescription("");
    }

    setError("");
    setResult(null);
    setShowResults(false);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post(
        `${API_URL}/upload-resume`,
        formData
      );

      const extractedText = response.data.extracted_text;

      if (!extractedText?.trim()) {
        setError(
          `No text could be extracted from ${
            isResume ? "your resume" : "the job description"
          }. Try a text-based PDF.`
        );
        return;
      }

      if (isResume) {
        setResumeText(extractedText);
        setUploadMessage(
          `Resume ready: ${response.data.filename}`
        );
      } else {
        setJobDescription(extractedText);
        setJdUploadMessage(
          `Job description ready: ${response.data.filename}`
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          `Failed to upload ${
            isResume ? "resume" : "job description"
          }. Check that the backend is running.`
      );
    } finally {
      if (isResume) {
        setUploading(false);
      } else {
        setJdUploading(false);
      }
    }
  }

  // Analyze resume against the job description
  async function handleMatch(event) {
    event.preventDefault();

    if (uploading || jdUploading) {
      setError("Please wait for both PDF uploads to finish.");
      return;
    }

    if (!resumeText.trim() || !jobDescription.trim()) {
      setError(
        "Please select both your resume PDF and job description PDF."
      );
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setShowResults(false);

    try {
      const response = await axios.post(
        `${API_URL}/match-resume`,
        {
          resume_text: resumeText,
          job_description: jobDescription,
        }
      );

      setResult(response.data);
      setShowResults(true);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Could not analyze the documents. Check that FastAPI is running."
      );
    } finally {
      setLoading(false);
    }
  }

  // Close the results popup with Escape.
  useEffect(() => {
    if (!showResults) return;

    function handleEscape(event) {
      if (event.key === "Escape") setShowResults(false);
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showResults]);

  // Copy a recommendation to the clipboard
  async function copySuggestion(item) {
    const text = [
      `Skill: ${item.skill}`,
      `Suggestion: ${item.suggestion}`,
      `Resume guidance: ${item.example}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setError(
        "Could not copy the suggestion. Check your browser clipboard permissions."
      );
    }
  }

  return (
    <main className="page">
      {/* Compact intro: keep uploads at the top of the page */}
      <section className="page-intro">
        <h1>Analyze your resume</h1>
        <p>
          Upload your resume and a job description to compare skills
          and get tailored recommendations.
        </p>
      </section>

      {/* PDF upload workspace */}
      <form className="workspace" onSubmit={handleMatch}>
        {/* Resume upload */}
        <section className="panel">
          <div className="panel-heading">
            <span className="heading-icon">
              <FileText size={19} />
            </span>

            <div>
              <h2>Your Resume</h2>
              <p>Upload your resume in PDF format</p>
            </div>
          </div>

          <label
            htmlFor="resume-file"
            className="upload-label"
          >
            <Upload size={18} />
            Choose Resume PDF
          </label>

          <div className="upload-form">
            <input
              id="resume-file"
              type="file"
              accept=".pdf,application/pdf"
              disabled={uploading || loading}
              onChange={(event) => {
                const selectedFile =
                  event.target.files?.[0];

                if (selectedFile) {
                  if (
                    selectedFile.type !== "application/pdf" &&
                    !selectedFile.name.toLowerCase().endsWith(".pdf")
                  ) {
                    setError("Please select a PDF file.");
                    event.target.value = "";
                    return;
                  }

                  uploadPdf(selectedFile, "resume");
                }

                event.target.value = "";
              }}
            />

            {file && (
              <div className="file-info">
                <FileCheck2 size={19} />

                <div className="file-details">
                  <span className="file-name">
                    {file.name}
                  </span>

                  <span className="file-status">
                    {uploading
                      ? "Extracting resume text..."
                      : uploadMessage || "Selected resume"}
                  </span>
                </div>

                {!uploading && resumeText && (
                  <CheckCircle2
                    size={19}
                    className="success-icon"
                  />
                )}
              </div>
            )}

            {!file && (
              <p className="upload-hint">
                Choose a PDF from your device. Text is extracted
                automatically.
              </p>
            )}

            {uploading && (
              <p className="field-note">
                <LoaderCircle
                  size={14}
                  className="spin"
                />{" "}
                Uploading and extracting resume...
              </p>
            )}
          </div>

          {resumeText && !uploading && (
            <div className="extraction-info">
              <CheckCircle2 size={16} />
              Resume extracted successfully
              <span>{resumeText.length.toLocaleString()} characters</span>
            </div>
          )}
        </section>

        {/* Job description upload */}
        <section className="panel">
          <div className="panel-heading">
            <span className="heading-icon">
              <Briefcase size={19} />
            </span>

            <div>
              <h2>Job Description</h2>
              <p>Upload the job description in PDF format</p>
            </div>
          </div>

          <label
            htmlFor="jd-file"
            className="upload-label"
          >
            <Upload size={18} />
            Choose Job Description PDF
          </label>

          <div className="upload-form">
            <input
              id="jd-file"
              type="file"
              accept=".pdf,application/pdf"
              disabled={jdUploading || loading}
              onChange={(event) => {
                const selectedFile =
                  event.target.files?.[0];

                if (selectedFile) {
                  if (
                    selectedFile.type !== "application/pdf" &&
                    !selectedFile.name.toLowerCase().endsWith(".pdf")
                  ) {
                    setError("Please select a PDF file.");
                    event.target.value = "";
                    return;
                  }

                  uploadPdf(selectedFile, "jd");
                }

                event.target.value = "";
              }}
            />

            {jdFile && (
              <div className="file-info">
                <FileCheck2 size={19} />

                <div className="file-details">
                  <span className="file-name">
                    {jdFile.name}
                  </span>

                  <span className="file-status">
                    {jdUploading
                      ? "Extracting job description..."
                      : jdUploadMessage || "Selected job description"}
                  </span>
                </div>

                {!jdUploading && jobDescription && (
                  <CheckCircle2
                    size={19}
                    className="success-icon"
                  />
                )}
              </div>
            )}

            {!jdFile && (
              <p className="upload-hint">
                Choose the job posting PDF. Its text will be
                extracted automatically.
              </p>
            )}

            {jdUploading && (
              <p className="field-note">
                <LoaderCircle
                  size={14}
                  className="spin"
                />{" "}
                Uploading and extracting job description...
              </p>
            )}
          </div>

          {jobDescription && !jdUploading && (
            <div className="extraction-info">
              <CheckCircle2 size={16} />
              Job description extracted successfully
              <span>
                {jobDescription.length.toLocaleString()} characters
              </span>
            </div>
          )}
        </section>

        {/* Analyze */}
        <button
          className="match-button"
          type="submit"
          disabled={
            loading ||
            uploading ||
            jdUploading ||
            !resumeText.trim() ||
            !jobDescription.trim()
          }
        >
          {loading ? (
            <>
              <LoaderCircle
                className="spin"
                size={18}
              />
              Analyzing documents...
            </>
          ) : (
            <>
              <Search size={18} />
              Analyze Resume Match
            </>
          )}
        </button>
      </form>

      {/* Errors */}
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}

      {/* Reopen results after the popup has been closed */}
      {result && !showResults && (
        <button
          type="button"
          className="view-results-button"
          onClick={() => setShowResults(true)}
        >
          <Search size={17} />
          View Matching Results
        </button>
      )}

      {/* Results popup */}
      {result && showResults && (
        <div
          className="results-modal-backdrop"
          role="presentation"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            background: "rgba(22, 21, 48, 0.68)",
            backdropFilter: "blur(7px)",
            overflowY: "auto",
          }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowResults(false);
          }}
        >
          <section
            className="results results-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="matching-results-title"
            style={{
              position: "relative",
              width: "min(980px, 100%)",
              maxHeight: "90vh",
              margin: "auto",
              padding: "30px",
              overflowY: "auto",
              borderRadius: "22px",
              background: "#ffffff",
              boxShadow: "0 28px 90px rgba(20, 18, 57, 0.35)",
            }}
          >
            <button
              type="button"
              className="results-modal-close"
              aria-label="Close matching results"
              onClick={() => setShowResults(false)}
            >
              <X size={20} />
            </button>
          <span className="eyebrow">ANALYSIS COMPLETE</span>

          <h2 id="matching-results-title">Your Matching Results</h2>

          {/* Match score */}
          <div className="score-card">
            <div>
              <p>Resume Match Score</p>

              <strong>
                {Number(result.match_score).toFixed(1)}%
              </strong>

              <p className="score-caption">
                Text similarity between your resume and the JD
              </p>
            </div>

            <div
              className="score-ring"
              style={{
                "--score": `${Math.max(
                  0,
                  Math.min(
                    100,
                    Number(result.match_score) || 0
                  )
                )}%`,
              }}
            >
              <span>
                {Number(result.match_score).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Skill comparison */}
          <div className="skill-grid">
            <div className="skill-card">
              <h3>Matched Skills</h3>

              {result.matched_skills?.length ? (
                result.matched_skills.map((skill) => (
                  <span
                    className="skill matched"
                    key={skill}
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p>No matching skills detected.</p>
              )}
            </div>

            <div className="skill-card">
              <h3>Skills to Improve</h3>

              {result.missing_skills?.length ? (
                result.missing_skills.map((skill) => (
                  <span
                    className="skill missing"
                    key={skill}
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p>
                  No missing skills from the supported skills
                  list were detected.
                </p>
              )}
            </div>
          </div>

          {/* Resume recommendations */}
          <div className="recommendations-panel">
            <h3>How to Improve Your Resume</h3>

            <p className="recommendations-intro">
              Suggestions based on skills mentioned in the job
              description but not detected in your resume.
              Include skills and experience only when you can
              honestly demonstrate them.
            </p>

            {result.recommendations?.length > 0 ? (
              <div className="recommendations-list">
                {result.recommendations.map((item) => (
                  <article
                    className="recommendation-card"
                    key={item.skill}
                  >
                    <div className="recommendation-heading">
                      <h4>{item.skill}</h4>

                      <span className="recommendation-section">
                        {item.section}
                      </span>
                    </div>

                    <p>{item.suggestion}</p>

                    <div className="suggested-wording">
                      <strong>Resume wording guidance</strong>
                      <p>{item.example}</p>
                    </div>

                    <button
                      type="button"
                      className="upload-button"
                      onClick={() => copySuggestion(item)}
                    >
                      Copy suggestion
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <p>
                No missing skills from the supported skills
                list were detected. Review the job description
                manually for other requirements.
              </p>
            )}
          </div>

          <p className="record-id">
            Analysis saved · Record ID: {result.id}
          </p>
          </section>
        </div>
      )}

      <footer>
        Built with React, FastAPI and MySQL
      </footer>
    </main>
  );
}
