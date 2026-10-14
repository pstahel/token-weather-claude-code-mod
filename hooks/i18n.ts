import type { AnalogyName } from './forecast'

export const LANGS = ['en', 'de', 'es', 'it', 'fr'] as const
export type Lang = (typeof LANGS)[number]
export const DEFAULT_LANG: Lang = 'en'

export const langOf = (v: unknown): Lang => (LANGS.includes(v as Lang) ? (v as Lang) : DEFAULT_LANG)

/** An analogy's words in one language. */
export type AnalogyWords = {
  /** The five steps, emptiest first. */
  steps: readonly [string, string, string, string, string]
  /** What a turn is called, one and many (`trip`, `trips`): the range counts them. */
  unit: readonly [string, string]
  /** How the last turn's delta is labelled (`last trip`). */
  last: string
  /** The cache gauge: warm, cooling, cold. */
  cache: readonly [string, string, string]
}

/** The words every analogy shares in one language. */
export type Phrases = {
  /** After the percentage of an analogy that counts what is left (`33% left`). */
  left: string
  /** After the cache's hit rate (`92% hit`). */
  hit: string
  timeLeft: (mins: number, ttl: number) => string
  rewrites: (tokens: string) => string
}

export const PHRASES: Record<Lang, Phrases> = {
  en: {
    left: 'left',
    hit: 'hit',
    timeLeft: (m, t) => `${m} of ${t} min left`,
    rewrites: k => `next turn rewrites ${k}`,
  },
  de: {
    left: 'übrig',
    hit: 'Treffer',
    timeLeft: (m, t) => `noch ${m} von ${t} min`,
    rewrites: k => `nächster Turn schreibt ${k} neu`,
  },
  es: {
    left: 'restante',
    hit: 'acierto',
    timeLeft: (m, t) => `quedan ${m} de ${t} min`,
    rewrites: k => `el próximo turno reescribe ${k}`,
  },
  it: {
    left: 'rimasto',
    hit: 'hit',
    timeLeft: (m, t) => `ancora ${m} di ${t} min`,
    rewrites: k => `il prossimo turno riscrive ${k}`,
  },
  fr: {
    left: 'restant',
    hit: 'succès',
    timeLeft: (m, t) => `encore ${m} sur ${t} min`,
    rewrites: k => `le prochain tour réécrit ${k}`,
  },
}

