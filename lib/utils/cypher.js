'use strict';

// Graph utils for cypher queries
exports.where = where;
exports.set = set;
exports.whereSetProperties = whereSetProperties;
exports.labels = labels;
exports.jsonToURL = jsonToURL;

/*  Internal method
    Example:
    params('city', {name: 'Aalst', postalcode: 9300})
    returns city.name={name} appendToken city.postalcode={postalcode} */

function append (fieldName, props, appendToken) {
  var params = '';
  var notFirst = false;
  fieldName += '.';
  for (var key in props) {
    var obj = props[key];
    if(notFirst)
      params += appendToken;
    else
      notFirst = true;
    params += fieldName + key + '={'+ key + '}';
  }
  return params;
}

/*  Example:
    where('city', {name: 'Aalst', postalcode: 9300})
    returns city.name={name} AND city.postalcode={postalcode} */

function where (fieldName, props) {
  return append(fieldName, props, ' AND ');
}
/*  Example:
    set('city', {name: 'Aalst', postalcode: 9300})
    returns city.name={name},city.postalcode={postalcode} */

function set (fieldName, props) {
  return append(fieldName, props, ',');
}

// Create a `where` and `set` string and a new object with unique propertynames
// Example:
// whereSetProperties('user', {userid: 123, firstname: 'foo'}, { firstname: 'bar' })
// returns {
//   where: "user.userid={xQ_1} AND user.firstname={xQ_2}",
//   set: "user.firstname={xQ_3}",
//   props { xQ_1: 123, xQ_2: 'foo', xQ_2: 'bar'}
// }

function whereSetProperties (fieldName, oldProps, newProps) {
  var whereClause = '',
    setClause = '',
    notFirst = false,
    props = {},
    i = 0,
    obj;
  fieldName += '.';

  for (var k in oldProps) {
    obj = oldProps[k];
    if(notFirst)
      whereClause += ' AND ';
    else
      notFirst = true;
    whereClause += fieldName + k + '={xQ_'+ (++i) + '}';

    props['xQ_' + i] = obj;
  }

  notFirst = false;

  for (var key in newProps) {
    obj = newProps[key];
    if(notFirst)
      setClause += ',';
    else
      notFirst = true;
    // Create unique placeholder {xx1} {xx2} ...
    setClause += fieldName + key + '={xQ_' + (++i) + '}';
    // Build new properties object
    props['xQ_' + i] = obj;
  }

  // Return stringified `where` and `set` clause and a new object with unique property names
  // So there are no name collisions
  return {
    where: whereClause,
    set: setClause,
    properties: props
  };
}

// Example:  
//   labels(['User','Student'])
//   returns ':User:Student'

function labels (array) {
  var res = '';
  if(typeof array === 'string') {
    return ':' + array;
  }    
  for (var i = 0; i < array.length; i++) {
    res += ':' + array[i];
  }    
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