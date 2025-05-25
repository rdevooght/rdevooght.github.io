function draw_summary_plot() {
  const div = document.querySelector("#summary_plot");

  const width = div.getBoundingClientRect().width;

  const direction = {
    hot: 1,
    dry: 1,
    cold: -1,
    rain: -1,
    wet: -1,
  };

  let color_scale = { domain: [], range: [] };
  for (const type in recordsTypes) {
    color_scale.domain.push(type);
    color_scale.range.push(recordsTypes[type].c2);
  }

  const plot = Plot.plot({
    width,
    color: color_scale,
    y: {
      ticks: 0,
    },
    marks: [
      Plot.rectY(records_summary, {
        x: (d) => new Date(d.year, 0, 1),
        y: (d) => direction[d.type] * d.count,
        // fy: "type",
        fill: "type",
        interval: "year",
        channels: {
          type: (d) => `${recordsTypes[d.type].desc}`,
          annee: (d) => `${d.year}`,
          records: (d) => d.count,
        },
        tip: {
          format: {
            type: true,
            annee: true,
            records: true,
            fill: false,
            x: false,
            y: false,
          },
        },
      }),
      Plot.gridY({ stroke: "white", strokeOpacity: 0.3 }),
    ],
  });
  div.append(plot);

  // add legend
  let legendHtml = "";
  for (const type in recordsTypes) {
    legendHtml += `<li><span class="legend-icon" style="background-color: ${recordsTypes[type].c2}"></span>${recordsTypes[type].desc}</li>`;
  }
  document.querySelector("#summary_plot_legend").innerHTML = legendHtml;
}
