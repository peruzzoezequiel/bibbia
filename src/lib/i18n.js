// Matriz IDIOMA × VERSÃO.
// Uma "seleção" (id nas rotas/props, historicamente chamada `lang`) combina
// idioma + versão, no formato `${idioma}-${versao}` (ex.: pt-bkj, en-kjv, fr-martin).
// `family` liga versões equivalentes entre idiomas (tr = Reforma/Texto Recebido).

export const LANGUAGES = {
  pt: { label: 'Português', htmlLang: 'pt-BR', speech: 'pt-BR' },
  en: { label: 'English', htmlLang: 'en', speech: 'en-US' },
  es: { label: 'Español', htmlLang: 'es', speech: 'es-ES' },
  it: { label: 'Italiano', htmlLang: 'it', speech: 'it-IT' },
  fr: { label: 'Français', htmlLang: 'fr', speech: 'fr-FR' },
}
export const LANGUAGE_CODES = Object.keys(LANGUAGES)

const SELECTIONS = {
  'pt-bkj':     { lang: 'pt', label: 'King James 1611', family: 'tr', versionOT: 'King James 1611', versionNT: 'Almeida' },
  'pt-livretr': { lang: 'pt', label: 'Bíblia Livre · Texto Recebido', family: 'tr', version: 'Bíblia Livre (Texto Recebido)' },
  'pt-almeida': { lang: 'pt', label: 'Almeida', family: 'tr', version: 'Almeida' },
  'pt-livre':   { lang: 'pt', label: 'Bíblia Livre', family: 'critical', version: 'Bíblia Livre' },
  'en-kjv':     { lang: 'en', label: 'King James Version', family: 'tr', version: 'King James Version' },
  'es-rv1909':  { lang: 'es', label: 'Reina-Valera 1909', family: 'tr', version: 'Reina-Valera 1909' },
  'it-diodati': { lang: 'it', label: 'Diodati 1649', family: 'tr', version: 'Diodati 1649' },
  'fr-martin':  { lang: 'fr', label: 'Martin 1744', family: 'tr', version: 'Martin 1744' },
  'fr-segond':  { lang: 'fr', label: 'Louis Segond 1910', family: 'critical', version: 'Louis Segond 1910' },
}

// denormaliza htmlLang/speech em cada seleção (evita mudar chamadas existentes)
export const LANGS = Object.fromEntries(
  Object.entries(SELECTIONS).map(([id, v]) => [id, { ...v, htmlLang: LANGUAGES[v.lang].htmlLang, speech: LANGUAGES[v.lang].speech }])
)

export const LANG_CODES = Object.keys(LANGS)   // ids de seleção
export const isLang = (id) => Object.prototype.hasOwnProperty.call(LANGS, id)
export const DEFAULT_LANG = 'pt-bkj'

export const langOf = (id) => LANGS[id]?.lang
export const versionsForLang = (lang) => LANG_CODES.filter((id) => LANGS[id].lang === lang)

// versão padrão de um idioma, preferindo manter a mesma "família"/tradição
export function defaultForLang(lang, preferFamily) {
  const list = versionsForLang(lang)
  if (preferFamily) {
    const m = list.find((id) => LANGS[id].family === preferFamily)
    if (m) return m
  }
  return list[0]
}

// opções de comparação obedecendo a regra: mesmo idioma (outra versão)
// OU mesma família/tradição (outro idioma). Nunca os dois eixos juntos.
export function compareOptions(id) {
  const cur = LANGS[id]
  if (!cur) return []
  return LANG_CODES.filter((o) => o !== id && (LANGS[o].lang === cur.lang || LANGS[o].family === cur.family))
}

export function versionLabel(id, testament) {
  const L = LANGS[id]
  if (!L) return ''
  if (L.version) return L.version
  return testament === 'NT' ? L.versionNT : L.versionOT
}

// hreflang: para cada idioma que tem uma versão da MESMA tradição (family),
// aponta a versão representante daquele idioma. São páginas equivalentes.
export function hreflangAlternates(id) {
  const cur = LANGS[id]
  if (!cur) return []
  const out = []
  for (const code of LANGUAGE_CODES) {
    const sel = LANG_CODES.find((s) => LANGS[s].lang === code && LANGS[s].family === cur.family)
    if (sel) out.push({ hreflang: LANGUAGES[code].htmlLang, sel })
  }
  return out
}

