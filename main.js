var request = require('superagent'),
	Step = require('step'),
	util = require('util'),
	cypher = require('./lib/utils/cypher'),
	Validator = require('./lib/utils/validator');

module.exports = Neo4j;

function Neo4j(url){
	if(typeof url !== 'undefined' && url !== ''){
		this.url = url;
	} else {
		this.url = 'http://localhost:7474';
	}
};

/*	Insert a Node
	Examples:
	Insert a Node with no label:
		insertNode({ name: 'Kristof' }, callback);
	Insert a Node with one label:	
		insertNode({ name: 'Kristof' }, ['Student'], callback);
		insertNode({ name: 'Kristof' }, 'Student', callback);
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
		var val = new Validator();

		if(val.labels(labels).hasErrors)
			return callback(val.error(), null);

		// Flexibility: make array of single string
		if(typeof labels === 'string')
			labels = [labels];

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

/*	Get an array of labels of a Node
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
	Create an index on the first name of a person.
		insertLabelIndex('Person', 'firstname', callback);
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
			.send({ 'property_keys' : [property_key] })
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

Neo4j.prototype.listIndexes = function(indexType, callback){
	var url = this.url + '/db/data/index/' + indexType;
	listIndexes(url, callback);	
};


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

/*	Adding one or multiple labels to a node. 
	Given a node id (integer) and one label (string) or multiple labels (array of strings) (non-empty strings)
	returns true if successfully added a label otherwise it will return false.
	Examples:
	addLabelsToNode(77, 'User', callback);
	addLabelsToNode(77, ['User', 'Student'], callback); 
		returns true
	addLabelsToNode(77, ['User', ''], callback); 
		returns an error! no empty string allowed	*/

Neo4j.prototype.addLabelsToNode = function(nodeId, labels, callback){   
	var url = this.url + '/db/data/node/' + nodeId + '/labels';
	var errorMsg = '"Labels" should be a non-empty string or an array of non-empty strings.';

	if(typeof labels === 'string') {
		if(labels === '')
			return callback(new Error(errorMsg), null);
		labels = [labels];
	}

	if(labels instanceof Array) {
		request
			.post(url)
			.send(labels)
			.set('Accept', 'application/json')
			.end(function(result){
			switch(result.statusCode){
				case 204:
					callback(null, true); // Labels added
					break;
				case 400:
					callback(new Error(errorMsg), null); // Empty label
					break;
				case 404:
					callback(null, false); // Node doesn't exist
					break;
				default:
					callback(new Error('HTTP Error ' + result.statusCode + ' when adding a label to a node.'), null);
				}
			});
	} else
		callback(new Error(errorMsg), null);
};

/*	Replacing labels on a node.
	This removes any labels currently on a node, and replaces them with the new labels.
	Given a node id (integer) and one label (string) or multiple labels (array of strings) (non-empty strings)
	returns true if successfully replaced all labels otherwise it will return false or an error.
	Examples:
	replaceLabelsFromNode(77, 'User', callback);
	replaceLabelsFromNode(77, ['User', 'Student'], callback); 
		returns true
	replaceLabelsFromNode(77, ['User', ''], callback);
	replaceLabelsFromNode(77, null, callback); 
		returns an error! no empty string allowed	*/
		
Neo4j.prototype.replaceLabelsFromNode = function(nodeId, labels, callback){
	var errorMsg = '"Labels" should be a non-empty string or an array of non-empty strings.';

	if(typeof labels === 'string') {
		if(labels === '')
			return callback(new Error(errorMsg), null);
		labels = [labels];
	}

	if(labels instanceof Array) {
		request
			.put(this.url + '/db/data/node/' + nodeId + '/labels')
			.send(labels)
			.set('Accept', 'application/json')
			.end(function(result){
				switch(result.statusCode){
					case 204:
						callback(null, true);
						break;
					case 400:
						callback(new Error(errorMsg), null); // Empty label
						break;
					case 404:
						callback(null, false);
						break;
					default:
						callback(new Error('HTTP Error ' + result.statusCode + ' when replacing labels.'), null);
			}
		});
	} else
		callback(new Error(errorMsg), null);
};

