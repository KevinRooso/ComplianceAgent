interface ReportData {
  websiteUrl: string;
  websiteSummary: string;
  analysis: {
    prohibited: number;
    highRisk: number;
    limitedRisk: number;
    minimalRisk: number;
    gpai: number;
    mainScore: number; // New main score out of 10
  };
}

interface ReportDisplayProps {
  reportData: ReportData;
  onReset?: () => void;
}

const ReportDisplay = ({ reportData, onReset }: ReportDisplayProps) => {
  // Helper for main score color (heatmap style)
  const getMainScoreClass = (score: number) => {
    if (score === 10) return 'status-red'; // Highest risk
    if (score >= 8) return 'status-orange';
    if (score >= 5) return 'status-yellow';
    return 'status-green';
  };

  // Highlight prohibited if mainScore is 10
  const highlightProhibited = reportData.analysis.mainScore === 10;

  return (
    <div className="report-display">
      <div className="report-header">
        <h3 className="report-title">Compliance Analysis Report</h3>
        <p className="analyzed-url">
          <strong>Analyzed URL:</strong> {reportData.websiteUrl}
        </p>
      </div>

      {/* Website Summary Section */}
      <div className="report-section">
        <h4 className="section-heading">Website Summary</h4>
        <p className="summary-text">
          {reportData.websiteSummary}
        </p>
        <div className={`main-score ${getMainScoreClass(reportData.analysis.mainScore)}`} style={{fontWeight: 'bold', fontSize: '1.25rem', marginTop: '1rem'}}>
          Main Risk Score: {reportData.analysis.mainScore} / 10
        </div>
      </div>

      {/* EU AI Act Analysis Section */}
      <div className="report-section">
        <h4 className="section-heading">EU AI Act Analysis</h4>
        <div className="analysis-grid grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div className={`analysis-item flex items-center${highlightProhibited ? ' status-red' : ''}`}>
            <span className="analysis-label flex-1">Prohibited AI Practices (Banned):</span>
            <span className={`score-badge ${highlightProhibited ? 'bg-red-500 text-white' : 'bg-gray-200'}`} style={{borderRadius: '0.5rem', padding: '0.25rem 0.75rem', minWidth: 32, textAlign: 'center', fontWeight: 600}}>{reportData.analysis.prohibited}</span>
          </div>
          <div className="analysis-item flex items-center">
            <span className="analysis-label flex-1">High-Risk AI Systems:</span>
            <span className="score-badge bg-yellow-200" style={{borderRadius: '0.5rem', padding: '0.25rem 0.75rem', minWidth: 32, textAlign: 'center', fontWeight: 600}}>{reportData.analysis.highRisk}</span>
          </div>
          <div className="analysis-item flex items-center">
            <span className="analysis-label flex-1">Limited Risk AI Systems:</span>
            <span className="score-badge bg-blue-200" style={{borderRadius: '0.5rem', padding: '0.25rem 0.75rem', minWidth: 32, textAlign: 'center', fontWeight: 600}}>{reportData.analysis.limitedRisk}</span>
          </div>
          <div className="analysis-item flex items-center">
            <span className="analysis-label flex-1">Minimal Risk AI Systems:</span>
            <span className="score-badge bg-green-200" style={{borderRadius: '0.5rem', padding: '0.25rem 0.75rem', minWidth: 32, textAlign: 'center', fontWeight: 600}}>{reportData.analysis.minimalRisk}</span>
          </div>
          <div className="analysis-item flex items-center">
            <span className="analysis-label flex-1">General Purpose AI (GPAI) Models:</span>
            <span className="score-badge bg-purple-200" style={{borderRadius: '0.5rem', padding: '0.25rem 0.75rem', minWidth: 32, textAlign: 'center', fontWeight: 600}}>{reportData.analysis.gpai}</span>
          </div>
        </div>
      </div>

      <div className="report-footer">
        <p className="disclaimer">
          <strong>Note:</strong> This analysis is based on automated scanning and should be reviewed by legal professionals for comprehensive compliance assessment.
        </p>
        {onReset && (
          <button className="reset-button" onClick={onReset}>
            Reset
          </button>
        )}
      </div>
    </div>
  );
};

export default ReportDisplay;
