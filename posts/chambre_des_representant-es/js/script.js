// Colors: https://coolors.co/813bb0-cda318-7cb4b8-70f8ba-ef6461
// Settings
var dichotomy_colors = {
  'F': '#813bb0',
  'M': '#cda318',
};
var font_dichotomy_colors = {
  'F': '#5a297b',
  'M': '#8f7211',
};

/*
  Tooltips
*/

function close_all_popups() {
  var opened_popup = document.querySelector('#footnote-popup');
  if (opened_popup) {
    opened_popup.remove();
  }

  for (let footnote of document.getElementsByClassName('footnote-open')) {
    footnote.classList.remove('footnote-open');
  }
}

document.getElementsByTagName('html')[0].addEventListener('click', function() {
  close_all_popups();
});

for (let footnote of document.getElementsByClassName('footnote')) {
  footnote.addEventListener('click', function(event){
    event.stopPropagation();
    
    if (this.classList.contains('footnote-open')) {
      close_all_popups();
    } else {
      close_all_popups();

      // Create popup
      const content = this.getAttribute('footnote-content');
      const popup = document.createElement('aside');
      popup.setAttribute('id', 'footnote-popup');
      popup.innerHTML = content + '<span class="popup-arrow"></span>';

      // Position the popup below the footnote
      // By default, it is centered under the footnote
      const footnote_pos = this.getBoundingClientRect();
      popup.style.top = `${footnote_pos.bottom + window.scrollY + 5}px`;
      popup.style.left = `${(footnote_pos.left + footnote_pos.right)/2 + window.scrollX}px`;
      document.body.appendChild(popup);
      // After the popup is added to the DOM, we check if it is out of the screen
      // and move it if it is
      var shift = 0;
      if (popup.getBoundingClientRect().left < 0) {
        shift = -popup.getBoundingClientRect().left;
      } else if (popup.getBoundingClientRect().right > window.innerWidth) {
        shift = window.innerWidth - popup.getBoundingClientRect().right;
      }
      if (shift !== 0) {
        popup.style.left = `${parseFloat(popup.style.left) + shift}px`;
        const arrow_pos = popup.getBoundingClientRect().width/2 - shift;
        popup.querySelector('.popup-arrow').style.left = `${arrow_pos}px`;
      }

      // prevent popup from closing when clicking on it
      popup.addEventListener('click', function(event) {
        event.stopPropagation();
      });

      this.classList.add('footnote-open');
    }
  });
}

/*
  "Show more"
*/

for (let showmore of document.querySelectorAll('.show-more-link')) {
  showmore.addEventListener('click', function(event){
    event.stopPropagation();
    var parent = this.parentNode;
    while (parent.className.indexOf('show-more') === -1) {
      parent = parent.parentNode;
    }
    parent.querySelector('.show-more-content').classList.toggle('show');
    return false;
  });
}


/*
  Charts
*/

var hf_over_time = timeline(data.hf_over_time, {
  x: 'year',
  y: 'F',
  width: document.getElementById("hf_over_time").clientWidth,
  color: "#813bb0",
  yDomain: [0, 0.6],
  xTicks: x => x % 2 == 1,
})

document.getElementById("hf_over_time").innerHTML = "";
document.getElementById("hf_over_time").appendChild(hf_over_time);

var hf_no_pres_over_time = timeline(data.hf_no_pres_over_time, {
  x: 'year',
  y: 'F',
  width: document.getElementById("hf_no_pres_over_time").clientWidth,
  color: "#813bb0",
  yDomain: [0, 0.6],
  xTicks: x => x % 2 == 1,
})

document.getElementById("hf_no_pres_over_time").innerHTML = "";
document.getElementById("hf_no_pres_over_time").appendChild(hf_no_pres_over_time);

function group_fr(group, gender) {
  function _single_group(group) {
    if (group == 'minister') return 'membre du gouvernement';
    if (group == 'bureau') return 'membre du bureau';
    if (group == 'president') {
      if (gender == 'F') return 'présidente';
      else return 'président';
    } 
    if (group == 'deputy') {
      if (gender == 'F') return 'députée';
      else return 'député';
    }
    if (group == 'group president') {
      if (gender == 'F') return 'présidente de groupe';
      else return 'président de groupe';
    }
    return group;
  }

  var res = [];
  for (g of group.split(",")) {
    res.push(_single_group(g.trim()));
  }
  return res.join(', ');
}

var speakers_2021 = myBubbleChart(d3.filter(data.interventions_per_person, d => d.year == 2021), {
  name: d => d.person_id,
  label: d => get_initials(d.first_name) + ' ' + d.last_name,
  value: d => d.word_count,
  width: document.getElementById("speakers_2021").clientWidth,
  height: Math.min(document.getElementById("speakers_2021").clientWidth, 700),
  color: colors_around('#7cb4b8', deviation=20),
  title: d => `${d.first_name} ${d.last_name}, ${group_fr(d.groups, d.legal_sex)} (${d3.format('.2s')(d.word_count)} mots en 2021)`,
})

document.getElementById("speakers_2021").innerHTML = "";
document.getElementById("speakers_2021").appendChild(speakers_2021);

var speakers_2021_by_gender = myBubbleChart(d3.filter(data.interventions_per_person, d => d.year == 2021), {
  name: d => d.person_id,
  label: d => get_initials(d.first_name) + ' ' + d.last_name,
  value: d => d.word_count,
  group: d => d.legal_sex,
  width: document.getElementById("speakers_2021_by_gender").clientWidth,
  height: Math.min(document.getElementById("speakers_2021").clientWidth-1, 700),
  color: d => dichotomy_colors[d.legal_sex],
  center_groups: false,
  groupLabel: g => `${(g.name == 'F') ? 'Femmes' : 'Hommes'}: ${d3.format('.0%')(g.share)}`,
  groupLabelColor: g => font_dichotomy_colors[g.name],
  title: d => `${d.first_name} ${d.last_name}, ${group_fr(d.groups, d.legal_sex)} (${d3.format('.2s')(d.word_count)} mots en 2021)`,
})

document.getElementById("speakers_2021_by_gender").innerHTML = "";
document.getElementById("speakers_2021_by_gender").appendChild(speakers_2021_by_gender);

// var legis_labels = {
//   52: '52è légis \n (2007-2010)',
//   53: '53è légis \n (2010-2014)',
//   54: '54è légis \n (2014-2019)',
//   55: '55è légis \n (2019-)',
// }

var legis_labels = {
  52: '52è légis',
  53: '53è légis',
  54: '54è légis',
  55: '55è légis',
}

var evolution_of_wps = quantilesChart(d3.filter(data.words_per_session_per_group, d => d.group == 'deputy'), {
// var evolution_of_wps = quantilesChart(data.words_per_session, {
  value: d => d.words_per_session,
  tick: d => d.period,
  group: d => d.legal_sex,
  groupColor: g => dichotomy_colors[g],
  width: document.querySelector("ul.big-list li").clientWidth,
  xPadding: 0.6,
  gPadding: 0,
  yLabel: "↑ Mots par séance",
  tickFormat: d => legis_labels[d],
})

document.getElementById('evolution_of_wps').appendChild(evolution_of_wps);