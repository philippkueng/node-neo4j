var request = require('superagent'),
    Step = require('step');

module.exports = Neo4j;

function Neo4j(url){
    if(typeof url !== 'undefined' && url !== ''){
        this.url = url;
    } else {
        this.url = 'http://localhost:7474';
    }
};

/* Insert a Node --------- */

Neo4j.prototype.insertNode = function(node, callback){
    var that = this;
    request
        .post(this.url + '/db/data/node')
        .send(node)
        .type('form')
        .set('Accept', 'application/json')
        .end(function(result){
            if(typeof result.body !== 'undefined'){
                that.addNodeId(result.body, callback);
            } else {
                callback(new Error('Response is empty'), null);
            }
        });
};



/* Delete a Node --------- */
// Nodes with Relationships cannot be deleted -> deliver proper error message

Neo4j.prototype.deleteNode = function(node_id, callback){
    request
        .del(this.url + '/db/data/node/' + node_id)
        .set('Accept', 'application/json')
        .end(function(result){
            switch(result.statusCode){
                case 204:
                    callback(null, true); // Node was deleted.
                    break;
                case 404:
                    callback(null, false); // Node doesn't exist.
                    break;
                case 409:
                    callback(null, false); // Node has Relationships and cannot be deleted.
                    break;
                default:
                    callback(new Error('Unknown Error while deleting Node'), null);
            }
        });
};



/* Read a Node ---------- */

Neo4j.prototype.readNode = function(node_id, callback){
    var that = this;
    request
        .get(this.url + '/db/data/node/' + node_id)
        .set('Accept', 'application/json')
        .end(function(result){
            if(typeof result.body !== 'undefined'){
                if(result.statusCode === 200){
                    that.addNodeId(result.body, callback);
                } else if(result.statusCode === 404){
                    callback(null, null);
                } else {
                    callback(new Error('HTTP Error ' + result.statusCode + ' occurred.'), null);
                }
            } else {
                callback(new Error('Response is empty'), null);
            }
        });
};

/* Update a Node ---------- */

Neo4j.prototype.updateNode = function(node_id, node_data, callback){
    var that = this;
    request
        .put(this.url + '/db/data/node/' + node_id + '/properties')
        .send(that.stringifyValueObjects(that.replaceNullWithString(node_data)))
        .set('Accept', 'application/json')
        .end(function(result){
            switch(result.statusCode){
                case 204:
                    callback(null, true);
                    break;
                case 404:
                    callback(null, false);
                    break;
                default:
                    callback(new Error('HTTP Error ' + result.statusCode + ' when updating a Node.'), null);
            }
        });
};


/* Insert a Relationship ------ */

Neo4j.prototype.insertRelationship = function(root_node_id, other_node_id, relationship_type, relationship_data, callback){
    var that = this;
    request
        .post(that.url + '/db/data/node/' + root_node_id + '/relationships')
        .send({
            to: that.url + '/db/data/node/' + other_node_id,
            type: relationship_type,
            data: that.stringifyValueObjects(that.replaceNullWithString(relationship_data))
        })
        .set('Accept', 'application/json')
        .end(function(result){
            switch(result.statusCode){
                case 201:
                    that.addRelationshipId(result.body, callback);
                    break;
                case 400: // Endnode not found exception
                    callback(null, false);
                    break;
                case 404: // Startnode not found exception
                    callback(null, false);
                    break;
                default:
                    callback(new Error('HTTP Error ' + result.statusCode + ' when inserting a Relationship.'), null);
            }
        });
};


/* Delete a Relationship --------- */

Neo4j.prototype.deleteRelationship = function(relationship_id, callback){
    var that = this;
    request
        .del(that.url + '/db/data/relationship/' + relationship_id)
        .set('Accept', 'application/json')
        .end(function(result){
            switch(result.statusCode){
                case 204:
                    callback(null, true);
                    break;
                case 404: // Relationship with that id doesn't exist.
                    callback(null, false);
                    break;
                default:
                    callback(new Error('HTTP Error ' + result.statusCode + ' when deleting a Relationship.'), null);
            }
        });
};


/* Read a Relationship ----------- */

Neo4j.prototype.readRelationship = function(relationship_id, callback){
    var that = this;

    request
        .get(that.url + '/db/data/relationship/' + relationship_id)
        .set('Accept', 'application/json')
        .end(function(result){
            switch(result.statusCode){
                case 200:
                    that.addRelationshipId(result.body, callback);
                    break;
                case 404:
                    callback(null, false);
                    break;
                default:
                    callback(new Error('HTTP Error ' + result.statusCode + ' when reading a Relationship'), null);
            }
        });
};

/* Update a Relationship -------- */

Neo4j.prototype.updateRelationship = function(relationship_id, relationship_data, callback){
    var that = this;

    request
        .put(that.url + '/db/data/relationship/' + relationship_id + '/properties')
        .send(that.stringifyValueObjects(that.replaceNullWithString(relationship_data)))
        .set('Accept', 'application/json')
        .end(function(result){
            switch(result.statusCode){
                case 204:
                    callback(null, true);
                    break;
                case 404:
                    callback(null, false);
                    break;
                default:
                    callback(new Error('HTTP Error ' + result.statusCode + ' when updating a Relationship.'), null);
            }
        });
};

/* ADVANCED FUNCTIONS ---------- */

/* Get all Relationship Types -------- */

