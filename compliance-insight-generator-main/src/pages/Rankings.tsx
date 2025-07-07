import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ExternalLink, BarChart2, Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ComplianceReport {
  website_url: string;
  website_description: string;
  category_scores: {
    prohibited_ai_practices: number;
    high_risk_ai_systems: number;
    limited_risk_ai_systems: number;
    minimal_risk_ai_systems: number;
    general_purpose_ai_models: number;
  };
}

const CATEGORIES = [
  { 
    key: "prohibited_ai_practices", 
    label: "Prohibited AI",
    description: "Banned AI practices under EU AI Act"
  },
  { 
    key: "high_risk_ai_systems", 
    label: "High Risk",
    description: "High-risk AI systems requiring conformity assessment"
  },
  { 
    key: "limited_risk_ai_systems", 
    label: "Limited Risk",
    description: "AI systems with transparency obligations"
  },
  { 
    key: "minimal_risk_ai_systems", 
    label: "Minimal Risk",
    description: "Minimal or no risk AI systems"
  },
  { 
    key: "general_purpose_ai_models", 
    label: "General AI",
    description: "General purpose AI models"
  }
];

const getRiskLevel = (score: number) => {
  if (score >= 8) return { 
    label: "Critical", 
    color: "bg-gradient-to-r from-red-500 to-red-600",
    textColor: "text-red-600",
    icon: <AlertTriangle className="w-4 h-4" />
  };
  if (score >= 6) return { 
    label: "High", 
    color: "bg-gradient-to-r from-orange-400 to-orange-500",
    textColor: "text-orange-500",
    icon: <AlertTriangle className="w-4 h-4" />
  };
  if (score >= 4) return { 
    label: "Medium", 
    color: "bg-gradient-to-r from-yellow-400 to-yellow-500",
    textColor: "text-yellow-500",
    icon: <AlertTriangle className="w-4 h-4" />
  };
  if (score >= 2) return { 
    label: "Low", 
    color: "bg-gradient-to-r from-blue-400 to-blue-500",
    textColor: "text-blue-500",
    icon: <Shield className="w-4 h-4" />
  };
  return { 
    label: "Minimal", 
    color: "bg-gradient-to-r from-green-400 to-green-500",
    textColor: "text-green-500",
    icon: <CheckCircle className="w-4 h-4" />
  };
};

export default function Rankings() {
  const { data: reports, isLoading, error } = useQuery<ComplianceReport[]>({
    queryKey: ['complianceReports'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8000/compliance_reports/Bruce/report');
      if (!response.ok) throw new Error('Failed to fetch compliance reports');
      const data = await response.json();
      return data.results || [];
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
              <BarChart2 className="w-8 h-8 text-blue-600" />
            </div>
            <Skeleton className="h-12 w-64 mx-auto mb-4" />
            <Skeleton className="h-5 w-96 max-w-full mx-auto" />
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden bg-white/80 backdrop-blur-sm border border-gray-200/70">
                <CardHeader className="pb-3 relative">
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div key={j} className="space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-8" />
                      </div>
                      <Skeleton className="h-1.5 w-full rounded-full" />
                      <Skeleton className="h-3 w-5/6" />
                    </div>
                  ))}
                  <Skeleton className="h-9 w-full mt-4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load compliance reports. {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!reports?.length) {
    return (
      <div className="container mx-auto py-8 text-center">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No reports found</AlertTitle>
          <AlertDescription>
            No compliance reports have been generated yet.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const sortedReports = [...reports].sort((a, b) => {
    const aMax = Math.max(...Object.values(a.category_scores));
    const bMax = Math.max(...Object.values(b.category_scores));
    return bMax - aMax;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
            <BarChart2 className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3 bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            Compliance Rankings
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Compare AI compliance scores across all analyzed websites and track their adherence to EU AI Act regulations
          </p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {sortedReports.map((report, idx) => {
          const scores = report.category_scores;
          const mainScore = Math.max(...Object.values(scores));
          const risk = getRiskLevel(mainScore);
          
          return (
            <motion.div key={idx} variants={itemVariants}>
              <Card className="h-full overflow-hidden bg-white/80 backdrop-blur-sm border border-gray-200/70 hover:shadow-xl transition-all duration-300 hover:border-blue-100">
                <CardHeader className="pb-3 relative">
                  <div className="absolute top-4 right-4">
                    <Badge 
                      className={cn(
                        "px-3 py-1.5 text-sm font-medium backdrop-blur-sm",
                        risk.textColor,
                        "bg-white/80 border border-gray-200/50"
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        {risk.icon}
                        {risk.label} Risk
                      </span>
                    </Badge>
                  </div>
                  
                  <div className="pr-16">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-1 group">
                      <a 
                        href={report.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 transition-colors flex items-start gap-2"
                      >
                        {new URL(report.website_url).hostname}
                        <ExternalLink className="h-3.5 w-3.5 mt-1.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                      </a>
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600 line-clamp-2">
                      {report.website_description}
                    </CardDescription>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0 space-y-5">
                  <div className="space-y-4">
                    {CATEGORIES.map(({ key, label, description }) => {
                      const score = scores[key];
                      const categoryRisk = getRiskLevel(score);
                      
                      return (
                        <div key={key} className="space-y-1.5">
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-medium text-gray-700">{label}</span>
                            <span className={cn(
                              "font-mono font-semibold text-xs px-2 py-0.5 rounded-full",
                              categoryRisk.textColor,
                              "bg-opacity-10",
                              categoryRisk.textColor.replace('text-', 'bg-')
                            )}>
                              {score}/10
                            </span>
                          </div>
                          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${score * 10}%` }}
                              transition={{ duration: 0.8, delay: idx * 0.05 }}
                              className={cn("h-full rounded-full", categoryRisk.color)}
                            />
                          </div>
                          <p className="text-xs text-gray-500">{description}</p>
                        </div>
                      );
                    })}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-4 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                    onClick={() => {
                      // Scroll to top and open report generator with this URL
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      // You might want to add logic to pre-fill the URL in the report generator
                    }}
                  >
                    Analyze Again
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
        </motion.div>
      </motion.div>
    </div>
  );
}
