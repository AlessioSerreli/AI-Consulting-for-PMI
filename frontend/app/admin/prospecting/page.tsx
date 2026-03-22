'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Brain, Users, TrendingUp, Search, MapPin, Phone, Globe, Star, Target, CheckCircle, XCircle, Clock, RefreshCw, Mail, Zap, UserPlus, Filter, Download } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const SETTORI_PMI = [
  // Manifatturiero
  'Officina meccanica',
  'Carpenteria metallica',
  'Lavorazione metalli',
  'Stampaggio plastica',
  'Falegnameria e lavorazione legno',
  'Produzione alimentare',
  'Panificio e pasticceria',
  'Tessile e abbigliamento',
  'Calzaturificio',
  'Ceramica e piastrelle',
  'Imballaggi e packaging',
  'Stampa e tipografia',
  // Costruzioni e impiantistica
  'Impresa edile',
  'Impianti elettrici',
  'Impianti idraulici',
  'Impianti termici e climatizzazione',
  'Serramenti e infissi',
  'Pavimenti e rivestimenti',
  'Arredamento su misura',
  'Giardinaggio e paesaggistica',
  // Trasporti e logistica
  'Trasporto merci',
  'Corriere espresso',
  'Magazzinaggio e logistica',
  'Trasporto persone',
  'Autoscuola',
  // Commercio
  'Commercio al dettaglio',
  'Commercio all\'ingrosso',
  'Concessionaria auto',
  'Rivendita materiali edili',
  'Ferramenta e utensileria',
  // Servizi alle imprese
  'Studio commercialista',
  'Studio legale',
  'Agenzia di comunicazione',
  'Agenzia pubblicitaria',
  'Consulenza informatica',
  'Software house',
  'Agenzia immobiliare',
  'Agenzia assicurativa',
  'Società di sicurezza',
  'Pulizie e facility management',
  'Noleggio attrezzature',
  // Ristorazione e ospitalità
  'Ristorante',
  'Bar e caffetteria',
  'Pizzeria',
  'Hotel e B&B',
  'Catering e banqueting',
  // Salute e benessere
  'Farmacia',
  'Studio dentistico',
  'Studio medico',
  'Fisioterapia e riabilitazione',
  'Palestra e fitness',
  'Parrucchiere e estetica',
  'Centro benessere e spa',
  // Istruzione e formazione
  'Scuola privata',
  'Centro formazione professionale',
  'Asilo nido e infanzia',
  // Agricoltura
  'Azienda agricola',
  'Vivaio',
  'Agriturismo',
  'Cantina vinicola',
  'Oleificio',
]

const PROVINCE_ITALIANE = [
  'Agrigento', 'Alessandria', 'Ancona', 'Aosta', 'Arezzo', 'Ascoli Piceno', 'Asti', 'Avellino',
  'Bari', 'Barletta-Andria-Trani', 'Belluno', 'Benevento', 'Bergamo', 'Biella', 'Bologna', 'Bolzano',
  'Brescia', 'Brindisi', 'Cagliari', 'Caltanissetta', 'Campobasso', 'Caserta', 'Catania', 'Catanzaro',
  'Chieti', 'Como', 'Cosenza', 'Cremona', 'Crotone', 'Cuneo', 'Enna', 'Fermo', 'Ferrara', 'Firenze',
  'Foggia', 'Forlì-Cesena', 'Frosinone', 'Genova', 'Gorizia', 'Grosseto', 'Imperia', 'Isernia',
  "L'Aquila", 'La Spezia', 'Latina', 'Lecce', 'Lecco', 'Livorno', 'Lodi', 'Lucca', 'Macerata',
  'Mantova', 'Massa-Carrara', 'Matera', 'Messina', 'Milano', 'Modena', 'Monza e Brianza', 'Napoli',
  'Novara', 'Nuoro', 'Oristano', 'Padova', 'Palermo', 'Parma', 'Pavia', 'Perugia', 'Pesaro e Urbino',
  'Pescara', 'Piacenza', 'Pisa', 'Pistoia', 'Pordenone', 'Potenza', 'Prato', 'Ragusa', 'Ravenna',
  'Reggio Calabria', 'Reggio Emilia', 'Rieti', 'Rimini', 'Roma', 'Rovigo', 'Salerno', 'Sassari',
  'Savona', 'Siena', 'Siracusa', 'Sondrio', 'Sud Sardegna', 'Taranto', 'Teramo', 'Terni', 'Torino',
  'Trapani', 'Trento', 'Treviso', 'Trieste', 'Udine', 'Varese', 'Venezia', 'Verbano-Cusio-Ossola',
  'Vercelli', 'Verona', 'Vibo Valentia', 'Vicenza', 'Viterbo',
]

