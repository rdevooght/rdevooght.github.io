/*
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
  else if (typeof val_or_function == 'string' && param.hasOwnProperty(val_or_function)) {
    return param[val_or_function];
  }
  else {
    return val_or_function;
  }
}

function clamp(number, min, max) {
  return Math.min(Math.max(number, min), max);
}

function random_int(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Version 1.1.7 d3-force-limit - https://github.com/vasturiano/d3-force-limit
// Copied here by fear of loosing a dependency
!function(n,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports):"function"==typeof define&&define.amd?define(["exports"],t):t((n="undefined"!=typeof globalThis?globalThis:n||self).d3=n.d3||{})}(this,(function(n){"use strict";function t(n){return function(){return n}}n.forceLimit=function(){var n,e,u=function(n){return 1},r=function(n){return-1/0},o=function(n){return 1/0},i=function(n){return-1/0},f=function(n){return 1/0},c=function(n){return-1/0},a=function(n){return 1/0},h=0,l=.01;function d(t){e.forEach((function(e){var d=u(e);["x","y","z"].slice(0,n).forEach((function(n){if(n in e){var u={x:[r,o],y:[i,f],z:[c,a]}[n].map((function(n){return n(e)})).sort((function(n,t){return n-t}));u[0]+=d,u[1]-=d;var y="v".concat(n),p=e[y],s=e[n],g=s+p;if(g<u[0]||g>u[1]){var x=g<u[0];s<u[0]||s>u[1]?(x===p<0&&(e[y]=0),e[n]=u[x?0:1]):e[y]=u[x?0:1]-s}h>0&&l>0&&(e[y]+=(Math.max(0,1-Math.max(0,s-u[0])/h)-Math.max(0,1-Math.max(0,u[1]-s)/h))*l*t)}}))}))}return d.initialize=function(t){e=t;for(var u=arguments.length,r=new Array(u>1?u-1:0),o=1;o<u;o++)r[o-1]=arguments[o];n=r.find((function(n){return[1,2,3].includes(n)}))||2},d.radius=function(n){return arguments.length?(u="function"==typeof n?n:t(+n),d):u},d.x0=function(n){return arguments.length?(r="function"==typeof n?n:t(+n),d):r},d.x1=function(n){return arguments.length?(o="function"==typeof n?n:t(+n),d):o},d.y0=function(n){return arguments.length?(i="function"==typeof n?n:t(+n),d):i},d.y1=function(n){return arguments.length?(f="function"==typeof n?n:t(+n),d):f},d.z0=function(n){return arguments.length?(c="function"==typeof n?n:t(+n),d):c},d.z1=function(n){return arguments.length?(a="function"==typeof n?n:t(+n),d):a},d.cushionWidth=function(n){return arguments.length?(h=n,d):h},d.cushionStrength=function(n){return arguments.length?(l=n,d):l},d},Object.defineProperty(n,"__esModule",{value:!0})}));


function colors_around(anchor, deviation=5) {

  if (anchor[0] == '#') anchor = anchor.substr(1);
  if (anchor.length != 6) return '#000000';

  const r = parseInt(anchor[0]+anchor[1], 16);
  const g = parseInt(anchor[2]+anchor[3], 16);
  const b = parseInt(anchor[4]+anchor[5], 16);

  return function() {
    var new_r = clamp(r + random_int(-deviation, deviation), 0, 255);
    var new_g = clamp(g + random_int(-deviation, deviation), 0, 255);
    var new_b = clamp(b + random_int(-deviation, deviation), 0, 255);

    return '#' + new_r.toString(16) + new_g.toString(16) + new_b.toString(16);
  }

}