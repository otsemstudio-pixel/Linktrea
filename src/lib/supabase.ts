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
        }
        Insert: {
          id: string
          slug?: string | null
          data?: Json
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string | null
          data?: Json
          is_published?: boolean
          created_at?: string
          updated_at?: string
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
    Views: Record<string, never>
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
