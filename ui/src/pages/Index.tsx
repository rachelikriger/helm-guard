import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { FileUploader } from '@/components/FileUploader';
import { ReportViewer } from '@/components/ReportViewer';
import { fetchReportFromUrl } from '@/lib/reportApi';
import type { HelmGuardReport } from '@/types/report';

const Index = () => {
    const [searchParams] = useSearchParams();
    const [report, setReport] = useState<HelmGuardReport | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    const handleReportLoaded = (loadedReport: HelmGuardReport) => {
        setLoadError(null);
        setReport(loadedReport);
    };

    const handleNewReport = () => {
        setReport(null);
        setLoadError(null);
    };

    useEffect(() => {
        const reportUrl = searchParams.get('reportUrl');
        if (!reportUrl) {
            setLoadError(null);
            return;
        }

        let isMounted = true;
        setLoadError(null);

        fetchReportFromUrl(reportUrl)
            .then((data) => {
                if (isMounted) setReport(data);
            })
            .catch((error) => {
                if (isMounted) {
                    setLoadError(
                        error instanceof Error
                            ? `Failed to load report from URL: ${error.message}`
                            : 'Failed to load report from URL',
                    );
                    setReport(null);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [searchParams]);

    if (report) {
        return <ReportViewer report={report} onNewReport={handleNewReport} />;
    }

    return (
        <div className="min-h-screen bg-background">
            {loadError && (
                <div className="container pt-6">
                    <div className="flex items-center gap-2 text-destructive bg-destructive/10 px-4 py-3 rounded-lg">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">{loadError}</span>
                    </div>
                </div>
            )}
            <FileUploader onReportLoaded={handleReportLoaded} />
        </div>
    );
};

export default Index;