/*	Removing a label from a node	
	Given a node id (positive integer) and one label (non-empty string)
	returns true if successfully removed the label otherwise it will return false (Node doesn't exist) or an error.
	Examples:
	deleteLabelFromNode(77, 'User', callback);
		returns true
	deleteLabelFromNode(77, ['Student'], callback); 
	deleteLabelFromNode(77, '', callback);
		returns an error, label should be a non-empty string */

Neo4j.prototype.deleteLabelFromNode = function(nodeId, label, callback){   
	var val = new Validator();
	val.nodeId(nodeId).label(label);

	if(val.hasErrors)
		return callback(val.error(), null);
		 	
	request
		.del(this.url + '/db/data/node/' + nodeId + '/labels/'+ label)
		.set('Accept', 'application/json')
		.end(function(result){
			switch(result.statusCode){
				case 204:
					callback(null, true); // Label was deleted.
					break;
				case 404:
					callback(null, false); // Node doesn't exist.
					break;
				default:
					callback(new Error('Unknown Error while deleting Index'), null);
		}
	});
};

/*	Get all nodes with a label
	Given a label (non-empty string)
	returns an array of nodes with that label
	Examples:
	readNodesWithLabel('User', callback);
		returns an array with nodes with the label 'User'
	deleteLabelFromNode('DoesNotExist', callback); 
		returns an empty array	 */

Neo4j.prototype.readNodesWithLabel = function(label, callback){
	var that = this;
	var val = new Validator();
	
	if(val.label(label).hasErrors)
		return callback(val.error(), null);

	request
		.get(this.url + '/db/data/label/' + label + '/nodes')
		.set('Accept', 'application/json')
		.end(function(result){
			var body = result.body;			
			switch(result.statusCode){
			case 200:
				if(body && body.length >= 1){
					Step(
						function addIds(){
							var group = this.group();							
							body.forEach(function(node){
								that.addNodeId(node, group());
							});							
						},
						function sumUp(err, nodes){
							if(err) throw err;							
							callback(null, nodes);							
						});
					} else 
						callback(null, body); 
					break;
				case 404:
					callback(null, false);
					break;
				default:
					callback(new Error('HTTP Error ' + result.statusCode + ' when reading a Relationship'), null);
			}
		});
};

/*	Get all nodes with a label an a property
	Given a label (non-empty string) and one property in json
	returns an array of nodes with that label and property
	Examples:
	readNodesWithLabelAndProperty('User',{ firstname: 'Sam' }, callback);
		returns an array with nodes with the label 'User' and property firstname='Sam'
	readNodesWithLabelAndProperty('User', { 'name': 'DoesNotExist'}, callback); 
		returns an empty array	 		*/

Neo4j.prototype.readNodesWithLabelAndProperties = function(label, properties, callback){
	var that = this;
	var val = new Validator();
	val.label(label).properties(properties);
	
	if(val.hasErrors)
		return callback(val.error(), null);
	
	var props = cypher.jsonToURL(properties);
	
	request
		.get(this.url + '/db/data/label/' + label + '/nodes?' + props)
		.set('Accept', 'application/json')
		.end(function(result){
			var body = result.body;				
			switch(result.statusCode){
			case 200:
				if(body && body.length >= 1){
					Step(
						function addIds(){
							var group = this.group();							
							body.forEach(function(node){
								that.addNodeId(node, group());
							});							
						},
						function sumUp(err, nodes){
							if(err) throw err;							
							callback(null, nodes);							
						});
					} else 
						callback(null, body); 
					break;
				case 404:
					callback(null, false);
					break;
				default:
					callback(new Error('HTTP Error ' + result.statusCode + ' when reading Nodes.'), null);
			}
		});
};
/*	List all labels.
	Example:
	listAllLabels(callback);
		returns [ "User", "Person", "Male", "Animal" ] */

Neo4j.prototype.listAllLabels = function(callback){
	request
	.get(this.url + '/db/data/labels')
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
				callback(new Error('HTTP Error ' + result.statusCode + ' when listing all labels.'), null);
		} 
	});
};

