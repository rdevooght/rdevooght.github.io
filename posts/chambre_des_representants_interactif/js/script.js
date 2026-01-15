// Colors: https://coolors.co/813bb0-cda318-7cb4b8-70f8ba-ef6461
// Settings
var gender_colors = {
  'F': '#813bb0',
  'M': '#cda318',
};
var font_dichotomy_colors = {
  'F': '#5a297b',
  'M': '#8f7211',
};

var party_colors = {
  'PS': '#ff0000',
  'Ecolo-Groen': '#99cc33',
  'N-VA': '#f2bd2e',
  'Vlaams Belang': '#ffed00',
  'Open Vld': '#0087dc',
  'MR': '#0047ab',
  'CD&V': '#ff8000',
  'Vooruit': '#e30613',
  'Vooruit / sp.a': '#e30613',
  'sp.a': '#e30613',
  'sp.a-spirit': '#e30613',
  'sp.a+Vl.Pro': '#e30613',
  'cdH': '#ff5919',
  'PVDA-PTB': '#cc0000',
  'PTB-GO!': '#cc0000',
  'DéFI': '#e11482',
  'FDF': '#e11482',
  'DéFI / FDF': '#e11482',
}

var party_grouping = {
  'Vooruit': 'Vooruit / sp.a',
  'sp.a': 'Vooruit / sp.a',
  'sp.a-spirit': 'Vooruit / sp.a',
  'sp.a+Vl.Pro': 'Vooruit / sp.a',
  'PVDA-PTB': 'PVDA-PTB',
  'PTB-GO!': 'PVDA-PTB',
  'DéFI': 'DéFI / FDF',
  'FDF': 'DéFI / FDF',
  'PP': 'Indépendants et autres', 
  'LDD': 'Indépendants et autres', 
  'Vuye&Wouters': 'Indépendants et autres',
  'Onafhank./Indép.': 'Indépendants et autres',
  'FN': 'Indépendants et autres',
  'MLD': 'Indépendants et autres',
}

var default_color = 'gray';

var roles_labels = {
  'president': 'Président·e du parlement',
  'bureau': 'Membres du bureau',
  'government': 'Membres du gouvernement',
  'deputy': 'Député·es (hors président·es)',
  'group president': 'Président·es de groupe',
};

function role_fr(role, gender) {
  function _single_role(role) {
    if (role == 'government') return 'membre du gouvernement';
    if (role == 'bureau') return 'membre du bureau';
    if (role == 'president') {
      if (gender == 'F') return 'présidente';
      else return 'président';
    } 
    if (role == 'deputy') {
      if (gender == 'F') return 'députée';
      else return 'député';
    }
    if (role == 'group president') {
      if (gender == 'F') return 'présidente de groupe';
      else return 'président de groupe';
    }
    return role;
  }

  var res = [];
  for (g of role.split(",")) {
    res.push(_single_role(g.trim()));
  }
  return res.join(', ');
}

/*
  Grouping options
*/
var groupers = [
  {name: 'party', accessor: d => d.main_party, label: 'Partis', colors: party_colors},
  {name: 'gender', accessor: d => d.legal_sex, label: 'Genre', colors: gender_colors, values_label: {F: 'Femmes', M: 'Hommes'}},
  {name: 'role', accessor: d => d.role, label: 'Role', values_label: roles_labels},
  {name: 'majority_opposition', accessor: d => d.majority_opposition, label: 'Majorité / Opposition', values_label: {'majority': 'Majorité', 'opposition': 'Opposition'}},
]

// Add default color scale to groups that don't have special color
for (g of groupers) {
  if (!g.colors) {    
    var scale = d3.scaleOrdinal(d3.schemeCategory10);
    var possible_values = unique_values(d3.map(data.interventions_per_person, g.accessor));
    g.colors = {};
    for (v of possible_values) {
      g.colors[v] = scale(v);
    }
  }

  g.get_color = function(d) {
    d = (typeof d == 'string') ? d : this.accessor(d);
    return this.colors[d] || default_color;
  }
}

function get_group(name) {
  return groupers.find(g => g.name == name);
}
function group_value_label(group, value) {
  group = (typeof group == 'string') ? get_group(group) : group;
  var label = value;
  if (group.values_label) {
    label = group.values_label[value];
  }
  return label;
}
function group_value_key(value) {
  return party_colors[value] ? party_colors[value] : value;
}
function split_cdv_nva(d) {
  if (d.main_party == 'CD&V - N-VA'){
    if (d.associated_parties.split(', ').includes('CD&V')) {
      return 'CD&V';
    }
    else {
      return 'N-VA';
    }
  }
  return d.main_party;
}

