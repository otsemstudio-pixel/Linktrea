// Régénère les données de démonstration dans public/data.json à partir du
// profil de référence (src/lib/demoProfile.ts). Sert de point de départ
// local — pour figer un vrai profil en production, voir le README.
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { demoProfile } from '../src/lib/demoProfile.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outPath = path.join(__dirname, '../public/data.json')

writeFileSync(outPath, JSON.stringify(demoProfile, null, 2) + '\n')
console.log(`Données de démonstration écrites dans ${outPath}`)
