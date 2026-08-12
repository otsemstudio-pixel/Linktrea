import { useState, type ReactNode } from 'react'
import { MotionPrefsProvider } from '@/lib/motion/MotionPrefsContext'
import Sparkline from '@/components/Sparkline'
import { useAdminMetrics, type PeriodDays } from './useAdminMetrics'
import ExportButtons from './ExportButtons'

// Outil interne (doc "Tableau de bord admin", Phase 3) — mise en page neutre
// et fonctionnelle, volontairement indépendante du système de thème par
// profil (Galerie/Personnalisé) qui pilote le reste du produit : cette page
// n'affiche jamais le profil de personne, pas de thème à appliquer.

function MetricCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-ink-raised bg-ink-raised/30 p-5">
      <h2 className="text-label uppercase tracking-label text-muted mb-4">{title}</h2>
      {children}
    </section>
  )
}

function SegmentedButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-9 px-3 text-xs font-medium focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 ${
        selected ? 'bg-accent text-ink' : 'text-muted'
      }`}
    >
      {label}
    </button>
  )
}

function HorizontalBarList({ items, emptyLabel }: { items: { label: string; count: number }[]; emptyLabel: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">{emptyLabel}</p>
  }
  const max = Math.max(1, ...items.map((i) => i.count))
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => (
        <li key={item.label}>
          <div className="flex justify-between text-sm mb-1">
            <span>{item.label}</span>
            <span className="font-mono text-muted">{item.count}</span>
          </div>
          <div className="h-1.5 rounded-full bg-ink overflow-hidden">
            <div className="h-full bg-accent rounded-full" style={{ width: `${(item.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

export default function AdminDashboard() {
  const [days, setDays] = useState<PeriodDays>(90)
  const metrics = useAdminMetrics(days)

  return (
    <MotionPrefsProvider themeMotion="full">
      <div className="min-h-dvh bg-ink text-paper font-sans p-4 lg:p-8">
        <div className="max-w-[1100px] mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h1 className="text-xl font-medium">Tableau de bord admin</h1>
            <div className="flex rounded-md border border-ink-raised overflow-hidden">
              <SegmentedButton label="30 j" selected={days === 30} onClick={() => setDays(30)} />
              <SegmentedButton label="90 j" selected={days === 90} onClick={() => setDays(90)} />
              <SegmentedButton label="180 j" selected={days === 180} onClick={() => setDays(180)} />
            </div>
          </div>

          {metrics.status === 'loading' && <p className="text-sm text-muted">Chargement…</p>}
          {metrics.status === 'error' && (
            <p className="text-sm text-down">Impossible de charger les métriques pour le moment. Réessaie dans un instant.</p>
          )}

          {metrics.status === 'ready' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <MetricCard title={`Inscriptions — ${days} derniers jours`}>
                <p className="font-mono font-medium text-2xl leading-none mb-3">
                  {metrics.signupTrend.reduce((sum, p) => sum + p.signups, 0)}
                </p>
                <Sparkline trend={metrics.signupTrend.map((p) => p.signups)} delay={0} />
                <ExportButtons
                  filename={`linktrea-inscriptions-${days}j`}
                  rows={metrics.signupTrend.map((p) => ({ Jour: p.day, Inscriptions: p.signups }))}
                />
              </MetricCard>

              <MetricCard title="Publication">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="font-mono font-medium text-2xl leading-none">{metrics.publishStats.totalProfiles}</p>
                    <p className="text-xs text-muted mt-1.5">Profils</p>
                  </div>
                  <div>
                    <p className="font-mono font-medium text-2xl leading-none">{metrics.publishStats.publishedProfiles}</p>
                    <p className="text-xs text-muted mt-1.5">Publiés</p>
                  </div>
                  <div>
                    <p className="font-mono font-medium text-2xl leading-none">{metrics.publishStats.publishRate}%</p>
                    <p className="text-xs text-muted mt-1.5">Taux</p>
                  </div>
                </div>
                <ExportButtons
                  filename="linktrea-publication"
                  rows={[
                    {
                      'Profils totaux': metrics.publishStats.totalProfiles,
                      'Profils publiés': metrics.publishStats.publishedProfiles,
                      'Taux de publication (%)': metrics.publishStats.publishRate,
                    },
                  ]}
                />
              </MetricCard>

              <MetricCard title="Popularité des thèmes">
                <HorizontalBarList
                  items={metrics.themePopularity.map((t) => ({ label: t.themeName, count: t.profileCount }))}
                  emptyLabel="Aucun profil pour le moment."
                />
                <ExportButtons
                  filename="linktrea-themes"
                  rows={metrics.themePopularity.map((t) => ({ Thème: t.themeName, Profils: t.profileCount }))}
                />
              </MetricCard>

              <MetricCard title="Répartition par domaine">
                <HorizontalBarList
                  items={metrics.domainDistribution.map((d) => ({ label: d.domain, count: d.profileCount }))}
                  emptyLabel="Aucun profil pour le moment."
                />
                <ExportButtons
                  filename="linktrea-domaines"
                  rows={metrics.domainDistribution.map((d) => ({ Domaine: d.domain, Profils: d.profileCount }))}
                />
              </MetricCard>

              <MetricCard title={`Engagement global — ${days} derniers jours`}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted mb-1.5">
                      Vues · {metrics.engagementTrend.reduce((sum, p) => sum + p.totalViews, 0)}
                    </p>
                    <Sparkline trend={metrics.engagementTrend.map((p) => p.totalViews)} delay={0} />
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-1.5">
                      Clics · {metrics.engagementTrend.reduce((sum, p) => sum + p.totalClicks, 0)}
                    </p>
                    <Sparkline trend={metrics.engagementTrend.map((p) => p.totalClicks)} delay={0} />
                  </div>
                </div>
                <ExportButtons
                  filename={`linktrea-engagement-${days}j`}
                  rows={metrics.engagementTrend.map((p) => ({ Jour: p.day, Vues: p.totalViews, Clics: p.totalClicks }))}
                />
              </MetricCard>
            </div>
          )}
        </div>
      </div>
    </MotionPrefsProvider>
  )
}
