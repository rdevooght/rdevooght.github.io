var raw_yearly_data_no_pres = {"2014":{"F":63236,"M":264661},"2015":{"F":141265,"M":739295},"2016":{"F":283882,"M":937642},"2017":{"F":170858,"M":803889},"2018":{"F":293718,"M":823129},"2019":{"F":166274,"M":442851},"2020":{"F":196220,"M":599673},"2021":{"F":182315,"M":417339}};
var raw_yearly_data = {"2014":{"F":63236,"M":352984},"2015":{"F":141265,"M":1051089},"2016":{"F":283882,"M":1285445},"2017":{"F":170858,"M":1178282},"2018":{"F":293718,"M":1382808},"2019":{"F":166274,"M":886643},"2020":{"F":196220,"M":917297},"2021":{"F":182315,"M":637687}};
function raw_to_Array(object) {
  var a = [];
  for (var year in object) {
    a.push({
      year: year,
      ratio: object[year].F / (object[year].F + object[year].M) * 100,
      id: `year_${year}`
    });
  }
  return a;
}
var yearly_data = raw_to_Array(raw_yearly_data);
var yearly_data_no_pres = raw_to_Array(raw_yearly_data_no_pres);

var parti_std_casing = {
  'ps':'PS',
  'mr':'MR',
  'ptb':'PTB',
  'ecolo':'ECOLO',
  'cdh':'cdH',
  'wallonie insoumise':'Wallonie Insoumise',
  'dieranimal':'DierAnimal',
  'collectif citoyen':'Collectif Citoyen',
  'turquoise':'Turquoise',
  'listes destexhe':'Listes Destexhe',
  'défi':'DéFI',
  'parti populaire':'Parti Populaire',
  'nation':'Nation',
  'agir':'Agir',
  'demain':'Demain',
  'pcb':'PCB',
  'la droite':'La Droite',
  'referendum':'Referendum'
};


/* Settings */
var transition_duration = 1000;
var dichotomy_colors = {
  'F': '#813bb0',
  'M': '#cda318',
};
var default_faded_opacity = 0.2;

/* Styling and sizing */
var viewport_width = document.documentElement.clientWidth;
var viewport_height = document.documentElement.clientHeight;
var w = viewport_width;
var h = viewport_height;
var scaling_factor = (w - 300)/2400 + 0.5;
var min_radius = 1*scaling_factor, default_radius = 5*scaling_factor, max_radius = 100*scaling_factor;
var small_font_size = 9, font_size = 10, big_font_size = 15;
if (w > 768) {
  small_font_size = 16;
  font_size = 16;
  big_font_size = 24;
}
var pop_size = (w > 768) ? 3000 : 1500;

d3.selectAll('.step').style('min-height', function() {
  var classes = this.className.split(' ');
  var height = viewport_height;
  for (c of classes) {
    if (c.match(/h\d+/)) {
      height = viewport_height * Number(c.slice(1)) / 100;
      break;
    }
  }
  return `${height}px`;
})

d3.selectAll('.step_text p').each(function() {
  var classes = this.className.split(' ');
  var selection = d3.select(this);
  for (c of classes) {
    if (c.match(/m[btlrvh]\d+/)) {
      if (c[1] == 'b') {
        selection.style('margin-bottom', `${viewport_height * Number(c.slice(2)) / 100}px`);
      }
      else if (c[1] == 't') {
        selection.style('margin-top', `${viewport_height * Number(c.slice(2)) / 100}px`);
      }
      else if (c[1] == 'l') {
        selection.style('margin-left', `${viewport_width * Number(c.slice(2)) / 100}px`);
      }
      else if (c[1] == 'r') {
        selection.style('margin-right', `${viewport_width * Number(c.slice(2)) / 100}px`);
      }
      else if (c[1] == 'v') {
        selection.style('margin-top', `${viewport_height * Number(c.slice(2)) / 100}px`);
        selection.style('margin-bottom', `${viewport_height * Number(c.slice(2)) / 100}px`);
      }
      else if (c[1] == 'h') {
        selection.style('margin-left', `${viewport_width * Number(c.slice(2)) / 100}px`);
        selection.style('margin-right', `${viewport_width * Number(c.slice(2)) / 100}px`);
      }
    }
  }
})

d3.selectAll('.step_text h1').each(function() {
  var selection = d3.select(this);
  var title_height = this.getBoundingClientRect().height;
  var margin = (viewport_height - title_height) / 2;
  
  selection.style('margin-top', `${margin}px`);
  selection.style('margin-bottom', `${margin}px`);
})

// Size of SVG element depends on screen size
var std_limits = {min_x: 33, max_x: 100, min_y: 0, max_y: 100};
if (viewport_width < viewport_height) {
  std_limits.min_x = 0
  std_limits.max_y = 80
}

// Show warning for small screens
// if (viewport_width > 960) {
//   d3.select('#small_screen_warning').remove();
// }

// Create the svg element
var svg = d3.select("#vis svg")
  .attr("viewBox", `0 0 ${w} ${h}`)
  .attr("preserveAspectRatio", "none")

var chart = svg.append('g').attr('id', 'historical_chart');
var bubbles = svg.append('g').attr('id', 'bubbles');
var annotations = svg.append('g').attr('id', 'annotations');


var step = {
  current_progress: null,
  progressive: false,
  progress: function(progress) {},
  show: function() {},
  leave: function() {},
};

/**
 * Returns the role of a candidate
 * @param {candidate object} candidate 
 * @returns 
 */
function role(candidate) {
  if (candidate.last_name == 'Marcourt')
    return 'Président du parlement';
  if (candidate.group_president)
    return `Président de groupe (${candidate.parti})`;
  if (candidate.mandates.includes('ministre'))
    return `Ministre`;
  
  return 'Membre du parlement';
}

/**
 * create_full_population takes a list of candidates and a population size.
 * It returns a list of size 'pop_size' of object having at least the following properties:
 * - a random desc
 * - a random color
 * - a random x position between 0 and 100
 * - a random y position between 0 and 100
 * 
 * moreover, for each candidate of the candidates list, 
 * one object in the returned list will have a copy of the properties of that candidate.
 * If pop_size is bigger than the number of candidates, the extra objects in the return list only contain the default properties (desc, color, x and x)
 * If pop_size is smaller than the number of candidates, the returned list will have the same length as the candidates list.
 */
