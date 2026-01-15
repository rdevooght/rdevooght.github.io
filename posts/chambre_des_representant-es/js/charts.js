// Based on https://observablehq.com/@d3/line-chart (Copyright 2021 Observable, Inc.)
function timeline(data, {
  x = ([x]) => x, // given d in data, returns the (temporal) x-value
  y = ([, y]) => y, // given d in data, returns the (quantitative) y-value
  width = 640, // outer width, in pixels
  xDomain, // [xmin, xmax]
  yDomain, // [ymin, ymax]
  yLabel, // a label for the y-axis
  xTicks = width / 80, // ticks on the x-axis. Can be a number, a list of values, or a function that will be applied to each data point
  percent = true, // whether to display y-values as percentages
  showYAxis = false, // whether to show the y-axis
  color = "currentColor", // stroke color of line
  strokeLinecap = "round", // stroke line cap of the line
  strokeLinejoin = "round", // stroke line join of the line
  strokeOpacity = 1, // stroke opacity of line
  showLabels = true,
} = {}) {

  // Dimensions
  const margin = {
    top: 20,
    right: 30,
    bottom: 30,
    left: 30,
  };
  const height = width * 0.4;
  const fontSize = (width < 600) ? 14 : 20;
  const strokeWidth = (width < 600) ? 2 : 3;


  // Compute values.
  var getx = (typeof x === 'string') ? d => d[x] : x;
  var gety = (typeof y === 'string') ? d => d[y] : y;
  const X = d3.map(data, getx);
  const Y = d3.map(data, gety);
  const I = d3.range(X.length);


  // Compute default domains.
  if (xDomain === undefined) xDomain = d3.extent(X);
  if (yDomain === undefined) yDomain = [0, d3.max(Y)];

  // Construct scales and axes.
  var xRange = [margin.left, width - margin.right];
  var yRange = [height - margin.bottom, margin.top];

  var yFormat = percent ? d3.format(".0%") : d3.format(".2f");


  const xScale = d3.scaleLinear(xDomain, xRange);
  const yScale = d3.scaleLinear(yDomain, yRange);

  var ticks = undefined;
  if (typeof xTicks === "number") {
    ticks = xScale.ticks(xTicks);
  } else if (typeof xTicks === "function") {
    ticks = d3.filter(X, xTicks);
  } else {
    ticks = xTicks;
  }

  const xAxis = d3.axisBottom(xScale).tickValues(ticks).tickFormat(d3.format('.0f')).tickSizeOuter(0);
  const yAxis = d3.axisLeft(yScale).ticks(height / 40, yFormat);

  // Construct a line generator.
  const line = d3.line()
      .curve(d3.curveLinear)
      .x(i => xScale(X[i]))
      .y(i => yScale(Y[i]));

  const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

  svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .attr('font-size', fontSize)
      .call(xAxis)
      .attr('font-size', fontSize);

  if (showYAxis) {
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(yAxis)
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").clone()
            .attr("x2", width - margin.left - margin.right)
            .attr("stroke-opacity", 0.1))
        .call(g => g.append("text")
            .attr("x", -margin.left)
            .attr("y", 10)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text(yLabel));
  }

  svg.append("path")
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", strokeWidth)
      .attr("stroke-linecap", strokeLinecap)
      .attr("stroke-linejoin", strokeLinejoin)
      .attr("stroke-opacity", strokeOpacity)
      .attr("d", line(I));
  
  if (showLabels) {
    svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize)
        .attr("text-anchor", "middle")
      .selectAll("text")
      .data(d3.filter(I, i => ticks.includes(X[i])))
      .join("text")
        .attr("dy", -fontSize * 0.7)
        .attr("x", i => xScale(X[i]))
        .attr("y", i => yScale(Y[i]))
        .text(i => yFormat(Y[i]))
  }

  return svg.node();
}

/**
 * Finds the best scale to show a list of values as a pack of circles within a given box
 * @param {Array} values: values that will be converted to circles 
 * @param {Array} box: width and height of the box that will contain the circles
 * @param {Array} limits: min and max radius of the circles
 */
 function optimalCircleScale(values, box, limits) {
   
  const total = d3.sum(values), extent = d3.extent(values);
  var box_radius = Math.min(box[0], box[1])/2;
  
  var fit_lower_limit = limits[0]**2 / extent[0];
  var fit_upper_limit = limits[1]**2 / extent[1];
  var fit_box = box_radius**2 / total * 0.75;

  var shift = Math.min(fit_box, fit_upper_limit);
  
  return Object.assign(x => clamp(Math.sqrt(x * shift), limits[0], limits[1]), {scale: shift});
}

