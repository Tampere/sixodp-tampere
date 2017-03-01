domain = 'https://10.106.10.10/'
api = domain + 'data/api/3/action/'
lang = 'fi'
apiKey = '0c7f22e1-48b9-441e-8c2e-9a45bba727dd'

var color = {
  primary: '#074a74',
  secondary: '#6fbf69',
  white: '#fff',
  white2: '#f8f8f8',
  black: '#000',
}
var txt = {
  amount: {
    'fi': 'Kpl'
  }
}

// Locales
// https://unpkg.com/d3-time-format@2.0.3/locale/fi-FI.json
var timeFormatLocales = {
  fi: {
    "dateTime": "%A, %-d. %Bta %Y klo %X",
    "date": "%-d.%-m.%Y",
    "time": "%H:%M:%S",
    "periods": [
        "a.m.",
        "p.m."
    ],
    "days": [
        "sunnuntai",
        "maanantai",
        "tiistai",
        "keskiviikko",
        "torstai",
        "perjantai",
        "lauantai"
    ],
    "shortDays": [
        "Su",
        "Ma",
        "Ti",
        "Ke",
        "To",
        "Pe",
        "La"
    ],
    "months": [
        "tammikuu",
        "helmikuu",
        "maaliskuu",
        "huhtikuu",
        "toukokuu",
        "kesäkuu",
        "heinäkuu",
        "elokuu",
        "syyskuu",
        "lokakuu",
        "marraskuu",
        "joulukuu"
    ],
    "shortMonths": [
        "Tammi",
        "Helmi",
        "Maalis",
        "Huhti",
        "Touko",
        "Kesä",
        "Heinä",
        "Elo",
        "Syys",
        "Loka",
        "Marras",
        "Joulu"
    ]
  },
  'sv': {},
  'en': {},
}

d3.timeFormatDefaultLocale(timeFormatLocales[lang])