function create_full_population(candidates, pop_size) {
  var full_pop = candidates.map(c => Object.assign(random_person(), c));
  if (pop_size > candidates.length) {
    for (var i = candidates.length; i < pop_size; i++) {
      full_pop.push(Object.assign(random_person(), {id: i}));
    }
  }
  return full_pop;
}

candidates = candidates.map((c, i) => Object.assign(c, {id: i}));
var full_pop = create_full_population(candidates, pop_size)



/* Scales */

var x = d3.scaleLinear().domain([0, 100]).range([0, w]);
var y = d3.scaleLinear().domain([0, 100]).range([0, h]);
var max_words = Math.max(...candidates.map(c => c.nbr_of_words));
var r = d3.scaleSqrt().domain([0, max_words]).range([min_radius, max_radius])

/**
 * The first parameter should either be a value, or a function that can take the second parameter as its parameter.
 * If the first param is a function, the second param is passed to that function and the result is returned.
 * Otherwise the first parameter is returned.
 * @param {*} val_or_function 
 * @param {*} param 
 * @returns 
 */
function eval_if_function(val_or_function, param) {
  if (typeof val_or_function == 'function') {
    return val_or_function(param);
  }
  else {
    return val_or_function;
  }
}

/**
 * Run a force simulation for the nodes in the data Array.
 * update data[subject].x and data[subject].y with the final position of the node in that simulation.
 * @param {Array} data 
 * @param {string} sub_object 
 * @param {function or number} x_attractor 
 * @param {function or number} y_attractor 
 * @param {function or number} radius 
 */
function sim_based_position(data, sub_object, x_attractor, y_attractor, radius) {
  var data_copy = data.map(c => Object.assign(c));
  d3.forceSimulation(data_copy)
    .force("x", d3.forceX(d => x(eval_if_function(x_attractor, d))))
    .force("y", d3.forceY(d => y(eval_if_function(y_attractor, d))))
    .force("collide", d3.forceCollide().radius(d => eval_if_function(radius, d)))
    .force('limit', d3.forceLimit().x0(x(0)).x1(x(100)).y0(y(0)).y1(y(100)).radius(d => eval_if_function(radius, d)))
    .tick(150)
    .stop()
  for (var i = 0; i < data.length; i++) {
    data[i][sub_object].x = x.invert(data_copy[i].x);
    data[i][sub_object].y = y.invert(data_copy[i].y);
  }
}

/**
 * Update the bubles visual
 * 
 * @param parent: d3 selection of the parent object containing the bubbles
 * @param data : Array containing the list of bubles and the corresponding data
 * @param id_func : function associating an id to each element of the data array
 * @param color : color value or function returning a color for each element of the data array
 * @param radius : radius value or function returning a radius for each element of the data array
 * @param x : x-position value or function returning a position for each element of the data array
 * @param y : y-position value or function returning a position for each element of the data array
 * @param title : title or function returning a title for each element of the data array
 * @param transition : d3 transition object
 */

 function draw_bubbles(parent, data, id_func, color, radius, x, y, title, transition, opacity=1) {
  parent.selectAll('circle').data(data, id_func)
    .join(
      enter => enter.append('circle')
        .attr('class', id_func)
        .attr('opacity', 0)
        .style("fill", color)
        .attr("r", radius)
        .attr('cx', x)
        .attr('cy', y)
        .call(function (s) {
          s.selectAll('title').remove();
          s.append('svg:title').text(title);
        })
        .call(enter => enter.transition(transition).attr('opacity', opacity)),
        update => update.call(function (s) {
          s.selectAll('title').remove();
          s.append('svg:title').text(title);
        })
        .attr('class', id_func)
        .transition(transition)
        .attr("r", radius)
        .attr('opacity', opacity)
        .style("fill", color)
        .attr("cx", x)
        .attr("cy", y),
      exit => exit.transition(transition)
        .attr('opacity', 0)
        .remove()
    )
}

function draw_annotations(parent, data, id_func, color, x, y, text, anchor, font_size, transition, opacity=1) {
  parent.selectAll('text').data(data, id_func)
  .join(
    enter => enter.append('text')
      .text(text)
      .attr('opacity', 0)
      .attr('x', x)
      .attr('y', y)
      .attr('font-size', font_size)
      .attr('text-anchor', anchor)
      .attr('font-color', color)
      .call(enter => enter.transition(transition).attr('opacity', opacity)),
      update => update
      .text(text)
      .attr('font-size', font_size)
      .attr('text-anchor', anchor)
      .transition(transition)
      .attr('font-color', color)
      .attr('opacity', opacity)
      .attr('x', x)
      .attr('y', y),
    exit => exit.transition(transition)
      .attr('opacity', 0)
      .remove()
  );
}

function draw_background(limit, transition) {
  if (limit < 10) {
    limit = 10;
  }
  svg//.transition(transition)
    .style('background', `linear-gradient(180deg, rgba(249,255,254,1) 0%, rgba(249,255,254,0.95) ${limit-5}%, rgba(249,255,254,0) ${limit+5}%, rgba(249,255,254,0) 100%)`);
}

function step1_maker(full_pop) {
  var speed = 0.02;
  var angle_speed_change = 0.5;

  // Add properties only used by this step under s1
  full_pop = full_pop.map(d => Object.assign(d, {s1: {angle: Math.random()*Math.PI}}));

  var moving_bubbles = Object.create(step);
  

  function launch_random_movement() {
    moving_bubbles.ticker = d3.interval((e) => {
      moving_bubbles.tick();
    }, 200);
  }

  moving_bubbles.show = function() {

    full_pop.map(d => {
      d.x = Math.random()*100;
      d.y = Math.random()*100;
    })

    const t = svg.transition()
      .duration(transition_duration);

    // Draw the bubbles
    draw_bubbles(bubbles, full_pop, d => d.id, d => d.color, default_radius, d => x(d.x), d => y(d.y), d => d.desc.join("\n"), t);
    
    // annotations
    draw_annotations(annotations, []);

    // background
    draw_background(0, t);
      
    t.end().then(function() {launch_random_movement()}, function() {console.log('s1 transition failed')});
  }
  
  // Randomly but smoothly move a single bubble
  function update_position(bubble) {
    bubble.s1.angle = (bubble.s1.angle + (Math.random()-0.5)*angle_speed_change) % Math.PI;
    var dx = speed*Math.cos(bubble.s1.angle);
    var dy = speed*Math.sin(bubble.s1.angle);
    bubble.x = bubble.x + dx;
    bubble.y = bubble.y + dy;
  }

  moving_bubbles.tick = function() {
    bubbles.selectAll('circle').each(update_position)
      .attr("cx", d => x(d.x))
      .attr("cy", d => y(d.y))
  }

  moving_bubbles.leave = function() {
    if (moving_bubbles.ticker) {
      moving_bubbles.ticker.stop();
    }
  }

  return moving_bubbles;
};

