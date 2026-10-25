import { AlertTriangle } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="container-page max-w-3xl py-12">
      <p className="eyebrow">Privacy</p>
      <h1 className="mt-2 text-3xl">Privacy information</h1>

      <div className="mt-5 flex gap-3 rounded-md border border-warning/25 bg-warningSoft px-4 py-3 text-sm leading-6 text-warning">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p>
          This is a plain-language explanation written for an academic project. It is not a legally reviewed privacy
          policy and does not constitute legal advice. Before using this application with real personal data outside a
          coursework context, replace it with a policy reviewed by a qualified person.
        </p>
      </div>

      <div className="mt-7 space-y-6 text-sm leading-7 text-inkSoft">
        <section>
          <h2 className="text-lg text-ink">What is stored</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>Your name, email address and a bcrypt hash of your password. The plain password is never stored.</li>
            <li>The portfolio content you enter: profile details, skills, education, projects, experience, achievements, links and design preferences.</li>
            <li>Generated analysis results, the template you selected, and publish status with timestamps.</li>
            <li>A daily counter of your AI requests, used to enforce the usage cap.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg text-ink">Session handling</h2>
          <p className="mt-2">
            Signing in issues a signed JSON Web Token in an HTTP-only cookie. The browser cannot read it with
            JavaScript. Signing out increments a per-account token version on the server, which invalidates the cookie
            even if a copy of it exists elsewhere.
          </p>
        </section>

        <section>
          <h2 className="text-lg text-ink">What becomes public</h2>
          <p className="mt-2">
            Only portfolios you explicitly publish are served at <code className="rounded bg-canvasAlt px-1 py-0.5 font-mono text-xs">/p/&lt;slug&gt;</code>.
            The public response contains portfolio content only: no email address of your account, no portfolio ids for
            other users, no analysis results. Your account email appears only if you type it into the portfolio&apos;s
            contact field yourself.
          </p>
        </section>

        <section>
          <h2 className="text-lg text-ink">Third-party services</h2>
          <p className="mt-2">
            When you use an AI feature, the facts you supplied for that request (for example a project description and
            your listed technologies) are sent to Google&apos;s Gemini API through the backend. Other portfolio data stays
            in the project&apos;s own MongoDB database. Hosting providers (Vercel, Render, MongoDB Atlas) process data as
            part of running the application.
          </p>
        </section>

        <section>
          <h2 className="text-lg text-ink">Data removal</h2>
          <p className="mt-2">
            Deleting your account in <span className="font-medium text-ink">Settings</span> removes your user record and
            all portfolios you own from the database. Deleted data cannot be recovered from the application.
          </p>
        </section>

        <section>
          <h2 className="text-lg text-ink">Cookies</h2>
          <p className="mt-2">
            One functional cookie is used for the session. There is no advertising, analytics or tracking cookie in this
            build.
          </p>
        </section>
      </div>
    </div>
  );
}
