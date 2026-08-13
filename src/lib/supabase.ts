import { createClient } from '@supabase/supabase-js'

// Types minimaux de public.profiles / public.reserved_slugs (voir
// supabase/migrations/20260806120000_create_profiles.sql). Le contenu réel
// de `data` est validé par zod côté store (profileSchema), pas ici — on ne
// duplique pas cette validation dans le typage de la table.
type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

// Tables/Views/Functions et Relationships sont exigés tels quels par
// GenericSchema/GenericTable de @supabase/postgrest-js (v2.112) : sans eux,
// le type ne matche pas la contrainte générique et postgrest-js retombe
// silencieusement sur `never` pour chaque colonne, sans erreur claire à
// l'usage — seulement des "Property does not exist on type 'never'" épars.
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          slug: string | null
          data: Json
          is_published: boolean
          created_at: string
          updated_at: string
          // Instantané public + horodatage de dernière publication (doc
          // "Complétude, historique, publication différée", Phase 3) —
          // colonnes déjà ajoutées côté Supabase, pas de migration ici.
          // `data` reste le brouillon en cours d'édition, TOUJOURS visible du
          // propriétaire ; `published_snapshot` est ce que la route publique
          // sert désormais (via la vue public_profiles), figé au moment du
          // dernier publish_profile_changes().
          published_snapshot: Json | null
          published_at: string | null
          // Publication automatique optionnelle (doc "Publication automatique
          // optionnelle + clarification de l'export", Phase 1) — false par
          // défaut, jamais actif tant que le propriétaire ne l'a pas
          // explicitement activé dans la zone Compte.
          auto_publish: boolean
        }
        Insert: {
          id: string
          slug?: string | null
          data?: Json
          is_published?: boolean
          created_at?: string
          updated_at?: string
          published_snapshot?: Json | null
          published_at?: string | null
          auto_publish?: boolean
        }
        Update: {
          id?: string
          slug?: string | null
          data?: Json
          is_published?: boolean
          created_at?: string
          updated_at?: string
          published_snapshot?: Json | null
          published_at?: string | null
          auto_publish?: boolean
        }
        Relationships: []
      }
      reserved_slugs: {
        Row: { slug: string }
        Insert: { slug: string }
        Update: { slug?: string }
        Relationships: []
      }
    }
    Views: {
      // `data` ici = published_snapshot de profiles, jamais le brouillon —
      // voir la définition réelle de la vue (doc Phase 3) : filtrée à
      // is_published = true and published_snapshot is not null, donc un
      // profil non publié ou publié sans snapshot n'y apparaît simplement
      // pas (loadBySlug le traite alors comme "profil introuvable", sans
      // cas d'erreur à distinguer côté client).
      public_profiles: {
        Row: {
          id: string
          slug: string | null
          data: Json | null
          published_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      // Voir supabase/migrations/20260810120000_delete_own_account.sql.
      delete_own_account: {
        Args: Record<string, never>
        Returns: undefined
      }
      // Voir supabase/migrations/20260811130000_profile_stats.sql (dashboard
      // de statistiques, Phase 1). record_link_click n'est pas appelée via
      // supabase.rpc() côté client (voir src/lib/stats.ts — fetch manuel pour
      // pouvoir attacher le jeton de session), le type reste néanmoins
      // déclaré ici pour rester fidèle au schéma SQL réel.
      record_profile_view: {
        Args: { p_slug: string }
        Returns: undefined
      }
      record_link_click: {
        Args: { p_slug: string; p_link_id: string }
        Returns: undefined
      }
      get_my_profile_stats: {
        Args: { p_days?: number }
        Returns: { day: string; views: number }[]
      }
      get_my_link_clicks: {
        Args: { p_days?: number }
        Returns: { link_id: string; total_clicks: number }[]
      }
      // Voir le schéma réel de profile_history/get_my_profile_history()/
      // restore_profile_version() confirmé côté Supabase (doc "Complétude,
      // historique, publication différée", Phase 2) — fonctions
      // SECURITY DEFINER déjà créées, pas de migration à écrire ici.
      get_my_profile_history: {
        Args: Record<string, never>
        Returns: { id: string; created_at: string }[]
      }
      restore_profile_version: {
        Args: { p_history_id: string }
        Returns: undefined
      }
      // Voir supabase/migrations/20260812120000_get_profile_history_entry.sql
      // — ajoutée après coup : get_my_profile_history() seule ne suffisait
      // pas à afficher l'aperçu d'une version (profile_history n'a pas de
      // policy RLS pour une lecture directe par le propriétaire).
      get_profile_history_entry: {
        Args: { p_history_id: string }
        Returns: Json
      }
      // Voir le schéma réel de public_profiles/publish_profile_changes()
      // confirmé côté Supabase (doc "Complétude, historique, publication
      // différée", Phase 3) — copie profiles.data dans published_snapshot,
      // pose published_at = now() et is_published = true ; pas de migration
      // à écrire ici, déjà en place.
      publish_profile_changes: {
        Args: Record<string, never>
        Returns: undefined
      }
      // Voir supabase/migrations/20260812200000_admin_status.sql (doc
      // "Tableau de bord admin", Phase 1) — seul point d'accès à la table
      // admins (RLS activé sans aucune policy directe).
      am_i_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      // Voir supabase/migrations/20260812210000_admin_metrics.sql (doc
      // "Tableau de bord admin", Phase 2) — chacune vérifie am_i_admin() en
      // première ligne et lève une exception sinon, jamais de ligne par
      // profil individuel.
      admin_signup_trend: {
        Args: { p_days?: number }
        Returns: { day: string; signups: number }[]
      }
      admin_publish_stats: {
        Args: Record<string, never>
        Returns: { total_profiles: number; published_profiles: number; publish_rate: number }[]
      }
      admin_theme_popularity: {
        Args: Record<string, never>
        Returns: { theme_name: string; profile_count: number }[]
      }
      admin_engagement_trend: {
        Args: { p_days?: number }
        Returns: { day: string; total_views: number; total_clicks: number }[]
      }
      admin_domain_distribution: {
        Args: Record<string, never>
        Returns: { domain: string; profile_count: number }[]
      }
    }
  }
}

// N'est importé (et donc évalué) que par SupabaseProfileStore, lui-même
// chargé dynamiquement uniquement quand VITE_STORAGE_MODE=supabase (voir
// src/lib/store/index.ts) — en mode local, ce fichier ne s'exécute jamais,
// donc pas d'erreur si les variables ne sont pas renseignées.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être renseignées dans .env pour utiliser VITE_STORAGE_MODE=supabase.',
  )
}

// Explicite plutôt que reposer sur les valeurs par défaut du SDK (elles le
// sont déjà, mais une config de session pour de vrais comptes doit être
// visible à l'audit, pas déduite) : persistSession stocke le token localement
// (localStorage, jamais un cookie — voir AuthContext.tsx) ; autoRefreshToken
// le renouvelle en tâche de fond tant que l'onglet est ouvert, pour que la
// session survive au-delà de sa durée de vie courte sans reconnexion
// manuelle ; detectSessionInUrl lit le `?code=...` du retour de lien
// magique (voir LoginPage.tsx pour pourquoi cette URL ne doit pas déjà
// contenir de hash).
export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
