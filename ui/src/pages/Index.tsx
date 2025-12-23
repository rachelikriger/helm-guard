import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileUploader } from '@/components/FileUploader';
import { ReportViewer } from '@/components/ReportViewer';
import type { HelmGuardReport } from '@/types/report';

const Index = () => {
  const [searchParams] = useSearchParams();
  const [report, setReport] = useState<HelmGuardReport | null>(null);

  const handleReportLoaded = (loadedReport: HelmGuardReport) => {
    setReport(loadedReport);
  };

  const handleNewReport = () => {
    setReport(null);
  };

  useEffect(() => {
    const reportUrl = searchParams.get('reportUrl');
    if (!reportUrl) return;

    let isMounted = true;

    const loadReport = async () => {
      try {
        const response = await fetch(reportUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch report (${response.status})`);
        }

        const data = await response.json() as HelmGuardReport;
        if (!data.summary || !data.results) {
          throw new Error('Invalid report format: missing summary or results');
        }

        if (isMounted) {
          setReport(data);
        }
      } catch (error) {
        console.error('Failed to load report from URL:', error);
      }
    };

    loadReport();

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

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