function grouped_party_accessor(d) {
  var party = split_cdv_nva(d);
  return party_grouping[party] ? party_grouping[party] : party;
}

/*
  Chart drawing
*/

// check if options are passed in the url
var options = {};
try {
  options = JSON.parse(decodeURI(window.location.search.split('?options=')[1]));
  if (!options) {
    throw new Error('No options');
  }
} catch (error) {
  options = {
    year: 2021,
    group: 'gender',
    coloring: 'default',
    filters: {},
  }
}

// Make url containing options
function get_share_url(with_anchor=true) {
  var url = window.location.protocol + '//' + window.location.hostname + window.location.pathname 
  url += '?options=' + encodeURI(JSON.stringify(options))
  if (with_anchor) url += '#explorer';
  return url;
}

function update_url() {
  history.pushState(options, '', get_share_url(with_anchor=false));
}


function make_data_filter(any_year = false) {
  var filters = [];
  for (var f in options.filters) {
    var accessor = (f == 'party') ? grouped_party_accessor : get_group(f).accessor;

    filters.push({accessor: accessor, values: options.filters[f]});
  }

  function data_filter(d) {
    if (!any_year && d.year != options.year) {
      return false;
    }
    for (var f of filters) {
      if (f.values.indexOf(f.accessor(d)) == -1) {
        return false;
      }
    }
    return true;
  }

  return data_filter;
}

function get_data() {

  var group = get_group(options.group);
  var key = d => d.person_id + '-' + group.accessor(d);

  function merge_records(records) {
    var values = new Map();
    var word_count = 0, interventions = 0;
    for (let r of records) {
      word_count += r.word_count;
      interventions += r.interventions;
      for (let k in r) {
        if (k != 'word_count' && k != 'interventions') {
          if (!values.has(k)) {
            values.set(k, new Map());
          }
          if (values.get(k).has(r[k])) {
            values.get(k).set(r[k], values.get(k).get(r[k]) + r.word_count);
          }
          else {
            values.get(k).set(r[k], r.word_count);
          }
        }
      }
    }

    var result = {}
    result.word_count = word_count;
    result.interventions = interventions;
    for (let k of values.keys()) {
      main = undefined;
      max_value = 0;
      all_values = [];
      for (let v of values.get(k).keys()) {
        if (values.get(k).get(v) > max_value) {
          main = v;
          max_value = values.get(k).get(v);
        }
        all_values.push(v);
      }
      result[k] = main;
      result[k + '_all'] = all_values.join(', ');
    }

    return result;
  }

  var merged_data = [];
  var person_ids = new Set();
  for (let node of d3.rollup(
    d3.filter(data.interventions_per_person, make_data_filter()),
    merge_records,
    key
  )) {
    var node_id = node[0];
    if (!person_ids.has(node[1].person_id)) {
      node_id = node[1].person_id;
      person_ids.add(node[1].person_id);
    }
    merged_data.push({node_id: node_id, ...node[1]});
  }
  
  return merged_data;
}

/**
 * get the percentage of speach time for a given group every year
 */
function get_year_evolution_of_group(group_value) {
  var group = get_group(options.group);
  var accessor = (group_value == 'CD&V' || group_value == 'N-VA') ? split_cdv_nva : group.accessor;
  var words_per_group = d3.flatRollup(
    d3.filter(data.interventions_per_person, make_data_filter(any_year = true)),
    r => d3.sum(r, d => d.word_count),
    d => d.year,
    d => group_value_key(accessor(d))
  );

  
  var words_per_year = d3.rollup(
    words_per_group,
    r => d3.sum(r, d => d[2]),
    d => d[0]
  );

  var res = [];
  var years = [];
  for (let g of words_per_group) {
    if (g[1] == group_value_key(group_value)) {
      res.push({year: g[0], words: g[2], percentage: g[2] / words_per_year.get(g[0])});
      years.push(g[0]);
    }
  }

  for (let y of words_per_year.keys()) {
    if (!years.includes(y)) {
      res.push({year: y, words: 0, percentage: 0});
    }
  }

  return d3.sort(res, d => d.year);
  
}

