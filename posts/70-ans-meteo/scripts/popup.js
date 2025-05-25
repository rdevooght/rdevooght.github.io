class RecordPopup extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.max_width = 800;
  }

  connectedCallback() {
    this.date = this.getAttribute("date") || "2024-01-01";

    this.render();
    this.setupListeners();
  }

  static get observedAttributes() {
    return ["date"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      if (name === "date") {
        this.date = newValue;
      }
      this.render();
      this.setupListeners();
    }
  }

  displayRecord(record, showReason = true) {
    let locality = "";
    if (record.level === "station") {
      locality = `${record.station}: `;
    }

    const reason = showReason ? `${record.text}: ` : "";

    const formatter = new Intl.NumberFormat("fr-BE", {
      maximumSignificantDigits: 3,
    }).format;
    return `${locality}${reason}${formatter(record.value)}${record.units}`;
  }

  renderRecordsList(records) {
    // sort records by priority and value
    records.sort((a, b) => b.value - a.value);
    records.sort((a, b) => b.priority - a.priority);

    // Group records by their record value
    const groupedRecords = records.reduce((groups, record) => {
      if (!groups[record.text]) {
        groups[record.text] = [];
      }
      groups[record.text].push(record);
      return groups;
    }, {});

    return Object.entries(groupedRecords)
      .map(([recordText, records]) => {
        // If there's only one record, display it as before
        if (records.length === 1) {
          return `<li>${this.displayRecord(records[0])}</li>`;
        }

        // If there are multiple records, display them in a list
        return `<li>${recordText}:
          <ul>
            ${records.map((record) => `<li>${this.displayRecord(record, false)}</li>`).join("")}
          </ul>
        </li>`;
      })
      .join("");
  }

  renderRecordsGroup(records, { level } = {}) {
    const filter = (d) => d.level === level;

    const filteredRecords = records.filter(filter);
    if (filteredRecords.length === 0) {
      return "";
    }

    if (level === "belgium") {
      if (filteredRecords.length === 1) {
        return `<p>${this.displayRecord(filteredRecords[0])}</p>`;
      } else {
        return `
          <ul>
            ${this.renderRecordsList(filteredRecords)}
          </ul>
        `;
      }
    } else {
      return `
      <details>
        <summary>Afficher les records locaux (${filteredRecords.length})</summary>
        <ul>
          ${this.renderRecordsList(filteredRecords)}
        </ul>
      </details>
      `;
    }
  }

  render() {
    const styles = `
      :host {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 999;
      }

      .overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
      }

      .popup {
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 80%;
        max-width: ${this.max_width}px;
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        padding: 20px;
        max-height: 70vh;
        overflow-y: auto;
      }

      .close-btn {
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        border: none;
        font-size: 1.8rem;
        line-height: 1;
        cursor: pointer;
        color: #666;
      }

      .close-btn:hover {
        color: #000;
      }

      ul {
        list-style: disc; /* More standard than circle for top level */
        padding-left: 1.5em; /* Add left padding for indentation */
        margin: 0.5em 0; /* Add some vertical spacing */
      }

      ul ul { /* Nested lists */
        list-style: circle; /* Second level gets circles */
        margin: 0.25em 0; /* Slightly less vertical spacing for nested lists */
      }

      details {
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 5px;
          margin-bottom: 10px;
          background-color: whitesmoke;
      }

      details summary {
          cursor: pointer;
          font-weight: bold;
      }

      h1 {
        margin-top: 0;
      }

      .graph_title {
      font-size: 0.9em;
      font-weight: light;
      font-style: italic;
      margin-bottom: 0em;
      }

      div.plot {
      width: 100%;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin: 1em 0;
      }
      th, td {
        padding: 8px;
        border: 1px solid #ddd;
        text-align: right;
      }
      th { background-color: #f0f0f0; }
      td:first-child { text-align: left; }

    `;

    const dateStr = new Date(this.date).toLocaleDateString("fr-BE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const dayMonthStr = new Date(this.date).toLocaleDateString("fr-BE", {
      month: "long",
      day: "numeric",
    });

    const [year, month, day] = this.date.split("-").map(Number);
    const dayRecords = getRecords(year, month, day);
    const daily_data = getDaily(year, month, day);

    const recordsShortcut = (data) => {
      return (
        this.renderRecordsGroup(data, { level: "belgium" }) +
        this.renderRecordsGroup(data, { level: "station" })
      );
    };

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="overlay">
        <div class="popup">
          <button class="close-btn">×</button>
          <h1>${dateStr}</h1>
          ${this.summaryTable(daily_data, dayRecords)}
          <h2>Evolution des températures</h2>
          <p class="graph_title"><span style="border-bottom: 2px solid blue">Minimums</span> et <span style="border-bottom: 2px solid red">maximums</span> de température pour un ${dayMonthStr}</p>
          <div class="plot" id="temp_plot"></div>
          <h2>Précipitations</h2>
          <p class="graph_title">mm de précipitations un ${dayMonthStr}</p>
          <div class="plot" id="rain_plot"></div>
          ${dayRecords.length > 0 ? `<h2>Records atteinds en ${year}</h2>` : ""}
          ${recordsShortcut(dayRecords)}
        </div>
      </div>
    `;

    this.renderPlots(daily_data);
  }

  summaryTable(daily_data, dayRecords) {
    const [year, month, day] = this.date.split("-").map(Number);

    // Get averages from getDayDataAndDev
    const dayStats = getDayDataAndDev(year, month, day);

    // Format values
    const formatter = new Intl.NumberFormat("fr-BE", {
      maximumSignificantDigits: 3,
    }).format;

    // Get current day's data
    const currentDay = daily_data.find((d) => d.thisYear);

    // Check for records
    const hasMaxTempRecord = dayRecords.some(
      (r) =>
        r.period === "date" &&
        r.level === "belgium" &&
        r.record.includes("température maximale"),
    );
    const hasMinTempRecord = dayRecords.some(
      (r) =>
        r.period === "date" &&
        r.level === "belgium" &&
        r.record.includes("température minimale"),
    );
    const hasRainRecord = dayRecords.some(
      (r) => r.type === "rain" && r.period === "date" && r.level === "belgium",
    );

    // Calculate historical min/max using d3
    const minMaxTemp = {
      max: {
        min: d3.min(daily_data, (d) => d.max_temps),
        max: d3.max(daily_data, (d) => d.max_temps),
      },
      min: {
        min: d3.min(daily_data, (d) => d.min_temps),
        max: d3.max(daily_data, (d) => d.min_temps),
      },
      precip: {
        min: d3.min(daily_data, (d) => d.precip_quantity),
        max: d3.max(daily_data, (d) => d.precip_quantity),
      },
    };

    const dayMonthStr = new Date(this.date).toLocaleDateString("fr-BE", {
      month: "long",
      day: "numeric",
    });

    return `
      <table>
        <tr>
          <th></th>
          <th>${year}</th>
          <th>Moyenne 1955-2024<sup>*</sup></th>
          <th>Min<sup>*</sup></th>
          <th>Max<sup>*</sup></th>
        </tr>
        <tr>
          <td>Température max</td>
          <td>${hasMaxTempRecord ? "🏆 " : ""}${formatter(currentDay.max_temps)}°C</td>
          <td>${formatter(dayStats.max_temps.avg)}°C</td>
          <td>${formatter(minMaxTemp.max.min)}°C</td>
          <td>${formatter(minMaxTemp.max.max)}°C</td>
        </tr>
        <tr>
          <td>Température min</td>
          <td>${hasMinTempRecord ? "🏆 " : ""}${formatter(currentDay.min_temps)}°C</td>
          <td>${formatter(dayStats.min_temps.avg)}°C</td>
          <td>${formatter(minMaxTemp.min.min)}°C</td>
          <td>${formatter(minMaxTemp.min.max)}°C</td>
        </tr>
        <tr>
          <td>Précipitations</td>
          <td>${hasRainRecord ? "🏆 " : ""}${formatter(currentDay.precip_quantity)}mm</td>
          <td>${formatter(dayStats.precip_quantity.avg)}mm</td>
          <td>${formatter(minMaxTemp.precip.min)}mm</td>
          <td>${formatter(minMaxTemp.precip.max)}mm</td>
        </tr>
      </table>
      <p><small><sup>*</sup> Pour un ${dayMonthStr}</small></p>
      `;
  }

  renderPlots(data) {
    // group max, min, current year and average into the specials array
    function tickAndText(val, text, dy, color, strokeWidth) {
      return [
        Plot.tickX([val], {
          x: (d) => d,
          stroke: color,
          strokeWidth,
        }),
        Plot.text([val], {
          x: (d) => d,
          text: (d) => text,
          fontSize: 10,
          dy,
          lineAnchor: "bottom",
          textAnchor: "middle",
        }),
      ];
    }

    const width = Math.min(window.innerWidth - 40, this.max_width - 40);
    function makeTempEvolutionPlot(dest) {
      const k = 15;

      const min_temps = data.map((d) => ({
        date: d.date,
        temp: d.min_temps,
        text: "Temp. min.",
      }));
      const max_temps = data.map((d) => ({
        date: d.date,
        temp: d.max_temps,
        text: "Temp. max.",
      }));
      const all_temps = [...min_temps, ...max_temps];

      const plot = Plot.plot({
        width: width,
        y: {
          label: `(°C)`,
          grid: true,
        },
        marks: [
          Plot.dot(data, {
            x: "date",
            y: "max_temps",
            stroke: "#fc7e7e",
          }),
          Plot.dot(data, {
            x: "date",
            y: "min_temps",
            stroke: "#7e7efc",
          }),
          Plot.linearRegressionY(data, {
            x: "date",
            y: "max_temps",
            stroke: "red",
          }),
          Plot.linearRegressionY(data, {
            x: "date",
            y: "min_temps",
            stroke: "blue",
          }),
          Plot.dot(
            data.filter((d) => d.thisYear),
            {
              x: "date",
              y: "max_temps",
              stroke: "red",
              fill: "red",
            },
          ),
          Plot.dot(
            data.filter((d) => d.thisYear),
            {
              x: "date",
              y: "min_temps",
              stroke: "blue",
              fill: "blue",
            },
          ),
          Plot.tip(
            all_temps,
            Plot.pointer({
              x: "date",
              y: "temp",
              title: (d) =>
                `${d.date.toLocaleDateString("fr-BE", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}\n${d.text}: ${d.temp}°C`,
            }),
          ),
        ],
      });

      dest.appendChild(plot);
    }

    function makeBeeswarmPlot(
      key,
      dest,
      { showMin = true, units = "", label = "", domain = null } = {},
    ) {
      const plot = Plot.plot({
        width: width,
        height: 300,
        color: {
          type: "diverging",
          scheme: "BuRd",
        },
        x: {
          label: `${label} (${units})`,
        },
        marks: [
          Plot.dotX(
            d3.sort(data, (a, b) => b.thisYear - a.thisYear),
            Plot.dodgeY("bottom", {
              x: key,
              fill: (d) => (d.thisYear ? "blue" : "gray"),
              r: 5,
              channels: {
                date: (d) =>
                  d.date.toLocaleDateString("fr-BE", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }),
              },
              tip: true,
            }),
          ),
        ],
      });

      dest.appendChild(plot);
    }

    function makeTickPlot(
      key,
      dest,
      { showMin = true, units = "", label = "", domain = null } = {},
    ) {
      console.log(width);

      const specials = [];
      const positions = []; // Array to track positions for collision detection
      const proximityThreshold = 2; // Threshold to determine if values are too close

      const current = data.filter((d) => d.thisYear)[0];
      positions.push(current[key]);
      specials.push(
        tickAndText(current[key], `${current.year}`, -20, "blue", 3),
      );

      const max = getMax(data, (d) => d[key]);
      if (max.year != current.year) {
        // Check if max value is close to any existing position
        const dy = positions.some(
          (pos) => Math.abs(pos - max[key]) < proximityThreshold,
        )
          ? -30
          : -20;
        positions.push(max[key]);
        specials.push(tickAndText(max[key], `${max.year}`, dy, "black", 2));
      }

      const min = getMax(data, (d) => -d[key]);
      if (showMin && min.year != current.year) {
        // Check if min value is close to any existing position
        const dy = positions.some(
          (pos) => Math.abs(pos - min[key]) < proximityThreshold,
        )
          ? -30
          : -20;
        positions.push(min[key]);
        specials.push(tickAndText(min[key], `${min.year}`, dy, "black", 2));
      }

      const average =
        data.reduce((acc, curr) => acc + curr[key], 0) / data.length;

      // Check if average value is close to any existing position
      const avgDy = positions.some(
        (pos) => Math.abs(pos - average) < proximityThreshold,
      )
        ? -30
        : -20;
      specials.push(tickAndText(average, "Moyenne", avgDy, "red", 3));

      const plot = Plot.plot({
        width: width,
        marginTop: 40,
        color: {
          type: "diverging",
          scheme: "BuRd",
        },
        x: {
          label: `${label} (${units})`,
          domain: domain || [min[key], max[key]],
        },
        marks: [
          Plot.tickX(data, {
            x: key,
            stroke: key,
          }),
          ...specials,
          Plot.tip(
            data,
            Plot.pointerX({
              x: key,
              title: (d) => `${d.year}: ${d[key]} ${units}`,
            }),
          ),
        ],
      });

      dest.appendChild(plot);
    }

    makeTempEvolutionPlot(this.shadowRoot.querySelector("#temp_plot"));
    makeBeeswarmPlot(
      "precip_quantity",
      this.shadowRoot.querySelector("#rain_plot"),
      {
        showMin: false,
        label: "Précipitation",
        units: "mm",
      },
    );
  }

  setupListeners() {
    this.shadowRoot
      .querySelector(".close-btn")
      .addEventListener("click", () => {
        this.hide();
      });

    this.shadowRoot.querySelector(".overlay").addEventListener("click", (e) => {
      if (e.target === this.shadowRoot.querySelector(".overlay")) {
        this.hide();
      }
    });
  }

  show() {
    this.style.display = "block";
  }

  hide() {
    this.style.display = "none";
  }
}

customElements.define("record-popup", RecordPopup);

// --- Popup Logic ---
function setupPopup() {
  const popup = document.querySelector("record-popup");
  const popupRecords = document.getElementById("popup-records");

  document
    .getElementById("calendar-container")
    .addEventListener("click", (event) => {
      const path = event.composedPath();
      const dayElement = path.find(
        (el) =>
          el.classList &&
          el.classList.contains("day") &&
          el.classList.contains("showPopup") &&
          el.hasAttribute("data-date"),
      );

      if (dayElement) {
        const date = dayElement.getAttribute("data-date");

        popup.setAttribute("date", date);

        popup.show();
      }
    });
}