export const WORDS: Record<Lang, Record<AnalogyName, AnalogyWords>> = {
  en: {
    weather: {
      steps: ['Clear', 'Cloudy', 'Showers', 'Storm', 'Compact soon'],
      unit: ['turn', 'turns'],
      last: 'last turn',
      cache: ['mild', 'chilly', 'frost'],
    },
    moon: {
      steps: ['New moon', 'Waxing', 'Half moon', 'Gibbous', 'Full moon, compact soon'],
      unit: ['night', 'nights'],
      last: 'last night',
      cache: ['lantern lit', 'lantern dim', 'lantern out'],
    },
    hearts: {
      steps: ['Full health', 'Scratched', 'Wounded', 'Critical', 'Low HP, /compact to heal'],
      unit: ['hit', 'hits'],
      last: 'last hit',
      cache: ['buff active', 'buff fading', 'buff gone'],
    },
    fuel: {
      steps: ['Full tank', 'Three quarters', 'Half tank', 'Reserve', 'Refuel, /compact'],
      unit: ['trip', 'trips'],
      last: 'last trip',
      cache: ['engine warm', 'engine cooling', 'cold start'],
    },
    pot: {
      steps: ['Cold', 'Warm', 'Simmering', 'Boiling', 'Boiling over'],
      unit: ['ladle', 'ladles'],
      last: 'last ladle',
      cache: ['stove hot', 'stove cooling', 'stove cold'],
    },
    tide: {
      steps: ['Low tide', 'Calm', 'Swell', 'Surf', 'Storm surge'],
      unit: ['wave', 'waves'],
      last: 'last wave',
      cache: ['water warm', 'water cooling', 'water cold'],
    },
    daytime: {
      steps: ['Morning', 'Noon', 'Afternoon', 'Evening', 'Midnight, time to compact'],
      unit: ['hour', 'hours'],
      last: 'last hour',
      cache: ['coffee hot', 'coffee cooling', 'coffee cold'],
    },
    volcano: {
      steps: ['Dormant', 'Rumbling', 'Smoking', 'Glowing', 'Eruption, compact now'],
      unit: ['quake', 'quakes'],
      last: 'last quake',
      cache: ['lava glowing', 'lava cooling', 'rock cold'],
    },
  },
  de: {
    weather: {
      steps: ['Klar', 'Bewölkt', 'Schauer', 'Gewitter', 'Bald compacten'],
      unit: ['Turn', 'Turns'],
      last: 'letzter Turn',
      cache: ['mild', 'kühl', 'Frost'],
    },
    moon: {
      steps: ['Neumond', 'Zunehmend', 'Halbmond', 'Fast voll', 'Vollmond, bald compacten'],
      unit: ['Nacht', 'Nächte'],
      last: 'letzte Nacht',
      cache: ['Laterne an', 'Laterne schwach', 'Laterne aus'],
    },
    hearts: {
      steps: ['Volle Gesundheit', 'Kratzer', 'Verwundet', 'Kritisch', 'Wenig HP, /compact heilt'],
      unit: ['Treffer', 'Treffer'],
      last: 'letzter Treffer',
      cache: ['Buff aktiv', 'Buff schwindet', 'Buff weg'],
    },
    fuel: {
      steps: ['Voller Tank', 'Dreiviertel', 'Halber Tank', 'Reserve', 'Tanken, /compact'],
      unit: ['Fahrt', 'Fahrten'],
      last: 'letzte Fahrt',
      cache: ['Motor warm', 'Motor kühlt ab', 'Kaltstart'],
    },
    pot: {
      steps: ['Kalt', 'Lauwarm', 'Köchelt', 'Kocht', 'Kocht über'],
      unit: ['Kelle', 'Kellen'],
      last: 'letzte Kelle',
      cache: ['Herd heiß', 'Herd kühlt ab', 'Herd kalt'],
    },
    tide: {
      steps: ['Ebbe', 'Ruhig', 'Dünung', 'Brandung', 'Sturmflut'],
      unit: ['Welle', 'Wellen'],
      last: 'letzte Welle',
      cache: ['Wasser warm', 'Wasser kühlt ab', 'Wasser kalt'],
    },
    daytime: {
      steps: ['Morgen', 'Mittag', 'Nachmittag', 'Abend', 'Mitternacht, Zeit zu compacten'],
      unit: ['Stunde', 'Stunden'],
      last: 'letzte Stunde',
      cache: ['Kaffee heiß', 'Kaffee kühlt ab', 'Kaffee kalt'],
    },
    volcano: {
      steps: ['Ruhend', 'Grollt', 'Raucht', 'Glüht', 'Ausbruch, jetzt compacten'],
      unit: ['Beben', 'Beben'],
      last: 'letztes Beben',
      cache: ['Lava glüht', 'Lava kühlt ab', 'Gestein kalt'],
    },
  },
  es: {
    weather: {
      steps: ['Despejado', 'Nublado', 'Chubascos', 'Tormenta', 'Compacta pronto'],
      unit: ['turno', 'turnos'],
      last: 'último turno',
      cache: ['templado', 'fresco', 'helada'],
    },
    moon: {
      steps: ['Luna nueva', 'Creciente', 'Media luna', 'Gibosa', 'Luna llena, compacta pronto'],
      unit: ['noche', 'noches'],
      last: 'última noche',
      cache: ['farol encendido', 'farol tenue', 'farol apagado'],
    },
    hearts: {
      steps: ['Salud completa', 'Rasguño', 'Herido', 'Crítico', 'Poca vida, /compact cura'],
      unit: ['golpe', 'golpes'],
      last: 'último golpe',
      cache: ['buff activo', 'buff se agota', 'buff perdido'],
    },
    fuel: {
      steps: ['Depósito lleno', 'Tres cuartos', 'Medio depósito', 'Reserva', 'Repostar, /compact'],
      unit: ['viaje', 'viajes'],
      last: 'último viaje',
      cache: ['motor caliente', 'motor enfriándose', 'arranque en frío'],
    },
    pot: {
      steps: ['Frío', 'Tibio', 'A fuego lento', 'Hirviendo', 'Se desborda'],
      unit: ['cucharón', 'cucharones'],
      last: 'último cucharón',
      cache: ['fogón caliente', 'fogón enfriándose', 'fogón frío'],
    },
    tide: {
      steps: ['Marea baja', 'Calma', 'Mar de fondo', 'Oleaje', 'Marejada'],
      unit: ['ola', 'olas'],
      last: 'última ola',
      cache: ['agua templada', 'agua enfriándose', 'agua fría'],
    },
    daytime: {
      steps: ['Mañana', 'Mediodía', 'Tarde', 'Anochecer', 'Medianoche, hora de compactar'],
      unit: ['hora', 'horas'],
      last: 'última hora',
      cache: ['café caliente', 'café enfriándose', 'café frío'],
    },
    volcano: {
      steps: ['Dormido', 'Retumba', 'Humea', 'Brilla', 'Erupción, compacta ya'],
      unit: ['temblor', 'temblores'],
      last: 'último temblor',
      cache: ['lava ardiente', 'lava enfriándose', 'roca fría'],
    },
  },
  it: {
    weather: {
      steps: ['Sereno', 'Nuvoloso', 'Rovesci', 'Temporale', 'Compatta presto'],
      unit: ['turno', 'turni'],
      last: 'ultimo turno',
      cache: ['mite', 'fresco', 'gelo'],
    },
    moon: {
      steps: ['Luna nuova', 'Crescente', 'Mezza luna', 'Gibbosa', 'Luna piena, compatta presto'],
      unit: ['notte', 'notti'],
      last: 'ultima notte',
      cache: ['lanterna accesa', 'lanterna fioca', 'lanterna spenta'],
    },
    hearts: {
      steps: ['Salute piena', 'Graffio', 'Ferito', 'Critico', 'Poca vita, /compact cura'],
      unit: ['colpo', 'colpi'],
      last: 'ultimo colpo',
      cache: ['buff attivo', 'buff in calo', 'buff finito'],
    },
    fuel: {
      steps: ['Pieno', 'Tre quarti', 'Mezzo serbatoio', 'Riserva', 'Fai benzina, /compact'],
      unit: ['viaggio', 'viaggi'],
      last: 'ultimo viaggio',
      cache: ['motore caldo', 'motore si raffredda', 'avvio a freddo'],
    },
    pot: {
      steps: ['Freddo', 'Tiepido', 'Sobbolle', 'Bolle', 'Trabocca'],
      unit: ['mestolo', 'mestoli'],
      last: 'ultimo mestolo',
      cache: ['fornello caldo', 'fornello si raffredda', 'fornello freddo'],
    },
    tide: {
      steps: ['Bassa marea', 'Calmo', 'Onda lunga', 'Risacca', 'Mareggiata'],
      unit: ['onda', 'onde'],
      last: 'ultima onda',
      cache: ['acqua calda', 'acqua si raffredda', 'acqua fredda'],
    },
    daytime: {
      steps: ['Mattina', 'Mezzogiorno', 'Pomeriggio', 'Sera', 'Mezzanotte, ora di compattare'],
      unit: ['ora', 'ore'],
      last: 'ultima ora',
      cache: ['caffè caldo', 'caffè si raffredda', 'caffè freddo'],
    },
    volcano: {
      steps: ['Quiescente', 'Brontola', 'Fuma', 'Arde', 'Eruzione, compatta ora'],
      unit: ['scossa', 'scosse'],
      last: 'ultima scossa',
      cache: ['lava ardente', 'lava si raffredda', 'roccia fredda'],
    },
  },
  fr: {
    weather: {
      steps: ['Dégagé', 'Nuageux', 'Averses', 'Orage', 'Compacter bientôt'],
      unit: ['tour', 'tours'],
      last: 'dernier tour',
      cache: ['doux', 'frais', 'gel'],
    },
    moon: {
      steps: ['Nouvelle lune', 'Croissant', 'Demi-lune', 'Gibbeuse', 'Pleine lune, compacter bientôt'],
      unit: ['nuit', 'nuits'],
      last: 'dernière nuit',
      cache: ['lanterne allumée', 'lanterne faible', 'lanterne éteinte'],
    },
    hearts: {
      steps: ['Pleine santé', 'Égratigné', 'Blessé', 'Critique', 'PV bas, /compact soigne'],
      unit: ['coup', 'coups'],
      last: 'dernier coup',
      cache: ['buff actif', 'buff faiblit', 'buff perdu'],
    },
    fuel: {
      steps: ['Plein', 'Trois quarts', 'Demi-réservoir', 'Réserve', 'Faire le plein, /compact'],
      unit: ['trajet', 'trajets'],
      last: 'dernier trajet',
      cache: ['moteur chaud', 'moteur refroidit', 'démarrage à froid'],
    },
    pot: {
      steps: ['Froid', 'Tiède', 'Mijote', 'Bout', 'Déborde'],
      unit: ['louche', 'louches'],
      last: 'dernière louche',
      cache: ['feu chaud', 'feu refroidit', 'feu froid'],
    },
    tide: {
      steps: ['Marée basse', 'Calme', 'Houle', 'Ressac', 'Submersion'],
      unit: ['vague', 'vagues'],
      last: 'dernière vague',
      cache: ['eau chaude', 'eau refroidit', 'eau froide'],
    },
    daytime: {
      steps: ['Matin', 'Midi', 'Après-midi', 'Soir', "Minuit, l'heure de compacter"],
      unit: ['heure', 'heures'],
      last: 'dernière heure',
      cache: ['café chaud', 'café refroidit', 'café froid'],
    },
    volcano: {
      steps: ['Endormi', 'Gronde', 'Fume', 'Rougeoie', 'Éruption, compacter maintenant'],
      unit: ['secousse', 'secousses'],
      last: 'dernière secousse',
      cache: ['lave ardente', 'lave refroidit', 'roche froide'],
    },
  },
}

/** `~5 trips`; `~? trips` until the pace is known; `~99+` at the cap. */
export function rangeText(n: number | undefined, unit: readonly [string, string]): string {
  if (n === undefined) return `~? ${unit[1]}`
  return `~${n >= 99 ? '99+' : n} ${n === 1 ? unit[0] : unit[1]}`
}