const CITTA_PER_PROVINCIA: Record<string, string[]> = {
  'Agrigento': ['Agrigento', 'Sciacca', 'Licata', 'Canicattì', 'Favara', 'Porto Empedocle'],
  'Alessandria': ['Alessandria', 'Casale Monferrato', 'Novi Ligure', 'Tortona', 'Acqui Terme', 'Valenza'],
  'Ancona': ['Ancona', 'Senigallia', 'Fabriano', 'Jesi', 'Chiaravalle', 'Osimo'],
  'Aosta': ['Aosta', 'Châtillon', 'Saint-Vincent', 'Courmayeur', 'Morgex'],
  'Arezzo': ['Arezzo', 'Cortona', 'Sansepolcro', 'Bibbiena', 'Montevarchi', 'Cavriglia'],
  'Ascoli Piceno': ['Ascoli Piceno', 'San Benedetto del Tronto', 'Monteprandone', 'Grottammare'],
  'Asti': ['Asti', 'Canelli', 'Nizza Monferrato', 'Villanova d\'Asti'],
  'Avellino': ['Avellino', 'Ariano Irpino', 'Atripalda', 'Solofra', 'Montoro'],
  'Bari': ['Bari', 'Altamura', 'Molfetta', 'Bitonto', 'Modugno', 'Andria', 'Barletta', 'Ruvo di Puglia'],
  'Barletta-Andria-Trani': ['Barletta', 'Andria', 'Trani', 'Canosa di Puglia', 'Margherita di Savoia'],
  'Belluno': ['Belluno', 'Feltre', 'Sedico', 'Pieve di Cadore', 'Cortina d\'Ampezzo'],
  'Benevento': ['Benevento', 'Montesarchio', 'Sant\'Agata de\' Goti', 'Telese Terme'],
  'Bergamo': ['Bergamo', 'Treviglio', 'Dalmine', 'Seriate', 'Romano di Lombardia', 'Calusco d\'Adda', 'Clusone', 'Sarnico'],
  'Biella': ['Biella', 'Cossato', 'Valdilana', 'Gaglianico', 'Candelo'],
  'Bologna': ['Bologna', 'Imola', 'Casalecchio di Reno', 'San Lazzaro di Savena', 'Castel Maggiore', 'Budrio', 'Porretta Terme'],
  'Bolzano': ['Bolzano', 'Merano', 'Bressanone', 'Laives', 'Brunico', 'Appiano sulla Strada del Vino'],
  'Brescia': ['Brescia', 'Desenzano del Garda', 'Gardone Val Trompia', 'Montichiari', 'Lumezzane', 'Chiari', 'Darfo Boario Terme'],
  'Brindisi': ['Brindisi', 'Fasano', 'Francavilla Fontana', 'Ostuni', 'Mesagne', 'Ceglie Messapica'],
  'Cagliari': ['Cagliari', 'Assemini', 'Quartu Sant\'Elena', 'Selargius', 'Capoterra', 'Monserrato'],
  'Caltanissetta': ['Caltanissetta', 'Gela', 'Niscemi', 'San Cataldo', 'Mussomeli'],
  'Campobasso': ['Campobasso', 'Termoli', 'Isernia', 'Bojano', 'Venafro'],
  'Caserta': ['Caserta', 'Aversa', 'Marcianise', 'Santa Maria Capua Vetere', 'Maddaloni', 'Capua'],
  'Catania': ['Catania', 'Acireale', 'Misterbianco', 'Paternò', 'Gravina di Catania', 'Caltagirone', 'Giarre'],
  'Catanzaro': ['Catanzaro', 'Lamezia Terme', 'Soverato', 'Chiaravalle Centrale'],
  'Chieti': ['Chieti', 'Lanciano', 'Vasto', 'Ortona', 'Guardiagrele', 'Francavilla al Mare'],
  'Como': ['Como', 'Cantù', 'Mariano Comense', 'Erba', 'Olgiate Comasco', 'Appiano Gentile'],
  'Cosenza': ['Cosenza', 'Rende', 'Castrovillari', 'Corigliano-Rossano', 'Montalto Uffugo', 'Paola'],
  'Cremona': ['Cremona', 'Crema', 'Casalmaggiore', 'Soresina', 'Pizzighettone'],
  'Crotone': ['Crotone', 'Cirò Marina', 'Cutro', 'Isola di Capo Rizzuto'],
  'Cuneo': ['Cuneo', 'Alba', 'Bra', 'Fossano', 'Mondovì', 'Savigliano', 'Saluzzo', 'Busca'],
  'Enna': ['Enna', 'Piazza Armerina', 'Nicosia', 'Leonforte', 'Barrafranca'],
  'Fermo': ['Fermo', 'Porto San Giorgio', 'Porto Sant\'Elpidio', 'Sant\'Elpidio a Mare'],
  'Ferrara': ['Ferrara', 'Cento', 'Argenta', 'Comacchio', 'Bondeno'],
  'Firenze': ['Firenze', 'Scandicci', 'Sesto Fiorentino', 'Empoli', 'Bagno a Ripoli', 'Campi Bisenzio', 'Pontassieve'],
  'Foggia': ['Foggia', 'Cerignola', 'Manfredonia', 'San Severo', 'Lucera', 'Vieste'],
  'Forlì-Cesena': ['Forlì', 'Cesena', 'Cesenatico', 'Savignano sul Rubicone', 'Bertinoro'],
  'Frosinone': ['Frosinone', 'Cassino', 'Alatri', 'Anagni', 'Sora', 'Ferentino'],
  'Genova': ['Genova', 'Rapallo', 'Chiavari', 'Sestri Levante', 'Arenzano', 'Lavagna'],
  'Gorizia': ['Gorizia', 'Monfalcone', 'Gradisca d\'Isonzo', 'Ronchi dei Legionari'],
  'Grosseto': ['Grosseto', 'Orbetello', 'Follonica', 'Porto Santo Stefano', 'Massa Marittima'],
  'Imperia': ['Imperia', 'Sanremo', 'Ventimiglia', 'Taggia', 'Bordighera'],
  'Isernia': ['Isernia', 'Venafro', 'Agnone', 'Pozzilli'],
  "L'Aquila": ["L'Aquila", 'Avezzano', 'Sulmona', 'Pescina', 'Celano'],
  'La Spezia': ['La Spezia', 'Sarzana', 'Lerici', 'Follo', 'Arcola'],
  'Latina': ['Latina', 'Aprilia', 'Terracina', 'Formia', 'Gaeta', 'Fondi', 'Cisterna di Latina'],
  'Lecce': ['Lecce', 'Taranto', 'Brindisi', 'Gallipoli', 'Otranto', 'Nardò', 'Maglie', 'Casarano'],
  'Lecco': ['Lecco', 'Merate', 'Calolziocorte', 'Mandello del Lario', 'Bellano'],
  'Livorno': ['Livorno', 'Piombino', 'Cecina', 'Rosignano Marittimo', 'Portoferraio'],
  'Lodi': ['Lodi', 'Codogno', 'Sant\'Angelo Lodigiano', 'Casalpusterlengo', 'Lodi Vecchio'],
  'Lucca': ['Lucca', 'Viareggio', 'Capannori', 'Altopascio', 'Castelnuovo di Garfagnana'],
  'Macerata': ['Macerata', 'Civitanova Marche', 'Porto Recanati', 'Recanati', 'Tolentino', 'San Severino Marche'],
  'Mantova': ['Mantova', 'Suzzara', 'Castiglione delle Stiviere', 'Guidizzolo', 'Viadana'],
  'Massa-Carrara': ['Massa', 'Carrara', 'Aulla', 'Pontremoli', 'Fivizzano'],
  'Matera': ['Matera', 'Pisticci', 'Nova Siri', 'Policoro', 'Bernalda'],
  'Messina': ['Messina', 'Milazzo', 'Barcellona Pozzo di Gotto', 'Taormina', 'Patti', 'Sant\'Agata di Militello'],
  'Milano': ['Milano', 'Sesto San Giovanni', 'Cinisello Balsamo', 'Legnano', 'Rho', 'Corsico', 'Cologno Monzese', 'Pioltello', 'Paderno Dugnano', 'Abbiategrasso'],
  'Modena': ['Modena', 'Carpi', 'Sassuolo', 'Formigine', 'Mirandola', 'Castelfranco Emilia'],
  'Monza e Brianza': ['Monza', 'Desio', 'Lissone', 'Seregno', 'Cesano Maderno', 'Muggiò', 'Brugherio'],
  'Napoli': ['Napoli', 'Giugliano in Campania', 'Torre del Greco', 'Pozzuoli', 'Casoria', 'Castellammare di Stabia', 'Portici', 'Ercolano'],
  'Novara': ['Novara', 'Borgomanero', 'Arona', 'Verbania', 'Omegna', 'Domodossola'],
  'Nuoro': ['Nuoro', 'Siniscola', 'Dorgali', 'Orgosolo', 'Bitti'],
  'Oristano': ['Oristano', 'Terralba', 'Cabras', 'Ghilarza', 'Bosa'],
  'Padova': ['Padova', 'Abano Terme', 'Cittadella', 'Este', 'Monselice', 'Montagnana'],
  'Palermo': ['Palermo', 'Bagheria', 'Monreale', 'Carini', 'Termini Imerese', 'Partinico', 'Marsala'],
  'Parma': ['Parma', 'Fidenza', 'Salsomaggiore Terme', 'Borgotaro', 'Langhirano'],
  'Pavia': ['Pavia', 'Vigevano', 'Voghera', 'Stradella', 'Mortara', 'Broni'],
  'Perugia': ['Perugia', 'Foligno', 'Città di Castello', 'Spoleto', 'Assisi', 'Gubbio', 'Umbertide'],
  'Pesaro e Urbino': ['Pesaro', 'Urbino', 'Fano', 'Fossombrone', 'Novafeltria'],
  'Pescara': ['Pescara', 'Montesilvano', 'Spoltore', 'Città Sant\'Angelo', 'Penne'],
  'Piacenza': ['Piacenza', 'Fiorenzuola d\'Arda', 'Castel San Giovanni', 'Borgonovo Val Tidone'],
  'Pisa': ['Pisa', 'Pontedera', 'Cascina', 'San Miniato', 'Volterra', 'Santa Croce sull\'Arno'],
  'Pistoia': ['Pistoia', 'Montecatini-Terme', 'Monsummano Terme', 'Pescia', 'Quarrata'],
  'Pordenone': ['Pordenone', 'Sacile', 'Maniago', 'Spilimbergo', 'Azzano Decimo'],
  'Potenza': ['Potenza', 'Melfi', 'Lagonegro', 'Viggiano', 'Villa d\'Agri'],
  'Prato': ['Prato', 'Montemurlo', 'Poggio a Caiano', 'Cantagallo'],
  'Ragusa': ['Ragusa', 'Modica', 'Vittoria', 'Comiso', 'Ispica', 'Scicli'],
  'Ravenna': ['Ravenna', 'Faenza', 'Lugo', 'Cervia', 'Russi', 'Bagnacavallo'],
  'Reggio Calabria': ['Reggio Calabria', 'Gioia Tauro', 'Villa San Giovanni', 'Siderno', 'Palmi', 'Locri'],
  'Reggio Emilia': ['Reggio Emilia', 'Correggio', 'Guastalla', 'Scandiano', 'Castelnovo ne\' Monti'],
  'Rieti': ['Rieti', 'Fara in Sabina', 'Poggio Mirteto', 'Magliano Sabina', 'Amatrice'],
  'Rimini': ['Rimini', 'Riccione', 'Cattolica', 'Santarcangelo di Romagna', 'Bellaria-Igea Marina'],
  'Roma': ['Roma', 'Guidonia Montecelio', 'Fiumicino', 'Tivoli', 'Velletri', 'Anzio', 'Civitavecchia', 'Pomezia', 'Frosinone'],
  'Rovigo': ['Rovigo', 'Adria', 'Porto Viro', 'Occhiobello', 'Badia Polesine'],
  'Salerno': ['Salerno', 'Cava de\' Tirreni', 'Battipaglia', 'Eboli', 'Nocera Inferiore', 'Vallo della Lucania'],
  'Sassari': ['Sassari', 'Olbia', 'Alghero', 'Porto Torres', 'Ozieri', 'Tempio Pausania'],
  'Savona': ['Savona', 'Albenga', 'Finale Ligure', 'Loano', 'Cairo Montenotte'],
  'Siena': ['Siena', 'Poggibonsi', 'Montepulciano', 'Chiusi', 'Colle di Val d\'Elsa', 'Montalcino'],
  'Siracusa': ['Siracusa', 'Augusta', 'Noto', 'Lentini', 'Avola', 'Pachino', 'Priolo Gargallo'],
  'Sondrio': ['Sondrio', 'Morbegno', 'Tirano', 'Chiavenna', 'Bormio'],
  'Sud Sardegna': ['Carbonia', 'Iglesias', 'Villasor', 'Domusnovas', 'Giba'],
  'Taranto': ['Taranto', 'Massafra', 'Martina Franca', 'Manduria', 'Grottaglie'],
  'Teramo': ['Teramo', 'Giulianova', 'Roseto degli Abruzzi', 'Pescara', 'Montorio al Vomano'],
  'Terni': ['Terni', 'Orvieto', 'Narni', 'Amelia', 'Acquasparta'],
  'Torino': ['Torino', 'Moncalieri', 'Collegno', 'Rivoli', 'Nichelino', 'Grugliasco', 'Pinerolo', 'Chieri', 'Ivrea', 'Settimo Torinese'],
  'Trapani': ['Trapani', 'Marsala', 'Mazara del Vallo', 'Castelvetrano', 'Alcamo', 'Erice'],
  'Trento': ['Trento', 'Rovereto', 'Riva del Garda', 'Arco', 'Pergine Valsugana', 'Mezzolombardo'],
  'Treviso': ['Treviso', 'Conegliano', 'Vittorio Veneto', 'Castelfranco Veneto', 'Oderzo', 'Montebelluna'],
  'Trieste': ['Trieste', 'Muggia', 'Duino-Aurisina', 'Monrupino'],
  'Udine': ['Udine', 'Pordenone', 'Palmanova', 'Tolmezzo', 'Codroipo', 'Cividale del Friuli'],
  'Varese': ['Varese', 'Busto Arsizio', 'Gallarate', 'Saronno', 'Cassano Magnago', 'Luino', 'Sesto Calende'],
  'Venezia': ['Venezia', 'Mestre', 'Chioggia', 'Marghera', 'San Donà di Piave', 'Jesolo', 'Portogruaro'],
  'Verbano-Cusio-Ossola': ['Verbania', 'Omegna', 'Domodossola', 'Gravellona Toce'],
  'Vercelli': ['Vercelli', 'Borgosesia', 'Santhià', 'Gattinara', 'Crescentino'],
  'Verona': ['Verona', 'Legnago', 'San Bonifacio', 'Villafranca di Verona', 'Isola della Scala', 'Peschiera del Garda'],
  'Vibo Valentia': ['Vibo Valentia', 'Pizzo', 'Tropea', 'Serra San Bruno'],
  'Vicenza': ['Vicenza', 'Bassano del Grappa', 'Schio', 'Thiene', 'Valdagno', 'Marostica', 'Arzignano'],
  'Viterbo': ['Viterbo', 'Civita Castellana', 'Tarquinia', 'Montefiascone', 'Orte'],
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: TrendingUp },
  { href: '/admin/leads', label: 'Pipeline Lead', icon: Users },
  { href: '/admin/clients', label: 'Clienti Attivi', icon: Brain },
  { href: '/admin/prospecting', label: 'Prospecting', icon: Target },
]

