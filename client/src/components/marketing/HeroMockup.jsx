import { Check, LayoutDashboard, Sparkles, Gauge, Monitor, Smartphone, Wand2, ChevronRight } from 'lucide-react';
import PortfolioRenderer from '../../templates/PortfolioRenderer.jsx';
import TemplatePreviewFrame from './TemplatePreviewFrame.jsx';
import { demoPortfolioFor } from '../../utils/demoPortfolio.js';

/**
 * Product preview used in the landing hero: a miniature of the PortiAI editor
 * beside a real rendered portfolio template. Everything is illustrative sample
 * content, labelled as such in the surrounding copy.
 */
export default function HeroMockup() {
  const portfolio = demoPortfolioFor('aurora', '#6366f1');

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute -inset-x-10 -bottom-16 -top-10 rounded-[48px] bg-brand-gradient opacity-[0.16] blur-3xl"
        aria-hidden="true"
      />

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#080d1d]/85 shadow-[0_50px_120px_-50px_rgba(0,0,0,1)] backdrop-blur-xl">
        {/* Window chrome */}
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] bg-[#060a16]/90 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="flex gap-1.5" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]/70" />
            </span>
            <span className="ml-3 hidden items-center gap-1.5 rounded-md bg-white/[0.05] px-2.5 py-1 text-[10px] text-faint sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
              app.portiai.com/studio
            </span>
          </div>
          <span className="rounded-full border border-accent-line/60 bg-accent-soft px-2.5 py-1 text-[10px] font-medium text-accent-hover">
            Autosaved
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[132px_1fr]">
          {/* Sidebar */}
          <aside className="hidden border-r border-white/[0.07] bg-[#070c1a] p-3 md:block">
            <div className="mb-4 flex items-center gap-2 px-1">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-gradient text-[10px] font-bold text-white">P</span>
              <span className="text-[11px] font-semibold text-white">PortiAI</span>
            </div>
            {[
              { icon: LayoutDashboard, label: 'Dashboard', active: false },
              { icon: Sparkles, label: 'AI Builder', active: true },
              { icon: Wand2, label: 'Templates' },
              { icon: Gauge, label: 'Analyzer' },
            ].map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                className={`mb-0.5 flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px] ${
                  active ? 'bg-accent-soft font-medium text-white' : 'text-faint'
                }`}
              >
                <Icon size={11} aria-hidden="true" />
                {label}
              </div>
            ))}
            <div className="mt-6 rounded-lg border border-white/[0.07] bg-white/[0.03] p-2.5">
              <p className="text-[9px] uppercase tracking-wider text-faint">Portfolio score</p>
              <p className="mt-0.5 text-lg font-bold text-white">
                86<span className="text-[10px] font-medium text-muted">/100</span>
              </p>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[86%] rounded-full bg-gradient-to-r from-brand-blue to-brand-violet" />
              </div>
            </div>
          </aside>

          <div className="min-w-0 p-3 sm:p-4">
            {/* Chat panel */}
            <div className="rounded-xl border border-white/[0.07] bg-[#0a1122] p-3">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                  <Sparkles size={10} className="text-accent-hover" aria-hidden="true" />
                  AI Portfolio Builder
                </p>
                <span className="flex items-center gap-1 text-[9px] text-success">
                  <span className="h-1 w-1 rounded-full bg-success" aria-hidden="true" />
                  ready
                </span>
              </div>

              <div className="mt-3 space-y-2">
                <div className="ml-auto w-[78%] rounded-lg rounded-br-sm bg-brand-gradient/90 px-3 py-2 text-[10px] leading-relaxed text-white">
                  I&apos;m a frontend developer with React projects. Build me a dark portfolio with a blog.
                </div>
                <div className="w-[88%] rounded-lg rounded-bl-sm border border-white/[0.07] bg-white/[0.04] px-3 py-2 text-[10px] leading-relaxed text-inkSoft">
                  Great. I&apos;ve drafted your summary, three project descriptions and a skills list. Choose a template below and I&apos;ll lay it out.
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['Obsidian Pro', 'Aurora Gradient', 'Neon Terminal'].map((name, index) => (
                    <span
                      key={name}
                      className={`rounded-full border px-2 py-0.5 text-[9px] ${
                        index === 0 ? 'border-accent-line bg-accent-soft text-white' : 'border-white/10 text-faint'
                      }`}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#070c1a] px-2.5 py-1.5">
                <span className="text-[10px] text-faint">Describe your work…</span>
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-md bg-brand-gradient">
                  <ChevronRight size={11} className="text-white" aria-hidden="true" />
                </span>
              </div>
            </div>

            {/* Live preview */}
            <div className="mt-3 overflow-hidden rounded-xl border border-white/[0.07] bg-[#050813]">
              <div className="flex items-center justify-between border-b border-white/[0.07] px-3 py-1.5">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-muted">Live preview</p>
                <div className="flex items-center gap-1 text-faint" aria-hidden="true">
                  <Monitor size={9} />
                  <Smartphone size={9} />
                </div>
              </div>
              <TemplatePreviewFrame designWidth={900} designHeight={680} label="Sample Aurora Gradient portfolio preview">
                <PortfolioRenderer portfolio={portfolio} />
              </TemplatePreviewFrame>
            </div>
          </div>
        </div>
      </div>

      {/* Floating badges */}
      <div className="absolute -left-3 top-1/3 hidden animate-floatSlow items-center gap-2 rounded-xl border border-white/10 bg-[#0b1224]/95 px-3 py-2 shadow-float backdrop-blur lg:flex">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-successSoft text-success">
          <Check size={12} aria-hidden="true" />
        </span>
        <div>
          <p className="text-[10px] font-semibold text-white">Published</p>
          <p className="text-[9px] text-faint">your-name.portiai.app</p>
        </div>
      </div>

      <div className="absolute -right-4 bottom-24 hidden animate-floatSlow items-center gap-2 rounded-xl border border-white/10 bg-[#0b1224]/95 px-3 py-2 shadow-float backdrop-blur [animation-delay:1.5s] lg:flex">
        <Gauge size={16} className="text-accent-hover" aria-hidden="true" />
        <div>
          <p className="text-[10px] font-semibold text-white">Analyser report</p>
          <p className="text-[9px] text-faint">6 categories scored</p>
        </div>
      </div>
    </div>
  );
}
