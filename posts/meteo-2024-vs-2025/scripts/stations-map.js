/**
 * Draws a map of Belgium with station dots and labels using Observable Plot.
 * Uses pre-formatted station data embedded within the function.
 *
 * @param {HTMLElement} targetElement - The DOM element where the plot should be rendered.
 */
function drawStationsMap(targetElement) {
  if (!targetElement || !(targetElement instanceof HTMLElement)) {
    console.error("Invalid targetElement provided.");
    return;
  }

  const width = Math.round(targetElement.getBoundingClientRect().width / 0.9);
  console.log(width);

  const verticalOffset = 10;
  const horizontalOffset = 8;
  const dotRadius = 5;
  const textStyle = {
    fontSize: 9,
    fill: "black",
    stroke: "white",
    strokeWidth: 0.5,
    x: "longitude",
    y: "latitude",
    text: (d) => `${d.name}\n${d.startYear}`,
  };

  // 3. Create the plot
  const plot = Plot.plot({
    width,
    height: width * 0.8,
    marginLeft: 10,
    marginRight: 10,
    x: {
      ticks: 0,
      label: null,
    },
    y: {
      ticks: 0,
      label: null,
    },
    marks: [
      // Draw Belgium border outline
      Plot.geo(belgiumGeoJson, {
        stroke: "grey",
        fill: "#e8e8e8",
        title: "Belgium",
      }),

      // Draw a dot for each station
      Plot.dot(stations, {
        x: "longitude",
        y: "latitude",
        fill: (d) =>
          stations_with_sun_measure.includes(d.code)
            ? colors.with_sun
            : colors.without_sun,
        stroke: (d) =>
          d.startYear <= 1955 ? colors.old_station : colors.new_station,
        strokeWidth: 1,
        r: dotRadius,
        // Use the original name for the tooltip for potentially more detail
        title: (d) => `${d.name} (${d.startYear})`,
      }),

      // Labels positioned TOP (or default)
      Plot.text(
        stations.filter((d) => d.position === "top" || !d.position), // Filter data
        {
          ...textStyle, // Apply common styles
          dy: -verticalOffset, // Move up
          lineAnchor: "bottom", // Align bottom of text to y - dy
          textAnchor: "middle", // Center horizontally
        },
      ),

      // Labels positioned BOTTOM
      Plot.text(
        stations.filter((d) => d.position === "bottom"), // Filter data
        {
          ...textStyle,
          dy: verticalOffset, // Move down
          lineAnchor: "top", // Align top of text to y + dy
          textAnchor: "middle", // Center horizontally
        },
      ),

      // Labels positioned LEFT
      Plot.text(
        stations.filter((d) => d.position === "left"), // Filter data
        {
          ...textStyle,
          dx: -horizontalOffset, // Move left
          lineAnchor: "middle", // Center vertically
          textAnchor: "end", // Align right edge of text to x - dx
        },
      ),

      // Labels positioned RIGHT
      Plot.text(
        stations.filter((d) => d.position === "right"), // Filter data
        {
          ...textStyle,
          dx: horizontalOffset, // Move right
          lineAnchor: "middle", // Center vertically
          textAnchor: "start", // Align left edge of text to x + dx
        },
      ),

      Plot.tip(
        stations,
        Plot.pointer({
          fontSize: 16,
          x: "longitude",
          y: "latitude",
          title: (d) => `${d.name}`,
        }),
      ),
    ],
  });

  plot.addEventListener("input", (event) => {
    const alpineData = Alpine.$data(document.body);
    alpineData.currently_hovering = plot.value ? plot.value : null;
  });

  // 4. Render the plot to the target element
  targetElement.innerHTML = ""; // Clear previous content
  targetElement.appendChild(plot);
}
