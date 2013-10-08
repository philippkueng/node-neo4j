'use strict';

// Graph utils for cypher queries
exports.params = params;
exports.stringify = stringify;
exports.jsonToURL = jsonToURL;

/*  Example:
    params('city', {name: 'Aalst', postalcode: 9300})
    returns city.name = {name}, city.postalcode = {postalcode} */

function params (fieldName, props) {
  var params = '';
  var notFirst = false;
  fieldName += '.';   
  for (var key in props) {   
    var obj = props[key];
    if(notFirst)
      params += ' AND ';
    else
      notFirst = true;
    params += fieldName + key + '={'+ key + '}';
  }
  return params;
}

function stringify (array) {
  var res = '';
  if(typeof array === 'string')
    return ':' + array; 
  for (var i = 0; i < array.length; i++) 
    res += ':' + array[i];  
  return res;
}

function jsonToURL (jsonData) {
  var result = '';
  var notFirst = false;
  for(var key in jsonData){
    if(notFirst) result += '&'; else notFirst = true;
    result += encodeURIComponent(key) + '=' + encodeURIComponent(JSON.stringify(jsonData[key]));    
  }
  return result;
}