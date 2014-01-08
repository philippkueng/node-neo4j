'use strict';

exports.getNodeId = getNodeId;
exports.getRelationshipId = getRelationshipId;

/* Internal method
   Example:
   http://db5.sb01.stations.graphenedb.com:24789/db/data/node/7
   will return 7 as an integer */

function getNodeId (url) {
  return parseInt(url.match(/\/db\/data\/node\/([0-9]+)(\/[0-9a-z\/]+)?$/)[1]);
}


/* Internal method
   Example:
   http://db5.sb01.stations.graphenedb.com:24789/db/data/relationship/7
   will return 7 as an integer */

function getRelationshipId (url) {
  return parseInt(url.match(/\/db\/data\/relationship\/([0-9]+)(\/[0-9a-z\/]+)?$/)[1]);
}