/**
 * For each party appearing in the candidates list, determine a position on the 100*100 canvas,
 * such that parties are well spread out on the sreen.
 * 
 * @param {*} candidates 
 * @param {*} limits:  {min_x, max_x, min_y, max_y}
 * 
 * Return an object of {party: {x, y}, }
 */
function determine_parties_positions(candidates, limits) {
  var height = limits.max_y - limits.min_y, width = limits.max_x - limits.min_x;

  var parties = [];
  for (c of candidates) {
    if (!parties.includes(c.parti.toLowerCase())) {
      parties.push(c.parti.toLowerCase())
    }
  }

  if (parties.length != 18) {
    throw new Error(`Wrong list of parties: ${parties}`);
  }

  // spread 18 parties on four lines: 5, 4, 5, 4
  var parties_and_positions = {};
  var spread = [5, 4, 5, 4];
  var y_pad = height / (spread.length + 1);
  var k = 0;
  for (var i = 0; i < spread.length; i++) {
    var x_pad = width / (spread[i] + 1);
    for (var j = 0; j < spread[i]; j++) {
      var x = (j+1) * x_pad;
      var y = (i+1) * y_pad;

      parties_and_positions[parties[k]] = {x: limits.min_x + x, y: limits.min_y + y};

      k++;
    }
  }

  return parties_and_positions;
}

// Determine how far below the center of the party buble should the name be written
function party_name_offset(d, i) {
  var offset = y(d.y) + Math.sqrt(d.count)*default_radius + big_font_size + 2;
  if (d.name.length > 10 && w < 758) {
    offset += i%2*big_font_size;
  }
  return offset
}

var parties_and_positions = determine_parties_positions(full_pop.filter(c => c.status), std_limits);


function candidates_step_maker(full_pop) {

  
  
  var data = full_pop.filter(c => c.status && c.status == 'effectif') // only keep persons who participated in the elections
  .map(c => Object.assign(c, {
    s2: {
      party_x: parties_and_positions[c.parti.toLowerCase()].x,
      party_y: parties_and_positions[c.parti.toLowerCase()].y,
    }
  }));

  sim_based_position(data, 's2', d => d.s2.party_x, d => d.s2.party_y, default_radius);

  


  var candidates_step = Object.create(step);
  

  candidates_step.show = function() {
    

    
    const t = svg.transition()
      .duration(transition_duration);

    // Draw the bubbles
    draw_bubbles(
      bubbles, data, d => d.id, d => d.color, default_radius, d => x(d.s2.x), d => y(d.s2.y), 
      d => `${d.first_name} ${d.last_name}\n${d.parti}`, t
    );
    

    // Write the parties name
    var parties = [];
    for (p in parties_and_positions) {
      parties.push({
        name: parti_std_casing[p], x: parties_and_positions[p].x, y: parties_and_positions[p].y,
        count: data.filter(c => c.parti.toLowerCase() == p).length
      });
    }

    draw_annotations(annotations, parties, d => d.name, 'black', d => x(d.x), party_name_offset,
    d => d.name, 'middle', big_font_size, t);

    // background
    draw_background(75, t);
  }

  return candidates_step;
}

function gendered_candidates_step_maker(full_pop) {

  
  
  var data = full_pop.filter(c => c.status && c.status == 'effectif') // only keep persons who participated in the elections
 


  var gendered_candidates_step = Object.create(step);
  

  gendered_candidates_step.show = function() {
    

    
    const t = svg.transition()
      .duration(transition_duration);

    // Draw the bubbles
    draw_bubbles(
      bubbles, data, d => d.id, d => dichotomy_colors[d.legal_sex], default_radius,
      d => x(d.s2.x), d => y(d.s2.y), 
      d => `${d.first_name} ${d.last_name}\n${d.parti}`, t
    );
    
    // Write the parties name
    var parties = [];
    for (p in parties_and_positions) {
      parties.push({
        name: parti_std_casing[p], x: parties_and_positions[p].x, y: parties_and_positions[p].y,
        count: data.filter(c => c.parti.toLowerCase() == p).length
      });
    }
    draw_annotations(annotations, parties, d => d.name, 'black', d => x(d.x), party_name_offset,
    d => d.name, 'middle', big_font_size, t);

    // background
    draw_background(75, t);
    
  }

  return gendered_candidates_step;
}

function election_results_step_maker(full_pop) {

  
  
  var data = full_pop.filter(c => c.status && c.status == 'effectif') // only keep persons who participated in the elections
  


  var election_results_step = Object.create(step);
  

  election_results_step.show = function() {
    

    
    const t = svg.transition()
      .duration(transition_duration);

    // Draw the bubbles
    draw_bubbles(
      bubbles, data, d => d.id, d => dichotomy_colors[d.legal_sex], default_radius,
      d => x(d.s2.x), d => y(d.s2.y), 
      d => `${d.first_name} ${d.last_name}\n${d.parti}`, t, d => d.elu ? 1 : default_faded_opacity
    );
    
    // annotations
    var parties = [];
    for (p in parties_and_positions) {
      parties.push({
        name: parti_std_casing[p], x: parties_and_positions[p].x, y: parties_and_positions[p].y,
        count: data.filter(c => c.parti.toLowerCase() == p).length
      });
    }
    var winning_parties = ['PS', 'MR', 'ECOLO', 'PTB', 'cdH'];
    draw_annotations(annotations, parties, d => d.name, 'black', d => x(d.x), party_name_offset,
    d => d.name, 'middle', big_font_size, t, d => (winning_parties.includes(d.name))? 1 : default_faded_opacity);

    // background
    draw_background(75, t);
  }
  return election_results_step;
}

