import { useCallback, useEffect, useState } from 'react';
import { LayoutTemplate, RefreshCcw } from 'lucide-react';
import { PageHeader, StatCard } from '../../components/ui/Kit.jsx';
import { Alert, Button, EmptyState, Spinner, Switch } from '../../components/ui/Primitives.jsx';
import { Badge, TableWrap, Td, Th } from '../../components/admin/ui.jsx';
import { adminService } from '../../services/adminService.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function Templates() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toggling, setToggling] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await adminService.templates());
    } catch (err) {
      setError(err.message || 'Templates could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (template) => {
    setToggling(template.id);
    try {
      await adminService.setTemplateEnabled(template.id, !template.enabled);
      toast.success(template.enabled ? 'Template disabled.' : 'Template enabled.');
      await load();
    } catch (err) {
      toast.error(err.message || 'That change could not be saved.');
    } finally {
      setToggling('');
    }
  };

  if (loading && !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner label="Loading templates…" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Administration"
        title="Templates"
        description="The template catalogue with live usage counts. Disabling a template blocks new portfolios from selecting it; existing portfolios keep working."
        actions={
          <Button variant="secondary" size="sm" onClick={load} loading={loading}>
            <RefreshCcw size={13} aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      {error ? (
        <Alert tone="error" title="Templates unavailable">
          {error}
        </Alert>
      ) : null}

      {data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={LayoutTemplate} label="Total templates" value={data.total} />
            <StatCard icon={LayoutTemplate} label="Free templates" value={data.free} tone="emerald" />
            <StatCard icon={LayoutTemplate} label="Premium templates" value={data.premium} tone="violet" />
            <StatCard icon={LayoutTemplate} label="Disabled" value={data.disabled} tone="amber" />
          </div>

          {data.templates.length === 0 ? (
            <EmptyState icon={LayoutTemplate} title="No templates" description="The catalogue is empty." />
          ) : (
            <TableWrap>
              <table className="w-full min-w-[760px] border-collapse">
                <thead className="bg-canvasAlt">
                  <tr>
                    <Th>Template</Th>
                    <Th>Tier</Th>
                    <Th>Layout</Th>
                    <Th>Usage</Th>
                    <Th>Status</Th>
                    <Th>Enabled</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.templates.map((template) => (
                    <tr key={template.id}>
                      <Td>
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block h-3 w-3 shrink-0 rounded-full border border-lineStrong"
                            style={{ backgroundColor: template.accent }}
                            aria-hidden="true"
                          />
                          <span className="font-medium text-ink">{template.name}</span>
                        </span>
                        <span className="block font-mono text-[10.5px] text-faint">{template.id}</span>
                      </Td>
                      <Td>
                        <Badge value={template.tier} />
                      </Td>
                      <Td className="capitalize">{template.layout}</Td>
                      <Td className="tabular-nums">{template.usageCount}</Td>
                      <Td>
                        <Badge value={template.enabled ? 'enabled' : 'disabled'} />
                      </Td>
                      <Td>
                        <Switch
                          checked={template.enabled}
                          disabled={toggling === template.id}
                          onChange={() => toggle(template)}
                          label={`${template.enabled ? 'Disable' : 'Enable'} ${template.name}`}
                          hideLabel
                        />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </>
      ) : null}
    </div>
  );
}
