var request = require('superagent'),
    Step = require('step'),
    util = require('util'),
    cypher = require('./lib/utils/cypher');

module.exports = Neo4j;

function Neo4j(url){
    if(typeof url !== 'undefined' && url !== ''){
        this.url = url;
    } else {
        this.url = 'http://localhost:7474';
    }
};

/*	Insert a Node --------- 
	Examples:
	Insert a Node with no label:
		insertNode({ name: 'Kristof' }, callback);
	Insert a Node with one label:	
		insertNode({ name: 'Kristof' }, ['Student'], callback);
	Insert a Node with three labels:
		insertNode({ name: 'Kristof' }, ['User', 'Student' ,'Man'], callback);		*/

Neo4j.prototype.insertNode = function(node, labels, callback){
	var that = this;
	// Insert node without a label with post request
	if(typeof labels === 'function') {
		callback = labels;		
		request
			.post(this.url + '/db/data/node')
			.send(node)
			.type('form')
			.set('Accept', 'application/json')
			.end(function(result){
				if(typeof result.body !== 'undefined')
					that.addNodeId(result.body, callback);
				else 
					callback(new Error('Response is empty'), null);
		
			});
	} else {
		// Insert node and label(s) with cypher query
		if(labels instanceof Array){ 
			var query = 'CREATE (data'+  cypher.stringify(labels) + ' {' + cypher.params(node) + '}) RETURN data';		
			this.cypherQuery(query, node, function(err, res) {
				if(err) 
					callback(err, null);
				else
					callback(err, res.data[0]);
			});		
		} else
			callback(new Error('The second parameter "labels" should be an array with strings OR "labels" should be a callback function.'), null);
	}	
};

/*	Get an array of labels of a Node ---------
	Example:
		readLabels(77, callback); 
		returns ['User','Student','Man']
*/

