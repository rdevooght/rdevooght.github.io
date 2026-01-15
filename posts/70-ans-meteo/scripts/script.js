/**
 * Generates and displays calendars for each month between startYear and endYear
 * @param {number} startYear - The starting year (inclusive)
 * @param {number} endYear - The ending year (inclusive)
 * @param {string} containerId - The ID of the container element to append calendars to
 * @param {Function} callback - Function to call when rendering is complete
 */
function generateCalendarRange(
  startYear,
  endYear,
  containerId = "calendar-container",
  callback = null,
) {
  let container = document.getElementById(containerId);

  // Clear the container
  container.innerHTML = "";

  // Render a full year at once
  function renderYearBatch(year) {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        // Create a year's worth of calendars
        for (let month = 1; month <= 12; month++) {
          const calendar = document.createElement("month-calendar");
          calendar.setAttribute("year", year);
          calendar.setAttribute("month", month);
          calendar.setAttribute("color", "avg_temps");
          container.appendChild(calendar);
        }
        resolve();
      });
    });
  }

  // Progressive rendering by year
  async function renderProgressively() {
    for (let year = startYear; year <= endYear; year++) {
      await renderYearBatch(year);
    }

    // Execute callback when rendering completes
    if (typeof callback === "function") {
      callback(container);
    }
  }

  // Start the progressive rendering
  renderProgressively();

  // Return the container reference
  return container;
}

function decode_record(record, month, day) {
  const level = text_encoding[record[0]];
  const period = text_encoding[record[1]];

  const priority = (level == "belgium" ? 10 : 1) * (period == "month" ? 5 : 1);

  const month_list = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ];
  const short_month = [
    "jan.",
    "fév.",
    "mars",
    "avr.",
    "mai",
    "juin",
    "juil.",
    "août",
    "sept.",
    "oct.",
    "nov.",
    "déc.",
  ];

  let scope = "";
  if (period == "date") {
    scope = `pour un ${day} ${short_month[month - 1]}`;
  } else if (period == "month") {
    const m = month_list[month - 1];
    const determinant = ["a", "e", "i", "o", "u"].includes(m[0]) ? "d'" : "de ";
    scope = `pour un mois ${determinant}${m}`;
  }

  const units = {
    cold: "°C",
    hot: "°C",
    rain: "mm",
    dry: "",
    wet: "",
  };

  const stations = {
    6451: "Zaventem/Melsbroek",
    6449: "Gosselies",
    6450: "Deurne",
    6464: "Retie",
    6472: "Humain",
    6494: "Mont Rigi",
    6484: "Buzenol",
    6490: "Spa (Aerodrome)",
    6476: "Saint-Hubert",
    6414: "Beitem",
    6418: "Zeebrugge",
    6438: "Stabroek",
    6446: "Uccle-Ukkel",
    6447: "Uccle-Ukkel",
    6477: "Diepenbeek",
    6478: "Bierset",
    6479: "Kleine-Brogel",
    6439: "Sint-Katelijne-Waver",
    6407: "Middelkerke",
    6434: "Melle",
    6455: "Dourbes",
    6459: "Ernage",
    6432: "Chievres",
    6458: "Beauvechain",
    6465: "Schaffen",
    6496: "Elsenborn",
    6456: "Florennes",
    6428: "Semmerzake",
    6400: "Koksijde",
  };

  return {
    level: level,
    period: period,
    type: text_encoding[record[2]],
    record: text_encoding[record[3]],
    value: record[4],
    station_code: text_encoding[record[5]],
    station: stations[text_encoding[record[5]]],
    priority: priority,
    text: `${text_encoding[record[3]]} ${scope}`,
    units: units[text_encoding[record[2]]],
  };
}

/**
 * Récupères les records pour une date donnée
 * @param {number} year - Année
 * @param {number} month - Mois (1-12)
 * @param {number} day - Jour (1-31)
 */
function getRecords(year, month, day) {
  dateString = `${year}-${month < 10 ? `0${month}` : month}-${day < 10 ? `0${day}` : day}`;
  if (records.hasOwnProperty(dateString)) {
    return records[dateString].map((r) => decode_record(r, month, day));
  }
  return [];
}

/**
 * Récupères la liste des records pour une date donnée,
 * mais uniquement la valeur de type et priorité
 * @param {number} year - Année
 * @param {number} month - Mois (1-12)
 * @param {number} day - Jour (1-31)
 */
