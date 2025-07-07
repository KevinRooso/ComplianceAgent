import React, { useEffect, useState } from "react";

interface ComplianceReport {
  // Adjust according to your backend's report structure
  websiteUrl?: string;
  website_description?: string;
  category_scores?: {
    prohibited_ai_practices?: number;
    high_risk_ai_systems?: number;
    limited_risk_ai_systems?: number;
    minimal_risk_ai_systems?: number;
    general_purpose_ai_models?: number;
  };
  [key: string]: any;
}

interface ComplianceRankingProps {
  user_id: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  prohibited_ai_practices: "Prohibited AI Practices",
  high_risk_ai_systems: "High-Risk AI Systems",
  limited_risk_ai_systems: "Limited Risk AI Systems",
  minimal_risk_ai_systems: "Minimal Risk AI Systems",
  general_purpose_ai_models: "General Purpose AI Models",
};

const colorMap = [
  "bg-green-400",
  "bg-yellow-400",
  "bg-orange-400",
  "bg-red-500",
];

function getColor(score: number) {
  if (score >= 8) return colorMap[3];
  if (score >= 5) return colorMap[2];
  if (score >= 3) return colorMap[1];
  return colorMap[0];
}

const ComplianceRanking: React.FC<ComplianceRankingProps> = ({ user_id }) => {
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`http://localhost:8000/compliance_reports/${encodeURIComponent(user_id)}/report`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch compliance rankings");
        return res.json();
      })
      .then((data) => {
        setReports(data.results || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [user_id]);

  if (loading) return <div className="py-8 text-center">Loading rankings...</div>;
  if (error) return <div className="py-8 text-center text-red-500">{error}</div>;
  if (!reports.length) return <div className="py-8 text-center text-gray-400">No compliance reports found for this user.</div>;

  const sortedReports = reports.sort((a, b) => {
    const mainRiskScoreA = Math.max(
      a.category_scores?.prohibited_ai_practices ?? 0,
      a.category_scores?.high_risk_ai_systems ?? 0,
      a.category_scores?.limited_risk_ai_systems ?? 0,
      a.category_scores?.minimal_risk_ai_systems ?? 0,
      a.category_scores?.general_purpose_ai_models ?? 0
    );
    const mainRiskScoreB = Math.max(
      b.category_scores?.prohibited_ai_practices ?? 0,
      b.category_scores?.high_risk_ai_systems ?? 0,
      b.category_scores?.limited_risk_ai_systems ?? 0,
      b.category_scores?.minimal_risk_ai_systems ?? 0,
      b.category_scores?.general_purpose_ai_models ?? 0
    );
    return mainRiskScoreB - mainRiskScoreA;
  });

  return (
    <section className="mt-12 mb-8 px-6 py-8 rounded-2xl shadow-lg bg-white border border-gray-200 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center text-blue-800">Compliance Ranking</h2>
      <p className="text-gray-600 mb-6 text-center">See how these websites rank on key EU AI Act compliance checks:</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedReports.map((report, index) => (
          <div key={index} className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-50 shadow-sm">
            <h3 className="text-lg font-medium mb-2 text-gray-700">{report.websiteUrl}</h3>
            <p className="text-sm text-gray-600 mb-4">{report.website_description}</p>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <div key={key} className="mb-4">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <div className="w-full h-4 rounded-full bg-gray-200 overflow-hidden mt-1">
                  <div
                    className={`h-4 rounded-full transition-all duration-500 ${getColor(report.category_scores?.[key] ?? 0)}`}
                    style={{ width: `${((report.category_scores?.[key] ?? 0) / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-6 text-center text-xs text-gray-400">Ranking is based on the latest compliance reports for these websites.</div>
    </section>
  );
};

export default ComplianceRanking;
