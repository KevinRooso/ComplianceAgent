
interface HeroSectionProps {
  onAnalyzeClick: () => void;
}

const HeroSection = ({ onAnalyzeClick }: HeroSectionProps) => {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <h1 className="hero-title">
          CompliancyAI
        </h1>
        <p className="hero-subtitle">
          Automated EU AI Act Compliance Analysis
        </p>
        <button 
          onClick={onAnalyzeClick}
          className="cta-button"
        >
          Analyze Your Website
        </button>
      </div>
    </section>
  );
};

export default HeroSection;
