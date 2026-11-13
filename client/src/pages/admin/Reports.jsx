import { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { PageHeader } from '../../components/ui/Kit.jsx';
import { Alert, Button } from '../../components/ui/Primitives.jsx';
import { downloadReport } from '../../services/adminService.js';
import { useToast } from '../../context/ToastContext.jsx';

const REPORTS = [
  { name: 'users', title: 'User registration report', description: 'All accounts with plan, status, counts and dates.' },
  { name: 'subscriptions', title: 'Premium subscription report', description: 'Every billing subscription with period and status.' },
  { name: 'payments', title: 'Payment report', description: 'All payment records with amounts and verification state.' },
  { name: 'ai-usage', title: 'AI usage report', description: 'Every AI generation with provider, model and outcome.' },
  { name: 'projects', title: 'Project generation report', description: 'Every AI project with stack, mode and status.' },
];

export default function Reports() {
  const toast = useToast();
  const [downloading, setDownloading] = useState('');
  const [error, setError] = useState('');

  const download = async (name) => {
    setDownloading(name);
    setError('');
    try {
      await downloadReport(name);
      toast.success('Report downloaded.');
    } catch (err) {
      setError(err.message || 'The report could not be downloaded.');
    } finally {
      setDownloading('');
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Administration"
        title="Reports"
        description="Export administrative reports as CSV. Each file contains up to the 1,000 most recent records."
      />

      {error ? (
        <Alert tone="error" title="Download failed">
          {error}
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((report) => (
          <section key={report.name} className="surface-card flex flex-col p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-md border border-line bg-canvas text-accent-hover">
              <FileText size={15} aria-hidden="true" />
            </span>
            <h2 className="mt-3 text-[13px] font-semibold text-ink">{report.title}</h2>
            <p className="mt-1 flex-1 text-[12px] leading-relaxed text-muted">{report.description}</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              loading={downloading === report.name}
              onClick={() => download(report.name)}
            >
              <Download size={13} aria-hidden="true" />
              Download CSV
            </Button>
          </section>
        ))}
      </div>
    </div>
  );
}
