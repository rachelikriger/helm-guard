import { useState } from 'react';
import { FileUploader } from '@/components/FileUploader';
import { ReportViewer } from '@/components/ReportViewer';
import type { HelmGuardReport } from '@/types/report';

const Index = () => {
  const [report, setReport] = useState<HelmGuardReport | null>(null);

  const handleReportLoaded = (loadedReport: HelmGuardReport) => {
    setReport(loadedReport);
  };

  const handleNewReport = () => {
    setReport(null);
  };

  if (report) {
    return <ReportViewer report={report} onNewReport={handleNewReport} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <FileUploader onReportLoaded={handleReportLoaded} />
    </div>
  );
};

export default Index;