/* CONSTRAINTS */

/*	Create a uniqueness constraint on a property.
	Example:
		createUniquenessContstraint('User','email', callback);
		returns 	{
					  "label" : "User",
					  "type" : "UNIQUENESS",
					  "property-keys" : [ "email" ]
					}			*/

Neo4j.prototype.createUniquenessContstraint = function(label, property_key, callback){	
	var val = new Validator();
	val.label(label).property(property_key);
	
	if(val.hasErrors)
		return callback(val.error(), null);

	request
		.post(this.url + '/db/data/schema/constraint/' + label + '/uniqueness')
		.send({ 'property_keys' : [property_key] })
		.set('Accept', 'application/json')
		.end(function(result){
			switch(result.statusCode){
				case 200:
					callback(null, result.body);
					break;
				case 409:
					callback(null, false); // Constraint already exists
					break;					
				default:
					callback(new Error('HTTP Error ' + result.statusCode + ' when creating a uniqueness contraint.'), null);
			} 
		});
};

/*	Get a specific uniqueness constraint for a label and a property
	Example:
		readUniquenessConstraint('User','email', callback);
		returns [ {
				  "label" : "User",
				  "property-keys" : [ "email" ],
				  "type" : "UNIQUENESS"
				} ]						 		*/

Neo4j.prototype.readUniquenessConstraint = function(label, property, callback){
	var val = new Validator();
	val.label(label).property(property);

	if(val.hasErrors)
		return callback();

	request
	.get(this.url + '/db/data/schema/constraint/' + label + '/uniqueness/' + property)
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
				callback(new Error('HTTP Error ' + result.statusCode + ' when reading uniqueness constraints'), null);
		} 
	});
};

/*	Get all uniqueness constraints for a label.
	Example:
		listAllUniquenessConstraintsForLabel('User', callback);
		returns [ {
				  "label" : "User",
				  "property-keys" : [ "uid" ],
				  "type" : "UNIQUENESS"
				}, {
				  "label" : "User",
				  "property-keys" : [ "email" ],
				  "type" : "UNIQUENESS"
				} ]						 		*/

Neo4j.prototype.listAllUniquenessConstraintsForLabel = function(label, callback){
	var val = new Validator();
	val.label(label);
	if(val.hasErrors)
		return callback();
	request
	.get(this.url + '/db/data/schema/constraint/' + label + '/uniqueness')
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
				callback(new Error('HTTP Error ' + result.statusCode + ' when listing all uniqueness constraints.'), null);
		} 
	});
};

/*	Get all constraints for a label.
	Example:
		listAllConstraints(callback);
		returns [ {
				  "label" : "Product",
				  "property-keys" : [ "pid" ],
				  "type" : "UNIQUENESS"
				}, {
				  "label" : "User",
				  "property-keys" : [ "email" ],
				  "type" : "UNIQUENESS"
				} ]						*/

Neo4j.prototype.listAllConstraintsForLabel = function(label, callback){
	var val = new Validator();
	val.label(label);
	if(val.hasErrors)
		return callback()
	request
	.get(this.url + '/db/data/schema/constraint/' + label)
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
				callback(new Error('HTTP Error ' + result.statusCode + ' when listing all constraints.'), null);
		} 
	});
};


/*	Get all constraints.
	Example:
		listAllConstraints(callback);
		returns [ {
				  "label" : "Product",
				  "property-keys" : [ "pid" ],
				  "type" : "UNIQUENESS"
				}, {
				  "label" : "User",
				  "property-keys" : [ "email" ],
				  "type" : "UNIQUENESS"
				} ]								*/

Neo4j.prototype.listAllConstraints = function(callback){
	request
	.get(this.url + '/db/data/schema/constraint')
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
				callback(new Error('HTTP Error ' + result.statusCode + ' when listing all constraints.'), null);
		} 
	});
};

/*	Drop uniqueness constraint for a label and a property.
	Example:
	dropContstraint('User','email', callback);
		returns 	{
					  "label" : "User",
					  "type" : "UNIQUENESS",
					  "property-keys" : [ "email" ]
					}			*/

