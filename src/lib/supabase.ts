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
    Functions: Record<string, never>
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

export const supabase = createClient<Database>(url, anonKey)
