// Moderniza a ortografia portuguesa pré-1943 do NT da versão pt-bkj
// (texto Almeida ~1911). Converte APENAS a grafia — nunca a tradução.
// Idempotente: rodar de novo não altera texto já modernizado.
//
//   node _tools/modernize-pt.mjs --dry    # só relata, não grava
//   node _tools/modernize-pt.mjs          # aplica em public/data/pt-bkj (livros NT)

import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const DIR = path.join(ROOT, 'public', 'data', 'pt-bkj')
const DRY = process.argv.includes('--dry')

const W = 'A-Za-zÀ-ÿ'
// fronteira de palavra que funciona com acentos (o \b do JS falha com é/á…)
const bounded = (s) => new RegExp(`(?<![${W}])${s}(?![${W}])`, 'g')

// ---------- 1) dicionário: nomes próprios, acentos e formas irregulares ----------
const DICT = {
  // nomes próprios
  Timotheo: 'Timóteo', Nazareth: 'Nazaré', Bethania: 'Betânia', Babylonia: 'Babilônia',
  Epheso: 'Éfeso', Ephesios: 'Efésios', Philippe: 'Filipe', Philippos: 'Filipos', Philippenses: 'Filipenses',
  Joppe: 'Jope', Agrippa: 'Agripa', Martha: 'Marta', Thomé: 'Tomé', Thiago: 'Tiago',
  Egypto: 'Egito', Tyro: 'Tiro', Syria: 'Síria', Cypro: 'Chipre', Chypre: 'Chipre',
  Emmaus: 'Emaús', Emmaús: 'Emaús', Anna: 'Ana', Hosanna: 'Hosana', Apollos: 'Apolo', Apollo: 'Apolo',
  Bethlehem: 'Belém', Bethlem: 'Belém', Bethesda: 'Betesda', Bethsaida: 'Betsaida',
  Bethphagé: 'Betfagé', Bethfage: 'Betfagé', Bethfagé: 'Betfagé',
  Mattheus: 'Mateus', Bartholomeu: 'Bartolomeu', Nathanael: 'Natanael',
  Zacharias: 'Zacarias', Elisabeth: 'Isabel', Sabbado: 'Sábado', sabbado: 'sábado',
  Capharnaum: 'Cafarnaum', Cesaréa: 'Cesareia', Judéa: 'Judeia', Galiléa: 'Galileia',
  Lystra: 'Listra', Thyatira: 'Tiatira', Genezareth: 'Genesaré', Joathão: 'Jotão',
  Gethsemane: 'Getsêmani', Maath: 'Maate', Seth: 'Sete', Bithynia: 'Bitínia', Ruth: 'Rute',
  Jerusalem: 'Jerusalém', Antiochia: 'Antioquia', Achaia: 'Acaia', Cilicia: 'Cilícia',
  Isaias: 'Isaías', Macedonia: 'Macedônia', Cornelio: 'Cornélio', Cesar: 'César', Johana: 'Joana',
  // palavras comuns (acentos e formas irregulares)
  phariseo: 'fariseu', phariseos: 'fariseus', mysterio: 'mistério', mysterios: 'mistérios',
  hypocrita: 'hipócrita', hypocritas: 'hipócritas', hypocrisia: 'hipocrisia',
  blasphemia: 'blasfêmia', blasphemias: 'blasfêmias', apparencia: 'aparência', apparencias: 'aparências',
  martyr: 'mártir', martyres: 'mártires', synagoga: 'sinagoga', synagogas: 'sinagogas',
  hymno: 'hino', hymnos: 'hinos', myrrha: 'mirra', lyrio: 'lírio', lyrios: 'lírios',
  crystal: 'cristal', berylo: 'berilo', amethysta: 'ametista', topazio: 'topázio', crisolito: 'crisólito',
  tambem: 'também', alguem: 'alguém', ninguem: 'ninguém', alem: 'além', vintem: 'vintém',
  aquillo: 'aquilo', naquillo: 'naquilo', daquillo: 'daquilo',
  cousa: 'coisa', cousas: 'coisas', dous: 'dois', quasi: 'quase', quotidiano: 'cotidiano',
  céo: 'céu', céos: 'céus', ceo: 'céu', ceos: 'céus', véo: 'véu', véos: 'véus',
  judeo: 'judeu', judeos: 'judeus', hebreo: 'hebreu', hebreos: 'hebreus',
  signal: 'sinal', signaes: 'sinais', defeza: 'defesa', despeza: 'despesa',
  sancto: 'santo', sanctos: 'santos', sancta: 'santa', sanctas: 'santas',
  prompto: 'pronto', promptos: 'prontos', prompta: 'pronta', promptas: 'prontas',
  fructo: 'fruto', fructos: 'frutos', excepto: 'exceto', espectaculo: 'espetáculo',
  reptis: 'répteis', damno: 'dano', damnos: 'danos', somno: 'sono', victoria: 'vitória',
  jactancia: 'jactância', auctoridade: 'autoridade', auctor: 'autor',
  comnosco: 'conosco', cohorte: 'coorte', vehemencia: 'veemência',
  ahi: 'aí', dahi: 'daí', inexcusaveis: 'inescusáveis',
  // acentos (curadoria da frequência real do texto)
  espirito: 'espírito', espiritos: 'espíritos', Espirito: 'Espírito', Espiritos: 'Espíritos',
  discipulo: 'discípulo', discipulos: 'discípulos', unigenito: 'unigênito',
  misericordia: 'misericórdia', principio: 'princípio', principios: 'princípios',
  proprio: 'próprio', propria: 'própria', proprios: 'próprios', proprias: 'próprias',
  paciencia: 'paciência', consciencia: 'consciência', sciencia: 'ciência', ciencia: 'ciência',
  descendencia: 'descendência', concupiscencia: 'concupiscência', concupiscencias: 'concupiscências',
  abundancia: 'abundância', obediencia: 'obediência', desobediencia: 'desobediência',
  diligencia: 'diligência', violencia: 'violência', prudencia: 'prudência',
  imundicia: 'imundícia', malicia: 'malícia', provincia: 'província', primicias: 'primícias',
  negocios: 'negócios', negocio: 'negócio', notorio: 'notório', sacerdocio: 'sacerdócio',
  dominio: 'domínio', silencio: 'silêncio', labios: 'lábios', impio: 'ímpio', impios: 'ímpios',
  necessario: 'necessário', necessarios: 'necessários', necessaria: 'necessária', necessarias: 'necessárias',
  ministerio: 'ministério', sacrificio: 'sacrifício', sacrificios: 'sacrifícios',
  adulterio: 'adultério', adulterios: 'adultérios', memoria: 'memória', patria: 'pátria',
  contrario: 'contrário', contraria: 'contrária', adversario: 'adversário', adversarios: 'adversários',
  salario: 'salário', imperio: 'império', premio: 'prêmio', proposito: 'propósito',
  voluntario: 'voluntário', sabio: 'sábio', sabios: 'sábios', sabia: 'sabia',
  diacono: 'diácono', diaconos: 'diáconos', benção: 'bênção', bencão: 'bênção',
  sabados: 'sábados', arvore: 'árvore', arvores: 'árvores', idolo: 'ídolo', idolos: 'ídolos',
  lampada: 'lâmpada', lampadas: 'lâmpadas', epistola: 'epístola', epistolas: 'epístolas',
  familia: 'família', familias: 'famílias', varias: 'várias', varios: 'vários',
  seculo: 'século', seculos: 'séculos', juizo: 'juízo', juizos: 'juízos', juizes: 'juízes',
  ultimo: 'último', ultimos: 'últimos', ultima: 'última', ultimas: 'últimas',
  unico: 'único', unicos: 'únicos', unica: 'única', unicas: 'únicas',
  cantico: 'cântico', canticos: 'cânticos', exercito: 'exército', exercitos: 'exércitos',
  principe: 'príncipe', principes: 'príncipes', apostolo: 'apóstolo', apostolos: 'apóstolos',
  parabola: 'parábola', parabolas: 'parábolas', tunica: 'túnica', tunicas: 'túnicas',
  proximo: 'próximo', proximos: 'próximos', proxima: 'próxima', paraiso: 'paraíso',
  convem: 'convém', detem: 'detém',
  // h intervocálico com acento resultante
  sahi: 'saí', sahia: 'saía', sahiam: 'saíam', sahiu: 'saiu', sahir: 'sair', sahirem: 'saírem',
  sahido: 'saído', sahindo: 'saindo', cahi: 'caí', cahia: 'caía', cahiam: 'caíam', cahiu: 'caiu',
  cahir: 'cair', cahirem: 'caírem', cahido: 'caído', cahindo: 'caindo',
  trahir: 'trair', trahia: 'traía', trahido: 'traído', trahe: 'trai', trahiu: 'traiu',
  // crase escrita como "á"
  'á': 'à', 'ás': 'às', 'áquelle': 'àquele', 'áquelles': 'àqueles', 'áquella': 'àquela', 'áquellas': 'àquelas',
  'áquele': 'àquele', 'áqueles': 'àqueles', 'áquela': 'àquela', 'áquelas': 'àquelas',
  'ácerca': 'acerca',
  vangloria: 'vanglória', vanglorias: 'vanglórias',
  // ---- segunda leva (QA por vocabulário) ----
  logar: 'lugar', logares: 'lugares', 'fóra': 'fora', 'fórma': 'forma', 'fórmas': 'formas',
  tres: 'três', agua: 'água', aguas: 'águas', lingua: 'língua', linguas: 'línguas',
  Amen: 'Amém', 'sómente': 'somente', 'jámais': 'jamais', 'ámanhã': 'amanhã',
  demonio: 'demônio', demonios: 'demônios', caridade: 'caridade',
  similhante: 'semelhante', similhantes: 'semelhantes', similhança: 'semelhança',
  similhantemente: 'semelhantemente', Similhantemente: 'Semelhantemente',
  oiro: 'ouro', 'corôa': 'coroa', 'corôas': 'coroas', 'côxo': 'coxo', 'côxos': 'coxos',
  'féras': 'feras', 'dôres': 'dores', herva: 'erva', hervas: 'ervas',
  tribu: 'tribo', tribus: 'tribos', edade: 'idade', magestade: 'majestade',
  peior: 'pior', cincoenta: 'cinquenta', veiu: 'veio', sobreveiu: 'sobreveio',
  saido: 'saído', sairam: 'saíram', cairam: 'caíram', sahiram: 'saíram', cahiram: 'caíram',
  instruido: 'instruído', constituido: 'constituído', incredulos: 'incrédulos', incredulo: 'incrédulo',
  infieis: 'infiéis', fieis: 'fiéis', facil: 'fácil', util: 'útil', sobrios: 'sóbrios',
  solicitos: 'solícitos', vigilia: 'vigília', diluvio: 'dilúvio', angustia: 'angústia',
  astucia: 'astúcia', ignorancia: 'ignorância', inteligencia: 'inteligência',
  audiencia: 'audiência', ganancia: 'ganância', delicias: 'delícias', fabulas: 'fábulas',
  perolas: 'pérolas', viboras: 'víboras', gravida: 'grávida', dadivas: 'dádivas',
  medico: 'médico', cenaculo: 'cenáculo', tabernaculo: 'tabernáculo', tabernaculos: 'tabernáculos',
  abysmo: 'abismo', deposito: 'depósito', minimo: 'mínimo', pateo: 'pátio', osculo: 'ósculo',
  visinho: 'vizinho', visinhos: 'vizinhos', visinha: 'vizinha', visinhas: 'vizinhas',
  mangedoura: 'manjedoura', alforge: 'alforje', dizimos: 'dízimos', ereis: 'éreis',
  estavamos: 'estávamos', licito: 'lícito', licitos: 'lícitos', ilicito: 'ilícito',
  animo: 'ânimo', animos: 'ânimos', escandalo: 'escândalo', escandalos: 'escândalos',
  carcere: 'cárcere', setimo: 'sétimo', Altissimo: 'Altíssimo', lagrimas: 'lágrimas',
  purpura: 'púrpura', saude: 'saúde', sauda: 'saúda', saudam: 'saúdam',
  primogenito: 'primogênito', primogenitos: 'primogênitos', unanimes: 'unânimes',
  paralytico: 'paralítico', paralyticos: 'paralíticos', eunucho: 'eunuco', eunuchos: 'eunucos',
  tetrarcha: 'tetrarca', archanjo: 'arcanjo', dextra: 'destra', paiz: 'país',
  Satanaz: 'Satanás', atraz: 'atrás', detraz: 'detrás', mez: 'mês', mezes: 'meses',
  azas: 'asas', aza: 'asa', teem: 'têm', 'vêem': 'veem', 'crêem': 'creem', 'crêram': 'creram',
  'crêr': 'crer', 'crêde': 'crede', 'crêdes': 'credes', 'crêstes': 'crestes', 'crêmos': 'cremos',
  'lêem': 'leem', 'dêem': 'deem', 'Vêde': 'Vede', 'vêde': 'vede', 'vêdes': 'vedes',
  'Sêde': 'Sede', 'sêde': 'sede', 'déste': 'deste', 'déstes': 'destes', 'désse': 'desse',
  poderam: 'puderam', quiseramos: 'quiséramos', tivesseis: 'tivésseis',
  'adultéra': 'adúltera', dagua: "d'água", 'calix': 'cálice',
  Moysés: 'Moisés', David: 'Davi', Jacob: 'Jacó', Isaac: 'Isaque', 'Abrahão': 'Abraão',
  Lazaro: 'Lázaro', Sidon: 'Sidom', Zebedeo: 'Zebedeu', saduceos: 'saduceus', saduceo: 'saduceu',
  galileo: 'galileu', galileos: 'galileus', Bartolomeo: 'Bartolomeu', Alfeo: 'Alfeu',
  Magdalena: 'Madalena', Capernaum: 'Cafarnaum', Melchisedec: 'Melquisedeque',
  'Beelzebú': 'Belzebu', Felix: 'Félix', 'Estevão': 'Estêvão', Juda: 'Judá', Judah: 'Judá',
  Gomorrah: 'Gomorra', 'Aarão': 'Arão', Booz: 'Boaz', Obed: 'Obede', Aminadab: 'Aminadabe',
  Cainan: 'Cainã', Poncio: 'Pôncio', Eliakim: 'Eliaquim', Laodicea: 'Laodiceia',
  Arimatea: 'Arimateia', Cesarea: 'Cesareia', Judea: 'Judeia', Tessalonica: 'Tessalônica',
  Iconio: 'Icônio', Galacia: 'Galácia', Pamfylia: 'Panfília', Tychico: 'Tíquico',
  Aquila: 'Áquila', JUDEOS: 'JUDEUS', 'Asia': 'Ásia',
  'aflicção': 'aflição', 'aflicções': 'aflições', 'acção': 'ação', 'acções': 'ações',
  'redempção': 'redenção', 'adopção': 'adoção', 'assumpção': 'assunção', 'excepção': 'exceção',
  'fôra': 'fora', 'fôras': 'foras', paschoa: 'páscoa', Paschoa: 'Páscoa', 'dágua': "d'água",
  prodigio: 'prodígio', prodigios: 'prodígios', viuva: 'viúva', viuvas: 'viúvas', viuvo: 'viúvo',
}