Neo4j.prototype.readRelationshipTypes = function(callback){
    var that = this;

    request
        .get(that.url + '/db/data/relationship/types')
        .set('Accept', 'application/json')
        .end(function(result){
            switch(result.statusCode){
                case 200:
                    callback(null, result.body);
                    break;
                default:
                    callback(new Error('HTTP Error ' + result.statusCode + ' when retrieving relationship types.'), null);
            }
        });
};

/* Get all Relationships of a Node --------- */

Neo4j.prototype.readAllRelationshipsOfNode = function(node_id, callback){
    var that = this;

    request
        .get(that.url + '/db/data/node/' + node_id + '/relationships/all')
        .set('Accept', 'application/json')
        .end(function(result){
            switch(result.statusCode){
                case 200:
                    that.addRelationshipIdForArray(result.body, callback);
                    break;
                case 404:
                    callback(null, false);
                    break;
                default:
                    callback(new Error('HTTP Error ' + result.statusCode + ' when retrieving all relationships for node ' + node_id), null);
            }
        });
};

/* Get all the incoming Relationships of a Node --------- */

Neo4j.prototype.readIncomingRelationshipsOfNode = function(node_id, callback){
    var that = this;

    request
        .get(that.url + '/db/data/node/' + node_id + '/relationships/in')
        .set('Accept', 'application/json')
        .end(function(result){
            switch(result.statusCode){
                case 200:
                    that.addRelationshipIdForArray(result.body, callback);
                    break;
                case 404:
                    callback(null, false);
                    break;
                default:
                    callback(new Error('HTTP Error ' + result.statusCode + ' when retrieving incoming relationships for node ' + node_id), null);
            }
        });
};

/* Get all the outgoing Relationships of a Node -------- */

Neo4j.prototype.readOutgoingRelationshipsOfNode = function(node_id, callback){
    var that = this;

    request
        .get(that.url + '/db/data/node/' + node_id + '/relationships/out')
        .set('Accept', 'application/json')
        .end(function(result){
            switch(result.statusCode){
                case 200:
                    that.addRelationshipIdForArray(result.body, callback);
                    break;
                case 404:
                    callback(null, false);
                    break;
                default:
                    callback(new Error('HTTP Error ' + result.statusCode + ' when retrieving outgoing relationships for node ' + node_id), null);
            }
        });
};


/* Run Cypher Query -------- */

Neo4j.prototype.cypherQuery = function(query, callback){
    var that = this;

    request
        .post(that.url + '/db/data/cypher')
        .set('Content-Type', 'application/json')
        .send({query: query})
        .end(function(result){
            switch(result.statusCode){
                case 200:
                    if(result.body && result.body.data.length >= 1){
                        Step(
                            function addIds(){
                                var group = this.group();
                                result.body.data.forEach(function(node){
                                    that.addNodeId(node[0], group());
                                });
                            },
                            function sumUp(err, nodes){
                                if(err){
                                    throw err;
                                } else {
                                    result.body.data = nodes;

                                    callback(null, result.body);
                                }
                        });
                    } else {
                        callback(null, result.body);
                    }
                    break;
                case 404:
                    callback(null, null);
                    break;
                default:
                    callback(new Error('HTTP Error ' + result.statusCode + ' when running the cypher query against neo4j'), null);
            }
        });
};


/* HELPER METHODS --------- */

/* Strips username and password from URL so that the node_id can be extracted. */

Neo4j.prototype.removeCredentials = function(path){
    if(typeof path !== 'undefined' && path !== ''){
        return path.replace(/[a-z0-9]+\:[a-z0-9]+\@/, '');
    } else {
        return '';
    }
};


/* Extract node_id and add it as a property. */

Neo4j.prototype.addNodeId = function(node, callback){
    node.id = node.self.replace(this.removeCredentials(this.url) + '/db/data/node/', '');
    callback(null, node);
};


/* Extract relationship_id and add it as a property. */

Neo4j.prototype.addRelationshipId = function(relationship, callback){
    relationship.start_node_id = relationship.start.replace(this.removeCredentials(this.url) + '/db/data/node/', '');
    relationship.end_node_id = relationship.end.replace(this.removeCredentials(this.url) + '/db/data/node/', '');
    relationship.id = relationship.self.replace(this.removeCredentials(this.url) + '/db/data/relationship/', '');
    callback(null, relationship);
};


/* Add relationship_id for an array of relationships */

Neo4j.prototype.addRelationshipIdForArray = function(relationships, callback){
    var that = this;
    Step(
        function process_relationships(){
            var group = this.group();
            relationships.forEach(function(relationship){
                that.addRelationshipId(relationship, group());
            });
        },
        function sum_up(err, results){
            if(err) {
                callback(err, null);
            } else {
                callback(null, results);
            }
        }
    );
};

/* Replace null values with an empty string */

Neo4j.prototype.replaceNullWithString = function(node_data, callback){

    for(var key in node_data){
        if(node_data.hasOwnProperty(key) && node_data[key] === null){
            node_data[key] = '';
        }
    }

    return node_data;
};


/* Turn values that are objects themselves into strings. */

Neo4j.prototype.stringifyValueObjects = function(node_data, callback){

    for(var key in node_data){
        if(node_data.hasOwnProperty(key) && typeof node_data[key] === 'object'){
            node_data[key] = JSON.stringify(node_data[key]);
        }
    }

    return node_data;
};


