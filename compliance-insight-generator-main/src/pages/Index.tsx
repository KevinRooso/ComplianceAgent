
import { useRef } from 'react';
import HeroSection from '../components/HeroSection';
import ReportGenerator from '../components/ReportGenerator';

const Index = () => {
  // Reference for smooth scrolling to the report generator section
  const reportGeneratorRef = useRef<HTMLDivElement>(null);

  // Function to handle smooth scroll to report generator
  const scrollToReportGenerator = () => {
    reportGeneratorRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Full viewport height */}
      <HeroSection onAnalyzeClick={scrollToReportGenerator} />
      
      {/* Report Generator Section */}
      <div ref={reportGeneratorRef} className="pb-16">
        <ReportGenerator />
      </div>
    </div>
  );
};

export default Index;