// ---------- 2) regras gerais (aplicadas depois do dicionário) ----------
const RULES = [
  // pronomes com "ll"
  [/(?<![A-Za-zÀ-ÿ])([Aa])quell/g, '$1quel'],
  [/(?<![A-Za-zÀ-ÿ])([Ee])lle(s?)(?![A-Za-zÀ-ÿ])/g, '$1le$2'],
  [/(?<![A-Za-zÀ-ÿ])([Ee])lla(s?)(?![A-Za-zÀ-ÿ])/g, '$1la$2'],
  [/(?<![A-Za-zÀ-ÿ])([DdNn])elle(s?)(?![A-Za-zÀ-ÿ])/g, '$1ele$2'],
  [/(?<![A-Za-zÀ-ÿ])([DdNn])ella(s?)(?![A-Za-zÀ-ÿ])/g, '$1ela$2'],
  // grupos e dígrafos antigos
  [/([Cc])hrist/g, '$1rist'],
  [/(?<![A-Za-zÀ-ÿ])([Ff])all/g, '$1al'],
  [/(?<![A-Za-zÀ-ÿ])([Pp])ecc/g, '$1ec'],
  [/(?<![A-Za-zÀ-ÿ])([Pp])roph/g, '$1rof'],
  [/(?<![A-Za-zÀ-ÿ])([Ss])anct/g, '$1ant'],
  [/(?<![A-Za-zÀ-ÿ])([Bb])apt/g, '$1at'],
  [/condemn/g, 'conden'], [/Condemn/g, 'Conden'],
  [/escript/g, 'escrit'], [/Escript/g, 'Escrit'],
  [/reprehen/g, 'repreen'], [/Reprehen/g, 'Repreen'],
  [/irreprehens/g, 'irrepreens'], [/comprehen/g, 'compreen'], [/Comprehen/g, 'Compreen'],
  [/prohib/g, 'proib'], [/Prohib/g, 'Proib'],
  [/captiv/g, 'cativ'], [/Captiv/g, 'Cativ'],
  [/infructifer/g, 'infrutífer'], [/conductor/g, 'condutor'], [/afectuos/g, 'afetuos'],
  [/(?<![A-Za-zÀ-ÿ])([Ee])greja/g, '$1greja'], [/(?<![A-Za-zÀ-ÿ])Egreja/g, 'Igreja'], [/(?<![A-Za-zÀ-ÿ])egreja/g, 'igreja'],
  [/(?<![A-Za-zÀ-ÿ])Egual/g, 'Igual'], [/(?<![A-Za-zÀ-ÿ])egual/g, 'igual'],
  [/(?<![A-Za-zÀ-ÿ])actos(?![A-Za-zÀ-ÿ])/g, 'atos'], [/(?<![A-Za-zÀ-ÿ])Actos(?![A-Za-zÀ-ÿ])/g, 'Atos'],
  // segunda leva: radicais
  [/resuscit/g, 'ressuscit'], [/Resuscit/g, 'Ressuscit'],
  [/resurrei/g, 'ressurrei'], [/Resurrei/g, 'Ressurrei'],
  [/(?<![A-Za-zÀ-ÿ])([Pp])rég/g, '$1reg'],
  [/(?<![A-Za-zÀ-ÿ])([Qq])uiz/g, '$1uis'],
  [/([a-zà-ÿ]*)poz(?=e)/g, '$1pus'], [/(?<![A-Za-zÀ-ÿ])([Pp])oz(?![A-Za-zÀ-ÿ])/g, '$1ôs'],
  [/([a-zà-ÿ])poz(?![A-Za-zÀ-ÿ])/g, '$1pôs'],
  [/pusee/g, 'puse'],
  [/circum/g, 'circun'], [/Circum/g, 'Circun'],
  [/(?<![A-Za-zÀ-ÿ])([Cc])omvosco(?![A-Za-zÀ-ÿ])/g, '$1onvosco'],
  [/(?<![A-Za-zÀ-ÿ])([Cc])omsigo(?![A-Za-zÀ-ÿ])/g, '$1onsigo'],
  [/(?<![A-Za-zÀ-ÿ])([Cc])omtigo(?![A-Za-zÀ-ÿ])/g, '$1ontigo'],
  [/(?<![A-Za-zÀ-ÿ])([Cc])omtudo(?![A-Za-zÀ-ÿ])/g, '$1ontudo'],
  [/(?<![A-Za-zÀ-ÿ])([Ee])mquanto(?![A-Za-zÀ-ÿ])/g, '$1nquanto'],
  [/(?<![A-Za-zÀ-ÿ])([Cc])re(?=at|ad|an|aç|ou)/g, '$1ri'],
  [/sepulchr/g, 'sepulcr'], [/Sepulchr/g, 'Sepulcr'],
  [/exhort/g, 'exort'], [/Exhort/g, 'Exort'],
  [/(?<![A-Za-zÀ-ÿ])([Dd])esh/g, '$1es'],
  [/(?<![A-Za-zÀ-ÿ])Bemaventurad/g, 'Bem-aventurad'],
  [/(?<![A-Za-zÀ-ÿ])bemaventurad/g, 'bem-aventurad'],
  [/(?<![A-Za-zÀ-ÿ])([Bb])emdit/g, (m, b) => (b === 'B' ? 'Bendit' : 'bendit')],
  [/assign/g, 'assin'], [/Assign/g, 'Assin'],
  [/([a-zà-ÿ])ámos(?![A-Za-zÀ-ÿ])/g, '$1amos'],
  [/(?<![A-Za-zÀ-ÿ])afim de(?![A-Za-zÀ-ÿ])/g, 'a fim de'],
  // th → t / ph → f (nomes já resolvidos no dicionário)
  [/([Tt])h(?=[aeiouáéíóúâêôr])/g, '$1'],
  [/Ph/g, 'F'], [/ph/g, 'f'],
  // duplas abolidas (rr e ss são legítimas)
  [/bb/g, 'b'], [/cc/g, 'c'], [/dd/g, 'd'], [/ff/g, 'f'],
  [/gg/g, 'g'], [/ll/g, 'l'], [/mm/g, 'm'], [/nn/g, 'n'], [/pp/g, 'p'], [/tt/g, 't'],
  // ênclises antigas: vol-o→vo-lo, nol-o→no-lo, matemol-o→matemo-lo, matal-o→matá-lo…
  [/(?<![A-Za-zÀ-ÿ])vol-([oa]s?)(?![A-Za-zÀ-ÿ])/g, 'vo-l$1'],
  [/(?<![A-Za-zÀ-ÿ])nol-([oa]s?)(?![A-Za-zÀ-ÿ])/g, 'no-l$1'],
  [/([a-zà-ÿ]{2,})mol-([oa]s?)(?![A-Za-zÀ-ÿ])/g, '$1mo-l$2'],
  [/([a-zà-ÿ]{2,})al-([oa]s?)(?![A-Za-zÀ-ÿ])/g, '$1á-l$2'],
  [/([a-zà-ÿ]{2,})el-([oa]s?)(?![A-Za-zÀ-ÿ])/g, '$1ê-l$2'],
  [/([a-zà-ÿ]{2,})il-([oa]s?)(?![A-Za-zÀ-ÿ])/g, '$1i-l$2'],
  [/([a-zà-ÿ]{2,})ol-([oa]s?)(?![A-Za-zÀ-ÿ])/g, '$1ô-l$2'],
  // apóstrofos: d'ele→dele, n'um→num, N'isto→Nisto, lh'o→lho, d'Israel→de Israel
  // (exceção: d'água é forma moderna aceita e fica com apóstrofo)
  [/(?<![A-Za-zÀ-ÿ])([DdNn])['’](?=(?![áÁ]gua)[a-zà-ÿáÁ])/g, '$1'],
  [/(?<![A-Za-zÀ-ÿ])d['’](?=[A-ZÀ-Ý])/g, 'de '],
  [/(?<![A-Za-zÀ-ÿ])D['’](?=[A-ZÀ-Ý])/g, 'De '],
  [/lh['’]([oa]s?)(?![A-Za-zÀ-ÿ])/g, 'lh$1'],
  // t'o → to, m'o → mo (contrações te+o / me+o)
  [/(?<![A-Za-zÀ-ÿ])([tm])['’]([oa]s?)(?![A-Za-zÀ-ÿ])/g, '$1$2'],
  [/(?<![A-Za-zÀ-ÿ])[nN]['’]([EA])le(s?)(?![A-Za-zÀ-ÿ])/g, (m, e, s) => 'n' + e.toLowerCase() + 'le' + s],
  // plurais/verbos em -aes → -ais (quaes→quais, estaes→estais, paes→pais, Paes→Pais)
  [/([A-Za-zà-ÿ])aes(?![A-Za-zÀ-ÿ])/g, '$1ais'],
  // -ae final → -ai (Pae→Pai, Saudae→Saudai)
  [/([A-Za-zÀ-ÿ])ae(?![A-Za-zÀ-ÿ])/g, '$1ai'],
  // -avel/-ivel e plurais ganham acento (exceção: haveis, presente de haver)
  [/(?<![A-Za-zÀ-ÿ])(?!haveis|Haveis)([A-Za-zà-ÿ]{2,})avel(?![A-Za-zÀ-ÿ])/g, '$1ável'],
  [/(?<![A-Za-zÀ-ÿ])(?!haveis|Haveis)([A-Za-zà-ÿ]{2,})aveis(?![A-Za-zÀ-ÿ])/g, '$1áveis'],
  [/([A-Za-zà-ÿ]{2,})ivel(?![A-Za-zÀ-ÿ])/g, '$1ível'],
  [/([A-Za-zà-ÿ]{2,})iveis(?![A-Za-zÀ-ÿ])/g, '$1íveis'],
]

// casos de contexto: "duvida" só é substantivo após em/sem/grande
const CONTEXT = [
  [/\b(em|Em|sem|Sem|grande) duvida\b/g, '$1 dúvida'],
  // "gloria" substantivo (não o verbo "se gloria")
  [/(?<!se |me |te )(?<![A-Za-zÀ-ÿ])gloria(s?)(?![A-Za-zÀ-ÿ])/g, 'glória$1'],
  [/(?<![A-Za-zÀ-ÿ])Gloria(s?)(?![A-Za-zÀ-ÿ])/g, 'Glória$1'],
]

function modernize(text) {
  let out = text
  for (const [from, to] of Object.entries(DICT)) {
    out = out.replace(bounded(from), to)
    if (from[0] === from[0].toLowerCase() && from[0].toUpperCase() !== from[0]) {
      const F = from[0].toUpperCase() + from.slice(1)
      const T = to[0].toUpperCase() + to.slice(1)
      out = out.replace(bounded(F), T)
    }
  }
  for (const [re, rep] of CONTEXT) out = out.replace(re, rep)
  for (const [re, rep] of RULES) out = out.replace(re, rep)
  return out
}

// ---------- aplicar nos livros do NT ----------
const index = JSON.parse(fs.readFileSync(path.join(DIR, 'index.json'), 'utf8'))
let changedVerses = 0, totalVerses = 0
const leftovers = {}

for (const b of index.filter((b) => b.testament === 'NT')) {
  const file = path.join(DIR, `${b.slug}.json`)
  const chapters = JSON.parse(fs.readFileSync(file, 'utf8'))
  const out = chapters.map((verses) => verses.map((v) => {
    totalVerses++
    const nv = modernize(v)
    if (nv !== v) changedVerses++
    return nv
  }))
  if (!DRY) fs.writeFileSync(file, JSON.stringify(out))
  for (const w of out.flat().join(' ').split(/[^A-Za-zÀ-ÿ'’]+/)) {
    if (!w) continue
    if (/ph|th|ll|cc|pp|tt|mm|nn(?!a)|['’]|ae$|aes$|elle|ella|(?<![sm]e )gloria/i.test(w)) {
      leftovers[w] = (leftovers[w] || 0) + 1
    }
  }
}

console.log(`${DRY ? '[DRY-RUN] ' : ''}Versículos alterados: ${changedVerses} de ${totalVerses}`)
const left = Object.entries(leftovers).sort((a, b) => b[1] - a[1])
console.log(`Possíveis resíduos: ${left.length} palavras distintas`)
console.log(left.slice(0, 50).map(([w, c]) => `${w}:${c}`).join('  '))