/**
 * Run a force simulation for the nodes in the data Array.
 * Returns an array of the length of the data Array, where each element is an object with x and y properties.
 * @param {Array} data 
 * @param {function or number} attractor 
 * @param {function or number} radius 
 * @param {Object} limits: optional object with xMin, xMax, yMin, yMax properties. 
 */
 function sim_based_position(data, attractor, radius, limits, padding) {
  var randx = (d) => Math.random() * (eval_if_function(limits, d).xMax - eval_if_function(limits, d).xMin) + eval_if_function(limits, d).xMin;
  var randy = (d) => Math.random() * (eval_if_function(limits, d).yMax - eval_if_function(limits, d).yMin) + eval_if_function(limits, d).yMin;

  var data_copy = data.map(d => Object.assign(d, {x: randx(d), y: randy(d)}));
  d3.forceSimulation(data_copy)
    .force("x", d3.forceX(d => eval_if_function(attractor, d)[0]))
    .force("y", d3.forceY(d => eval_if_function(attractor, d)[1]))
    .force("collide", d3.forceCollide().radius(d => eval_if_function(radius, d) + padding))
    .force('limit', d3.forceLimit()
                        .x0(d => eval_if_function(limits, d).xMin)
                        .x1(d => eval_if_function(limits, d).xMax)
                        .y0(d => eval_if_function(limits, d).yMin)
                        .y1(d => eval_if_function(limits, d).yMax)
                        .radius(d => eval_if_function(radius, d))
          )
    .tick(250)
    .stop()
  
  return data_copy.map(d => ({x: d.x, y: d.y}));
}