function get_year_evolution() {
  var group = get_group(options.group);
  var accessor = (group.name == 'party') ? split_cdv_nva : group.accessor;
  var filtered_data = d3.filter(data.interventions_per_person, make_data_filter(any_year = true));
  var words_per_group = d3.rollup(
    filtered_data,
    r => d3.sum(r, d => d.word_count),
    d => d.year,
    d => party_grouping[accessor(d)] || accessor(d)
  );

  var values = unique_values(d3.map(filtered_data, d => party_grouping[accessor(d)] || accessor(d)));

  var result = [];
  for (year of words_per_group.keys()) {
    for (v of values) {
      var words = 0;
      if (words_per_group.get(year).has(v)) {
        words = words_per_group.get(year).get(v);
      }

      result.push({
        year: new Date(`${year}-01-01`), 
        group_value: group_value_label(group, v), 
        words: words,
        color: group.get_color(v),
      });
    }
  }

  return d3.sort(result, d => d.year, d3.ascending);
}

function make_coloring_function() {
  var coloring_group = undefined;
  if (options.coloring == 'default') {
    coloring_group = get_group(options.group);
  } else {
    coloring_group = get_group(options.coloring);
  }

  if (coloring_group.colors) {
    return function(d) {
      var group_name = coloring_group.accessor(d);
      if (group_name in coloring_group.colors) {
        return coloring_group.colors[group_name];
      }
      else if (coloring_group.accessor(d) == 'CD&V - N-VA'){
        return coloring_group.colors[split_cdv_nva(d)];
      }
      return default_color;
    }
  }
  else {
    var scale = d3.scaleOrdinal(d3.schemeCategory10);
    return d => scale(coloring_group.accessor(d));
  }
}

function show_timeline(e, d) {

  e.stopPropagation();
  d3.select('#timeline').style('display', 'block');
  options.show_timeline = d ? d.name : true;
  update_url();
  
  if (d) {
    var timeline_data = get_year_evolution_of_group(d.name);
    var timeline_chart = timeline(timeline_data, {
      x: d => d.year,
      y: d => d.percentage,
      xTicks: x => x % 2 == 1,
      yDomain: [0, 1],
      showYAxis: true,
      width: document.getElementById("timeline-chart").clientWidth,
      color: '#36637c'
    });

    // Construct timeline title
    var title = 'Evolution du temps de parole ';
    if (options.group == 'party') {
      title += 'des membres du parti ' + d.name;
    }
    else if (options.group == 'majority_opposition') {
      title += 'des membres de ';
      title += d.name == 'majority' ? 'la majorité' : "l'opposition";
    }
    else {
      title += 'des ' + group_value_label(get_group(options.group), d.name).toLowerCase();
    }

    d3.select('#timeline-legend').style('display', 'none');

  }
  else {
    var timeline_data = get_year_evolution();
    var colors = d3.rollup(timeline_data, v => v[0].color, d => d.group_value);
    var timeline_chart = StackedAreaChart(timeline_data, {
      x: d => d.year,
      y: d => d.words,
      z: d => d.group_value,
      width: document.getElementById("timeline-chart").clientWidth,
      colors: colors,
    });

    // Construct timeline title
    var title = 'Evolution du temps de parole ';
    if (options.group == 'party') {
      title += 'entre les partis';
    }
    else if (options.group == 'majority_opposition') {
      title += 'entre la majorité et l\'opposition';
    }
    else if (options.group == 'gender') {
      title += 'entre hommes et femmes';
    }
    else if (options.group == 'role') {
      title += 'en fonction du role';
    }

    d3.select('#timeline-legend').style('display', 'flex')
      .selectAll('div')
      .data(colors.keys())
      .join('div')
      .call(div => {
        div.selectAll('span').remove();
        div.append('span')
          .attr('class', 'color-sample')
          .style('background-color', d => colors.get(d));
        div.append('span')
          .attr('class', 'legend-label')
          .text(d => d);
      })
  }

  document.querySelector("#timeline h2").innerHTML = title;
  document.getElementById("timeline-chart").innerHTML = "";
  document.getElementById("timeline-chart").appendChild(timeline_chart);

  // If some filters are active, explain the filters
  if (Object.keys(options.filters).length > 0) {
    function ou_join(list) {
      if (list.length == 1) {
        return list[0];
      }
      return list.slice(0, list.length-1).join(', ') + ' ou ' + list[list.length - 1];
    }

    d3.select('#timeline-active-filters').style('display', 'block')
      .select('ul')
      .selectAll('li')
      .data(Object.keys(options.filters))
      .join('li')
      .text(d => ou_join(d3.map(options.filters[d], v => group_value_label(d, v))));
  }
  else {
    d3.select('#timeline-active-filters').style('display', 'none');
  }
}

