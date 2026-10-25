import { AlertTriangle } from 'lucide-react';

export default function Terms() {
  return (
    <div className="container-page max-w-3xl py-12">
      <p className="eyebrow">Terms</p>
      <h1 className="mt-2 text-3xl">Terms of use</h1>

      <div className="mt-5 flex gap-3 rounded-md border border-warning/25 bg-warningSoft px-4 py-3 text-sm leading-6 text-warning">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p>
          These terms are written for an academic software project and are not a legally reviewed agreement. They
          describe how the demonstration build behaves.
        </p>
      </div>

      <div className="mt-7 space-y-6 text-sm leading-7 text-inkSoft">
        <section>
          <h2 className="text-lg text-ink">Using the service</h2>
          <p className="mt-2">
            PortiAI is provided for building and reviewing a personal portfolio. You are responsible for the accuracy of
            what you publish. Do not upload content that is unlawful, that you do not have the right to use, or that
            impersonates another person.
          </p>
        </section>

        <section>
          <h2 className="text-lg text-ink">AI-generated suggestions</h2>
          <p className="mt-2">
            AI output is a suggestion, not a verified statement of fact. The application instructs the model not to
            invent qualifications or outcomes, but you must review generated text before publishing it. Do not rely on
            the analyzer score as a prediction of employment outcomes; it measures content quality against a documented
            rubric.
          </p>
        </section>

        <section>
          <h2 className="text-lg text-ink">Availability</h2>
          <p className="mt-2">
            The application runs on free-tier infrastructure. It may be slow after idle periods, may be taken offline,
            and may enforce AI usage limits. No uptime or data-retention guarantee is offered. This is not a commercial
            service.
          </p>
        </section>

        <section>
          <h2 className="text-lg text-ink">Accounts</h2>
          <p className="mt-2">
            One person should hold one account. You are responsible for keeping your password safe. You can delete your
            account and its data in Settings at any time.
          </p>
        </section>

        <section>
          <h2 className="text-lg text-ink">Liability</h2>
          <p className="mt-2">
            The software is provided &quot;as is&quot;, without warranties of any kind. The author is not liable for any loss
            arising from its use, including loss of portfolio content. Keep a personal copy of anything important.
          </p>
        </section>
      </div>
    </div>
  );
}