// Based on https://observablehq.com/@d3/bubble-chart (Copyright 2021 Observable, Inc.)
function myBubbleChart(data, { 
  value, // given a node d, returns a quantitative value
  label, // given a leaf node d, returns the display name
  title, // given a node d, returns its hover text
  width = 640, // outer width, in pixels
  height = 400, // outer height, in pixels
  padding = 1, // separation between circles
  color = "#ddd", // fill for leaf circles
  fillOpacity, // fill opacity for leaf circles
  group, // given a node d, returns its group name
  center_groups = true, // whether to center groups
  groupLabel,  // given a group object of the form {name, data, total_value, share}, returns its label
  groupLabelSize = 20, // font size for group labels
  groupLabelHeight = groupLabelSize*2, // height of group labels
  groupLabelColor = "#000", // color for group labels
} = {}) {

  const limits = {xMin: 0, xMax: width, yMin: 0, yMax: height};
  const fontSize = (width < 600) ? 14 : 20;
  const min_radius_for_label = (width < 600) ? 20 : 35;



  const radius_limits = [2, 1000];
  var r = optimalCircleScale(
    data.map(d => eval_if_function(value, d)), 
    [width, groupLabel ? height - groupLabelHeight : height], 
    radius_limits
  );

  if (group) {
    var groups = d3.groups(data, d => eval_if_function(group, d)).map(g => ({
      name: g[0],
      data: g[1],
      total_value: d3.sum(g[1], d => eval_if_function(value, d)),
      share: d3.sum(g[1], d => eval_if_function(value, d)) / d3.sum(data, d => eval_if_function(value, d))
    }));
    var sum_group_radius = d3.sum(groups, g => Math.sqrt(g.total_value));
    var offset = [0, 0];
    var group_centers = new Map();
    var group_limits = new Map();
    for (var g of groups) {
      g.group_radius = Math.sqrt(g.total_value);

      if (width > height) { // horizontal
        g.width = g.group_radius/sum_group_radius*width;
        g.height = groupLabel ? height - groupLabelHeight : height;
      }
      else { // vertical
        g.width = width;
        g.height = groupLabel ? g.group_radius/sum_group_radius*height - groupLabelHeight : g.group_radius/sum_group_radius*height;
      }

      g.limits = {xMin: offset[0], xMax: offset[0] + g.width, yMin: offset[1], yMax: offset[1] + g.height};
      g.center = [(g.limits.xMin + g.limits.xMax)/2, (g.limits.yMin + g.limits.yMax)/2];

      if (width > height) { // horizontal
        offset[0] += g.width;
      }
      else { // vertical
        offset[1] += g.group_radius/sum_group_radius*height;
      }

      if (center_groups) {
        group_scale = optimalCircleScale(g.data.map(d => eval_if_function(value, d)), [g.width, g.height], radius_limits);
        if (group_scale.scale < r.scale) {
          r = group_scale;
        }

        group_centers.set(g.name, g.center);
      }

      group_limits.set(g.name, g.limits);
      
    }
  }
  
  

  const D = d3.sort(data.map(d => ({
    value: eval_if_function(value, d),
    label: eval_if_function(label, d),
    title: eval_if_function(title, d),
    color: eval_if_function(color, d),
    r: r(eval_if_function(value, d)),
    attractor: (group && center_groups) ? group_centers.get(eval_if_function(group, d)) : [width/2, height/2],
    limits: group ? group_limits.get(eval_if_function(group, d)) : limits
  })), d => d.value);
  const P = sim_based_position(D, d => d.attractor, d => d.r, d => d.limits, padding);
  const I = d3.range(data.length);


  const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;")
      .attr("fill", "currentColor")
      .attr("font-size", fontSize)
      .attr("font-family", "sans-serif")
      .attr("text-anchor", "middle");

  const leaf = svg.append('g')
    .selectAll("g")
    .data(I)
    .join("g")
      .attr("transform", i => `translate(${P[i].x},${P[i].y})`);

  leaf.append("circle")
      .attr("fill", i => D[i].color)
      .attr("fill-opacity", fillOpacity)
      .attr("r", i => D[i].r);

  if (title) leaf.append("title")
      .text(i => D[i].title);

  if (label) {
    // A unique identifier for clip paths (to avoid conflicts).
    const uid = `O-${Math.random().toString(16).slice(2)}`;


    leaf.append("clipPath")
        .attr("id", i => `${uid}-clip-${i}`)
      .append("circle")
        .attr("r", i => D[i].r > min_radius_for_label ? D[i].r*2 : 0);

    leaf.append("text")
        .attr("clip-path", i => `url(${new URL(`#${uid}-clip-${i}`, location)})`)
      .selectAll("tspan")
      .data(i => D[i].r > min_radius_for_label ? `${D[i].label}`.split(/\n/g) : [])
      .join("tspan")
        .attr("x", 0)
        .attr("y", (d, i, D) => `${i - D.length / 2 + 0.85}em`)
        .attr("fill-opacity", (d, i, D) => i === D.length - 1 ? 0.7 : null)
        .text(d => d);
  }

  if (groupLabel) {
    
    svg.append('g')
      .attr("font-size", groupLabelSize)
      .selectAll("g")
      .data(groups)
      .join("g")
        .attr("transform", g => `translate(${g.center[0]},${g.limits.yMax + groupLabelHeight/2 + groupLabelSize/2})`)
        .attr('color', g => eval_if_function(groupLabelColor, g))
      .append("text")
      .text(g => groupLabel(g))
  }

  return svg.node();
}

function quantilesChart(data, {
  value, // accessor for the values of the data
  tick, // accessor for the tick values
  group, // accessor for the group values
  groupColor, // function that takes a group value and returns a color
  groupLabel, //  function that takes a group value and returns a label
  marginTop = 20, // top margin, in pixels
  marginRight = 30, // right margin, in pixels
  marginBottom = 30, // bottom margin, in pixels
  marginLeft = 40, // left margin, in pixels
  width = 640, // outer width of chart, in pixels
  height = width/2, // outer height of chart, in pixels
  insetLeft = 0.5, // inset left edge of bar
  insetRight = 0.5, // inset right edge of bar
  xRange = [marginLeft, width - marginRight], // [left, right]
  xPadding = 0.1, // amount of x-range to reserve to separate groups
  tickFormat,
  gPadding = 0.05, // amount of x-range to reserve to separate groups
  yRange = [height - marginBottom, marginTop], // [bottom, top]
  yFormat, // a format specifier string for the y-axis
  yLabel, // a label for the y-axis
}) {
  const ticks = d3.sort([...new Set(d3.map(data, tick))]);
  const groups = [...new Set(d3.map(data, group))];

  const grouped_data = d3.rollup(
    data,
    v => ({
      q25: d3.quantile(v, 0.25, value),
      q50: d3.quantile(v, 0.5, value),
      q75: d3.quantile(v, 0.75, value),
    }),
    tick,
    group,
  );

  var flat_data = [];
  for (const t of ticks) {
    for (const g of groups) {
      flat_data.push({tick: t, group: g, ...grouped_data.get(t).get(g)});
    }
  }

  
  

  // Construct scales and axes.
  const xScale = d3.scaleBand(ticks, xRange).paddingInner(xPadding);
  const gScale = d3.scaleBand(groups, [0, xScale.bandwidth()]).padding(gPadding);
  const yDomain = [0, d3.max(flat_data, d => d.q75)];
  const yScale = d3.scaleLinear(yDomain, yRange);
  const xAxis = d3.axisBottom(xScale).ticks(ticks).tickFormat(tickFormat).tickSizeOuter(0);
  const yAxis = d3.axisLeft(yScale).ticks(height / 40, yFormat);

  const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

  svg.append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(yAxis)
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").clone()
          .attr("x2", width - marginLeft - marginRight)
          .attr("stroke-opacity", 0.1))
      .call(g => g.append("text")
          .attr("x", -marginLeft)
          .attr("y", 10)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .text(yLabel));

  const boxes = svg.append("g")
      .selectAll("g")
      .data(flat_data)
      .join("g")

  boxes.append("line")
      .attr("x1", d => xScale(d.tick) + gScale(d.group) + gScale.bandwidth()/2)
      .attr("x2", d => xScale(d.tick) + gScale(d.group) + gScale.bandwidth()/2)
      .attr("y1", d => yScale(d.q75))
      .attr("y2", d => yScale(d.q25))
      .attr('stroke-width', 2)
      .attr("stroke", d => groupColor(d.group));
  
  boxes.append("circle")
      .attr("cx", d => xScale(d.tick) + gScale(d.group) + gScale.bandwidth()/2)
      .attr("cy", d => yScale(d.q50))
      .attr("fill", d => groupColor(d.group))
      .attr("r", 3);

  boxes.append("title")
      .text(d => `Médiane: ${d3.format('.2s')(d.q50)} mots par séance`);

  svg.append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(xAxis);

  return svg.node();
}

