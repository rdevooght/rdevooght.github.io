const stations_with_sun_measure = [
  "6464",
  "6455",
  "6434",
  "6494",
  "6438",
  "6459",
  "6477",
  "6447",
  "6447",
  "6414",
  "6418",
  "6439",
  "6472",
  "6484",
  "belgium",
];

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

const colors = {
  neutral: "black",
  2024: "#7570b3",
  2025: "#d95f02",
  with_sun: "#3182bd",
  without_sun: "#9ecae1",
  old_station: "black",
  new_station: "white",
};

function showStationPicker() {
  const modal = document.getElementById("map-popover");
  modal.showModal();
  drawStationsMap(document.querySelector("#stations-map"));
}

function hideStationPicker() {
  const modal = document.getElementById("map-popover");
  modal.close();
}

function getRainDays(station) {
  const days = data[station][2025].length;
  function _getRainDays(station, year) {
    const rain_days = d3.sum(
      data[station][year].slice(0, days),
      (d) => d.rain_day,
    );
    return {
      days: days,
      rain: rain_days,
      dry: days - rain_days,
      percentage: rain_days / days,
    };
  }
  return {
    avg: _getRainDays(station, "avg"),
    2024: _getRainDays(station, 2024),
    2025: _getRainDays(station, 2025),
  };
}

function getPrecipitations(station) {
  const days = data[station][2025].length;
  function _getPrecipitations(station, year) {
    const precip = data[station][year][days - 1].rain;
    return {
      days: days,
      rain: precip,
    };
  }
  return {
    avg: _getPrecipitations(station, "avg"),
    2024: _getPrecipitations(station, 2024),
    2025: _getPrecipitations(station, 2025),
  };
}

function getSunHours(station) {
  const days = data[station][2025].length;
  function _getSunHours(station, year) {
    const sun = data[station][year][days - 1].sun;
    return {
      days: days,
      sun: sun,
    };
  }
  return {
    avg: _getSunHours(station, "avg"),
    2024: _getSunHours(station, 2024),
    2025: _getSunHours(station, 2025),
  };
}

const percent_formater = new Intl.NumberFormat("fr-BE", {
  maximumSignificantDigits: 2,
  style: "percent",
}).format;
const signed_percent_formater = new Intl.NumberFormat("fr-BE", {
  maximumSignificantDigits: 3,
  style: "percent",
  signDisplay: "exceptZero",
}).format;

const round_formater = new Intl.NumberFormat("fr-BE", {
  maximumFractionDigits: 0,
}).format;

function getComparison(a, b) {
  return signed_percent_formater(b / a - 1);
}

const comp_date = (function () {
  const days = data["belgium"][2025].length;
  const last_day = data["belgium"][2025][days - 1].day;
  const last_date = new Date(`2025-${last_day}`);
  return last_date.toLocaleDateString("fr-BE", {
    month: "long",
    day: "numeric",
  });
})();

function getMeanTempData(station_code) {
  const days = data[station_code][2025].length;
  function _getMeanTempData(year) {
    return d3.mean(
      data[station_code][year].slice(0, days),
      (d) => (d.Tmin + d.Tmax) / 2,
    );
  }
  return {
    2024: _getMeanTempData(2024),
    2025: _getMeanTempData(2025),
    avg: _getMeanTempData("avg"),
  };
}

function getMonthlyTempData(station_code, tempType = "avg") {
  const days = data[station_code][2025].length;

  // Temperature extraction function based on type
  function getTempValue(d) {
    switch (tempType) {
      case "Tmin":
        return d.Tmin;
      case "Tmax":
        return d.Tmax;
      case "avg":
      default:
        return (d.Tmin + d.Tmax) / 2;
    }
  }

  function _getMonthlyTempData(year) {
    const yearData = data[station_code][year].slice(0, days);

    // Group data by month
    const monthlyData = d3.group(yearData, (d) => d.day.split("-")[0]);

    // Calculate average temperature for each month
    const monthlyAverages = {};
    monthlyData.forEach((monthDays, month) => {
      monthlyAverages[month] = d3.mean(monthDays, getTempValue);
    });

    return monthlyAverages;
  }

  const results = [];

  // Process each year and convert to flat array format
  const years = [2024, 2025];
  years.forEach((year) => {
    const monthlyData = _getMonthlyTempData(year);
    Object.entries(monthlyData).forEach(([month, avg_temp]) => {
      results.push({
        month: parseInt(month),
        avg_temp: avg_temp,
        year: year,
      });
    });
  });

  return results;
}
