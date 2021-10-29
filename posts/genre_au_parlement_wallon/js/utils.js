function clamp(number, min, max) {
  return Math.min(Math.max(number, min), max);
}

function random_element(list) {
  return list[Math.floor(Math.random()*list.length)]
}

// copied from https://gist.github.com/jdarling/06019d16cb5fd6795edf
var random_color = (function(){
  var golden_ratio_conjugate = 0.618033988749895;
  var h = Math.random();

  var hslToRgb = function (h, s, l){
      var r, g, b;

      if(s == 0){
          r = g = b = l; // achromatic
      }else{
          function hue2rgb(p, q, t){
              if(t < 0) t += 1;
              if(t > 1) t -= 1;
              if(t < 1/6) return p + (q - p) * 6 * t;
              if(t < 1/2) return q;
              if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
              return p;
          }

          var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          var p = 2 * l - q;
          r = hue2rgb(p, q, h + 1/3);
          g = hue2rgb(p, q, h);
          b = hue2rgb(p, q, h - 1/3);
      }

      return '#'+Math.round(r * 255).toString(16)+Math.round(g * 255).toString(16)+Math.round(b * 255).toString(16);
  };
  
  return function(){
    h += golden_ratio_conjugate;
    h %= 1;
    return hslToRgb(h, 0.5, 0.60);
  };
})();

// select an element from a d3 selection, and create it if it doesn't exist
function select_or_create(selection, element, attrs) {
  var selector = element;

  for (var attr of attrs) {
    if (attr[0] == 'class') {
      selector += '.'+attr[1];
    }
  }

  node = selection.selectAll(selector).data([1]).join(element);
  for (var attr of attrs) {
    node.attr(attr[0], attr[1]);
  }

  return node;
}

/**
 * Returns the initials of a name
 * @param {string} name 
 */
function get_initials(name) {
  var initials = '';
  var parts = []
  for (var part of name.split(' ')) {
    var subparts = [];
    for (var subpart of part.split('-')) {
      subparts.push(subpart[0].toUpperCase()+'.');
    }
    parts.push(subparts.join('-'));
  }
  return parts.join(' ');
}

// Version 1.1.7 d3-force-limit - https://github.com/vasturiano/d3-force-limit
// Copied here by fear of loosing a dependency
!function(n,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports):"function"==typeof define&&define.amd?define(["exports"],t):t((n="undefined"!=typeof globalThis?globalThis:n||self).d3=n.d3||{})}(this,(function(n){"use strict";function t(n){return function(){return n}}n.forceLimit=function(){var n,e,u=function(n){return 1},r=function(n){return-1/0},o=function(n){return 1/0},i=function(n){return-1/0},f=function(n){return 1/0},c=function(n){return-1/0},a=function(n){return 1/0},h=0,l=.01;function d(t){e.forEach((function(e){var d=u(e);["x","y","z"].slice(0,n).forEach((function(n){if(n in e){var u={x:[r,o],y:[i,f],z:[c,a]}[n].map((function(n){return n(e)})).sort((function(n,t){return n-t}));u[0]+=d,u[1]-=d;var y="v".concat(n),p=e[y],s=e[n],g=s+p;if(g<u[0]||g>u[1]){var x=g<u[0];s<u[0]||s>u[1]?(x===p<0&&(e[y]=0),e[n]=u[x?0:1]):e[y]=u[x?0:1]-s}h>0&&l>0&&(e[y]+=(Math.max(0,1-Math.max(0,s-u[0])/h)-Math.max(0,1-Math.max(0,u[1]-s)/h))*l*t)}}))}))}return d.initialize=function(t){e=t;for(var u=arguments.length,r=new Array(u>1?u-1:0),o=1;o<u;o++)r[o-1]=arguments[o];n=r.find((function(n){return[1,2,3].includes(n)}))||2},d.radius=function(n){return arguments.length?(u="function"==typeof n?n:t(+n),d):u},d.x0=function(n){return arguments.length?(r="function"==typeof n?n:t(+n),d):r},d.x1=function(n){return arguments.length?(o="function"==typeof n?n:t(+n),d):o},d.y0=function(n){return arguments.length?(i="function"==typeof n?n:t(+n),d):i},d.y1=function(n){return arguments.length?(f="function"==typeof n?n:t(+n),d):f},d.z0=function(n){return arguments.length?(c="function"==typeof n?n:t(+n),d):c},d.z1=function(n){return arguments.length?(a="function"==typeof n?n:t(+n),d):a},d.cushionWidth=function(n){return arguments.length?(h=n,d):h},d.cushionStrength=function(n){return arguments.length?(l=n,d):l},d},Object.defineProperty(n,"__esModule",{value:!0})}));
