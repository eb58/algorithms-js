// Vorgegebene Orte für Tour und Ortsliste: Mittelpunkt (re, im) als Dezimalstring, Zoomstufe z (log2 der halben Bildhöhe),
// Drehung r und Periode p des Minibrots, aus der sich die nötige Iterationszahl ableitet.
;((root, factory) => {
  const api = factory()
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else root.MandelbrotPlaces = api
})(typeof globalThis !== 'undefined' ? globalThis : this, () => [
  {
    name: 'Goldener Schnitt',
    info: 'Siegel-Scheibe am Rand der Hauptkardioide',
    re: '-0.39054838543342',
    im: '-0.58678718876144',
    z: -15.823,
    r: 1.0971,
    p: 610
  },
  {
    name: 'Elefantental',
    info: 'Rüsselparade nahe der Spitze bei 0,25',
    re: '0.269194124589789',
    im: '0.005540526495113',
    z: -20.606,
    r: 2.4421,
    p: 134
  },
  {
    name: 'Seepferdchental',
    info: 'Spiralen zwischen Kardioide und Periode-2-Kreis',
    re: '-0.743643887037158870778064',
    im: '0.131825904205312292821097',
    z: -48.92,
    r: -0.875,
    p: 998
  },
  {
    name: 'Misiurewicz-Wirbel',
    info: 'Spirale um einen Misiurewicz-Punkt',
    re: '-0.7756837697445748027346383',
    im: '0.1364673704715429498027001',
    z: -54.254,
    r: -1.5251,
    p: 347
  },
  {
    name: 'Nadel',
    info: 'Minibrot auf der Antenne der reellen Achse',
    re: '-1.9855403716912853327620681',
    im: '0.0000000000000000000000000',
    z: -53.531,
    r: 0.0,
    p: 75
  },
  {
    name: 'Doppelspirale',
    info: 'Verschlungene Arme bei −0,1 + 0,96i',
    re: '-0.101096363856632154083296781659',
    im: '0.956286510810084812789602004720',
    z: -70.666,
    r: 1.4866,
    p: 85
  },
  {
    name: 'Sternenkranz',
    info: 'Eingebettete Julia-Menge mit 20 Zacken',
    re: '-0.00000000000057906085889350831241876116',
    im: '0.99999999999952248343169679964682201990',
    z: -97.137,
    r: -2.3053,
    p: 578
  },
  {
    name: 'Spiralkranz',
    info: 'Spiralen rund um ein tiefes Minibrot',
    re: '-0.00000000000057906085889337750829368954',
    im: '0.99999999999952248343169663725397983800',
    z: -94.923,
    r: 1.4099,
    p: 782
  },
  {
    name: 'Dendritenkette',
    info: 'Verzweigte Äste nahe c = i',
    re: '-0.000000000000579060858893512845813656761',
    im: '0.999999999999522483431696820224282993993',
    z: -98.902,
    r: 1.2296,
    p: 306
  },
  {
    name: 'Nadelstern',
    info: 'Stern tief unten auf der Antenne',
    re: '-1.9855403716912853327731903175833',
    im: '0.0000000000000000256520696639388',
    z: -71.939,
    r: -0.1384,
    p: 675
  },
  {
    name: 'Wellenmuster',
    info: 'Konzentrische Wellen im Wirbel',
    re: '-0.7756837697445747872173800846935',
    im: '0.1364673704715429505197109767559',
    z: -72.662,
    r: -1.6634,
    p: 3123
  },
  {
    name: 'Spiralgarten',
    info: 'Minibrot im Spiralfeld der Doppelspirale',
    re: '-0.10109636385663215408333246943067934',
    im: '0.95628651081008481278946631438570845',
    z: -85.095,
    r: 1.5286,
    p: 1955
  }
])