type RunStatus = 'idle' | 'running' | 'succeeded' | 'failed'

interface ProspectingLead {
  id: string
  company_name: string
  category: string
  address: string
  city: string
  phone: string
  website: string
  email: string
  rating: number | null
  review_count: number
  google_maps_url: string
  status: string
  notes: string | null
  created_at: string
  owner_name: string | null
  owner_email: string | null
  owner_position: string | null
  outreach_sent_at: string | null
  source: string | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new:       { label: 'Nuovo',      color: 'bg-electric-500/10 text-electric-400' },
  contacted: { label: 'Contattato', color: 'bg-yellow-500/10 text-yellow-400' },
  converted: { label: 'Convertito', color: 'bg-green-500/10 text-green-400' },
  dismissed: { label: 'Scartato',   color: 'bg-slate-500/10 text-slate-500' },
}

const EMPLOYEES_OPTIONS = [
  { value: '',         label: 'Qualsiasi dimensione' },
  { value: 'micro',    label: 'Micro (1–9 dip.)' },
  { value: 'piccola',  label: 'Piccola (10–49 dip.)' },
  { value: 'media',    label: 'Media (50–249 dip.)' },
]

const REVENUE_OPTIONS = [
  { value: '',       label: 'Qualsiasi fatturato' },
  { value: '<500k',  label: '< €500k' },
  { value: '500k2m', label: '€500k – €2M' },
  { value: '2m10m',  label: '€2M – €10M' },
  { value: '>10m',   label: '> €10M' },
]