const UI = {
  pt: {
    brand: 'Bíblia', searchBook: 'Buscar livro…', searchAll: 'Buscar palavra ou frase…',
    ot: 'Velho Testamento', nt: 'Novo Testamento', nothing: 'Nada encontrado.',
    listen: 'Ouvir', pause: 'Pausar', resume: 'Continuar', stop: 'Parar',
    download: 'Baixar', downloading: 'Baixando…', noAudio: 'Áudio ainda não gerado para este capítulo.',
    notSupported: 'Seu navegador não suporta narração por voz.',
    copy: 'Copiar', share: 'Compartilhar', copied: 'Copiado!', linkCopied: 'Link copiado!',
    copyFail: 'Não foi possível copiar', shareFail: 'Não foi possível compartilhar',
    settings: 'Ajustes de leitura', textSize: 'Tamanho do texto', verseDisplay: 'Exibição dos versículos',
    paragraph: 'Parágrafo', perLine: 'Um por linha', font: 'Fonte', serif: 'Serifada', sans: 'Sem serifa',
    theme: 'Tema', auto: 'Automático', light: 'Claro', dark: 'Escuro', language: 'Idioma', close: 'Fechar', search: 'Buscar',
    preparing: 'Preparando busca…', searchHint: 'Digite ao menos 2 letras. A busca ignora acentos e maiúsculas.',
    results: 'resultado(s)', noResults: 'Nenhum versículo encontrado.', autoHint: 'Segue o horário do dia',
    favorites: 'Favoritos', noFavorites: 'Nenhum versículo salvo ainda. Toque num versículo e escolha “Favoritar”.',
    save: 'Favoritar', saved2: 'Salvo', verseOfDay: 'Versículo do dia', image: 'Imagem', compare: 'Comparar', remove: 'Remover',
    toggleBooks: 'Mostrar/ocultar livros', by: 'Por', version: 'Versão',
    hideBooks: 'Recolher os livros', showBooks: 'Mostrar os livros', books: 'Livros',
    consentText: 'Usamos cookies do Google Analytics para entender como o site é usado.',
    accept: 'Aceitar', decline: 'Recusar',
  },
  en: {
    brand: 'Bible', searchBook: 'Search book…', searchAll: 'Search a word or phrase…',
    ot: 'Old Testament', nt: 'New Testament', nothing: 'Nothing found.',
    listen: 'Listen', pause: 'Pause', resume: 'Resume', stop: 'Stop',
    download: 'Download', downloading: 'Downloading…', noAudio: 'Audio not generated for this chapter yet.',
    notSupported: 'Your browser does not support speech narration.',
    copy: 'Copy', share: 'Share', copied: 'Copied!', linkCopied: 'Link copied!',
    copyFail: 'Could not copy', shareFail: 'Could not share',
    settings: 'Reading settings', textSize: 'Text size', verseDisplay: 'Verse display',
    paragraph: 'Paragraph', perLine: 'One per line', font: 'Font', serif: 'Serif', sans: 'Sans-serif',
    theme: 'Theme', auto: 'Automatic', light: 'Light', dark: 'Dark', language: 'Language', close: 'Close', search: 'Search',
    preparing: 'Preparing search…', searchHint: 'Type at least 2 letters. Search ignores accents and case.',
    results: 'result(s)', noResults: 'No verse found.', autoHint: 'Follows the time of day',
    favorites: 'Favorites', noFavorites: 'No verse saved yet. Tap a verse and choose “Bookmark”.',
    save: 'Bookmark', saved2: 'Saved', verseOfDay: 'Verse of the day', image: 'Image', compare: 'Compare', remove: 'Remove',
    toggleBooks: 'Show/hide books', by: 'By', version: 'Version',
    hideBooks: 'Collapse books', showBooks: 'Show books', books: 'Books',
    consentText: 'We use Google Analytics cookies to understand how the site is used.',
    accept: 'Accept', decline: 'Decline',
  },
  es: {
    brand: 'Biblia', searchBook: 'Buscar libro…', searchAll: 'Buscar palabra o frase…',
    ot: 'Antiguo Testamento', nt: 'Nuevo Testamento', nothing: 'Nada encontrado.',
    listen: 'Escuchar', pause: 'Pausar', resume: 'Continuar', stop: 'Detener',
    download: 'Descargar', downloading: 'Descargando…', noAudio: 'Audio aún no generado para este capítulo.',
    notSupported: 'Tu navegador no admite narración por voz.',
    copy: 'Copiar', share: 'Compartir', copied: '¡Copiado!', linkCopied: '¡Enlace copiado!',
    copyFail: 'No se pudo copiar', shareFail: 'No se pudo compartir',
    settings: 'Ajustes de lectura', textSize: 'Tamaño del texto', verseDisplay: 'Presentación de versículos',
    paragraph: 'Párrafo', perLine: 'Uno por línea', font: 'Fuente', serif: 'Con serifa', sans: 'Sin serifa',
    theme: 'Tema', auto: 'Automático', light: 'Claro', dark: 'Oscuro', language: 'Idioma', close: 'Cerrar', search: 'Buscar',
    preparing: 'Preparando búsqueda…', searchHint: 'Escribe al menos 2 letras. La búsqueda ignora acentos y mayúsculas.',
    results: 'resultado(s)', noResults: 'Ningún versículo encontrado.', autoHint: 'Sigue la hora del día',
    favorites: 'Favoritos', noFavorites: 'Ningún versículo guardado aún. Toca un versículo y elige “Guardar”.',
    save: 'Guardar', saved2: 'Guardado', verseOfDay: 'Versículo del día', image: 'Imagen', compare: 'Comparar', remove: 'Quitar',
    toggleBooks: 'Mostrar/ocultar libros', by: 'Por', version: 'Versión',
    hideBooks: 'Ocultar libros', showBooks: 'Mostrar libros', books: 'Libros',
    consentText: 'Usamos cookies de Google Analytics para entender cómo se usa el sitio.',
    accept: 'Aceptar', decline: 'Rechazar',
  },
  it: {
    brand: 'Bibbia', searchBook: 'Cerca libro…', searchAll: 'Cerca una parola o frase…',
    ot: 'Antico Testamento', nt: 'Nuovo Testamento', nothing: 'Nessun risultato.',
    listen: 'Ascolta', pause: 'Pausa', resume: 'Riprendi', stop: 'Ferma',
    download: 'Scarica', downloading: 'Scaricamento…', noAudio: 'Audio non ancora generato per questo capitolo.',
    notSupported: 'Il tuo browser non supporta la narrazione vocale.',
    copy: 'Copia', share: 'Condividi', copied: 'Copiato!', linkCopied: 'Link copiato!',
    copyFail: 'Impossibile copiare', shareFail: 'Impossibile condividere',
    settings: 'Impostazioni di lettura', textSize: 'Dimensione del testo', verseDisplay: 'Visualizzazione dei versetti',
    paragraph: 'Paragrafo', perLine: 'Uno per riga', font: 'Carattere', serif: 'Con grazie', sans: 'Senza grazie',
    theme: 'Tema', auto: 'Automatico', light: 'Chiaro', dark: 'Scuro', language: 'Lingua', close: 'Chiudi', search: 'Cerca',
    preparing: 'Preparazione ricerca…', searchHint: 'Digita almeno 2 lettere. La ricerca ignora accenti e maiuscole.',
    results: 'risultato/i', noResults: 'Nessun versetto trovato.', autoHint: 'Segue l’ora del giorno',
    favorites: 'Preferiti', noFavorites: 'Nessun versetto salvato. Tocca un versetto e scegli “Salva”.',
    save: 'Salva', saved2: 'Salvato', verseOfDay: 'Versetto del giorno', image: 'Immagine', compare: 'Confronta', remove: 'Rimuovi',
    toggleBooks: 'Mostra/nascondi libri', by: 'Di', version: 'Versione',
    hideBooks: 'Nascondi libri', showBooks: 'Mostra libri', books: 'Libri',
    consentText: 'Usiamo cookie di Google Analytics per capire come viene usato il sito.',
    accept: 'Accetta', decline: 'Rifiuta',
  },
  fr: {
    brand: 'Bible', searchBook: 'Chercher un livre…', searchAll: 'Chercher un mot ou une phrase…',
    ot: 'Ancien Testament', nt: 'Nouveau Testament', nothing: 'Rien trouvé.',
    listen: 'Écouter', pause: 'Pause', resume: 'Reprendre', stop: 'Arrêter',
    download: 'Télécharger', downloading: 'Téléchargement…', noAudio: 'Audio pas encore généré pour ce chapitre.',
    notSupported: 'Votre navigateur ne prend pas en charge la narration vocale.',
    copy: 'Copier', share: 'Partager', copied: 'Copié !', linkCopied: 'Lien copié !',
    copyFail: 'Impossible de copier', shareFail: 'Impossible de partager',
    settings: 'Réglages de lecture', textSize: 'Taille du texte', verseDisplay: 'Affichage des versets',
    paragraph: 'Paragraphe', perLine: 'Un par ligne', font: 'Police', serif: 'Avec empattement', sans: 'Sans empattement',
    theme: 'Thème', auto: 'Automatique', light: 'Clair', dark: 'Sombre', language: 'Langue', close: 'Fermer', search: 'Chercher',
    preparing: 'Préparation de la recherche…', searchHint: 'Tapez au moins 2 lettres. La recherche ignore les accents et la casse.',
    results: 'résultat(s)', noResults: 'Aucun verset trouvé.', autoHint: 'Suit l’heure du jour',
    favorites: 'Favoris', noFavorites: 'Aucun verset enregistré. Touchez un verset et choisissez « Enregistrer ».',
    save: 'Enregistrer', saved2: 'Enregistré', verseOfDay: 'Verset du jour', image: 'Image', compare: 'Comparer', remove: 'Retirer',
    toggleBooks: 'Afficher/masquer les livres', by: 'Par', version: 'Version',
    hideBooks: 'Masquer les livres', showBooks: 'Afficher les livres', books: 'Livres',
    consentText: 'Nous utilisons des cookies Google Analytics pour comprendre l’usage du site.',
    accept: 'Accepter', decline: 'Refuser',
  },
}

export const t = (id) => UI[langOf(id)] || UI.pt
