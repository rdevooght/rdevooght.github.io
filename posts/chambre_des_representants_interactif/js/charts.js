/**
 * Divides the box delimited by the limits object in the number cells specified by the sections parameter.
 * Returns an array of objects with xMin, xMax, yMin, yMax properties.
 * @param {Object} limits: object with xMin, xMax, yMin, yMax properties. 
 * @param {number} sections: number of sections to divide the box into.
 */
function divideSpace(limits, sections) {
  var width = limits.xMax - limits.xMin;
  var height = limits.yMax - limits.yMin;
  var rows = 1;
  var cols = 1;
  // add rows and cols until there are too many cells
  while (rows * cols < sections) {
    if (width/cols > height/rows) {
      cols++;
    } else {
      rows++;
    }
  }
  // if possible, remove unecessary rows and cols
  while (cols*rows - sections >= rows) {
    cols--;
  } 
  while (cols*rows - sections >= cols) {
    rows--;
  }
  // divide the space into cells
  var cells = [];
  for (var i = 0; i < rows; i++) {
    cols = Math.min(sections, cols);
    for (var j = 0; j < cols; j++) {
      cells.push({
        xMin: limits.xMin + width * j / cols,
        xMax: limits.xMin + width * (j+1) / cols,
        yMin: limits.yMin + height * i / rows,
        yMax: limits.yMin + height * (i+1) / rows
      });
    }
    sections -= cols;
  }

  return cells;
}

