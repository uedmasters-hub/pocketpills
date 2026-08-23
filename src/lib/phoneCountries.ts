/** Country dialing codes for PhoneField. Nepal (NP) is default; grouped by region in the UI. */

export type PhoneCountry = {
  /** ISO 3166-1 alpha-2 */
  iso: string;
  /** Dial digits only, e.g. `"977"` */
  code: string;
  label: string;
  dial: string;
  /** Max national digits (10 for typical mobiles; never past E.164). */
  nationalLen: number;
  /** Continent / region label for dropdown grouping. */
  region: string;
};

/** Preferred region order in the country picker (Asia first — Nepal). */
export const PHONE_REGION_ORDER = [
  "Asia",
  "Africa",
  "Europe",
  "North America",
  "South America",
  "Oceania",
  "Antarctica",
  "Other",
] as const;

export const PHONE_COUNTRIES: readonly PhoneCountry[] = [
  {
    "iso": "NP",
    "code": "977",
    "label": "Nepal",
    "dial": "+977",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "DZ",
    "code": "213",
    "label": "Algeria",
    "dial": "+213",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "AO",
    "code": "244",
    "label": "Angola",
    "dial": "+244",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "BJ",
    "code": "229",
    "label": "Benin",
    "dial": "+229",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "BW",
    "code": "267",
    "label": "Botswana",
    "dial": "+267",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "BF",
    "code": "226",
    "label": "Burkina Faso",
    "dial": "+226",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "BI",
    "code": "257",
    "label": "Burundi",
    "dial": "+257",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "CM",
    "code": "237",
    "label": "Cameroon",
    "dial": "+237",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "CV",
    "code": "238",
    "label": "Cape Verde",
    "dial": "+238",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "CF",
    "code": "236",
    "label": "Central African Republic",
    "dial": "+236",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "TD",
    "code": "235",
    "label": "Chad",
    "dial": "+235",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "KM",
    "code": "269",
    "label": "Comoros",
    "dial": "+269",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "CD",
    "code": "243",
    "label": "Democratic Republic of the Congo",
    "dial": "+243",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "DJ",
    "code": "253",
    "label": "Djibouti",
    "dial": "+253",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "EG",
    "code": "20",
    "label": "Egypt",
    "dial": "+20",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "GQ",
    "code": "240",
    "label": "Equatorial Guinea",
    "dial": "+240",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "ER",
    "code": "291",
    "label": "Eritrea",
    "dial": "+291",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "ET",
    "code": "251",
    "label": "Ethiopia",
    "dial": "+251",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "GA",
    "code": "241",
    "label": "Gabon",
    "dial": "+241",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "GM",
    "code": "220",
    "label": "Gambia",
    "dial": "+220",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "GH",
    "code": "233",
    "label": "Ghana",
    "dial": "+233",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "GN",
    "code": "224",
    "label": "Guinea",
    "dial": "+224",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "GW",
    "code": "245",
    "label": "Guinea-Bissau",
    "dial": "+245",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "CI",
    "code": "225",
    "label": "Ivory Coast",
    "dial": "+225",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "KE",
    "code": "254",
    "label": "Kenya",
    "dial": "+254",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "LS",
    "code": "266",
    "label": "Lesotho",
    "dial": "+266",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "LR",
    "code": "231",
    "label": "Liberia",
    "dial": "+231",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "LY",
    "code": "218",
    "label": "Libya",
    "dial": "+218",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "MG",
    "code": "261",
    "label": "Madagascar",
    "dial": "+261",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "MW",
    "code": "265",
    "label": "Malawi",
    "dial": "+265",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "ML",
    "code": "223",
    "label": "Mali",
    "dial": "+223",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "MR",
    "code": "222",
    "label": "Mauritania",
    "dial": "+222",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "MU",
    "code": "230",
    "label": "Mauritius",
    "dial": "+230",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "YT",
    "code": "262",
    "label": "Mayotte",
    "dial": "+262",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "MA",
    "code": "212",
    "label": "Morocco",
    "dial": "+212",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "MZ",
    "code": "258",
    "label": "Mozambique",
    "dial": "+258",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "NA",
    "code": "264",
    "label": "Namibia",
    "dial": "+264",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "NE",
    "code": "227",
    "label": "Niger",
    "dial": "+227",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "NG",
    "code": "234",
    "label": "Nigeria",
    "dial": "+234",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "CG",
    "code": "242",
    "label": "Republic of the Congo",
    "dial": "+242",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "RE",
    "code": "262",
    "label": "Reunion",
    "dial": "+262",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "RW",
    "code": "250",
    "label": "Rwanda",
    "dial": "+250",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "SH",
    "code": "290",
    "label": "Saint Helena",
    "dial": "+290",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "ST",
    "code": "239",
    "label": "Sao Tome and Principe",
    "dial": "+239",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "SN",
    "code": "221",
    "label": "Senegal",
    "dial": "+221",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "SC",
    "code": "248",
    "label": "Seychelles",
    "dial": "+248",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "SL",
    "code": "232",
    "label": "Sierra Leone",
    "dial": "+232",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "SO",
    "code": "252",
    "label": "Somalia",
    "dial": "+252",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "ZA",
    "code": "27",
    "label": "South Africa",
    "dial": "+27",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "SS",
    "code": "211",
    "label": "South Sudan",
    "dial": "+211",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "SD",
    "code": "249",
    "label": "Sudan",
    "dial": "+249",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "SZ",
    "code": "268",
    "label": "Swaziland",
    "dial": "+268",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "TZ",
    "code": "255",
    "label": "Tanzania",
    "dial": "+255",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "TG",
    "code": "228",
    "label": "Togo",
    "dial": "+228",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "TN",
    "code": "216",
    "label": "Tunisia",
    "dial": "+216",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "UG",
    "code": "256",
    "label": "Uganda",
    "dial": "+256",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "EH",
    "code": "212",
    "label": "Western Sahara",
    "dial": "+212",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "ZM",
    "code": "260",
    "label": "Zambia",
    "dial": "+260",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "ZW",
    "code": "263",
    "label": "Zimbabwe",
    "dial": "+263",
    "nationalLen": 10,
    "region": "Africa"
  },
  {
    "iso": "AF",
    "code": "93",
    "label": "Afghanistan",
    "dial": "+93",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "AM",
    "code": "374",
    "label": "Armenia",
    "dial": "+374",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "AZ",
    "code": "994",
    "label": "Azerbaijan",
    "dial": "+994",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "BH",
    "code": "973",
    "label": "Bahrain",
    "dial": "+973",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "BD",
    "code": "880",
    "label": "Bangladesh",
    "dial": "+880",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "BT",
    "code": "975",
    "label": "Bhutan",
    "dial": "+975",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "IO",
    "code": "246",
    "label": "British Indian Ocean Territory",
    "dial": "+246",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "BN",
    "code": "673",
    "label": "Brunei",
    "dial": "+673",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "KH",
    "code": "855",
    "label": "Cambodia",
    "dial": "+855",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "CN",
    "code": "86",
    "label": "China",
    "dial": "+86",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "CX",
    "code": "61",
    "label": "Christmas Island",
    "dial": "+61",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "CC",
    "code": "61",
    "label": "Cocos Islands",
    "dial": "+61",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "GE",
    "code": "995",
    "label": "Georgia",
    "dial": "+995",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "HK",
    "code": "852",
    "label": "Hong Kong",
    "dial": "+852",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "IN",
    "code": "91",
    "label": "India",
    "dial": "+91",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "ID",
    "code": "62",
    "label": "Indonesia",
    "dial": "+62",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "IR",
    "code": "98",
    "label": "Iran",
    "dial": "+98",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "IQ",
    "code": "964",
    "label": "Iraq",
    "dial": "+964",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "IL",
    "code": "972",
    "label": "Israel",
    "dial": "+972",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "JP",
    "code": "81",
    "label": "Japan",
    "dial": "+81",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "JO",
    "code": "962",
    "label": "Jordan",
    "dial": "+962",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "KZ",
    "code": "7",
    "label": "Kazakhstan",
    "dial": "+7",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "KW",
    "code": "965",
    "label": "Kuwait",
    "dial": "+965",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "KG",
    "code": "996",
    "label": "Kyrgyzstan",
    "dial": "+996",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "LA",
    "code": "856",
    "label": "Laos",
    "dial": "+856",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "LB",
    "code": "961",
    "label": "Lebanon",
    "dial": "+961",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "MO",
    "code": "853",
    "label": "Macao",
    "dial": "+853",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "MY",
    "code": "60",
    "label": "Malaysia",
    "dial": "+60",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "MV",
    "code": "960",
    "label": "Maldives",
    "dial": "+960",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "MN",
    "code": "976",
    "label": "Mongolia",
    "dial": "+976",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "MM",
    "code": "95",
    "label": "Myanmar",
    "dial": "+95",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "KP",
    "code": "850",
    "label": "North Korea",
    "dial": "+850",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "OM",
    "code": "968",
    "label": "Oman",
    "dial": "+968",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "PK",
    "code": "92",
    "label": "Pakistan",
    "dial": "+92",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "PS",
    "code": "970",
    "label": "Palestinian Territory",
    "dial": "+970",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "PH",
    "code": "63",
    "label": "Philippines",
    "dial": "+63",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "QA",
    "code": "974",
    "label": "Qatar",
    "dial": "+974",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "SA",
    "code": "966",
    "label": "Saudi Arabia",
    "dial": "+966",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "SG",
    "code": "65",
    "label": "Singapore",
    "dial": "+65",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "KR",
    "code": "82",
    "label": "South Korea",
    "dial": "+82",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "LK",
    "code": "94",
    "label": "Sri Lanka",
    "dial": "+94",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "SY",
    "code": "963",
    "label": "Syria",
    "dial": "+963",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "TW",
    "code": "886",
    "label": "Taiwan",
    "dial": "+886",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "TJ",
    "code": "992",
    "label": "Tajikistan",
    "dial": "+992",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "TH",
    "code": "66",
    "label": "Thailand",
    "dial": "+66",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "TR",
    "code": "90",
    "label": "Turkey",
    "dial": "+90",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "TM",
    "code": "993",
    "label": "Turkmenistan",
    "dial": "+993",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "AE",
    "code": "971",
    "label": "United Arab Emirates",
    "dial": "+971",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "UZ",
    "code": "998",
    "label": "Uzbekistan",
    "dial": "+998",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "VN",
    "code": "84",
    "label": "Vietnam",
    "dial": "+84",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "YE",
    "code": "967",
    "label": "Yemen",
    "dial": "+967",
    "nationalLen": 10,
    "region": "Asia"
  },
  {
    "iso": "AX",
    "code": "358",
    "label": "Aland Islands",
    "dial": "+358",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "AL",
    "code": "355",
    "label": "Albania",
    "dial": "+355",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "AD",
    "code": "376",
    "label": "Andorra",
    "dial": "+376",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "AT",
    "code": "43",
    "label": "Austria",
    "dial": "+43",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "BY",
    "code": "375",
    "label": "Belarus",
    "dial": "+375",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "BE",
    "code": "32",
    "label": "Belgium",
    "dial": "+32",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "BA",
    "code": "387",
    "label": "Bosnia and Herzegovina",
    "dial": "+387",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "BG",
    "code": "359",
    "label": "Bulgaria",
    "dial": "+359",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "HR",
    "code": "385",
    "label": "Croatia",
    "dial": "+385",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "CY",
    "code": "357",
    "label": "Cyprus",
    "dial": "+357",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "CZ",
    "code": "420",
    "label": "Czech Republic",
    "dial": "+420",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "DK",
    "code": "45",
    "label": "Denmark",
    "dial": "+45",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "EE",
    "code": "372",
    "label": "Estonia",
    "dial": "+372",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "FO",
    "code": "298",
    "label": "Faroe Islands",
    "dial": "+298",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "FI",
    "code": "358",
    "label": "Finland",
    "dial": "+358",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "FR",
    "code": "33",
    "label": "France",
    "dial": "+33",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "DE",
    "code": "49",
    "label": "Germany",
    "dial": "+49",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "GI",
    "code": "350",
    "label": "Gibraltar",
    "dial": "+350",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "GR",
    "code": "30",
    "label": "Greece",
    "dial": "+30",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "GG",
    "code": "44",
    "label": "Guernsey",
    "dial": "+44",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "HU",
    "code": "36",
    "label": "Hungary",
    "dial": "+36",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "IS",
    "code": "354",
    "label": "Iceland",
    "dial": "+354",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "IE",
    "code": "353",
    "label": "Ireland",
    "dial": "+353",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "IM",
    "code": "44",
    "label": "Isle of Man",
    "dial": "+44",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "IT",
    "code": "39",
    "label": "Italy",
    "dial": "+39",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "JE",
    "code": "44",
    "label": "Jersey",
    "dial": "+44",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "LV",
    "code": "371",
    "label": "Latvia",
    "dial": "+371",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "LI",
    "code": "423",
    "label": "Liechtenstein",
    "dial": "+423",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "LT",
    "code": "370",
    "label": "Lithuania",
    "dial": "+370",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "LU",
    "code": "352",
    "label": "Luxembourg",
    "dial": "+352",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "MK",
    "code": "389",
    "label": "Macedonia",
    "dial": "+389",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "MT",
    "code": "356",
    "label": "Malta",
    "dial": "+356",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "MD",
    "code": "373",
    "label": "Moldova",
    "dial": "+373",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "MC",
    "code": "377",
    "label": "Monaco",
    "dial": "+377",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "ME",
    "code": "382",
    "label": "Montenegro",
    "dial": "+382",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "NL",
    "code": "31",
    "label": "Netherlands",
    "dial": "+31",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "NO",
    "code": "47",
    "label": "Norway",
    "dial": "+47",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "PL",
    "code": "48",
    "label": "Poland",
    "dial": "+48",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "PT",
    "code": "351",
    "label": "Portugal",
    "dial": "+351",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "RO",
    "code": "40",
    "label": "Romania",
    "dial": "+40",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "RU",
    "code": "7",
    "label": "Russia",
    "dial": "+7",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "SM",
    "code": "378",
    "label": "San Marino",
    "dial": "+378",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "RS",
    "code": "381",
    "label": "Serbia",
    "dial": "+381",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "SK",
    "code": "421",
    "label": "Slovakia",
    "dial": "+421",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "SI",
    "code": "386",
    "label": "Slovenia",
    "dial": "+386",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "ES",
    "code": "34",
    "label": "Spain",
    "dial": "+34",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "SJ",
    "code": "47",
    "label": "Svalbard and Jan Mayen",
    "dial": "+47",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "SE",
    "code": "46",
    "label": "Sweden",
    "dial": "+46",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "CH",
    "code": "41",
    "label": "Switzerland",
    "dial": "+41",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "UA",
    "code": "380",
    "label": "Ukraine",
    "dial": "+380",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "GB",
    "code": "44",
    "label": "United Kingdom",
    "dial": "+44",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "VA",
    "code": "379",
    "label": "Vatican",
    "dial": "+379",
    "nationalLen": 10,
    "region": "Europe"
  },
  {
    "iso": "AI",
    "code": "1",
    "label": "Anguilla",
    "dial": "+1",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "AG",
    "code": "1",
    "label": "Antigua and Barbuda",
    "dial": "+1",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "AW",
    "code": "297",
    "label": "Aruba",
    "dial": "+297",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "BS",
    "code": "1",
    "label": "Bahamas",
    "dial": "+1",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "BB",
    "code": "1",
    "label": "Barbados",
    "dial": "+1",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "BZ",
    "code": "501",
    "label": "Belize",
    "dial": "+501",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "BM",
    "code": "1",
    "label": "Bermuda",
    "dial": "+1",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "BQ",
    "code": "599",
    "label": "Bonaire, Saint Eustatius and Saba ",
    "dial": "+599",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "VG",
    "code": "1",
    "label": "British Virgin Islands",
    "dial": "+1",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "CA",
    "code": "1",
    "label": "Canada",
    "dial": "+1",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "KY",
    "code": "1",
    "label": "Cayman Islands",
    "dial": "+1",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "CR",
    "code": "506",
    "label": "Costa Rica",
    "dial": "+506",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "CU",
    "code": "53",
    "label": "Cuba",
    "dial": "+53",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "CW",
    "code": "599",
    "label": "Curacao",
    "dial": "+599",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "DM",
    "code": "1",
    "label": "Dominica",
    "dial": "+1",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "DO",
    "code": "1",
    "label": "Dominican Republic",
    "dial": "+1",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "SV",
    "code": "503",
    "label": "El Salvador",
    "dial": "+503",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "GL",
    "code": "299",
    "label": "Greenland",
    "dial": "+299",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "GD",
    "code": "1",
    "label": "Grenada",
    "dial": "+1",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "GP",
    "code": "590",
    "label": "Guadeloupe",
    "dial": "+590",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "GT",
    "code": "502",
    "label": "Guatemala",
    "dial": "+502",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "HT",
    "code": "509",
    "label": "Haiti",
    "dial": "+509",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "HN",
    "code": "504",
    "label": "Honduras",
    "dial": "+504",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "JM",
    "code": "1",
    "label": "Jamaica",
    "dial": "+1",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "MQ",
    "code": "596",
    "label": "Martinique",
    "dial": "+596",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "MX",
    "code": "52",
    "label": "Mexico",
    "dial": "+52",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "MS",
    "code": "1",
    "label": "Montserrat",
    "dial": "+1",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "NI",
    "code": "505",
    "label": "Nicaragua",
    "dial": "+505",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "PA",
    "code": "507",
    "label": "Panama",
    "dial": "+507",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "PR",
    "code": "1",
    "label": "Puerto Rico",
    "dial": "+1",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "BL",
    "code": "590",
    "label": "Saint Barthelemy",
    "dial": "+590",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "KN",
    "code": "1",
    "label": "Saint Kitts and Nevis",
    "dial": "+1",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "LC",
    "code": "1",
    "label": "Saint Lucia",
    "dial": "+1",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "MF",
    "code": "590",
    "label": "Saint Martin",
    "dial": "+590",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "PM",
    "code": "508",
    "label": "Saint Pierre and Miquelon",
    "dial": "+508",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "VC",
    "code": "1",
    "label": "Saint Vincent and the Grenadines",
    "dial": "+1",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "SX",
    "code": "599",
    "label": "Sint Maarten",
    "dial": "+599",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "TT",
    "code": "1",
    "label": "Trinidad and Tobago",
    "dial": "+1",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "TC",
    "code": "1",
    "label": "Turks and Caicos Islands",
    "dial": "+1",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "VI",
    "code": "1",
    "label": "U.S. Virgin Islands",
    "dial": "+1",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "US",
    "code": "1",
    "label": "United States",
    "dial": "+1",
    "nationalLen": 10,
    "region": "North America"
  },
  {
    "iso": "AS",
    "code": "1",
    "label": "American Samoa",
    "dial": "+1",
    "nationalLen": 10,
    "region": "Oceania"
  },
  {
    "iso": "AU",
    "code": "61",
    "label": "Australia",
    "dial": "+61",
    "nationalLen": 10,
    "region": "Oceania"
  },
  {
    "iso": "CK",
    "code": "682",
    "label": "Cook Islands",
    "dial": "+682",
    "nationalLen": 10,
    "region": "Oceania"
  },
  {
    "iso": "TL",
    "code": "670",
    "label": "East Timor",
    "dial": "+670",
    "nationalLen": 10,
    "region": "Oceania"
  },
  {
    "iso": "FJ",
    "code": "679",
    "label": "Fiji",
    "dial": "+679",
    "nationalLen": 10,
    "region": "Oceania"
  },
  {
    "iso": "PF",
    "code": "689",
    "label": "French Polynesia",
    "dial": "+689",
    "nationalLen": 10,
    "region": "Oceania"
  },
  {
    "iso": "GU",
    "code": "1",
    "label": "Guam",
    "dial": "+1",
    "nationalLen": 10,
    "region": "Oceania"
  },
  {
    "iso": "KI",
    "code": "686",
    "label": "Kiribati",
    "dial": "+686",
    "nationalLen": 10,
    "region": "Oceania"
  },
  {
    "iso": "MH",
    "code": "692",
    "label": "Marshall Islands",
    "dial": "+692",
    "nationalLen": 10,
    "region": "Oceania"
  },
  {
    "iso": "FM",
    "code": "691",
    "label": "Micronesia",
    "dial": "+691",
    "nationalLen": 10,
    "region": "Oceania"
  },
  {
    "iso": "NR",
    "code": "674",
    "label": "Nauru",
    "dial": "+674",
    "nationalLen": 10,
    "region": "Oceania"
  },
  {
    "iso": "NC",
    "code": "687",
    "label": "New Caledonia",
    "dial": "+687",
    "nationalLen": 10,
    "region": "Oceania"
  },
  {
    "iso": "NZ",
    "code": "64",
    "label": "New Zealand",
    "dial": "+64",
    "nationalLen": 10,
    "region": "Oceania"
  },
  {
    "iso": "NU",
    "code": "683",
    "label": "Niue",
    "dial": "+683",
    "nationalLen": 10,
    "region": "Oceania"
  },
  {
    "iso": "NF",
    "code": "672",
    "label": "Norfolk Island",
    "dial": "+672",
    "nationalLen": 10,
    "region": "Oceania"
  },
  {
    "iso": "MP",
    "code": "1",
    "label": "Northern Mariana Islands",
    "dial": "+1",
    "nationalLen": 10,
    "region": "Oceania"
  },
  {
    "iso": "PW",
    "code": "680",
    "label": "Palau",
    "dial": "+680",
    "nationalLen": 10,
    "region": "Oceania"
  },
  {
    "iso": "PG",
    "code": "675",
    "label": "Papua New Guinea",
    "dial": "+675",
    "nationalLen": 10,
    "region": "Oceania"
  },
  {
    "iso": "PN",
    "code": "870",
    "label": "Pitcairn",
    "dial": "+870",
    "nationalLen": 10,
    "region": "Oceania"
  },
  {
    "iso": "WS",
    "code": "685",
    "label": "Samoa",
    "dial": "+685",
    "nationalLen": 10,
    "region": "Oceania"
  },
  {
    "iso": "SB",
    "code": "677",
    "label": "Solomon Islands",
    "dial": "+677",
    "nationalLen": 10,
    "region": "Oceania"
  },
  {
    "iso": "TK",
    "code": "690",
    "label": "Tokelau",
    "dial": "+690",
    "nationalLen": 10,
    "region": "Oceania"
  },
  {
    "iso": "TO",
    "code": "676",
    "label": "Tonga",
    "dial": "+676",
    "nationalLen": 10,
    "region": "Oceania"
  },
  {
    "iso": "TV",
    "code": "688",
    "label": "Tuvalu",
    "dial": "+688",
    "nationalLen": 10,
    "region": "Oceania"
  },
  {
    "iso": "UM",
    "code": "1",
    "label": "United States Minor Outlying Islands",
    "dial": "+1",
    "nationalLen": 10,
    "region": "Oceania"
  },
  {
    "iso": "VU",
    "code": "678",
    "label": "Vanuatu",
    "dial": "+678",
    "nationalLen": 10,
    "region": "Oceania"
  },
  {
    "iso": "WF",
    "code": "681",
    "label": "Wallis and Futuna",
    "dial": "+681",
    "nationalLen": 10,
    "region": "Oceania"
  },
  {
    "iso": "AR",
    "code": "54",
    "label": "Argentina",
    "dial": "+54",
    "nationalLen": 10,
    "region": "South America"
  },
  {
    "iso": "BO",
    "code": "591",
    "label": "Bolivia",
    "dial": "+591",
    "nationalLen": 10,
    "region": "South America"
  },
  {
    "iso": "BR",
    "code": "55",
    "label": "Brazil",
    "dial": "+55",
    "nationalLen": 10,
    "region": "South America"
  },
  {
    "iso": "CL",
    "code": "56",
    "label": "Chile",
    "dial": "+56",
    "nationalLen": 10,
    "region": "South America"
  },
  {
    "iso": "CO",
    "code": "57",
    "label": "Colombia",
    "dial": "+57",
    "nationalLen": 10,
    "region": "South America"
  },
  {
    "iso": "EC",
    "code": "593",
    "label": "Ecuador",
    "dial": "+593",
    "nationalLen": 10,
    "region": "South America"
  },
  {
    "iso": "FK",
    "code": "500",
    "label": "Falkland Islands",
    "dial": "+500",
    "nationalLen": 10,
    "region": "South America"
  },
  {
    "iso": "GF",
    "code": "594",
    "label": "French Guiana",
    "dial": "+594",
    "nationalLen": 10,
    "region": "South America"
  },
  {
    "iso": "GY",
    "code": "592",
    "label": "Guyana",
    "dial": "+592",
    "nationalLen": 10,
    "region": "South America"
  },
  {
    "iso": "PY",
    "code": "595",
    "label": "Paraguay",
    "dial": "+595",
    "nationalLen": 10,
    "region": "South America"
  },
  {
    "iso": "PE",
    "code": "51",
    "label": "Peru",
    "dial": "+51",
    "nationalLen": 10,
    "region": "South America"
  },
  {
    "iso": "SR",
    "code": "597",
    "label": "Suriname",
    "dial": "+597",
    "nationalLen": 10,
    "region": "South America"
  },
  {
    "iso": "UY",
    "code": "598",
    "label": "Uruguay",
    "dial": "+598",
    "nationalLen": 10,
    "region": "South America"
  },
  {
    "iso": "VE",
    "code": "58",
    "label": "Venezuela",
    "dial": "+58",
    "nationalLen": 10,
    "region": "South America"
  }
] as const;

export const DEFAULT_PHONE_COUNTRY_ISO = "NP";

export function groupPhoneCountriesByRegion(
  countries: readonly PhoneCountry[],
): { region: string; countries: PhoneCountry[] }[] {
  const map = new Map<string, PhoneCountry[]>();
  for (const c of countries) {
    const list = map.get(c.region) ?? [];
    list.push(c);
    map.set(c.region, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => {
      if (a.iso === "NP") return -1;
      if (b.iso === "NP") return 1;
      return a.label.localeCompare(b.label);
    });
  }
  const out: { region: string; countries: PhoneCountry[] }[] = [];
  for (const region of PHONE_REGION_ORDER) {
    const list = map.get(region);
    if (list?.length) out.push({ region, countries: list });
  }
  for (const [region, list] of map) {
    if (!(PHONE_REGION_ORDER as readonly string[]).includes(region) && list.length) {
      out.push({ region, countries: list });
    }
  }
  return out;
}
