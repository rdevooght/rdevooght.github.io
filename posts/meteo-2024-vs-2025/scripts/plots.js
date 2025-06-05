function render_plot(targetElement, plot) {
  if (!targetElement || !(targetElement instanceof HTMLElement)) {
    console.error("Invalid targetElement provided.");
    return;
  }

  // Render the plot to the target element
  targetElement.innerHTML = ""; // Clear previous content
  targetElement.appendChild(plot);
}

function cumsum_plot(
  targetElement,
  y,
  {
    station = "belgium",
    ylabel = "",
    marginLeft = 50,
    avg_start_year = 1955,
  } = {},
) {
  const width = targetElement.getBoundingClientRect().width;
  const height = Math.min(400, width * 0.8);

  // find which label should go above or below the line
  const y_accessor =
    typeof y === "string" || y instanceof String ? (d) => d[y] : y;
  const l2025 = data[station][2025].length;
  let position_2025 = "top",
    position_2024 = "top",
    position_avg = "bottom";
  if (
    y_accessor(data[station][2025][l2025 - 1]) <
    y_accessor(data[station]["avg"][l2025 - 1])
  ) {
    position_2025 = "bottom";
  }
  if (
    d3.max(data[station][2024], y_accessor) <
    d3.max(data[station]["avg"], y_accessor)
  ) {
    position_2024 = "bottom";
    position_avg = "top";
  }

  function year_label(points, label, position) {
    const anchor_id = Math.min(points.length - 1, 310);
    const anchor_x = new Date(`2024-${points[anchor_id].day}`);
    const anchor_y = y_accessor(points[anchor_id]);
    const anchor = { x: anchor_x, y: anchor_y, text: label };

    let textAnchor, lineAnchor, dy;
    if (position == "top") {
      textAnchor = "end";
      dy = -5;
      lineAnchor = "bottom";
    } else {
      textAnchor = "start";
      dy = 5;
      lineAnchor = "top";
    }

    return Plot.text([anchor], {
      x: "x",
      y: "y",
      text: "text",
      textAnchor,
      lineAnchor,
      dy,
      fontSize: 12,
    });
  }

  function combine_perc_data(p1, p2) {
    return d3
      .zip(
        d3.sort(monthly_data[station][p1], (d) => d.month),
        d3.sort(monthly_data[station][p2], (d) => d.month),
      )
      .map((d) => ({
        month: d[0].month,
        y1: y_accessor(d[0]),
        y2: y_accessor(d[1]),
      }));
  }

  const plot = Plot.plot({
    marginLeft,
    width,
    height,
    x: {
      tickFormat: d3.timeFormat("%b"),
      label: null,
    },
    y: {
      label: ylabel,
    },

    marks: [
      Plot.areaY(combine_perc_data("p10", "p90"), {
        x: (d) => new Date(2024, d["month"], 0),
        y1: "y1",
        y2: "y2",
        curve: "catmull-rom",
        fillOpacity: 0.1,
      }),
      Plot.areaY(combine_perc_data("p20", "p80"), {
        x: (d) => new Date(2024, d["month"], 0),
        y1: "y1",
        y2: "y2",
        curve: "catmull-rom",
        fillOpacity: 0.1,
      }),
      Plot.areaY(combine_perc_data("p30", "p70"), {
        x: (d) => new Date(2024, d["month"], 0),
        y1: "y1",
        y2: "y2",
        curve: "catmull-rom",
        fillOpacity: 0.1,
      }),
      Plot.areaY(combine_perc_data("p40", "p60"), {
        x: (d) => new Date(2024, d["month"], 0),
        y1: "y1",
        y2: "y2",
        curve: "catmull-rom",
        fillOpacity: 0.1,
      }),
      Plot.line(
        data[station]["avg"],
        Plot.windowY(10, {
          x: (d) => new Date(`2024-${d["day"]}`),
          y: y,
          stroke: colors.neutral,
        }),
      ),
      Plot.line(data[station][2024], {
        x: (d) => new Date(`2024-${d["day"]}`),
        y: y,
        stroke: colors[2024],
        strokeWidth: 3,
      }),
      Plot.line(data[station][2025], {
        x: (d) => new Date(`2024-${d["day"]}`),
        y: y,
        stroke: colors[2025],
        strokeWidth: 3,
      }),

      year_label(data[station]["2024"], "2024", position_2024),
      year_label(data[station]["2025"], "2025", position_2025),
      year_label(
        data[station]["avg"],
        `Moyenne\n${avg_start_year}-2024`,
        position_avg,
      ),
    ],
  });

  render_plot(targetElement, plot);
}

function draw_precipitations_plot(targetElement, { station = "belgium" } = {}) {
  const startYear = Math.max(
    1955,
    stations.filter((d) => d.code == station)[0].startYear,
  );
  cumsum_plot(targetElement, "rain", {
    ylabel: null,
    station,
    avg_start_year: startYear,
  });
}

function draw_sun_hours_plot(targetElement, { station = "belgium" } = {}) {
  cumsum_plot(targetElement, "sun", {
    ylabel: null,
    station,
    avg_start_year: 2015,
  });
}

function draw_all_plots(station) {
  draw_precipitations_plot(document.getElementById("precipitations_plot"), {
    station,
  });

  if (stations_with_sun_measure.includes(station)) {
    document.getElementById("sun_hours_plot").hidden = false;
    draw_sun_hours_plot(document.getElementById("sun_hours_plot"), {
      station,
    });
  } else {
    document.getElementById("sun_hours_plot").hidden = true;
  }

  draw_temp_plot(document.getElementById("temp_plot"), {
    station,
    value: "avg",
    ylabel: "Température moyenne (°C)",
  });
}

