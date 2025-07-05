import { useState } from 'react';
import ReportDisplay from './ReportDisplay';

interface ReportData {
  websiteUrl: string;
  websiteSummary: string;
  analysis: {
    prohibited: number;
    highRisk: number;
    limitedRisk: number;
    minimalRisk: number;
    gpai: number;
    mainScore: number;
  };
}

const ReportGenerator = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async () => {
    if (!url.trim()) return;
    setIsLoading(true);
    setError(null);
    setReportData(null);
    try {
      const response = await fetch('http://localhost:8000/analyze_compliance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to analyze compliance');
      }
      const data = await response.json();
      // Map API response to ReportData
      const scores = data.category_scores || {};
      const report: ReportData = {
        websiteUrl: data.website_url,
        websiteSummary: data.website_description,
        analysis: {
          prohibited: scores.prohibited_ai_practices ?? 0,
          highRisk: scores.high_risk_ai_systems ?? 0,
          limitedRisk: scores.limited_risk_ai_systems ?? 0,
          minimalRisk: scores.minimal_risk_ai_systems ?? 0,
          gpai: scores.general_purpose_ai_models ?? 0,
          mainScore: Math.max(
            scores.prohibited_ai_practices ?? 0,
            scores.high_risk_ai_systems ?? 0,
            scores.limited_risk_ai_systems ?? 0,
            scores.minimal_risk_ai_systems ?? 0,
            scores.general_purpose_ai_models ?? 0
          ),
        },
      };
      setReportData(report);
    } catch (e: any) {
      setError(e.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateReport();
  };

  const resetReport = () => {
    setReportData(null);
    setUrl('');
    setError(null);
  };


  return (
    <section className="report-generator-section">
      <div className="container">
        <div className="report-generator-content">
          <h2 className="section-title">
            Generate Your Compliance Report
          </h2>

          {error && (
            <div className="error-message bg-red-100 text-red-700 p-3 rounded mb-4 border border-red-300">
              <strong>Error:</strong> {error}
            </div>
          )}

          {!reportData ? (
            <form onSubmit={handleSubmit} className="url-form">
              <div className="input-group">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="url-input"
                  disabled={isLoading}
                  required
                />
                <button
                  type="submit"
                  disabled={isLoading || !url.trim()}
                  className="generate-button"
                >
                  {isLoading ? (
                    <>
                      <span className="loading-spinner mr-2"></span>
                      Generating...
                    </>
                  ) : (
                    'Generate Report'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="report-container">
              {reportData ? (
                <ReportDisplay reportData={reportData} onReset={resetReport} />
              ) : null}
              <button 
                onClick={resetReport}
                className="new-analysis-button"
              >
                Analyze Another Website
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ReportGenerator;