function hide_timeline() {
  d3.select('#timeline').style('display', 'none');
  delete options.show_timeline;
  update_url();
}

var chart = undefined;
function draw_chart() {

  update_url();
  var group = get_group(options.group);

  function title(d) {
    var t = `${d.first_name} ${d.last_name}\n`;
    t += `${role_fr(d.role_all, d.legal_sex)} \n`;
    t += `${d.associated_parties} \n`;
    t += `${d3.format('.2s')(d.word_count)} mots en ${options.year}`;
    return t;
  }

  function groupLabel(g) {
    var name = group_value_label(group, g.name);
    return `${name}: ${d3.format('.0%')(g.share)}*`
  }

  var data = get_data();
  if (data.length == 0) {
    d3.select('#empty-data').style('display', 'block');
    d3.select('#chart svg').style('display', 'none');
    return;
  }

  d3.select('#empty-data').style('display', 'none');
  d3.select('#chart svg').style('display', 'block');

  chart = myBubbleChart(svg, data, {
    element_id: d => d.node_id,
    label: d => get_initials(d.first_name) + ' ' + d.last_name,
    title: title,
    value: d => d.word_count,
    group: group.accessor,
    width: width,
    height: height,
    color: make_coloring_function(),
    center_groups: true,
    groupLabel: groupLabel,
  });

  chart.groupLabels
    .style('cursor', 'pointer')  
    .on('click', show_timeline);
}





/*
  Interactions
*/

// add the class "active" to the recieved element
// and remove it from the siblings
function set_active(element) {
  element.parentElement.querySelectorAll(".active").forEach(e => e.classList.remove("active"));
  element.classList.add("active");
}

// Years
var years = d3.range(2007, 2022);
d3.select('#years-selector .buttons')
  .selectAll('button')
  .data(years)
  .join('button')
    .attr('class', 'grouper')
    .classed('active', d => d == options.year)
    .attr('value', d => d)
    .text(d => d)
    .on('click', function() {
      set_active(this);
      options.year = this.value;
      draw_chart();
    });

// Groups
d3.select('#grouper-selector .buttons')
  .selectAll('button')
  .data(groupers)
  .join('button')
    .attr('class', 'grouper')
    .classed('active', d => d.name == options.group)
    .attr('value', d => d.name)
    .text(d => d.label)
    .on('click', function() {
      set_active(this);
      let group = this.value;
      options.group = group;
      draw_chart();
    });



// Filters
var filters = [];
for (g of groupers) {
  var accessor = (g.name == 'party') ? grouped_party_accessor : g.accessor;

  filters.push({
    name: g.name,
    grouper: g,
    label: g.label,
    values: unique_values(d3.map(data.interventions_per_person, accessor)),
  });
}

function check_filters(ul) {
  var group = ul.id.slice(7);
  var selected_options = [];
  var full = true;
  for (let check of ul.querySelectorAll('input')) {
    if (check.checked) {
      selected_options.push(check.name);
    }
    else {
      full = false;
    }
  }

  if (full) {
    delete options.filters[group];
    ul.parentNode.querySelector('a.filter-clear').textContent = 'Tout désélectionner';
  } else {
    options.filters[group] = selected_options;
    ul.parentNode.querySelector('a.filter-clear').textContent = 'Tout sélectionner';
  }
  draw_chart();
}

d3.select('#filters')
  .selectAll('div')
  .data(filters)
  .join('div')
    .attr('class', 'filter-group')
    .call(group => {
      group.append('h4')
        .attr('class', 'filter-label')
        .text(d => d.label);
      
      group.append('a')
        .attr('class', 'filter-clear')
        .text('Tout désélectionner')
        .on('click', function(e) {
          e.stopPropagation();
          if (this.textContent == 'Tout désélectionner') {
            d3.select(this.parentNode).selectAll('input').property('checked', false);
          }
          else {
            d3.select(this.parentNode).selectAll('input').property('checked', true);
          }

          check_filters(this.parentNode.querySelector('ul'));
        });
      
      var select = group.append('ul').attr('id', d => `filter-${d.name}`);
      
      
      select.selectAll('li')
          .data(d => d3.sort(d3.map(d.values, v => ({
            group: d.name, key: v, label: group_value_label(d.grouper, v), color: d.grouper.get_color(v)
          })), d => d.label.toLowerCase(), d3.ascending))
          .join('li')
            .call(li => {
              li.append('input')
                .attr('type', 'checkbox')
                .property('checked', d => {
                  if (!options.filters[d.group]) {
                    return true;
                  } else {
                    return options.filters[d.group].includes(d.key);
                  }
                })
                .attr('name', d => d.key);
              li.append('label')
                .text(d => d.label);
              li.append('span')
                .attr('class', 'color-sample')
                .style('background-color', d => d.color);
            })
            .on('click', function(e) {
              e.stopPropagation();

              var ul = this.parentElement;
              var checkbox = this.querySelector('input');

              if (e.target != checkbox) {

                // if all elements are checked, uncheck them all except the one that was clicked
                // otherwise, just toggle the element that was clicked
                var all_inputs = d3.select(ul).selectAll('input');

                if (all_inputs.filter(':checked').size() == all_inputs.size()) {
                  all_inputs.property('checked', false);
                  checkbox.checked = true;
                }
                else if (all_inputs.filter(':checked').size() == 1 && checkbox.checked) {
                  all_inputs.property('checked', true);
                  checkbox.checked = false;
                }
                else {
                  checkbox.checked = !checkbox.checked;
                }
              }

              check_filters(ul);
            });
      
    });

