import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { FileUploader } from '@/components/FileUploader';
import { ReportViewer } from '@/components/ReportViewer';
import { safeParseReport } from '@helm-guard/shared';
import type { HelmGuardReport } from '@/types/report';
import type { SafeParseReportFailure } from '@helm-guard/shared';

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
                const response = await fetch(`/proxy?url=${encodeURIComponent(reportUrl)}`);
                if (!response.ok) {
                    let msg = `Failed to fetch report (${response.status})`;
                    try {
                        const errBody = await response.json();
                        if (errBody.error) msg = errBody.error;
                        if (errBody.hint) msg += ` — ${errBody.hint}`;
                    } catch {
                        /* ignore */
                    }
                    throw new Error(msg);
                }

                const data = await response.json();
                const parsed = safeParseReport(data);
                if (parsed.success) {
                    if (isMounted) setReport(parsed.data);
                } else {
                    const err = (parsed as SafeParseReportFailure).error;
                    const msg = err?.message ?? 'Invalid report format';
                    throw new Error(typeof msg === 'string' ? msg : 'Invalid report format');
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
