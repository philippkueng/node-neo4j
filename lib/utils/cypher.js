'use strict';
// Graph utils for cypher queries
exports.params = params;
exports.stringify = stringify;

function params (fields) {
  var params = '';
  var notFirst = false;
  for (var key in fields) {
    var obj = fields[key];
    if(notFirst)
      params += ',';
    else
      notFirst = true;
    params += key + ':{'+ key + '}';
  }
  return params;
}

function stringify (array) {
  var res = '';
  for (var i = 0; i < array.length; i++) 
    res += ':' + array[i];  
  return res;
}