function election_results_list_step_maker(full_pop) {

  
  
  var data = full_pop.filter(c => c.elu) // only keep persons who won the elections

  // return an object {x:, y: } giving the position of the ith bubble (out of 75)
  function position_of_bubble(i) {
    var nbr_of_columns = 3;
    padding = 10;

    var col_width = (std_limits.max_x - std_limits.min_x - 2*padding) / nbr_of_columns;
    var row_height = (std_limits.max_y - std_limits.min_y - 2*padding) / Math.ceil(75 / nbr_of_columns);

    var col = Math.floor(i/75*nbr_of_columns);
    var row = i % Math.ceil(75/nbr_of_columns);

    return {
      x: std_limits.min_x + padding + col * col_width,
      y: std_limits.min_y + padding + row * row_height
    };
  }

  for (var i = 0; i < data.length; i++) {
    data[i].s_res_list = position_of_bubble(i);
  }


  var election_results_step = Object.create(step);
  

  election_results_step.show = function() {
    

    
    const t = svg.transition()
      .duration(transition_duration);

    // Draw the bubbles
    draw_bubbles(
      bubbles, data, d => d.id, d => dichotomy_colors[d.legal_sex], default_radius,
      d => x(d.s_res_list.x), d => y(d.s_res_list.y), 
      d => `${d.first_name} ${d.last_name}\n${d.parti}`, t
    );
    
    // annotations
    draw_annotations(annotations, data, d => d.id, 'black', 
      d => x(d.s_res_list.x)+10, d => y(d.s_res_list.y)+5,
      d => (w < 758) ? `${get_initials(d.first_name)} ${d.last_name}` : `${d.first_name} ${d.last_name}`, 'left', small_font_size, t);

    // background
    draw_background(75, t);
  }

  return election_results_step;
}