Neo4j.prototype.readLabels = function(node_id, callback){		
	request
		.get(this.url + '/db/data/node/' + node_id + '/labels')		
		.set('Accept', 'application/json')
		.end(function(result){
			if(typeof result.body !== 'undefined')
				callback(null, result.body);
			else 
				callback(new Error('Response is empty'), null);	
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

/* Create an Index ---------- */

Neo4j.prototype.insertIndex = function(index, callback){
    var that = this;

    request
        .post(that.url + '/db/data/index/' + index.type + '/')
        .send({
            'name': index.index,
            'config': index.config
        })
        .set('Accept', 'application/json')
        .end(function(result){
            switch(result.statusCode){
                case 201:
                    callback(null, result.body);
                    break;
                case 404:
                    callback(null, false);
                    break;
                default:
                    callback(new Error('HTTP Error ' + result.statusCode + ' when inserting an Index.'), null);
            } 
        });
};

/*	Create an index on a property of a label 
	Example:
	Create an index on the first name and last name of a person.
		insertLabelIndex('Person', ['firstname'], callback);
		returns {
				  "label" : "Person",
				  "property-keys" : [ "firstname" ]
				}
	Note:
	Compound indexes are not yet supported, only one property per index is allowed.
	So ['firstname', 'lastname'] is not supported yet. */

Neo4j.prototype.insertLabelIndex = function(label, property_key, callback){
    request
			.post(this.url + '/db/data/schema/index/' + label)
			.send({ "property_keys" : [property_key] })
			.type('form')
			.set('Accept', 'application/json')
			.end(function(result){
				if(typeof result.body !== 'undefined')
					callback(null, result.body);
				else 
					callback(new Error('Response is empty'), null);		
	});
};

Neo4j.prototype.insertNodeIndex = function(index, callback){
    var _index = index;
    if(typeof index === 'string'){
        _index = {
            type: 'node',
            index: index
        };
    }
    this.insertIndex(_index, callback);
};

Neo4j.prototype.insertRelationshipIndex = function(index, callback){
    var _index = index;
    if(typeof index === 'string'){
        _index = {
            type: 'relationship',
            index: index
        };
    }
    this.insertIndex(_index, callback);
};

/* Delete an Index ---------- */

Neo4j.prototype.deleteIndex = function(index, callback){
    var that = this;
    
    request
    .del(this.url + '/db/data/index/' + index.type + '/' + index.index)
    .set('Accept', 'application/json')
    .end(function(result){
        switch(result.statusCode){
            case 204:
                callback(null, true); // Index was deleted.
                break;
            case 404:
                callback(null, false); // Index doesn't exist.
                break;
            default:
                callback(new Error('Unknown Error while deleting Index'), null);
        }
    });
};

Neo4j.prototype.deleteNodeIndex = function(index, callback){
    this.deleteIndex({type: 'node', index: index}, callback);
};

Neo4j.prototype.deleteRelationshipIndex = function(index, callback){
    this.deleteIndex({type: 'relationship', index: index}, callback);
};

Neo4j.prototype.deleteLabelIndex = function(label, property_key, callback){
    request
	.del(this.url + '/db/data/schema/index/' + label + '/' + property_key)
	.set('Accept', 'application/json')
	.end(function(result){
		switch(result.statusCode){
			case 204:
				callback(null, true); // Index was deleted.
				break;
            case 404:
				callback(null, false); // Index doesn't exist.
				break;
            default:
				callback(new Error('Unknown Error while deleting Index'), null);
        }
    });
};

function listIndexes (url, callback) {
	request
    .get(url)
    .set('Accept', 'application/json')
    .end(function(result){
        switch(result.statusCode){
            case 200:
                callback(null, result.body);
                break;
            case 404:
                callback(null, false);
                break;
            default:
                callback(new Error('HTTP Error ' + result.statusCode + ' when listing all indexes.'), null);
        } 
    });
}

/* REMOVE?
Neo4j.prototype.listIndexes = function(indexType, callback){
    var url = this.url + '/db/data/index/' + indexType;
    listIndexes(url, callback);    
};
*/

Neo4j.prototype.listNodeIndexes = function(callback){
	var url = this.url + '/db/data/index/node';
    listIndexes(url, callback);
};

Neo4j.prototype.listRelationshipIndexes = function(callback){
	var url = this.url + '/db/data/index/relationship';
    listIndexes(url, callback);
};

/*	List indexes for a label 
	Example: 
	listLabelIndexes('City', callback);
	returns [ { label: 'City', 'property-keys': [ 'postalcode' ] },
  			  { label: 'City', 'property-keys': [ 'name' ] } ]		*/

Neo4j.prototype.listLabelIndexes = function(label, callback){
	var url = this.url + '/db/data/schema/index/' + label;
    listIndexes(url, callback);
};

/* Add item to Index ---------- */

Neo4j.prototype.addItemToIndex = function(arguments, callback){
    var that = this;

    request
        .post(that.url + '/db/data/index/' + arguments.indexType + '/' + arguments.indexName)
        .send({
            'uri': that.url + '/db/data/' + arguments.indexType + '/' + arguments.itemId,
            'key': arguments.indexKey,
            'value': arguments.indexValue
        })
        .set('Accept', 'application/json')
        .end(function(result){
            switch(result.statusCode){
                case 200:
                    callback(null, result.body);
                    break;
                case 201:
                    callback(null, result.body);
                    break;
                default:
                    callback(new Error('HTTP Error ' + result.statusCode + ' when adding an Item to an Index'), null);
            }
        });
};

Neo4j.prototype.addNodeToIndex = function(nodeId, indexName, indexKey, indexValue, callback){
    this.addItemToIndex({
        indexType: 'node',
        itemId: nodeId,
        indexName: indexName,
        indexKey: indexKey,
        indexValue: indexValue
    }, callback);
};

Neo4j.prototype.addRelationshipToIndex = function(nodeId, indexName, indexKey, indexValue, callback){
    this.addItemToIndex({
        indexType: 'relationship',
        itemId: nodeId,
        indexName: indexName,
        indexKey: indexKey,
        indexValue: indexValue
    }, callback);
};
/*	Add a label to a node. Given a node id (integer) and a label (string)
	returns true if successfully added a label. If it failed it will return false.
	Example:
	addLabelToNode(77, 'User', callback); 
	returns true
	*/

Neo4j.prototype.addLabelToNode = function(nodeId, label, callback){
    var that = this;

    request
        .post(that.url + '/db/data/node/' + nodeId + '/labels')
        .send(label)
        .set('Accept', 'application/json')
        .end(function(result){
            switch(result.statusCode){
                case 204:
                    callback(null, true); // label added
                    break;
                case 404:
                    callback(null, false);
                    break;
                default:
                    callback(new Error('HTTP Error ' + result.statusCode + ' when adding a label to a node'), null);
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

Neo4j.prototype.cypherQuery = function(query, params, callback){
    var that = this;
    var body = { query: query };
    if(params) {
    	if(typeof params === 'function')
    		callback = params;
    	else
    		body['params'] = params;
    } 
    //console.log('PARAMS: ' + util.inspect(body));
    request
        .post(that.url + '/db/data/cypher')
        .set('Content-Type', 'application/json')
        .send(body)
        .end(function(result){        	
            switch(result.statusCode){
                case 200:
                    if(result.body && result.body.data.length >= 1){
                        Step(
                            function addIds(){
                                var group = this.group();
                                result.body.data.forEach(function(resultset){
                                    resultset.forEach(function(node){
                                       that.addNodeId(node, group());
                                    });
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


/* Run Batch Queries -------- */

Neo4j.prototype.batchQuery = function(query, callback){
    var that = this;

    request
        .post(that.url + '/db/data/batch')
        .set('Content-Type', 'application/json')
        .send(query)
        .end(function(result){
            switch(result.statusCode){
                case 200:
                    callback(null, result.body);
                    break;
                case 404:
                    callback(null, null);
                    break;
                default:
                    callback(new Error('HTTP Error ' + result.statusCode + ' when running the batch query against neo4j'), null);
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
    if (node && node.self) {
        node.id = parseInt(node.self
                    .replace(this.removeCredentials(this.url) + '/db/data/node/', '')
                    .replace(this.removeCredentials(this.url) + '/db/data/relationship/', ''));  
    }
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