Neo4j.prototype.dropUniquenessContstraint = function(label, property_key, callback){	
	var val = new Validator();
	val.label(label).property(property_key);
	
	if(val.hasErrors)
		return callback(val.error(), null);

	request
		.del(this.url + '/db/data/schema/constraint/' + label + '/uniqueness/' + property_key)
		.send({ 'property_keys' : [property_key] })
		.set('Accept', 'application/json')
		.end(function(result){
			switch(result.statusCode){
				case 204:
					callback(null, true); // Constraint was deleted.
					break;
				case 404:
					callback(null, false); // Constraint doesn't exist.
					break;
				default:
					callback(new Error('HTTP Error ' + result.statusCode + ' when removing a uniqueness contraint.'), null);
			} 
		});
};

/* TRANSACTIONS */

//http://localhost:7474/db/data/transaction

/*	Begin a transaction
	You begin a new transaction by posting zero or more Cypher statements to the transaction endpoint. 
	The server will respond with the result of your statements, as well as the location of your open transaction.
	{
  "statements" : [ {
    "statement" : "CREATE (n {props}) RETURN n",
    "parameters" : {
      "props" : {
        "name" : "My Node"
      }
    }
  } ]
}
	Example:
		beginTransaction(, callback);
		*/


Neo4j.prototype.beginTransaction = function(statements, callback){	
	var that = this;
	request
		.post(this.url + '/db/data/transaction')
		.send(statements)
		.set('Accept', 'application/json')
		.end(function(result){
			switch(result.statusCode){
				case 201:
					that.addTransactionId(result.body, callback);
					break;
				case 404:
					callback(null, false);
					break;
				default:
					callback(new Error('HTTP Error ' + result.statusCode + ' when beginning transaction.'), null);
			} 
		});
};

Neo4j.prototype.addStatementsToTransaction = function(transactionId, statements, callback){
	var that = this;
	var val = new Validator();
	val.transaction(transactionId);

	if(val.hasErrors)
		return callback(val.error(), null);

	request
		.post(this.url + '/db/data/transaction/' + transactionId)
		.send(statements)
		.set('Accept', 'application/json')
		.end(function(result){
			console.log('ERRORCODE: ' + result.statusCode + '\n');
			switch(result.statusCode){
				case 200:
					that.addTransactionId(result.body, function afterAddingTransactionId (err, res) {
						if(res.errors && res.errors.length > 0)
							callback(new Error('An error occured when adding statements to the transaction. See "errors" inside the result for more details.'), res);
						else
							callback(null, res);
					});
					break;
				case 404:
					callback(null, false); // Transaction doesn't exist.
					break;
				default:
					callback(new Error('HTTP Error ' + result.statusCode + ' when adding statements to transaction.'), null);
			} 
		});
};

// Reset transaction timeout of an open transaction

Neo4j.prototype.resetTimeoutTransaction = function(transactionId, callback){
	var that = this;
	var val = new Validator();
	val.transaction(transactionId);

	if(val.hasErrors)
		return callback(val.error(), null);

	request
		.post(this.url + '/db/data/transaction/' + transactionId)
		.send({ statements : [ ]})
		.set('Accept', 'application/json')
		.end(function(result){
			console.log('ERRORCODE: ' + result.statusCode + '\n');
			switch(result.statusCode){
				case 200:
					that.addTransactionId(result.body, callback);
					break;
				case 404:
					callback(null, false); // Transaction doesn't exist.
					break;
				default:
					callback(new Error('HTTP Error ' + result.statusCode + ' when resetting transaction timeout.'), null);
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
								if(err) throw err;
								else {
									result.body.data = nodes;
									callback(null, result.body);
								}
						});
					} else 
						callback(null, result.body); 
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

/* Extract transactionId and add it as a property. */

Neo4j.prototype.addTransactionId = function(node, callback){
	var from = this.url.length + 21; // length of url and '/db/data/transaction/'
	var to = node.commit.indexOf('/', from); // next slash	
	node.transactionId = parseInt(node.commit.substring(from, to));	
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