function formatOutreachDate(isoDate: string): string {
  const d = new Date(isoDate)
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
}

export default function ProspectingPage() {
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')
  const [specificCity, setSpecificCity] = useState('')
  const [maxResults, setMaxResults] = useState(50)
  const [employees, setEmployees] = useState('')
  const [revenue, setRevenue] = useState('')
  const [runStatus, setRunStatus] = useState<RunStatus>('idle')
  const [runId, setRunId] = useState<string | null>(null)
  const [searchLabel, setSearchLabel] = useState('')
  const [newResults, setNewResults] = useState<ProspectingLead[]>([])
  const [savedLeads, setSavedLeads] = useState<ProspectingLead[]>([])
  const [activeTab, setActiveTab] = useState<'search' | 'saved'>('search')
  const [error, setError] = useState<string | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const [enrichingAll, setEnrichingAll] = useState(false)
  const [outreachSending, setOutreachSending] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkOutreaching, setBulkOutreaching] = useState(false)

  const [filterProvincia, setFilterProvincia] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSettore, setFilterSettore] = useState('')

  const [previewLead, setPreviewLead] = useState<ProspectingLead | null>(null)
  const [showBulkConfirm, setShowBulkConfirm] = useState(false)

  const [showManualForm, setShowManualForm] = useState(false)
  const [manualForm, setManualForm] = useState({
    company_name: '', owner_email: '', owner_name: '',
    city: '', phone: '', website: '', category: '',
  })
  const [manualSubmitting, setManualSubmitting] = useState(false)

  useEffect(() => {
    loadSavedLeads()
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [])

  async function loadSavedLeads() {
    const res = await fetch(`${API_URL}/prospecting/leads?limit=100`).catch(() => null)
    if (res?.ok) setSavedLeads(await res.json())
  }

  async function startSearch() {
    if (!query.trim() || !city.trim()) return
    setError(null)
    setRunStatus('running')
    setNewResults([])
    const searchCity = specificCity || city
    const empLabel = EMPLOYEES_OPTIONS.find(o => o.value === employees)?.label ?? ''
    const revLabel = REVENUE_OPTIONS.find(o => o.value === revenue)?.label ?? ''
    const filters = [empLabel, revLabel].filter(l => l && !l.startsWith('Qualsiasi')).join(' · ')
    setSearchLabel(`${query} · ${searchCity}${filters ? ` · ${filters}` : ''}`)

    const res = await fetch(`${API_URL}/prospecting/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query.trim(), city: searchCity, max_results: maxResults, employees: employees || null, revenue: revenue || null }),
    }).catch(() => null)

    if (!res?.ok) {
      setError('Errore avvio ricerca. Verifica che APIFY_API_TOKEN sia configurato nel .env.')
      setRunStatus('failed')
      return
    }

    const data = await res.json()
    setRunId(data.run_id)
    pollStatus(data.run_id)
  }

  function pollStatus(id: string) {
    pollingRef.current = setInterval(async () => {
      const res = await fetch(`${API_URL}/prospecting/runs/${id}/status`).catch(() => null)
      if (!res?.ok) return

      const data = await res.json()

      if (data.status === 'SUCCEEDED') {
        clearInterval(pollingRef.current!)
        fetchResults(id)
      } else if (data.status === 'FAILED' || data.status === 'TIMED-OUT') {
        clearInterval(pollingRef.current!)
        setRunStatus('failed')
        setError(`Scraping fallito con status: ${data.status}`)
      }
    }, 2000)
  }

  async function fetchResults(id: string) {
    const res = await fetch(`${API_URL}/prospecting/runs/${id}/results?save=true`).catch(() => null)
    if (!res?.ok) {
      setRunStatus('failed')
      setError('Errore nel recupero risultati.')
      return
    }
    const data = await res.json()
    const results = data.results || []
    setNewResults(results)
    setRunStatus('succeeded')
    setActiveTab('search')
    loadSavedLeads()

    // Enrich automatico — parte subito in background dopo lo scraping
    const withWebsite = results.filter((l: ProspectingLead) => l.website && !l.owner_email).length
    if (withWebsite > 0) {
      setEnrichingAll(true)
      await fetch(`${API_URL}/prospecting/leads/enrich-all?limit=${results.length}`, { method: 'POST' }).catch(() => null)
      await loadSavedLeads()
      setEnrichingAll(false)
    }
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`${API_URL}/prospecting/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setSavedLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l))
    setNewResults(prev => prev.map(l => l.id === id ? { ...l, status } : l))
  }

  async function enrichLead(id: string) {
    const res = await fetch(`${API_URL}/prospecting/leads/${id}/enrich`, { method: 'POST' }).catch(() => null)
    if (!res?.ok) return
    const data = await res.json()
    if (data.enriched && data.contact) {
      const update = { owner_name: data.contact.owner_name, owner_email: data.contact.owner_email, owner_position: data.contact.owner_position }
      setSavedLeads(prev => prev.map(l => l.id === id ? { ...l, ...update } : l))
      setNewResults(prev => prev.map(l => l.id === id ? { ...l, ...update } : l))
    }
  }

  async function enrichAll() {
    setEnrichingAll(true)
    await fetch(`${API_URL}/prospecting/leads/enrich-all?limit=20`, { method: 'POST' }).catch(() => null)
    await loadSavedLeads()
    setEnrichingAll(false)
  }

  async function sendOutreach(lead: ProspectingLead) {
    if (!lead.owner_email && !lead.email) {
      alert('Nessuna email disponibile. Esegui prima l\'enrich.')
      return
    }
    setPreviewLead(lead)
  }

  async function confirmOutreach(lead: ProspectingLead) {
    setPreviewLead(null)
    setOutreachSending(lead.id)
    const res = await fetch(`${API_URL}/prospecting/leads/${lead.id}/outreach`, { method: 'POST' }).catch(() => null)
    setOutreachSending(null)
    if (res?.ok) {
      const data = await res.json()
      const now = new Date().toISOString()
      setSavedLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'contacted', outreach_sent_at: now } : l))
      setNewResults(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'contacted', outreach_sent_at: now } : l))
      if (data.already_in_pipeline) alert('Lead già in pipeline')
    } else {
      alert('Errore invio email. Controlla i log del backend.')
    }
  }

  async function sendBulkOutreach() {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    setShowBulkConfirm(false)
    setBulkOutreaching(true)

    const res = await fetch(`${API_URL}/prospecting/leads/bulk-outreach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_ids: ids }),
    }).catch(() => null)

    setBulkOutreaching(false)

    if (res?.ok) {
      const data = await res.json()
      const now = new Date().toISOString()
      const sentSet = new Set<string>(data.sent as string[])
      setSavedLeads(prev => prev.map(l => sentSet.has(l.id) ? { ...l, status: 'contacted', outreach_sent_at: now } : l))
      setNewResults(prev => prev.map(l => sentSet.has(l.id) ? { ...l, status: 'contacted', outreach_sent_at: now } : l))
      setSelectedIds(new Set())
      if (data.failed?.length > 0) {
        alert(`Inviato a ${data.sent.length}/${ids.length}. Falliti: ${data.failed.length} (nessuna email o errore SMTP).`)
      }
    } else {
      alert('Errore bulk outreach. Controlla i log del backend.')
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll(leads: ProspectingLead[]) {
    const withEmail = leads.filter(l => l.owner_email || l.email).map(l => l.id)
    setSelectedIds(new Set(withEmail))
  }

  function deselectAll() {
    setSelectedIds(new Set())
  }

  async function submitManualLead() {
    if (!manualForm.company_name.trim() || !manualForm.owner_email.trim()) return
    setManualSubmitting(true)
    // Omette i campi opzionali vuoti (stringa vuota → non inviato)
    const payload = Object.fromEntries(
      Object.entries(manualForm).filter(([, v]) => v.trim() !== '')
    )
    const res = await fetch(`${API_URL}/prospecting/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => null)
    setManualSubmitting(false)
    if (res?.ok) {
      const newLead = await res.json()
      setSavedLeads(prev => [newLead, ...prev])
      setManualForm({ company_name: '', owner_email: '', owner_name: '', city: '', phone: '', website: '', category: '' })
      setShowManualForm(false)
      setActiveTab('saved')
    } else {
      alert('Errore nel salvataggio del lead. Controlla i log del backend.')
    }
  }

  function exportCSV(leads: ProspectingLead[]) {
    const headers = ['Azienda', 'Città', 'Categoria', 'Telefono', 'Sito web', 'Email', 'Decision Maker', 'Ruolo', 'Email DM', 'Rating', 'Recensioni', 'Status']
    const rows = leads.map(l => [
      l.company_name,
      l.city || l.address || '',
      l.category || '',
      l.phone || '',
      l.website || '',
      l.email || '',
      l.owner_name || '',
      l.owner_position || '',
      l.owner_email || '',
      l.rating?.toString() || '',
      l.review_count?.toString() || '',
      STATUS_CONFIG[l.status]?.label || l.status,
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prospect_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredSavedLeads = savedLeads.filter(l => {
    const matchProvincia = !filterProvincia || (l.city || '').toLowerCase().includes(filterProvincia.toLowerCase())
    const matchStatus = !filterStatus || l.status === filterStatus
    const matchSettore = !filterSettore || (l.category || '').toLowerCase().includes(filterSettore.toLowerCase())
    return matchProvincia && matchStatus && matchSettore
  })

  const currentLeads = activeTab === 'search' ? newResults : filteredSavedLeads
  const leadsWithEmail = currentLeads.filter(l => l.owner_email || l.email)
  const allWithEmailSelected = leadsWithEmail.length > 0 && leadsWithEmail.every(l => selectedIds.has(l.id))
  const someWithEmailSelected = leadsWithEmail.some(l => selectedIds.has(l.id)) && !allWithEmailSelected

  return (
    <div className="min-h-screen bg-navy-900">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-navy-800 border-r border-navy-700 flex flex-col">
        <div className="p-6 border-b border-navy-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-electric-500 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white">Admin Panel</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                item.href === '/admin/prospecting'
                  ? 'bg-navy-700 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-navy-700'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-navy-700">
          <div className="text-xs text-slate-500">v0.1.0 — MVP</div>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Prospecting</h1>
          <p className="text-slate-400 text-sm mt-1">Trova nuove PMI da contattare tramite Google Maps</p>
        </div>

        {/* Search form */}
        <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Search className="w-4 h-4 text-electric-400" />
            Nuova ricerca
          </h2>
          <div className="grid grid-cols-4 gap-4 mb-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Settore / categoria</label>
              <select
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-electric-500"
              >
                <option value="">Seleziona settore...</option>
                {SETTORI_PMI.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Provincia</label>
              <select
                value={city}
                onChange={e => { setCity(e.target.value); setSpecificCity('') }}
                className="w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-electric-500"
              >
                <option value="">Seleziona provincia...</option>
                {PROVINCE_ITALIANE.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Città specifica</label>
              <select
                value={specificCity}
                onChange={e => setSpecificCity(e.target.value)}
                disabled={!city}
                className="w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-electric-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="">Tutta la provincia</option>
                {(CITTA_PER_PROVINCIA[city] || []).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Max risultati</label>
              <select
                value={maxResults}
                onChange={e => setMaxResults(Number(e.target.value))}
                className="w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-electric-500"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={1000}>Senza limite</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Dimensione azienda</label>
              <select
                value={employees}
                onChange={e => setEmployees(e.target.value)}
                className="w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-electric-500"
              >
                {EMPLOYEES_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Fascia di fatturato</label>
              <select
                value={revenue}
                onChange={e => setRevenue(e.target.value)}
                className="w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-electric-500"
              >
                {REVENUE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <button
            onClick={startSearch}
            disabled={runStatus === 'running' || !query.trim() || !city.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-electric-500 hover:bg-electric-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl text-sm transition-colors"
          >
            {runStatus === 'running'
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Analizzando Google Maps...</>
              : <><Search className="w-4 h-4" /> Avvia ricerca</>
            }
          </button>
          {error && (
            <p className="mt-3 text-red-400 text-sm">{error}</p>
          )}
        </div>

        {/* Manual lead form */}
        {showManualForm && (
          <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6 mb-6">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-electric-400" />
              Aggiungi lead manuale
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Azienda <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  placeholder="es. Officina Rossi"
                  value={manualForm.company_name}
                  onChange={e => setManualForm(f => ({ ...f, company_name: e.target.value }))}
                  className="w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-electric-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Email contatto <span className="text-red-400">*</span></label>
                <input
                  type="email"
                  placeholder="es. info@azienda.it"
                  value={manualForm.owner_email}
                  onChange={e => setManualForm(f => ({ ...f, owner_email: e.target.value }))}
                  className="w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-electric-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Nome referente</label>
                <input
                  type="text"
                  placeholder="es. Mario Rossi"
                  value={manualForm.owner_name}
                  onChange={e => setManualForm(f => ({ ...f, owner_name: e.target.value }))}
                  className="w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-electric-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Città</label>
                <input
                  type="text"
                  placeholder="es. Milano"
                  value={manualForm.city}
                  onChange={e => setManualForm(f => ({ ...f, city: e.target.value }))}
                  className="w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-electric-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Telefono</label>
                <input
                  type="text"
                  placeholder="es. +39 02 1234567"
                  value={manualForm.phone}
                  onChange={e => setManualForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-electric-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Sito web</label>
                <input
                  type="text"
                  placeholder="es. www.azienda.it"
                  value={manualForm.website}
                  onChange={e => setManualForm(f => ({ ...f, website: e.target.value }))}
                  className="w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-electric-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Categoria</label>
                <input
                  type="text"
                  placeholder="es. officina meccanica"
                  value={manualForm.category}
                  onChange={e => setManualForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-electric-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={submitManualLead}
                disabled={manualSubmitting || !manualForm.company_name.trim() || !manualForm.owner_email.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-electric-500 hover:bg-electric-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl text-sm transition-colors"
              >
                {manualSubmitting ? <><RefreshCw className="w-4 h-4 animate-spin" /> Salvataggio...</> : <><UserPlus className="w-4 h-4" /> Salva lead</>}
              </button>
              <button
                onClick={() => setShowManualForm(false)}
                className="px-4 py-2.5 text-sm text-slate-400 hover:text-white bg-navy-900 border border-navy-700 rounded-xl transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        )}

        {/* Toolbar: Enrich All + bulk actions */}
        <div className="flex items-center justify-between mb-3">
          {selectedIds.size > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400 px-3 py-1.5 bg-navy-800 border border-navy-700 rounded-xl">
                Selezionati: <span className="text-white font-medium">{selectedIds.size}</span>
              </span>
              <button
                onClick={deselectAll}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-navy-800 border border-navy-700 rounded-xl transition-colors"
              >
                Deseleziona
              </button>
              <button
                onClick={() => setShowBulkConfirm(true)}
                disabled={bulkOutreaching}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-electric-500/10 border border-electric-500/30 hover:bg-electric-500/20 disabled:opacity-40 disabled:cursor-not-allowed text-electric-400 rounded-xl text-sm font-medium transition-colors"
              >
                {bulkOutreaching
                  ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Invio in corso...</>
                  : <><Mail className="w-3.5 h-3.5" /> Outreach selezionati ({selectedIds.size})</>
                }
              </button>
            </div>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            {currentLeads.length > 0 && (
              <button
                onClick={() => exportCSV(currentLeads)}
                className="flex items-center gap-2 px-4 py-2 bg-navy-800 border border-navy-700 hover:border-electric-500/50 text-slate-300 hover:text-white rounded-xl text-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-electric-400" /> Esporta CSV ({currentLeads.length})
              </button>
            )}
            <button
              onClick={() => setShowManualForm(v => !v)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm transition-colors ${
                showManualForm
                  ? 'bg-electric-500/10 border-electric-500/40 text-electric-400'
                  : 'bg-navy-800 border-navy-700 hover:border-electric-500/50 text-slate-300 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" /> Aggiungi lead manuale
            </button>
            <button
              onClick={enrichAll}
              disabled={enrichingAll}
              className="flex items-center gap-2 px-4 py-2 bg-navy-800 border border-navy-700 hover:border-electric-500/50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 hover:text-white rounded-xl text-sm transition-colors"
            >
              {enrichingAll
                ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Ricerca email in corso...</>
                : <><Zap className="w-3.5 h-3.5 text-electric-400" /> Enrich All</>
              }
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-navy-800 border border-navy-700 rounded-xl p-1 w-fit">
          <button
            onClick={() => { setActiveTab('search'); setSelectedIds(new Set()) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'search' ? 'bg-navy-700 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Risultati ricerca {newResults.length > 0 && `(${newResults.length})`}
          </button>
          <button
            onClick={() => { setActiveTab('saved'); setSelectedIds(new Set()) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'saved' ? 'bg-navy-700 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Tutti i lead salvati {savedLeads.length > 0 && `(${savedLeads.length})`}
          </button>
        </div>

        {/* Results */}
        {activeTab === 'search' && (
          <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6">
            {runStatus === 'idle' && (
              <div className="text-center py-16 text-slate-500">
                <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Inserisci settore e città per trovare nuovi prospect</p>
              </div>
            )}

            {runStatus === 'running' && (
              <div className="text-center py-16">
                <RefreshCw className="w-10 h-10 mx-auto mb-3 text-electric-400 animate-spin" />
                <p className="text-white font-medium">Scraping in corso: {searchLabel}</p>
                <p className="text-slate-500 text-sm mt-1">Attendi 30–60 secondi...</p>
              </div>
            )}

            {runStatus === 'succeeded' && newResults.length === 0 && (
              <div className="text-center py-16 text-slate-500">
                <p>Nessun risultato trovato per questa ricerca.</p>
              </div>
            )}

            {runStatus === 'succeeded' && newResults.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-slate-400 text-sm">{newResults.length} aziende trovate · {searchLabel}</p>
                  {enrichingAll && (
                    <span className="flex items-center gap-1.5 text-xs text-electric-400 bg-electric-500/10 border border-electric-500/20 px-3 py-1.5 rounded-xl">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Ricerca email in corso...
                    </span>
                  )}
                </div>
                <LeadTable
                  leads={newResults}
                  onStatusChange={updateStatus}
                  onEnrich={enrichLead}
                  onOutreach={sendOutreach}
                  outreachSending={outreachSending}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onSelectAll={() => allWithEmailSelected ? deselectAll() : selectAll(newResults)}
                  allWithEmailSelected={allWithEmailSelected}
                  someSelected={someWithEmailSelected}
                />
              </>
            )}
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6">
            {/* Filtri */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <Filter className="w-4 h-4 text-slate-500 shrink-0" />
              <select
                value={filterSettore}
                onChange={e => setFilterSettore(e.target.value)}
                className="bg-navy-900 border border-navy-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-electric-500 min-w-[200px]"
              >
                <option value="">Tutti i settori</option>
                {SETTORI_PMI.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select
                value={filterProvincia}
                onChange={e => setFilterProvincia(e.target.value)}
                className="bg-navy-900 border border-navy-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-electric-500 min-w-[180px]"
              >
                <option value="">Tutte le province</option>
                {PROVINCE_ITALIANE.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="bg-navy-900 border border-navy-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-electric-500 min-w-[150px]"
              >
                <option value="">Tutti gli status</option>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
              {(filterSettore || filterProvincia || filterStatus) && (
                <button
                  onClick={() => { setFilterSettore(''); setFilterProvincia(''); setFilterStatus('') }}
                  className="text-xs text-slate-400 hover:text-white px-3 py-2 bg-navy-900 border border-navy-700 rounded-xl transition-colors"
                >
                  Azzera filtri
                </button>
              )}
              {(filterSettore || filterProvincia || filterStatus) && (
                <span className="text-xs text-slate-500 ml-auto">
                  {filteredSavedLeads.length} / {savedLeads.length} lead
                </span>
              )}
            </div>

            {savedLeads.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <p>Nessun lead salvato ancora. Avvia una ricerca per iniziare.</p>
              </div>
            ) : filteredSavedLeads.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <p>Nessun lead corrisponde ai filtri selezionati.</p>
              </div>
            ) : (
              <LeadTable
                leads={filteredSavedLeads}
                onStatusChange={updateStatus}
                onEnrich={enrichLead}
                onOutreach={sendOutreach}
                outreachSending={outreachSending}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onSelectAll={() => allWithEmailSelected ? deselectAll() : selectAll(filteredSavedLeads)}
                allWithEmailSelected={allWithEmailSelected}
                someSelected={someWithEmailSelected}
              />
            )}
          </div>
        )}
      </main>

      {/* Modale conferma bulk outreach */}
      {showBulkConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-navy-800 border border-navy-600 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-navy-700">
              <h2 className="text-white font-semibold text-lg">Conferma invio bulk</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 bg-electric-500/10 border border-electric-500/20 rounded-xl p-4">
                <div className="text-3xl font-bold text-electric-400">{selectedIds.size}</div>
                <div>
                  <p className="text-white font-medium">aziende selezionate</p>
                  <p className="text-slate-400 text-sm">riceveranno l&apos;email outreach</p>
                </div>
              </div>
              <p className="text-slate-300 text-sm">
                Sei sicuro di voler inviare l&apos;email di outreach a tutte le <strong className="text-white">{selectedIds.size} aziende</strong> selezionate? L&apos;operazione non è reversibile.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-navy-700">
              <button
                onClick={() => setShowBulkConfirm(false)}
                className="px-5 py-2.5 text-sm text-slate-400 hover:text-white bg-navy-900 border border-navy-700 rounded-xl transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={sendBulkOutreach}
                className="flex items-center gap-2 px-5 py-2.5 bg-electric-500 hover:bg-electric-600 text-white font-medium rounded-xl text-sm transition-colors"
              >
                <Mail className="w-4 h-4" /> Sì, invia a tutte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale anteprima outreach */}
      {previewLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-navy-800 border border-navy-600 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-navy-700">
              <div>
                <h2 className="text-white font-semibold text-lg">Anteprima email outreach</h2>
                <p className="text-slate-400 text-sm mt-0.5">Controlla prima di inviare</p>
              </div>
              <button onClick={() => setPreviewLead(null)} className="text-slate-400 hover:text-white transition-colors text-xl leading-none">✕</button>
            </div>

            {/* Info invio */}
            <div className="px-6 py-4 bg-navy-900/50 border-b border-navy-700 space-y-1.5">
              <div className="flex gap-2 text-sm">
                <span className="text-slate-500 w-16 shrink-0">A:</span>
                <span className="text-white">{previewLead.owner_email || previewLead.email}</span>
              </div>
              <div className="flex gap-2 text-sm">
                <span className="text-slate-500 w-16 shrink-0">Oggetto:</span>
                <span className="text-white">Ho analizzato {previewLead.company_name} — diagnosi gratuita per te</span>
              </div>
            </div>

            {/* Preview email */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-white rounded-xl p-6 text-sm text-gray-800 space-y-4 leading-relaxed">
                <p>Ciao <strong>{(previewLead.owner_name || previewLead.company_name).split(' ')[0] || 'Imprenditore'}</strong>,</p>
                <p>Ho analizzato <strong>{previewLead.company_name}</strong> e penso ci siano margini concreti per ridurre il lavoro manuale e aumentare l&apos;efficienza operativa con strumenti AI accessibili.</p>
                <p>Ho preparato una <strong>diagnosi gratuita</strong> — 5 minuti di questionario, e ricevi un report personalizzato con il tuo punteggio di efficienza e 3 azioni concrete da implementare subito.</p>
                <div className="bg-amber-50 border-l-4 border-amber-400 p-3 space-y-2">
                  <p>① Il tuo <strong>punteggio di efficienza operativa</strong> vs le PMI del tuo settore</p>
                  <p>② Le <strong>3 aree critiche</strong> con i quick win attivabili subito</p>
                  <p>★ Il <strong>Certificato di Efficienza Operativa</strong> — completamente gratuito</p>
                </div>
                <div className="bg-gray-900 text-amber-400 font-bold px-6 py-3 rounded-lg inline-block">
                  Inizia la diagnosi gratuita →
                </div>
                <p className="text-gray-500 text-xs">Oppure rispondi a questa email. Ti rispondo entro 24 ore.</p>
                <hr />
                <p className="text-gray-700 font-semibold">Luigi Negro &amp; Alessio Serreli</p>
                <p className="text-gray-400 text-xs uppercase tracking-wide">AI Expert · Ottimizzazione Processi PMI</p>
              </div>
            </div>

            {/* Footer azioni */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-navy-700">
              <button
                onClick={() => setPreviewLead(null)}
                className="px-5 py-2.5 text-sm text-slate-400 hover:text-white bg-navy-900 border border-navy-700 rounded-xl transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={() => confirmOutreach(previewLead)}
                className="flex items-center gap-2 px-5 py-2.5 bg-electric-500 hover:bg-electric-600 text-white font-medium rounded-xl text-sm transition-colors"
              >
                <Mail className="w-4 h-4" /> Conferma e invia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function LeadTable({ leads, onStatusChange, onEnrich, onOutreach, outreachSending, selectedIds, onToggleSelect, onSelectAll, allWithEmailSelected, someSelected }: {
  leads: ProspectingLead[]
  onStatusChange: (id: string, status: string) => void
  onEnrich: (id: string) => Promise<void>
  onOutreach: (lead: ProspectingLead) => Promise<void>
  outreachSending: string | null
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onSelectAll: () => void
  allWithEmailSelected: boolean
  someSelected: boolean
}) {
  const [enrichingId, setEnrichingId] = useState<string | null>(null)

  async function handleEnrich(id: string) {
    setEnrichingId(id)
    await onEnrich(id)
    setEnrichingId(null)
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-navy-700">
            <th className="pb-3 pr-3 w-8">
              <input
                type="checkbox"
                checked={allWithEmailSelected}
                ref={el => { if (el) el.indeterminate = someSelected }}
                onChange={onSelectAll}
                title={allWithEmailSelected ? 'Deseleziona tutti' : 'Seleziona tutti con email'}
                className="w-3.5 h-3.5 accent-electric-500 cursor-pointer"
              />
            </th>
            <th className="text-left text-slate-400 font-medium pb-3 pr-4">Azienda</th>
            <th className="text-left text-slate-400 font-medium pb-3 pr-4">Contatti</th>
            <th className="text-left text-slate-400 font-medium pb-3 pr-4">Decision Maker</th>
            <th className="text-left text-slate-400 font-medium pb-3 pr-4">Rating</th>
            <th className="text-left text-slate-400 font-medium pb-3 pr-4">Status</th>
            <th className="text-left text-slate-400 font-medium pb-3">Azioni</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-navy-700">
          {leads.map(lead => (
            <tr key={lead.id} className={`hover:bg-navy-900/30 transition-colors ${lead.status === 'dismissed' ? 'opacity-40' : ''} ${selectedIds.has(lead.id) ? 'bg-electric-500/5' : ''}`}>
              <td className="py-3 pr-3">
                <input
                  type="checkbox"
                  checked={selectedIds.has(lead.id)}
                  onChange={() => onToggleSelect(lead.id)}
                  className="w-3.5 h-3.5 accent-electric-500 cursor-pointer"
                />
              </td>
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{lead.company_name}</span>
                  {lead.source === 'manual' && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 font-medium">Manuale</span>
                  )}
                </div>
                <div className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  {lead.city || lead.address || '—'}
                  {lead.category && <span className="ml-2 text-slate-600">· {lead.category}</span>}
                </div>
              </td>
              <td className="py-3 pr-4">
                <div className="space-y-0.5">
                  {lead.phone && (
                    <div className="flex items-center gap-1 text-slate-300 text-xs">
                      <Phone className="w-3 h-3 text-slate-500" /> {lead.phone}
                    </div>
                  )}
                  {lead.website && (
                    <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-electric-400 text-xs hover:underline">
                      <Globe className="w-3 h-3" /> sito web
                    </a>
                  )}
                  {lead.google_maps_url && (
                    <a href={lead.google_maps_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-slate-500 text-xs hover:text-slate-300">
                      <MapPin className="w-3 h-3" /> Google Maps
                    </a>
                  )}
                </div>
              </td>
              <td className="py-3 pr-4 min-w-[180px]">
                {lead.owner_name || lead.owner_email ? (
                  <div className="space-y-0.5">
                    {lead.owner_name && (
                      <div className="text-white text-xs font-medium">{lead.owner_name}</div>
                    )}
                    {lead.owner_position && (
                      <div className="text-slate-500 text-xs">{lead.owner_position}</div>
                    )}
                    {lead.owner_email && (
                      <a href={`mailto:${lead.owner_email}`} className="flex items-center gap-1 text-electric-400 text-xs hover:underline">
                        <Mail className="w-3 h-3" /> {lead.owner_email}
                      </a>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => handleEnrich(lead.id)}
                    disabled={enrichingId === lead.id || !lead.website}
                    title={!lead.website ? 'Nessun sito web disponibile' : 'Cerca decision maker su Hunter.io'}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-navy-600 hover:border-electric-500/50 text-slate-500 hover:text-electric-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
                  >
                    {enrichingId === lead.id
                      ? <><RefreshCw className="w-3 h-3 animate-spin" /> Ricerca...</>
                      : <><Zap className="w-3 h-3" /> Enrich</>
                    }
                  </button>
                )}
              </td>
              <td className="py-3 pr-4">
                {lead.rating ? (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-white text-xs font-medium">{lead.rating.toFixed(1)}</span>
                    <span className="text-slate-500 text-xs">({lead.review_count})</span>
                  </div>
                ) : (
                  <span className="text-slate-600 text-xs">—</span>
                )}
              </td>
              <td className="py-3 pr-4">
                <div className="space-y-1">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_CONFIG[lead.status]?.color ?? 'text-slate-400'}`}>
                    {STATUS_CONFIG[lead.status]?.label ?? lead.status}
                  </span>
                  {lead.outreach_sent_at && (
                    <div className="text-xs text-green-400/70 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Contattato il {formatOutreachDate(lead.outreach_sent_at)}
                    </div>
                  )}
                </div>
              </td>
              <td className="py-3">
                <div className="flex items-center gap-1">
                  {/* Bottone Outreach */}
                  {lead.status !== 'converted' && (
                    <button
                      onClick={() => onOutreach(lead)}
                      disabled={outreachSending === lead.id}
                      title={lead.outreach_sent_at ? 'Email già inviata — reinvia' : 'Invia email outreach con link survey'}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        lead.outreach_sent_at
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20'
                          : 'bg-electric-500/10 text-electric-400 border border-electric-500/20 hover:bg-electric-500/20'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {outreachSending === lead.id
                        ? <><RefreshCw className="w-3 h-3 animate-spin" /> Invio...</>
                        : lead.outreach_sent_at
                          ? <><CheckCircle className="w-3 h-3" /> Inviata</>
                          : <><Mail className="w-3 h-3" /> Outreach</>
                      }
                    </button>
                  )}
                  {lead.status !== 'contacted' && lead.status !== 'converted' && (
                    <button
                      onClick={() => onStatusChange(lead.id, 'contacted')}
                      title="Segna come contattato"
                      className="p-1.5 rounded-lg hover:bg-yellow-500/10 text-slate-500 hover:text-yellow-400 transition-colors"
                    >
                      <Clock className="w-4 h-4" />
                    </button>
                  )}
                  {lead.status !== 'converted' && (
                    <button
                      onClick={() => onStatusChange(lead.id, 'converted')}
                      title="Segna come convertito"
                      className="p-1.5 rounded-lg hover:bg-green-500/10 text-slate-500 hover:text-green-400 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  {lead.status !== 'dismissed' && (
                    <button
                      onClick={() => onStatusChange(lead.id, 'dismissed')}
                      title="Scarta"
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