// Coloring
var coloring_options = [{name: 'default', label: 'Par défaut', values: []}];
for (let f of filters) { coloring_options.push(f); }
d3.select('#coloring-selector .buttons')
  .selectAll('button')
  .data(coloring_options)
  .join('button')
    .attr('class', 'grouper')
    .classed('active', d => d.name == options.coloring)
    .attr('value', d => d.name)
    .text(d => d.label)
    .on('click', function() {
      set_active(this);
      options.coloring = this.value;
      chart.update_colors(make_coloring_function());
    })
    .filter(d => d.values.length > 0)
    .append('ul')
      .attr('class', 'colors-legend')
      .selectAll('li')
      .data(d => d3.sort(d3.map(d.values, v => ({
        group: d.name, key: v, label: group_value_label(d.grouper, v), color: d.grouper.get_color(v)
      })), d => d.label.toLowerCase(), d3.ascending))
      .join('li')
      .call(li => {
        li.append('span')
          .attr('class', 'color-sample')
          .style('background-color', d => d.color);
        li.append('span')
          .text(d => d.label);
      })

d3.selectAll('#coloring-selector .buttons ul')
  .insert('li', ':first-child')
    .text('Légende: ')

// create svg
var width = document.getElementById("chart").clientWidth;
var height = window.innerHeight - document.getElementById("chart").getBoundingClientRect().top + document.getElementById("explorer").getBoundingClientRect().top - 20;
height = Math.max(height, window.innerHeight * 0.7); // make sure the chart is not too small
height = (width < 600) ? window.innerHeight : height;
const svg = d3.select('#chart').append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;")
      .attr("fill", "currentColor")
      .attr("font-size", 10)
      .attr("font-family", "sans-serif")
      .attr("text-anchor", "middle");
svg.append('g').attr('class', 'nodes');
svg.append('g').attr('class', 'group-labels');

// Draw default chart
draw_chart();

// Main timeline
d3.select('#show-timeline')
    .style('cursor', 'pointer')  
    .on('click', show_timeline);

if (options.show_timeline) {
  if (options.show_timeline === true) {
    d3.select('#show-timeline').dispatch('click');
  }
  else {
    d3.select(`#group-label-${options.show_timeline}`).dispatch('click');
  }
}

// Hide timeline when clicking outside the box
document.addEventListener('click', function() {
  hide_timeline();
});
document.getElementById('timeline').addEventListener('click', function(e) {
    e.stopPropagation();
});
d3.select('.close').on('click', function() {
  hide_timeline();
});



/* 
  Share button
  */

for (let share of document.querySelectorAll('.share')) {
  share.addEventListener('click', function(e) {
    e.stopPropagation();
    e.preventDefault();
    var url = get_share_url();
    copyTextToClipboard(url);

    var temp_message = document.createElement("p");
    temp_message.style.top = this.getBoundingClientRect().top + "px";
    if (this.getBoundingClientRect().right < window.innerWidth - 100) {
      temp_message.style.left = this.getBoundingClientRect().right + "px";
    } else {
      temp_message.style.right = (window.innerWidth - this.getBoundingClientRect().left) + "px";
    }
    temp_message.style.position = "fixed";
    temp_message.className = "temp-message";
    temp_message.textContent = "Lien copié !";
    document.body.appendChild(temp_message);
    setTimeout(function() {
      document.body.removeChild(temp_message);
    }, 1000);
  });
}

