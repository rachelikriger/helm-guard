import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { FileUploader } from '@/components/FileUploader';
import { ReportViewer } from '@/components/ReportViewer';
import type { HelmGuardReport } from '@/types/report';

function isValidReport(report: unknown): report is HelmGuardReport {
    return Boolean(
        report &&
        typeof report === 'object' &&
        (report as HelmGuardReport).summary &&
        Array.isArray((report as HelmGuardReport).results),
    );
}

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

        const loadReport = async () => {
            try {
                setLoadError(null);
                const response = await fetch(reportUrl);
                if (!response.ok) {
                    throw new Error(`Failed to fetch report (${response.status})`);
                }

                const data = (await response.json()) as HelmGuardReport;
                if (!isValidReport(data)) {
                    throw new Error('Invalid report format: missing summary or results array');
                }

                if (isMounted) {
                    setReport(data);
                }
            } catch (error) {
                if (isMounted) {
                    setLoadError(
                        error instanceof Error
                            ? `Failed to load report from URL: ${error.message}`
                            : 'Failed to load report from URL',
                    );
                    setReport(null);
                }
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