function hemicycle_step_maker(full_pop) {

  var viewport_width = document.documentElement.clientWidth;
  var viewport_height = document.documentElement.clientHeight;
  var xy_ratio = viewport_width/viewport_height;

  /**
   * Return an array of 75 points ({x: x, y: y}) arranged in a hemicycle
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


    var arcs = [8, 12, 15, 18, 22];
    var hemicycle_points = [];
    for (var i = 0; i < arcs.length; i++) {
      hemicycle_points = hemicycle_points.concat(points_on_arc(inner_radius+i*row_width, arcs[i]));
    }
    hemicycle_points.sort((a,b) => a.angle - b.angle);
    return hemicycle_points.map(d => ({x: d.x/xy_ratio+center_x, y: d.y+center_y, angle: d.angle}));
  }

  hemicycle_points = make_hemicycle(6, 3, 25, 50, xy_ratio);

  // Extract members of parliament and position them
  var pm = full_pop.filter(c => c.member_of_parliament);
  pm.sort((a,b) => {
    var s_index = {F: 1, M: 0};
    return s_index[a.legal_sex] - s_index[b.legal_sex];
  });
  for (var i = 0; i < pm.length; i++) {
    pm[i].s4 = {x: hemicycle_points[i].x, y: hemicycle_points[i].y};
  }

  // Extract ministers and position them
  var ministers = full_pop.filter(c => c.mandates && c.mandates.includes('ministre') && c.last_name != 'Collignon');
  var row_width = 3;
  for (var i = 0; i < ministers.length; i++) {
    ministers[i].s4 = {
      x: 75 + (i%3) * row_width/xy_ratio,
      y: 50 - Math.floor(i / 3) * row_width
    }
  }

  var data = pm.concat(ministers);

  var hemicycle_step = Object.create(step);
  

  hemicycle_step.show = function() {

        
    const t = svg.transition()
      .duration(transition_duration);

    // Draw the bubbles
    draw_bubbles(
      bubbles, data, d => d.id, d => dichotomy_colors[d.legal_sex], default_radius*2,
      d => x(d.s4.x), d => y(d.s4.y), 
      d => `${d.first_name} ${d.last_name}\n${d.parti}`, t
    );
    
    // annotations
    draw_annotations(annotations, []);
    
    // background
    draw_background(0, t);
  }

  return hemicycle_step;


}

function speakers_step_maker(full_pop) {
  
  var limits = std_limits;
  var fourth_width = (limits.max_x - limits.min_x) / 4;

  var data = full_pop.filter(c => c.member_of_parliament || (c.mandates && c.mandates.includes('ministre'))) // only keep persons who won the elections
  .map(c => Object.assign(c, {
    s5: {
      attractor_x: (c.legal_sex == 'F') ? limits.min_x + fourth_width : limits.min_x + 3*fourth_width,
      attractor_y: (limits.min_y + limits.max_y)/2,
    }
  }));

  sim_based_position(data, 's5', d => d.s5.attractor_x, d => d.s5.attractor_y, default_radius*2);


  var speakers_step = Object.create(step);
  

  speakers_step.show = function() {

        
    const t = svg.transition()
      .duration(transition_duration);

    // Draw the bubbles
    draw_bubbles(
      bubbles, data.filter(c => c.last_name != 'Collignon'), d => d.id, d => dichotomy_colors[d.legal_sex], default_radius*2,
      d => x(d.s5.x), d => y(d.s5.y), 
      d => `${d.first_name} ${d.last_name}\n${d.parti}`, t
    );
    
    // annotations
    draw_annotations(annotations, []);

    // background
    draw_background(0, t);
  }

  return speakers_step;
}

function speakers_growing_bubbles_step_maker(full_pop) {
  
  var data = full_pop.filter(c => c.member_of_parliament || (c.mandates && c.mandates.includes('ministre'))) // only keep persons who speak in the parliament
  .map(c => Object.assign(c, {
    s6: {
      r: r(c.nbr_of_words)
    }
  }));

  sim_based_position(data, 's6', d => d.s5.attractor_x, d => d.s5.attractor_y, d => d.s6.r*1.05+0.1);


  var speakers_growing_bubbles_step = Object.create(step);
  

  speakers_growing_bubbles_step.show = function() {

        
    const t = svg.transition()
      .duration(transition_duration);

    // Draw the bubbles
    draw_bubbles(
      bubbles, data, d => d.id, d => dichotomy_colors[d.legal_sex], d => d.s6.r,
      d => x(d.s6.x), d => y(d.s6.y), 
      d => `${d.first_name} ${d.last_name}\n${d.parti}`, t
    );
    
    // annotations
    var top5 = d3.sort(data, d => -d.nbr_of_words).slice(0,5);
    draw_annotations(annotations, top5, d => d.id, 'black', 
    d => x(d.s6.x), d => y(d.s6.y), d => `${get_initials(d.first_name)} ${d.last_name}`, 
    'middle', font_size, t);

    // background
    draw_background(0, t);
  }

  return speakers_growing_bubbles_step;
}

function biggest_speakers_step_maker(full_pop) {

  function determine_area_limits() {
    var w = document.documentElement.clientWidth;
    var h = document.documentElement.clientHeight;

    if (w > h) {
      return {
        min_x: std_limits.min_x+10,
        max_x: std_limits.max_x,
        min_y: std_limits.min_y+20,
        max_y: std_limits.max_y-20,
      }
    }
    else {
      return {
        min_x: std_limits.min_x+10,
        max_x: std_limits.max_x,
        min_y: std_limits.min_y+15,
        max_y: std_limits.max_y-25,
      }
    }
  
  }

  
  
  var limits = determine_area_limits();
  
  var n = 10;
  var bubbles_x_pos = limits.min_x;
  var topn_scale = d3.scaleLinear().domain([0, n-1]).range([limits.min_y, limits.max_y]);

  var data = full_pop.filter(c => c.nbr_of_words) // only keep persons who spoke
  data.sort((a, b) => b.nbr_of_words - a.nbr_of_words)
  data = data.slice(0,n)
    .map((c, i) => Object.assign(c, {
      s7: {
        x: bubbles_x_pos,
        y: topn_scale(i),
        r: r(c.nbr_of_words) / 2,
        role: role(c),
      }
    }));
  
  //console.log(d3.sum(data.map(x => x.nbr_of_words)));

  var biggest_speakers_step = Object.create(step);
  

  biggest_speakers_step.show = function() {
    svg.select('g.pie_chart').remove();

        
    const t = svg.transition()
      .duration(transition_duration);

    // Draw the bubbles
    draw_bubbles(
      bubbles, data, d => d.id, d => dichotomy_colors[d.legal_sex], d => d.s7.r,
      d => x(d.s7.x), d => y(d.s7.y), 
      d => `${d.first_name} ${d.last_name}\n${d.parti}`, t
    );
    
    // Draw the text
    draw_annotations(
      annotations, data, d => d.id, 'black',
      d => x(d.s7.x + 10),  d => y(d.s7.y)+font_size/2, d => `${d.first_name} ${d.last_name}, ${d.s7.role}`,
      'left', font_size, t
    );

    // background
    draw_background(limits.max_y+5, t);
  }

  return biggest_speakers_step;
}

function normal_pm_step_maker(full_pop) {
  
  var data = full_pop.filter(c => c.member_of_parliament || (c.mandates && c.mandates.includes('ministre'))); // only keep persons who speak in the parliament


  var normal_pm_step = Object.create(step);
  

  normal_pm_step.show = function() {

        
    const t = svg.transition()
      .duration(transition_duration);

    // Draw the bubbles
    draw_bubbles(
      bubbles, data, d => d.id, d => dichotomy_colors[d.legal_sex], d => d.s6.r,
      d => x(d.s6.x), d => y(d.s6.y), 
      d => `${d.first_name} ${d.last_name}\n${d.parti}`, t,
      d => (d.member_of_parliament && !d.group_president && d.last_name != 'Marcourt') ? 1 : default_faded_opacity
    );
    
    // annotations
    draw_annotations(annotations, []);

    // background
    draw_background(0, t);
    
  }

  return normal_pm_step;
}

function normal_pm_plot_step_maker(full_pop) {

  var padding = 10;
  var limits = {
    min_x: std_limits.min_x+padding, max_x: std_limits.max_x-padding,
    min_y: std_limits.min_y+2*padding, max_y: std_limits.max_y-2*padding,
  };
  
  var data = full_pop.filter(c => c.member_of_parliament && !c.group_president && c.last_name != 'Marcourt') // only keep simple pm
  .map(c => Object.assign(c, {
    s9: {
      r: r(c.nbr_of_words),
      avg_length: c.nbr_interventions ? c.nbr_of_words / c.nbr_interventions : 0
    }
  }));

  var plot_window = {x0: x(limits.min_x), x1: x(limits.max_x), y0: y(limits.max_y), y1: y(limits.min_y)};
  var max_interventions = Math.max(...data.map(c => c.nbr_interventions));
  var max_avg_length = Math.max(...data.map(c => c.s9.avg_length));
  var interventions_scale = d3.scaleLinear().domain([0, max_interventions]).nice().range([plot_window.x0, plot_window.x1]);
  var avg_length_scale = d3.scaleLinear().domain([0, max_avg_length]).nice().range([plot_window.y0, plot_window.y1]);
  
  var xAxis = g => g
    .attr('transform', `translate(0,${plot_window.y0})`)
    .attr('class', 'pm_plot_axis')
    .call(d3.axisBottom(interventions_scale))
    .call(g => g
      .append('text')
      .text("Nombre d'interventions")
      .attr('x', plot_window.x1)
      .attr('text-anchor', 'end')
      .attr('dy', -10)
      .attr('opacity', 1)
      .attr('font-size', font_size)
      .attr('fill', 'black')
    );
  
  var yAxis = g => g
    .attr('transform', `translate(${plot_window.x0},0)`)
    .attr('class', 'pm_plot_axis')
    .call(d3.axisLeft(avg_length_scale))
    .call(g => g
      .append('text')
      .text('Nombre de mots par intervention')
      .attr('y', plot_window.y1)
      .attr('text-anchor', (w > h) ? 'middle' : 'start')
      .attr('dx', (w > h) ? 0 : -x(padding)+5)
      .attr('dy', -10)
      .attr('opacity', 1)
      .attr('font-size', font_size)
      .attr('fill', 'black')
    );

  var normal_pm_plot_step = Object.create(step);
  

  normal_pm_plot_step.show = function() {
    svg.select('g.pie_chart').remove();

        
    const t = svg.transition()
      .duration(transition_duration);

    // Draw the bubbles
    draw_bubbles(
      bubbles, data, d => d.id, d => dichotomy_colors[d.legal_sex], d => d.s6.r,
      d => interventions_scale(d.nbr_interventions), d => avg_length_scale(d.s9.avg_length), 
      d => `${d.first_name} ${d.last_name}\n${d.parti}`, t
    );
    
    // Draw the axes
    svg.append('svg:g').call(xAxis);
    svg.append('svg:g').call(yAxis);

    // annotations
    draw_annotations(annotations, []);

    // background
    draw_background(70, t);
    
  }

  normal_pm_plot_step.leave = function() {
    svg.selectAll('.pm_plot_axis').remove();
  }

  return normal_pm_plot_step;
}

function avg_pm_plot_step_maker(full_pop) {

  var padding = 10;
  var limits = {
    min_x: std_limits.min_x+padding, max_x: std_limits.max_x-padding,
    min_y: std_limits.min_y+2*padding, max_y: std_limits.max_y-2*padding,
  };
  
  var data = full_pop.filter(c => c.member_of_parliament && !c.group_president && c.last_name != 'Marcourt') // only keep simple pm
  .map(c => Object.assign(c, {
    s10: {
      r: r(c.nbr_of_words),
      avg_length: c.nbr_interventions ? c.nbr_of_words / c.nbr_interventions : 0
    }
  }));

  var plot_window = {x0: x(limits.min_x), x1: x(limits.max_x), y0: y(limits.max_y), y1: y(limits.min_y)};
  var max_interventions = Math.max(...data.map(c => c.nbr_interventions))
  var max_avg_length = Math.max(...data.map(c => c.s10.avg_length))
  var interventions_scale = d3.scaleLinear().domain([0, max_interventions]).nice().range([plot_window.x0, plot_window.x1])
  var avg_length_scale = d3.scaleLinear().domain([0, max_avg_length]).nice().range([plot_window.y0, plot_window.y1])
  
  var xAxis = g => g
    .attr('transform', `translate(0,${plot_window.y0})`)
    .attr('class', 'pm_plot_axis')
    .call(d3.axisBottom(interventions_scale))
    .call(g => g
      .append('text')
      .text("Nombre d'interventions")
      .attr('x', plot_window.x1)
      .attr('text-anchor', 'end')
      .attr('dy', -10)
      .attr('opacity', 1)
      .attr('font-size', font_size)
      .attr('fill', 'black')
    );
  
  var yAxis = g => g
    .attr('transform', `translate(${plot_window.x0},0)`)
    .attr('class', 'pm_plot_axis')
    .call(d3.axisLeft(avg_length_scale))
    .call(g => g
      .append('text')
      .text('Nombre de mots par intervention')
      .attr('y', plot_window.y1)
      .attr('text-anchor', (w > h) ? 'middle' : 'start')
      .attr('dx', (w > h) ? 0 : -x(padding)+5)
      .attr('dy', -10)
      .attr('opacity', 1)
      .attr('font-size', font_size)
      .attr('fill', 'black')
    );

  var averages = [
    {
      legal_sex: 'F',
      nbr_interventions: d3.mean(data.filter(c => c.legal_sex == 'F'), c => c.nbr_interventions),
      avg_length: d3.sum(data.filter(c => c.legal_sex == 'F'), c => c.nbr_of_words) / d3.sum(data.filter(c => c.legal_sex == 'F'), c => c.nbr_interventions),
      id: 'F-2020',
    },
    {
      legal_sex: 'M',
      nbr_interventions: d3.mean(data.filter(c => c.legal_sex == 'M'), c => c.nbr_interventions),
      avg_length: d3.sum(data.filter(c => c.legal_sex == 'M'), c => c.nbr_of_words) / d3.sum(data.filter(c => c.legal_sex == 'M'), c => c.nbr_interventions),
      id: 'M-2020',
    }
  ];

  function average_by_sex(sex) {
    return averages.filter(d => d.legal_sex == sex)[0];
  }

  var F = {
    x: interventions_scale(average_by_sex('F').nbr_interventions),
    y: avg_length_scale(average_by_sex('F').avg_length)
  }

  var M = {
    x: interventions_scale(average_by_sex('M').nbr_interventions),
    y: avg_length_scale(average_by_sex('M').avg_length)
  }

  

  var avg_pm_plot_step = Object.create(step);
  

  avg_pm_plot_step.show = function() {
    svg.select('g.pie_chart').remove();

        
    const t = svg.transition()
      .duration(transition_duration);

    t.on('end', function() {
      // Draw the labels
      var line_length = 20;
      var labels = svg.append('svg:g').attr('class', 'avg_plot_labels');
      labels.append('line')
        .attr('x1', F.x).attr('y1', F.y)
        .attr('x2', F.x - line_length).attr('y2', F.y)
        .attr('stroke', 'black')
      
      labels.append('line')
        .attr('x1', F.x)
        .attr('y1', F.y)
        .attr('x2', F.x)
        .attr('y2', F.y + line_length)
        .attr('stroke', 'black')

      labels.append('line')
        .attr('x1', M.x)
        .attr('y1', M.y)
        .attr('x2', M.x + line_length)
        .attr('y2', M.y)
        .attr('stroke', 'black')

      labels.append('line')
        .attr('x1', M.x)
        .attr('y1', M.y)
        .attr('x2', M.x)
        .attr('y2', M.y - line_length)
        .attr('stroke', 'black')
      
      labels.append('text')
        .attr('x', F.x - line_length).attr('y', F.y)
        .attr('text-anchor', 'end')
        .attr('font-size', font_size)
        .attr('dy', 5)
        .text(`${Math.round(average_by_sex('F').avg_length)} mots`)
      
      labels.append('text')
        .attr('x', F.x).attr('y', F.y + line_length)
        .attr('text-anchor', 'start')
        .attr('font-size', font_size)
        .attr('dy', 15)
        .attr('dx', -5)
        .text(`${Math.round(average_by_sex('F').nbr_interventions)} interventions`)

      labels.append('text')
        .attr('x', M.x + line_length).attr('y', M.y)
        .attr('text-anchor', 'start')
        .attr('font-size', font_size)
        .attr('dy', 5)
        .text(`${Math.round(average_by_sex('M').avg_length)} mots`)

      labels.append('text')
        .attr('x', M.x).attr('y', M.y - line_length)
        .attr('text-anchor', 'start')
        .attr('font-size', font_size)
        .attr('dy', -5)
        .attr('dx', -5)
        .text(`${Math.round(average_by_sex('M').nbr_interventions)} interventions`)
      
      labels.lower();
    });


    // Draw the bubbles
    bubbles.selectAll('circle').data(averages, d => d.id)
      .join(
        enter => enter.append('circle')
          .attr('r', default_radius)
          .attr('opacity', 0)
          .style("fill", d => dichotomy_colors[d.legal_sex])
          .attr('cx', d => interventions_scale(d.nbr_interventions))
          .attr('cy', d => avg_length_scale(d.avg_length))
          .call(enter => enter.transition(t)
            .attr('opacity', 1)
          ),
        update => update
          .transition(t)
          .style("fill", d => dichotomy_colors[d.legal_sex])
          .attr('cx', d => interventions_scale(d.nbr_interventions))
          .attr('cy', d => avg_length_scale(d.avg_length))
          .attr('opacity', 1)
          .attr('r', default_radius),
        exit => exit.transition(t)
          .attr('opacity', 0)
          .attr('cx', d => interventions_scale(average_by_sex(d.legal_sex).nbr_interventions))
          .attr('cy', d => avg_length_scale(average_by_sex(d.legal_sex).avg_length))
          .attr('r', default_radius)
          .remove()
      );
    
    // Draw the axes
    svg.append('svg:g').call(xAxis);
    svg.append('svg:g').call(yAxis);
    
    // annotations
    draw_annotations(annotations, []);
    

    // background
    draw_background(70, t);
    
  }

  avg_pm_plot_step.leave = function() {
    svg.selectAll('.pm_plot_axis').remove();
    svg.selectAll('.avg_plot_labels').remove();
  }

  return avg_pm_plot_step;
}


function speaking_time_step_maker(full_pop) {

  var limits = std_limits;
  var thirds = (limits.max_x - limits.min_x) / 3;

  var total_words = raw_yearly_data[2020].F + raw_yearly_data[2020].M;

  var data = [
    {
      legal_sex: 'M', words: raw_yearly_data[2020].M, id: `M-2020`,
      desc: '', x: limits.min_x + 2*thirds, y: (limits.min_y + limits.max_y)/2, perc: raw_yearly_data[2020].M / total_words * 100
    },
    {
      legal_sex: 'F', words: raw_yearly_data[2020].F, id: 'F-2020',
      desc: '', x: limits.min_x + thirds, y: (limits.min_y + limits.max_y)/2, perc: raw_yearly_data[2020].F / total_words * 100
    },
  ];

  var speaking_time_step = Object.create(step);
  

  speaking_time_step.show = function() {
  
    const t = svg.transition()
      .duration(transition_duration);
    
    draw_bubbles(
      bubbles, data, d => d.id, d => dichotomy_colors[d.legal_sex], d => r(d.words),
      d => x(d.x), d => y(d.y), 
      d => d.desc, t
    );

    draw_annotations(annotations, data, d => d.id, 'black', d => x(d.x), d => y(d.y),
    d => `${d.perc.toPrecision(3)}%`, 'middle', big_font_size, t);

    // background
    draw_background(0, t);
  }

  return speaking_time_step;
}

var time_chart = function(){
  var chart = svg.select('#historical_chart');
  var limits = std_limits;
  var padding = 10;
  var plot_window = {x0: x(limits.min_x+padding), x1: x(limits.max_x-padding), y0: y(limits.max_y-2*padding), y1: y(limits.min_y+2*padding)};
  var year_scale = d3.scaleLinear().domain([2015, 2021]).nice().range([plot_window.x0, plot_window.x1]);
  var extended_year_scale = d3.scaleLinear().domain([2015, 2050]).nice().range([plot_window.x0, plot_window.x1]);
  var speaking_ratio_scale = d3.scaleLinear().domain([0, 60]).nice().range([plot_window.y0, plot_window.y1]);
  
  var short_xAxis = g => g
    .attr('transform', `translate(0,${plot_window.y0})`)
    .call(d3.axisBottom(year_scale).tickValues([2015, 2016, 2017, 2018, 2019, 2020, 2021]).tickFormat(d3.format('.0f')));

  var long_xAxis = g => g
    .attr('transform', `translate(0,${plot_window.y0})`)
    .call(d3.axisBottom(extended_year_scale).tickValues([2015, 2020, 2025, 2030, 2035, 2040, 2045, 2050]).tickFormat(d3.format('.0f')));

  function regression(year) {
    return -2383.45 + 1.1893 * year;
  }
  
  var short_regression_line = d3.line()
    .x(function(d) { return time_chart.year_scale(d); })
    .y(function(d) { return time_chart.speaking_ratio_scale(regression(d)); });
  
  var long_regression_line = d3.line()
    .x(function(d) { return time_chart.extended_year_scale(d); })
    .y(function(d) { return time_chart.speaking_ratio_scale(regression(d)); });

  return {
    chart, limits, padding, plot_window, year_scale, extended_year_scale, 
    speaking_ratio_scale, short_xAxis, long_xAxis,
    regression, short_regression_line, long_regression_line
  };
}()

function speaking_time_evolution_step_maker(full_pop) {

  var data = yearly_data.filter(d => d.year > 2014);
  var data_2020 = yearly_data.filter(d => d.year == 2020)[0];

  var speaking_time_evolution_step = Object.create(step);
  

  speaking_time_evolution_step.show = function() {


        
    const t = svg.transition()
      .duration(transition_duration);


    // Draw the bubbles
    draw_bubbles(
      bubbles, data, d => `F-${d.year}`, dichotomy_colors['F'],
      default_radius, d => time_chart.year_scale(d.year), d => time_chart.speaking_ratio_scale(d.ratio),
      d => `Pourcentage du temps de parole des femmes au parlement wallon en ${d.year}`, t
    );

    // Draw annotations
    draw_annotations(
      annotations, data, d => `F-${d.year}`, dichotomy_colors['F'],
      d => time_chart.year_scale(d.year), d => time_chart.speaking_ratio_scale(d.ratio) - 10,
      d => `${d.ratio.toPrecision(3)}%`, 'middle', font_size, t
    )

    
    // Draw the axes
    select_or_create(time_chart.chart, 'g', [['class', 'plot_axis']]).call(time_chart.short_xAxis);

    // background
    draw_background(70, t);
    
  }

  speaking_time_evolution_step.leave = function() {
    time_chart.chart.select('g.plot_axis').selectChildren().remove();
    time_chart.chart.select('path.regression').selectAll('g').remove();
  }

  return speaking_time_evolution_step;
}

function speaking_time_regression_step_maker(full_pop) {

  var data = yearly_data.filter(d => d.year > 2014);
  var data_2020 = yearly_data.filter(d => d.year == 2020)[0];

  var speaking_time_regression_step = Object.create(step);
  

  speaking_time_regression_step.show = function() {


        
    const t = svg.transition()
      .duration(transition_duration);

    // Draw the bubbles
    draw_bubbles(
      bubbles, data, d => `F-${d.year}`, dichotomy_colors['F'],
      default_radius, d => time_chart.year_scale(d.year), d => time_chart.speaking_ratio_scale(d.ratio),
      d => `Pourcentage du temps de parole des femmes au parlement wallon en ${d.year}`, t
    );

    // Draw annotations
    draw_annotations(
      annotations, data, d => `F-${d.year}`, dichotomy_colors['F'],
      d => time_chart.year_scale(d.year), d => time_chart.speaking_ratio_scale(d.ratio) - 10,
      d => `${d.ratio.toPrecision(3)}%`, 'middle', font_size, t
    )
     

    // Draw regression line
    select_or_create(time_chart.chart, 'path', [['class', 'regression']])
      .attr("d", time_chart.short_regression_line([2015, 2016]))
      .attr("fill", "none")
      .attr("stroke", "gray")
      .attr("stroke-dasharray", "10,10")
      .attr("stroke-width", 1.5)
      .transition(t)
      .attr("d", time_chart.short_regression_line([2015, 2021]));
  

    
    // Draw the axes
    select_or_create(time_chart.chart, 'g', [['class', 'plot_axis']]).call(time_chart.short_xAxis);
    
    // background
    draw_background(70, t);
  }

  speaking_time_regression_step.leave = function() {
    time_chart.chart.select('g.plot_axis').selectChildren().remove();
    time_chart.chart.select('path.regression').selectAll('g').remove();
  }

  return speaking_time_regression_step;
}


function speaking_time_projection_step_maker(full_pop) {

  var year_for_5050 = (50 + 2383.45) / 1.1893;


  var data = yearly_data.filter(d => d.year > 2014);
  data.push({year: year_for_5050, ratio: 50, color: '#66c9cc'});

  var speaking_time_evolution_step = Object.create(step);
  

  speaking_time_evolution_step.show = function() {


        
    const t = svg.transition()
      .duration(transition_duration);

    
    // Draw the bubbles
    draw_bubbles(
      bubbles, data, d => `F-${d.year}`,  d => (d.color !== undefined) ? d.color : dichotomy_colors['F'],
      default_radius, d => time_chart.extended_year_scale(d.year), d => time_chart.speaking_ratio_scale(d.ratio),
      d => `Pourcentage du temps de parole des femmes au parlement wallon en ${d.year}`, t
    );

    // Draw annotations
    draw_annotations(
      annotations, data, d => `F-${d.year}`,  d => (d.color !== undefined) ? d.color : dichotomy_colors['F'],
      d => time_chart.extended_year_scale(d.year), d => time_chart.speaking_ratio_scale(d.ratio) - 10,
      d => `${d.ratio.toPrecision(3)}%`, 'middle', font_size, t
    )
    
      
    // Draw regression line
    select_or_create(time_chart.chart, 'path', [['class', 'regression']])
      .attr("d", time_chart.short_regression_line([2015, 2021]))
      .attr("fill", "none")
      .attr("stroke", "gray")
      .attr("stroke-dasharray", "10,10")
      .attr("stroke-width", 1.5)
      .transition(t)
      .attr("d", time_chart.long_regression_line([2015, 2050]));

    
    // Draw the axes
    select_or_create(time_chart.chart, 'g', [['class', 'plot_axis']]).call(time_chart.short_xAxis)
      .transition(t).call(time_chart.long_xAxis);
    
    // background
    draw_background(70, t);
    
  }

  speaking_time_evolution_step.leave = function() {
    time_chart.chart.select('g.plot_axis').selectChildren().remove();
    time_chart.chart.select('path.regression').remove();
  }

  return speaking_time_evolution_step;
}


function empty_step_maker() {
  
  var empty_step = Object.create(step);
  

  empty_step.show = function() {

    
    const t = svg.transition()
      .duration(transition_duration);

    // Draw the bubbles
    draw_bubbles(bubbles, []);
    
    // annotations
    draw_annotations(annotations, []);
    
  }

  return empty_step;
}


var steps = 
[
  step1_maker(full_pop),
  candidates_step_maker(full_pop),
  gendered_candidates_step_maker(full_pop),
  election_results_step_maker(full_pop),
  election_results_list_step_maker(full_pop),
  hemicycle_step_maker(full_pop),
  speakers_step_maker(full_pop),
  speakers_growing_bubbles_step_maker(full_pop),
  biggest_speakers_step_maker(full_pop),
  normal_pm_step_maker(full_pop),
  normal_pm_plot_step_maker(full_pop),
  avg_pm_plot_step_maker(full_pop),
  speaking_time_step_maker(full_pop),
  speaking_time_evolution_step_maker(full_pop),
  speaking_time_regression_step_maker(full_pop),
  speaking_time_projection_step_maker(full_pop),
  empty_step_maker(),
];


var scroll = scroller()
.container(d3.select('#sections'));

// pass in .step selection as the steps
scroll(d3.selectAll('.step'));


scroll.on('active', function (index) {
  console.log('active: ', index);
  for (s of steps) {
    s.leave();
  }
  steps[index].show();

  // Show legend of step #index
  d3.selectAll('.step').each(function(d, i) {
    d3.select(this).select('.legend')
      .style('display', (i == index) ? 'block' : 'none');
  });
});

d3.select('#sections').style('visibility', 'visible');
