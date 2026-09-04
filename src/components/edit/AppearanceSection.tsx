import { useEffect, useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { Check } from 'lucide-react'
import type { Profile, GalleryThemeId, ButtonStyle, HeaderLayout, ShapeLanguage, SignatureStyle, PlatformIconStyle, CustomThemeSettings } from '@/types'
import { ACCENT_SUGGESTIONS } from '@/lib/theme/accentSuggestions'
import { resolveAccent } from '@/lib/theme/accent'
import { ensureReadableTextColor } from '@/lib/theme/deriveSurfaces'
import { oklchToHex } from '@/lib/theme/color'
import { FONT_DUOS, FONT_DUO_IDS } from '@/lib/theme/fontDuos'
import { GALLERY_THEMES, GALLERY_THEME_IDS, type BackgroundTreatment } from '@/lib/theme/galleryThemes'
import EclatVariantPicker from './EclatVariantPicker'
import { resolveAppearanceBackground } from '@/lib/theme/resolveAppearance'
import { shapeTokens } from '@/lib/theme/shape'
import PlatformIcon from '@/components/PlatformIcon'
import {
  BUTTON_STYLE_LABELS,
  HEADER_LAYOUT_LABELS,
  SHAPE_LANGUAGE_LABELS,
  SIGNATURE_STYLE_LABELS,
  PLATFORM_ICON_STYLE_LABELS,
  customSettingsFromTheme,
} from '@/lib/theme/appearance'

const ADJUSTED_NOTICE_DURATION_MS = 4000
const BUTTON_STYLES: ButtonStyle[] = ['solid', 'outline', 'elevated']
const HEADER_LAYOUTS: HeaderLayout[] = ['classic', 'banner', 'seal']
const SHAPE_LANGUAGES: ShapeLanguage[] = ['sharp', 'soft', 'pill']
const SIGNATURE_STYLES: SignatureStyle[] = ['plain', 'stamp']
const PLATFORM_ICON_STYLES: PlatformIconStyle[] = ['accent', 'brand', 'white', 'black']

// Miniature "carte + bouton" dans le langage donné (personnalisation
// avancée, Phase 1) — un nom seul ('Net'/'Doux'/'Pilule') ne dit rien de
// l'effet réel, contrairement au style de boutons ou au layout d'en-tête,
// dont le nom seul se comprend déjà à peu près. Rayons calculés directement
// depuis shapeTokens(), jamais via var(--radius-*) : les trois options
// doivent s'afficher simultanément, indépendamment de celle actuellement
// appliquée à l'aperçu.
function ShapePreview({ shape }: { shape: ShapeLanguage }) {
  const tokens = shapeTokens(shape)
  return (
    <div className="flex items-end gap-1.5 mb-2" aria-hidden="true">
      <div className="h-7 w-9 border border-ink-raised bg-ink" style={{ borderRadius: tokens.lg }} />
      <div className="h-3.5 w-6 bg-accent" style={{ borderRadius: tokens.sm }} />
    </div>
  )
}

// Même logique que ShapePreview ci-dessus, pour la signature (Phase 4) —
// « Aa » comme échantillon, pas la vraie signature de la personne : ce
// sélecteur montre la FORME du traitement, une miniature n'a pas besoin de
// citer un vrai texte pour ça.
function SignaturePreview({ style }: { style: SignatureStyle }) {
  if (style === 'stamp') {
    return (
      <p
        className="italic text-[10px] font-mono border px-2 py-1 mb-1"
        style={{ borderColor: 'var(--accent)', transform: 'rotate(-4deg)' }}
        aria-hidden="true"
      >
        « Aa »
      </p>
    )
  }
  return (
    <p className="italic text-[10px] text-muted mb-1" aria-hidden="true">
      « Aa »
    </p>
  )
}

// Fonds "flat" assez clairs pour exiger un texte sombre dans la vignette de
// la grille ci-dessous — 'Titre' (finance) puis 'Missive' (prompt domaine
// Diplomatie, Phase 4) : un ensemble plutôt qu'une seule comparaison figée,
// pour qu'un futur thème clair s'y ajoute sans nouvelle branche de logique.
const LIGHT_FLAT_BACKGROUNDS = new Set(['#EDE8DE', '#F1E7D2'])

function treatmentPreviewStyle(treatment: BackgroundTreatment): React.CSSProperties {
  if (treatment.kind === 'flat') return { background: treatment.base }
  if (treatment.kind === 'gradient') return { background: `linear-gradient(to bottom, ${treatment.from}, ${treatment.to})` }
  // texture : pas de rendu du guillochis dans une vignette de 90px — l'aplat
  // suffit à distinguer visuellement le thème dans la grille.
  return { background: treatment.base, backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 6px)' }
}

// Sélecteur Galerie / Personnalisé (refonte v2, Phases 1-6) — le fond, la
// typographie, le style de boutons/cartes, le layout d'en-tête et le fond
// animé sont tous réels : choisir un thème nommé ou une couleur libre change
// immédiatement l'aperçu (voir useAppliedTheme et IdentityHeader.tsx,
// pilotés par profile.appearance). Seul l'accent reste un pont vers
// profile.theme — aucune Phase du prompt ne lui donne de valeur propre par
// thème.
function ThemeGallerySection() {
  const { control, setValue, getValues } = useFormContext<Profile>()
  const appearance = useWatch({ control, name: 'appearance' })
  const [adjustedNotice, setAdjustedNotice] = useState<string | null>(null)

  // Garde-fou de contraste (prompt "Icônes de plateformes...", Partie 1) —
  // 'white' sur un fond clair et 'black' sur un fond sombre produiraient des
  // icônes quasi invisibles ; désactivés plutôt que laissés au choix (voir
  // le rendu du sélecteur en mode Personnalisé plus bas). Sans objet en
  // Galerie : chaque thème y fixe déjà une valeur lisible sur SON fond (voir
  // GALLERY_THEMES), aucun sélecteur n'y est proposé.
  const isLightBackground = resolveAppearanceBackground(appearance).isLight
  const disabledIconStyles: PlatformIconStyle[] = isLightBackground ? ['white'] : ['black']

  useEffect(() => {
    if (!adjustedNotice) return
    const timer = setTimeout(() => setAdjustedNotice(null), ADJUSTED_NOTICE_DURATION_MS)
    return () => clearTimeout(timer)
  }, [adjustedNotice])

  function switchToGallery() {
    if (appearance.kind === 'gallery') return
    setValue(
      'appearance',
      { kind: 'gallery', themeId: 'ledger', animatedBackground: false, eclatVariant: 'braise', motion: appearance.motion },
      { shouldDirty: true },
    )
  }

  function switchToCustom() {
    if (appearance.kind === 'custom') return
    const currentTheme = getValues('theme')
    setValue(
      'appearance',
      { kind: 'custom', settings: customSettingsFromTheme(appearance, currentTheme), motion: appearance.motion },
      { shouldDirty: true },
    )
  }

  function selectGalleryTheme(themeId: GalleryThemeId) {
    if (appearance.kind !== 'gallery') return
    // Un thème qui a un fond animé l'affiche par défaut (voir le prompt v2 :
    // l'interrupteur "Fond animé" sert à le FIGER, pas à l'activer) ; un
    // thème sans fond animé n'a de toute façon aucun effet visuel de ce
    // booléen — le forcer à false évite juste de garder un état sans objet.
    const animatedBackground = GALLERY_THEMES[themeId].animationKind !== null
    setValue('appearance', { ...appearance, themeId, animatedBackground }, { shouldDirty: true })

    // Suggestion de traitement photo (correctif "filtres photo étendus") —
    // seulement si rien n'a encore été choisi ('none' fait office de "pas
    // encore touché" ici) : une fois la personne a délibérément réglé un
    // traitement, changer de thème ensuite ne doit plus jamais l'écraser.
    if (getValues('identity.photoTreatment') === 'none') {
      setValue('identity.photoTreatment', GALLERY_THEMES[themeId].photoTreatment, { shouldDirty: true })
    }
  }

  function updateSettings(patch: Partial<CustomThemeSettings>) {
    if (appearance.kind !== 'custom') return
    setValue('appearance', { ...appearance, settings: { ...appearance.settings, ...patch } }, { shouldDirty: true })
  }

  // Fond libre : dérive les surfaces en direct (voir useAppliedTheme) mais
  // doit aussi revalider le texte de page et des titres, choisis par
  // l'utilisateur — un texte lisible sur l'ancien fond peut ne plus l'être
  // sur le nouveau. Jamais après coup : au moment même du choix.
  function pickBackground(hex: string) {
    if (appearance.kind !== 'custom') return
    const page = ensureReadableTextColor(appearance.settings.pageTextColor, hex)
    const heading = ensureReadableTextColor(appearance.settings.headingColor, hex)
    setValue(
      'appearance',
      {
        ...appearance,
        settings: {
          ...appearance.settings,
          background: hex,
          pageTextColor: page.adjusted ? oklchToHex(page.color) : appearance.settings.pageTextColor,
          headingColor: heading.adjusted ? oklchToHex(heading.color) : appearance.settings.headingColor,
        },
      },
      { shouldDirty: true },
    )
    if (page.adjusted || heading.adjusted) setAdjustedNotice('Texte ajusté pour la lisibilité sur ce fond.')
  }

  function pickTextColor(key: 'pageTextColor' | 'headingColor', hex: string) {
    if (appearance.kind !== 'custom') return
    const result = ensureReadableTextColor(hex, appearance.settings.background)
    updateSettings({ [key]: result.adjusted ? oklchToHex(result.color) : hex })
    if (result.adjusted) setAdjustedNotice('Ajusté pour la lisibilité.')
  }

  return (
    <div className="mb-6 pb-6 border-b border-ink-raised">
      <span className="text-label uppercase tracking-label text-muted block mb-2">Thème</span>

      <div className="flex gap-1 p-1 rounded-md bg-ink mb-4 w-fit">
        <button
          type="button"
          onClick={switchToGallery}
          aria-pressed={appearance.kind === 'gallery'}
          className="min-h-9 px-3 rounded text-sm"
          style={{
            background: appearance.kind === 'gallery' ? 'var(--accent-subtle)' : 'transparent',
            color: appearance.kind === 'gallery' ? 'var(--accent)' : 'var(--paper)',
          }}
        >
          Galerie
        </button>
        <button
          type="button"
          onClick={switchToCustom}
          aria-pressed={appearance.kind === 'custom'}
          className="min-h-9 px-3 rounded text-sm"
          style={{
            background: appearance.kind === 'custom' ? 'var(--accent-subtle)' : 'transparent',
            color: appearance.kind === 'custom' ? 'var(--accent)' : 'var(--paper)',
          }}
        >
          Personnalisé
        </button>
      </div>

      {appearance.kind === 'gallery' ? (
        <>
          <div className="grid grid-cols-3 gap-2">
            {GALLERY_THEME_IDS.map((id) => {
              const meta = GALLERY_THEMES[id]
              const selected = appearance.themeId === id
              const textOnPreview =
                meta.background.kind === 'flat' && LIGHT_FLAT_BACKGROUNDS.has(meta.background.base) ? '#13110F' : '#E7E8E7'
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => selectGalleryTheme(id)}
                  aria-pressed={selected}
                  className="aspect-square rounded-lg border flex flex-col items-center justify-center gap-1 text-xs overflow-hidden"
                  style={{ borderColor: selected ? 'var(--accent)' : 'var(--ink-raised)', ...treatmentPreviewStyle(meta.background) }}
                >
                  {selected && <Check size={13} style={{ color: textOnPreview }} aria-hidden="true" />}
                  <span style={{ color: textOnPreview }}>{meta.name}</span>
                </button>
              )
            })}
          </div>

          {/* Réservé aux 4 thèmes qui déclarent un animationKind (Phase 6) —
              n'affiche pas un interrupteur sans effet sur les 8 autres. */}
          {GALLERY_THEMES[appearance.themeId].animationKind !== null && (
            <label className="flex items-center gap-2 min-h-11 text-sm mt-3">
              <input
                type="checkbox"
                checked={appearance.animatedBackground}
                onChange={(e) =>
                  setValue('appearance', { ...appearance, animatedBackground: e.target.checked }, { shouldDirty: true })
                }
                className="size-4 accent-[var(--accent)]"
              />
              Fond animé
            </label>
          )}

          {/* Seul "Éclat" propose plusieurs variantes de fond — les 12
              autres thèmes n'ont rien à choisir ici (voir le prompt : leur
              fond animé, quand ils en ont un, est fixe). */}
          {appearance.themeId === 'eclat' && (
            <EclatVariantPicker
              value={appearance.eclatVariant}
              onChange={(eclatVariant) => setValue('appearance', { ...appearance, eclatVariant }, { shouldDirty: true })}
            />
          )}
        </>
      ) : (
        <div className="flex flex-col gap-4">
          <label className="flex items-center gap-3 min-h-11">
            <span className="text-sm flex-1">Fond</span>
            <input
              type="color"
              value={appearance.settings.background}
              onChange={(e) => pickBackground(e.target.value)}
              className="h-9 w-14 rounded-md border border-ink-raised bg-transparent p-0.5 shrink-0"
            />
          </label>

          <div>
            <label className="flex items-center gap-2 min-h-11 text-sm">
              <input
                type="checkbox"
                checked={appearance.settings.animatedBackground}
                onChange={(e) => updateSettings({ animatedBackground: e.target.checked })}
                className="size-4 accent-[var(--accent)]"
              />
              Fond animé
            </label>
            {appearance.settings.animatedBackground && (
              <>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {appearance.settings.animatedColors.map((hex, i) => (
                    <label key={i} className="flex items-center gap-2 min-h-11">
                      <input
                        type="color"
                        value={hex}
                        onChange={(e) => {
                          const next = [...appearance.settings.animatedColors] as [string, string, string]
                          next[i] = e.target.value
                          updateSettings({ animatedColors: next })
                        }}
                        className="h-9 w-full rounded-md border border-ink-raised bg-transparent p-0.5 shrink-0"
                      />
                    </label>
                  ))}
                </div>
                <EclatVariantPicker
                  value={appearance.settings.animationStyle}
                  onChange={(animationStyle) => updateSettings({ animationStyle })}
                  colors={appearance.settings.animatedColors}
                  label="Style d'animation"
                />
              </>
            )}
          </div>

          {(
            [
              ['buttonColor', 'Couleur des boutons/cartes'],
              ['buttonTextColor', 'Couleur du texte des boutons'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-3 min-h-11">
              <span className="text-sm flex-1">{label}</span>
              <input
                type="color"
                value={appearance.settings[key]}
                onChange={(e) => updateSettings({ [key]: e.target.value })}
                className="h-9 w-14 rounded-md border border-ink-raised bg-transparent p-0.5 shrink-0"
              />
            </label>
          ))}

          {(
            [
              ['pageTextColor', 'Couleur du texte de page'],
              ['headingColor', 'Couleur des titres'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-3 min-h-11">
              <span className="text-sm flex-1">{label}</span>
              <input
                type="color"
                value={appearance.settings[key]}
                onChange={(e) => pickTextColor(key, e.target.value)}
                className="h-9 w-14 rounded-md border border-ink-raised bg-transparent p-0.5 shrink-0"
              />
            </label>
          ))}

          {adjustedNotice && (
            <p className="text-xs text-muted -mt-2" role="status">
              {adjustedNotice}
            </p>
          )}

          <div>
            <span className="text-label uppercase tracking-label text-muted block mb-2">Police de page</span>
            {/* Aperçus en image statique, comme au Niveau 1 (Galerie) : afficher
                ce sélecteur ne doit jamais charger les 14 paires de polices —
                seul le duo réellement choisi est récupéré, voir loadFontDuo.ts. */}
            <div className="grid grid-cols-2 gap-2">
              {FONT_DUO_IDS.map((id) => {
                const def = FONT_DUOS[id]
                const selected = appearance.settings.pageFontDuo === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => updateSettings({ pageFontDuo: id })}
                    aria-pressed={selected}
                    className="rounded-lg border p-2 text-left min-h-11 flex items-center justify-between gap-2"
                    style={{ borderColor: selected ? 'var(--accent)' : 'var(--ink-raised)' }}
                  >
                    <img
                      src={`${import.meta.env.BASE_URL}theme/duo-previews/${id}.png`}
                      alt={`${def.name} — ${def.character}`}
                      width={140}
                      height={36}
                      className="h-9 w-auto"
                    />
                    {selected && <Check size={14} className="text-accent shrink-0" aria-hidden="true" />}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-muted mt-2">{FONT_DUOS[appearance.settings.pageFontDuo].character}</p>
          </div>

          <label className="flex items-center gap-2 min-h-11 text-sm">
            <input
              type="checkbox"
              checked={appearance.settings.headingFontFamily === null}
              onChange={(e) => updateSettings({ headingFontFamily: e.target.checked ? null : '' })}
              className="size-4 accent-[var(--accent)]"
            />
            Police des titres identique à la police de page
          </label>
          {appearance.settings.headingFontFamily !== null && (
            <label className="block">
              <span className="text-label uppercase tracking-label text-muted block mb-1.5">Police des titres</span>
              <input
                type="text"
                value={appearance.settings.headingFontFamily}
                onChange={(e) => updateSettings({ headingFontFamily: e.target.value })}
                placeholder="Nom de la police"
                className="w-full min-h-11 rounded-md border border-ink-raised bg-ink px-3 text-sm text-paper focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
              />
            </label>
          )}

          <div>
            <span className="text-label uppercase tracking-label text-muted block mb-2">Style des boutons</span>
            <div className="grid grid-cols-3 gap-2">
              {BUTTON_STYLES.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => updateSettings({ buttonStyle: style })}
                  aria-pressed={appearance.settings.buttonStyle === style}
                  className="min-h-11 rounded-md border text-sm"
                  style={{ borderColor: appearance.settings.buttonStyle === style ? 'var(--accent)' : 'var(--ink-raised)' }}
                >
                  {BUTTON_STYLE_LABELS[style]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-label uppercase tracking-label text-muted block mb-2">Layout d'en-tête</span>
            <div className="grid grid-cols-3 gap-2">
              {HEADER_LAYOUTS.map((layout) => (
                <button
                  key={layout}
                  type="button"
                  onClick={() => updateSettings({ headerLayout: layout })}
                  aria-pressed={appearance.settings.headerLayout === layout}
                  className="min-h-11 rounded-md border text-sm"
                  style={{ borderColor: appearance.settings.headerLayout === layout ? 'var(--accent)' : 'var(--ink-raised)' }}
                >
                  {HEADER_LAYOUT_LABELS[layout]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-label uppercase tracking-label text-muted block mb-2">Langage de forme</span>
            <div className="grid grid-cols-3 gap-2">
              {SHAPE_LANGUAGES.map((shape) => (
                <button
                  key={shape}
                  type="button"
                  onClick={() => updateSettings({ shape })}
                  aria-pressed={appearance.settings.shape === shape}
                  className="rounded-md border p-2 flex flex-col items-center text-sm"
                  style={{ borderColor: appearance.settings.shape === shape ? 'var(--accent)' : 'var(--ink-raised)' }}
                >
                  <ShapePreview shape={shape} />
                  {SHAPE_LANGUAGE_LABELS[shape]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-label uppercase tracking-label text-muted block mb-2">Style de signature</span>
            <div className="grid grid-cols-2 gap-2">
              {SIGNATURE_STYLES.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => updateSettings({ signatureStyle: style })}
                  aria-pressed={appearance.settings.signatureStyle === style}
                  className="rounded-md border p-2 flex flex-col items-center text-sm"
                  style={{ borderColor: appearance.settings.signatureStyle === style ? 'var(--accent)' : 'var(--ink-raised)' }}
                >
                  <SignaturePreview style={style} />
                  {SIGNATURE_STYLE_LABELS[style]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-label uppercase tracking-label text-muted block mb-2">Style des icônes de réseaux</span>
            <div className="grid grid-cols-2 gap-2">
              {PLATFORM_ICON_STYLES.map((style) => {
                const poorContrast = disabledIconStyles.includes(style)
                return (
                  <button
                    key={style}
                    type="button"
                    onClick={() => updateSettings({ platformIconStyle: style })}
                    aria-pressed={appearance.settings.platformIconStyle === style}
                    disabled={poorContrast}
                    className="rounded-md border p-2 flex flex-col items-center gap-1.5 text-sm disabled:opacity-40"
                    style={{
                      borderColor: appearance.settings.platformIconStyle === style ? 'var(--accent)' : 'var(--ink-raised)',
                    }}
                  >
                    <div className="flex gap-1.5" aria-hidden="true">
                      <PlatformIcon platform="github" style={style} size={18} />
                      <PlatformIcon platform="instagram" style={style} size={18} />
                    </div>
                    {PLATFORM_ICON_STYLE_LABELS[style]}
                  </button>
                )
              })}
            </div>
            {disabledIconStyles.length > 0 && (
              <p className="text-xs text-muted mt-2">
                {disabledIconStyles.map((s) => PLATFORM_ICON_STYLE_LABELS[s]).join(', ')} peu lisible sur ce fond, désactivé.
              </p>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-muted mt-4">
        Le fond, la typographie, le style de boutons/cartes, le layout d'en-tête et le fond animé pilotent déjà
        l'aperçu, en Galerie comme en Personnalisé — en Personnalisé, la palette et le style d'animation du
        fond animé restent libres, jamais liés au thème "Éclat" de la Galerie.
      </p>
    </div>
  )
}

export default function AppearanceSection() {
  const { control, setValue } = useFormContext<Profile>()
  const appearance = useWatch({ control, name: 'appearance' })
  const accent = useWatch({ control, name: 'theme.accent' })
  const motion = useWatch({ control, name: 'theme.motion' })

  // Message transitoire "ajusté pour la lisibilité" — pas un état dérivé de
  // theme.accent : la valeur stockée est toujours DÉJÀ corrigée (voir
  // resolveAccent), donc on ne peut pas savoir après coup si une correction
  // a eu lieu. On le garde en local, posé au moment du choix, et effacé
  // après quelques secondes.
  const [adjustedNotice, setAdjustedNotice] = useState(false)

  useEffect(() => {
    if (!adjustedNotice) return
    const timer = setTimeout(() => setAdjustedNotice(false), ADJUSTED_NOTICE_DURATION_MS)
    return () => clearTimeout(timer)
  }, [adjustedNotice])

  // L'accent reste un pont partagé par tous les thèmes de la Galerie tant
  // que la Phase 4 (style de boutons) ne donne pas sa propre couleur à
  // chacun — corrigé contre le fond RÉSOLU de profile.appearance, pas contre
  // l'ancien theme.background qui ne pilote plus rien.
  const referenceBackground = resolveAppearanceBackground(appearance).hex

  function pickAccent(hex: string) {
    const resolved = resolveAccent(hex, referenceBackground)
    setValue('theme.accent', resolved.hex, { shouldDirty: true })
    setAdjustedNotice(resolved.adjusted)
  }

  return (
    <>
      <ThemeGallerySection />

      <span className="text-label uppercase tracking-label text-muted block mb-2">Accent</span>
      <div className="grid grid-cols-6 gap-2 mb-3">
        {ACCENT_SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion.hex}
            type="button"
            onClick={() => pickAccent(suggestion.hex)}
            aria-label={suggestion.name}
            aria-pressed={accent?.toLowerCase() === suggestion.hex.toLowerCase()}
            className="size-9 min-h-9 rounded-full border-2 flex items-center justify-center"
            style={{
              background: suggestion.hex,
              borderColor:
                accent?.toLowerCase() === suggestion.hex.toLowerCase() ? 'var(--paper)' : 'transparent',
            }}
          >
            {accent?.toLowerCase() === suggestion.hex.toLowerCase() && (
              <Check size={14} className="text-ink" aria-hidden="true" />
            )}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-3 min-h-11 mb-1">
        <span className="text-sm">Personnalisé</span>
        <input
          type="color"
          value={accent ?? '#E4A93C'}
          onChange={(e) => pickAccent(e.target.value)}
          className="h-9 w-14 rounded-md border border-ink-raised bg-transparent p-0.5"
        />
        <span className="text-xs font-mono text-muted">{accent}</span>
      </label>

      {adjustedNotice && (
        <p className="text-xs text-muted mb-4" role="status">
          Ajusté pour la lisibilité.
        </p>
      )}

      <label className="flex items-center gap-2 min-h-11 text-sm mt-5">
        <input
          type="checkbox"
          checked={motion === 'reduced'}
          onChange={(e) => setValue('theme.motion', e.target.checked ? 'reduced' : 'full', { shouldDirty: true })}
          className="size-4 accent-[var(--accent)]"
        />
        Réduire les animations
      </label>
    </>
  )
}