function getRecordsFast(year, month, day) {
  dateString = `${year}-${month < 10 ? `0${month}` : month}-${day < 10 ? `0${day}` : day}`;
  if (records.hasOwnProperty(dateString)) {
    return records[dateString].map((r) => ({
      level: text_encoding[r[0]],
      type: text_encoding[r[2]],
      priority:
        (text_encoding[r[0]] == "belgium" ? 10 : 1) *
        (text_encoding[r[1]] == "month" ? 5 : 1),
    }));
  }
  return [];
}

function hasRecords(year, month, day) {
  dateString = `${year}-${month < 10 ? `0${month}` : month}-${day < 10 ? `0${day}` : day}`;
  return records.hasOwnProperty(dateString);
}

// Data about records types
// const recordsTypes = {
//   hot: { c1: "orange", c2: "darkred", desc: "Haute température" },
//   dry: { c1: "beige", c2: "goldenrod", desc: "Période de sécheresse" },
//   cold: { c1: "paleturquoise", c2: "turquoise", desc: "Basse température" },
//   rain: { c1: "powderblue", c2: "navy", desc: "Fortes pluies" },
//   wet: { c1: "aqua", c2: "dodgerblue", desc: "Période de pluie" },
// };

const recordsTypes = {
  hot: { c1: "white", c2: "darkred", desc: "Haute température" },
  dry: { c1: "white", c2: "goldenrod", desc: "Période de sécheresse" },
  cold: { c1: "white", c2: "turquoise", desc: "Basse température" },
  rain: { c1: "white", c2: "navy", desc: "Fortes pluies" },
  wet: { c1: "white", c2: "dodgerblue", desc: "Période de pluie" },
};

// Create interpolators once
const colorInterpolators = {};
for (const type in recordsTypes) {
  const C1 = new Color(recordsTypes[type].c1);
  colorInterpolators[type] = C1.range(recordsTypes[type].c2);
}
const rb_scale = d3.scaleSequential(d3.interpolateRdBu);
const temps_scale = (v) => rb_scale(0.5 - v / 3);
colorInterpolators["temps"] = temps_scale;
colorInterpolators["min_temps"] = temps_scale;
colorInterpolators["max_temps"] = temps_scale;
colorInterpolators["avg_temps"] = temps_scale;

/**
 * Returns a color based on the type and score
 * The higher the score, the more intense the color
 * @param {string} type - whose value can be hot, cold, rain, dry or wet
 * @param {int} score - between 0 and 100
 * @returns {string} - RGB color string
 */
function getColor(type, score) {
  // Normalize score to be between 0 and 1 for color calculations
  const normalizedScore = Math.max(0, Math.min(100, score)) / 100;

  // Use the pre-created interpolator
  return colorInterpolators[type](normalizedScore);
}

/**
 * based on a list of records,
 * return a list of the type of records, the score for each type (the sum of the records' priority score)
 * and the color for each type
 * @param {List of records} records
 */
function getColors(records) {
  // 1. group records by type
  let groups = [];
  for (let r of records) {
    let i = groups.findIndex((d) => d.type == r.type);
    if (i == -1) {
      groups.push({ type: r.type, score: r.priority });
    } else {
      groups[i].score += r.priority;
    }
  }

  // 2. get the color for each group
  return groups.map((g) => ({ ...g, color: getColor(g.type, g.score) }));
}

function getDaily(year, month, day) {
  const yearly_data = daily[month - 1][day - 1].map((d, i) => ({
    year: 1955 + i,
    date: new Date(1955 + i, month - 1, day),
    min_temps: d[0],
    max_temps: d[1],
    precip_quantity: d[2],
    thisYear: year == i + 1955,
    records: [],
  }));

  return yearly_data;
}

function getDayDataAndDev(year, month, day) {
  const rawValues = daily[month - 1][day - 1][year - 1955];
  const mean = daily_avg[month - 1][day - 1];
  const std = daily_std[month - 1][day - 1];
  const data = {
    min_temps: {
      val: rawValues[0],
      avg: mean[0],
      dev: (rawValues[0] - mean[0]) / std[0],
    },
    max_temps: {
      val: rawValues[1],
      avg: mean[1],
      dev: (rawValues[1] - mean[1]) / std[1],
    },
    avg_temps: {
      val: (rawValues[0] + rawValues[1]) / 2,
      avg: mean[3],
      dev: ((rawValues[0] + rawValues[1]) / 2 - mean[3]) / std[3],
    },
    precip_quantity: {
      val: rawValues[2],
      avg: mean[2],
      dev: (rawValues[2] - mean[2]) / std[2],
    },
  };
  return data;
}

function getMax(array, accessor) {
  return array.reduce(
    (max, item) => (accessor(item) > accessor(max) ? item : max),
    array[0],
  );
}