/**
   * Return an array of 150 points ({x: x, y: y}) arranged in a hemicycle
   * @param {float} inner_radius 
   * @param {float} row_width 
   * @param {float} center_x 
   * @param {float} center_y 
   * @returns 
   */
 function make_hemicycle(inner_radius, row_width, center_x, center_y, xy_ratio) {

  /**
   * returns the position of 'nbr_of_points' points on a hemicycle of radius 'radius',
   * as an array of objects {x: x, y: y, angle: angle}
   * @param {float} radius 
   * @param {int} nbr_of_points 
   */
  function points_on_arc(radius, nbr_of_points) {
    var points = [];
    var angle = Math.PI/(nbr_of_points-1);
    for (var i = 0; i < nbr_of_points; i++) {
      points.push({
        x: radius*Math.cos(angle*i),
        y: -radius*Math.sin(angle*i),
        angle: angle*i,
      });
    }
    return points;
  }


  var arcs = [14, 16, 19, 21, 24, 26, 30];
  var hemicycle_points = [];
  for (var i = 0; i < arcs.length; i++) {
    hemicycle_points = hemicycle_points.concat(points_on_arc(inner_radius+i*row_width, arcs[i]));
  }
  hemicycle_points.sort((a,b) => a.angle - b.angle);
  return hemicycle_points.map(d => ({x: d.x/xy_ratio+center_x, y: d.y+center_y, angle: d.angle}));
}

// Based on https://observablehq.com/@d3/bubble-chart (Copyright 2021 Observable, Inc.)
function drawHemicycle(data, { 
  title, // given a node d, returns its hover text
  width = 640, // outer width, in pixels
  height = 400, // outer height, in pixels
  color = "#ddd", // fill for leaf circles
  fillOpacity, // fill opacity for leaf circles
  group, // given a node d, returns its group name
} = {}) {

  const limits = {xMin: 0, xMax: width, yMin: 0, yMax: height};
  const fontSize = (width < 600) ? 14 : 20;
  const min_radius_for_label = (width < 600) ? 20 : 35;
  

  const D = d3.sort(data.map(d => ({
    title: eval_if_function(title, d),
    color: eval_if_function(color, d),
    r: 5,
    group: eval_if_function(group, d)
  })), d => d.group);
  const P = make_hemicycle(50, 20, width/2, height*0.8, width/height);
  const I = d3.range(data.length);


  const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;")
      .attr("fill", "currentColor")
      .attr("font-size", fontSize)
      .attr("font-family", "sans-serif")
      .attr("text-anchor", "middle");

  const leaf = svg.append('g')
    .selectAll("g")
    .data(I)
    .join("g")
      .attr("transform", i => `translate(${P[i].x},${P[i].y})`);

  leaf.append("circle")
      .attr("fill", i => D[i].color)
      .attr("fill-opacity", fillOpacity)
      .attr("r", i => D[i].r);

  if (title) leaf.append("title")
      .text(i => D[i].title);

  return svg.node();
}