function draw_temp_plot(
  targetElement,
  {
    station = "belgium",
    value = "avg",
    ylabel = "",
    marginLeft = 50,
    avg_start_year = 1955,
  } = {},
) {
  const width = targetElement.getBoundingClientRect().width;
  const height = Math.min(400, width * 0.8);

  // find which label should go above or below the line
  const y_accessor =
    value == "avg" ? (d) => (d.Tmin + d.Tmax) / 2 : (d) => d[value];

  const monthNames = [
    "Jan",
    "Fev",
    "Mar",
    "Avr",
    "Mai",
    "Jun",
    "Jul",
    "Aoû",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  function _getMonthlyTempData(year) {
    const yearData = data[station][year];

    // Group data by month
    const monthlyData = d3.group(yearData, (d) =>
      parseInt(d.day.split("-")[0]),
    );

    // Calculate average temperature for each month
    const monthlyAverages = [];
    monthlyData.forEach((monthDays, month) => {
      if (monthDays.length > 25) {
        monthlyAverages.push({
          month: monthNames[month - 1],
          y: d3.mean(monthDays, y_accessor),
        });
      }
    });

    return monthlyAverages;
  }

  function combine_perc_data(p1, p2) {
    return d3
      .zip(
        d3.sort(monthly_data[station][p1], (d) => d.month),
        d3.sort(monthly_data[station][p2], (d) => d.month),
      )
      .filter((d) => d[0].month > 0)
      .map((d) => ({
        month: monthNames[d[0].month - 1],
        y1: y_accessor(d[0]),
        y2: y_accessor(d[1]),
      }));
  }

  const plot = Plot.plot({
    marginLeft,
    width,
    height,
    x: {
      label: null,
      domain: monthNames,
    },
    y: {
      label: ylabel,
    },

    marks: [
      Plot.areaY(combine_perc_data("p10", "p90"), {
        x: "month",
        y1: "y1",
        y2: "y2",
        curve: "catmull-rom",
        fillOpacity: 0.1,
      }),
      Plot.areaY(combine_perc_data("p20", "p80"), {
        x: "month",
        y1: "y1",
        y2: "y2",
        curve: "catmull-rom",
        fillOpacity: 0.1,
      }),
      Plot.areaY(combine_perc_data("p30", "p70"), {
        x: "month",
        y1: "y1",
        y2: "y2",
        curve: "catmull-rom",
        fillOpacity: 0.1,
      }),
      Plot.areaY(combine_perc_data("p40", "p60"), {
        x: "month",
        y1: "y1",
        y2: "y2",
        curve: "catmull-rom",
        fillOpacity: 0.1,
      }),
      Plot.line(
        monthly_data[station]["avg"].filter((d) => d.month > 0),
        {
          x: (d) => monthNames[d.month - 1],
          y: y_accessor,
          stroke: colors.neutral,
          curve: "catmull-rom",
        },
      ),
      Plot.line(_getMonthlyTempData(2024), {
        x: "month",
        y: "y",
        stroke: colors[2024],
        strokeWidth: 3,
        curve: "catmull-rom",
      }),
      Plot.line(_getMonthlyTempData(2025), {
        x: "month",
        y: "y",
        stroke: colors[2025],
        strokeWidth: 3,
        curve: "catmull-rom",
      }),
    ],
  });

  render_plot(targetElement, plot);
}

function draw_temp_plot2(
  targetElement,
  {
    station = "belgium",
    value = "avg",
    ylabel = "",
    marginLeft = 50,
    avg_start_year = 1955,
  } = {},
) {
  const width = targetElement.getBoundingClientRect().width;
  const height = Math.min(400, width * 0.8);

  // find which label should go above or below the line
  const y_accessor =
    value == "avg" ? (d) => (d.Tmin + d.Tmax) / 2 : (d) => d[value];

  function combine_perc_data(p1, p2) {
    return d3
      .zip(
        d3.sort(monthly_data[station][p1], (d) => d.month),
        d3.sort(monthly_data[station][p2], (d) => d.month),
      )
      .filter((d) => d[0].month > 0)
      .map((d) => ({
        date: new Date(2024, d[0].month - 1, 15),
        y1: y_accessor(d[0]),
        y2: y_accessor(d[1]),
      }));
  }

  console.log(combine_perc_data("p10", "p90"));

  const plot = Plot.plot({
    marginLeft,
    width,
    height,
    x: {
      label: null,
    },
    y: {
      label: ylabel,
    },

    marks: [
      Plot.areaY(combine_perc_data("p10", "p90"), {
        x: "date",
        y1: "y1",
        y2: "y2",
        curve: "catmull-rom",
        fillOpacity: 0.1,
      }),
      Plot.areaY(combine_perc_data("p20", "p80"), {
        x: "date",
        y1: "y1",
        y2: "y2",
        curve: "catmull-rom",
        fillOpacity: 0.1,
      }),
      Plot.areaY(combine_perc_data("p30", "p70"), {
        x: "date",
        y1: "y1",
        y2: "y2",
        curve: "catmull-rom",
        fillOpacity: 0.1,
      }),
      Plot.areaY(combine_perc_data("p40", "p60"), {
        x: "date",
        y1: "y1",
        y2: "y2",
        curve: "catmull-rom",
        fillOpacity: 0.1,
      }),
      Plot.line(
        data[station][2024],
        Plot.windowY(30, {
          x: (d) => new Date(`2024-${d["day"]}`),
          y: y_accessor,
          stroke: colors[2024],
          strokeWidth: 3,
        }),
      ),
      Plot.line(
        data[station][2025],
        Plot.windowY(30, {
          x: (d) => new Date(`2024-${d["day"]}`),
          y: y_accessor,
          stroke: colors[2025],
          strokeWidth: 3,
        }),
      ),
    ],
  });

  render_plot(targetElement, plot);
}