function add_or_replace_label(node, {
  min_radius_for_label = 45,
  font_size = 20,
} = {}) {
  // A unique identifier for clip paths (to avoid conflicts).
  const uid = `O-${Math.random().toString(16).slice(2)}`;
        

  node.selectAll('g.label').remove();
  var label = node.append('g').attr('class', 'label');


  label.append("clipPath")
      .attr("id", d => `${uid}-clip-${d.node_id}`)
    .append("circle")
      .attr("r", d => d.r > min_radius_for_label ? d.r*2 : 0);

  label.append("text")
      .style("font-size", `${font_size}px`)
      .attr("clip-path", d => `url(${new URL(`#${uid}-clip-${d.node_id}`, location)})`)
    .selectAll("tspan")
    .data(d => d.r > min_radius_for_label ? `${d.label}`.split(/\n/g) : [])
    .join("tspan")
      .attr('stroke', 'none')
      .attr("x", 0)
      .attr("y", (d, i, D) => `${i - D.length / 2 + 0.85}em`)
      .attr("fill-opacity", (d, i, D) => i === D.length - 1 ? 0.7 : null)
      .text(d => d);
}

function add_or_replace_title(node) {
  // node.selectAll('title').remove();
  // node.append("title")
  //       .text(d => d.title);
  node.selectAll('g.tooltip').remove();
  var tooltip = node.append('g')
                  .attr('class', 'tooltip')
                  .style('display', 'none')
                  .style('z-index', 10)
                  .attr("transform", d => `translate(0,${d.r + 5})`);
  tooltip.append('rect')
        .attr('width', 160)
        .attr('height', d => `${(d.title.split(/\n/).length + 2) * 1.1}em`)
        .attr('x', -80)
        .attr('rx', 10)
        .attr('fill', 'black')
        .attr('fill-opacity', 0.8)
        .attr('stroke', 'none');
  
  tooltip.append("text")
        .attr('stroke', 'none')
        .attr('text-anchor', 'start')
        .attr('fill', 'white')
        .attr("transform", d => `translate(-70,20)`)
        .selectAll("tspan")
        .data(d => d.title.split(/\n/))
        .join("tspan")
          .attr("x", 0)
          .attr("y", (_, i) => `${i * 1.1}em`)
          .attr("font-weight", (_, i) => i ? null : "bold")
          .text(d => d);
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
 * Check if the point is inside the given limits
 * @param {object} point: object with x and y properties 
 * @param {Object} limits: object with xMin, xMax, yMin, yMax properties. 
 */
function is_in_limits(point, limits) {
  return point.x >= limits.xMin && point.x <= limits.xMax && point.y >= limits.yMin && point.y <= limits.yMax;
}

/**
 * Run a force simulation for the nodes in the data Array.
 * Returns an array of the length of the data Array, where each element is an object with x and y properties.
 * @param {Array} data 
 * @param {function or number} attractor 
 * @param {function or number} radius 
 * @param {Object} limits: object with xMin, xMax, yMin, yMax properties. 
 */
 function sim_based_position(data, attractor, radius, limits, padding) {
  var randx = (d) => Math.random() * (eval_if_function(limits, d).xMax - eval_if_function(limits, d).xMin) + eval_if_function(limits, d).xMin;
  var randy = (d) => Math.random() * (eval_if_function(limits, d).yMax - eval_if_function(limits, d).yMin) + eval_if_function(limits, d).yMin;

  // initialize positions
  // only if the position is not already set
  // or if it is set outside the limits
  for (var i = 0; i < data.length; i++) {
    if (!data[i].x || !data[i].y || !is_in_limits(data[i], limits)) {
      data[i].x = randx(data[i]);
      data[i].y = randy(data[i]);
    }
  }
  
  d3.forceSimulation(data)
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
  
}


// Based on https://observablehq.com/@d3/bubble-chart (Copyright 2021 Observable, Inc.)
function myBubbleChart(svg, data, { 
  element_id, // given a node d, returns an id that should be consistent accros visualizations
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
  transition_duration = 1000, // duration of transitions
} = {}) {

  const limits = {xMin: 0, xMax: width, yMin: 0, yMax: height};

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
    }))
    groups = d3.sort(groups, g => g.name);


    var cells = divideSpace(limits, groups.length);

    var group_centers = new Map();
    var group_limits = new Map();

    for (var i = 0; i < groups.length; i++) {
      groups[i].limits = cells[i];
      if (groupLabel) {
        groups[i].limits.yMax -= groupLabelHeight;
      }
      groups[i].width = groups[i].limits.xMax - groups[i].limits.xMin;
      groups[i].height = groups[i].limits.yMax - groups[i].limits.yMin;
      groups[i].center = [
        (groups[i].limits.xMin + groups[i].limits.xMax) / 2,
        (groups[i].limits.yMin + groups[i].limits.yMax) / 2
      ]
      group_scale = optimalCircleScale(
        groups[i].data.map(d => eval_if_function(value, d)), 
        [groups[i].width, groups[i].height], 
        radius_limits
      );
      if (group_scale.scale < r.scale) {
        r = group_scale;
      }

      group_centers.set(groups[i].name, groups[i].center);
      group_limits.set(groups[i].name, groups[i].limits);
      
    }
  }
  
  const D = d3.sort(data.map(d => ({
    raw: d,
    value: eval_if_function(value, d),
    label: eval_if_function(label, d),
    title: eval_if_function(title, d),
    color: eval_if_function(color, d),
    r: r(eval_if_function(value, d)),
    attractor: (group && center_groups) ? group_centers.get(eval_if_function(group, d)) : [width/2, height/2],
    limits: group ? group_limits.get(eval_if_function(group, d)) : limits,
    node_id: eval_if_function(element_id, d),
  })), d => d.value);
  sim_based_position(D, d => d.attractor, d => d.r, d => d.limits, padding);
  const I = d3.range(data.length);

  // Update group labels
  if (groupLabel) {
      
    var groupLabels = svg.select('g.group-labels')
      .attr("font-size", groupLabelSize)
      .selectAll("g")
      .data(groups, g => g.name)
      .join(
        enter => enter.append('g')
                  .attr("transform", g => `translate(${g.center[0]},${g.limits.yMax + groupLabelHeight/2 + groupLabelSize/2})`)
                  .attr('color', g => eval_if_function(groupLabelColor, g))
                  .attr('id', g => 'group-label-' + g.name)
                  .call(box => {
                    box.append("text")
                      .text(g => groupLabel(g))
                    box.append('title')
                      .text("Cliquez pour voir l'évolution")
                  }),
        update => update
                    .attr("transform", g => `translate(${g.center[0]},${g.limits.yMax + groupLabelHeight/2 + groupLabelSize/2})`)
                    .attr('color', g => eval_if_function(groupLabelColor, g))
                    .select("text")
                    .text(g => groupLabel(g)),
        exit => exit.remove()
      )
  }


  // Update bubbles
  const t = svg.transition()
      .duration(transition_duration);

  const leaf = svg.select('g.nodes').raise()
    .selectAll("g")
    .data(D, d => d.node_id)
    .join(
      enter => enter.append('g')
        .attr('class', d => `node_${d.raw.person_id}`)
        .attr('opacity', 0)
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .call(node => {
          node.append('circle')
            .attr("fill", d => d.color)
            .attr("r", d => d.r);
          
          if (title) { add_or_replace_title(node); }
          
          if (label) { add_or_replace_label(node); }
        })
        .call(enter => enter.transition(t).attr('opacity', 1)),
      update => update
        .call(node => {

          if (title) { add_or_replace_title(node); }
          if (label) { add_or_replace_label(node); }

          node.select('circle')
            .transition(t)
            .attr("fill", d => d.color)
            .attr("r", d => d.r);
        })
        .transition(t)
        .attr("transform", d => `translate(${d.x},${d.y})`),
      exit => exit
        .remove()
    )

  // React to mouse events
  leaf.select('circle').on('mouseover', function(e, d) {
    d3.selectAll(`.node_${d.raw.person_id}`)
      .raise()
      .attr('stroke', 'black')
      .attr('stroke-width', 3)
        .select('g.tooltip')
        .style('display', 'block');
  }).on('mouseout', function(e, d) {
    d3.selectAll(`.node_${d.raw.person_id}`)
      .attr('stroke', 'black')
      .attr('stroke-width', 0)
        .select('g.tooltip')
        .style('display', 'none');
  });

  
  
  

  // Update coloring
  function update_colors(color) {
    const t = svg.transition()
      .duration(transition_duration);
    
      leaf.select("circle")
            .transition(t)
            .attr("fill", d => eval_if_function(color, d.raw));
  }

  return Object.assign(svg.node(), {update_colors: update_colors, groupLabels: groupLabels});
}

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
    left: 60,
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
        .call(g => g.selectAll('.tick text')
            .attr('x', -15));
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