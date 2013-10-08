var request = require('superagent'),
	Step = require('step'),
	util = require('util'),
	cypher = require('./lib/utils/cypher'),
	Validator = require('./lib/utils/validator');

module.exports = Neo4j;

var NODE_LENGTH = 14;			// '/db/data/node/'
var RELALATIONSHIP_LENGTH = 22;	// '/db/data/relationship/'
var TRANSACTION_LENGTH = 21;	// '/db/data/transaction/'

function Neo4j(url){
	if(typeof url !== 'undefined' && url !== ''){
		this.url = url;
	} else {
		this.url = 'http://localhost:7474';
	}
};


function debug (obj) {
	console.info(util.inspect(obj) + '\n\n');
}

/*	Insert a Node
	Returns the node that is inserted and his node id (property: _id)
	Examples:
	Insert a Node with no label:
		insertNode({ name: 'Kristof' }, callback);
	Insert a Node with one label:	
		insertNode({ name: 'Kristof' }, ['Student'], callback);
		insertNode({ name: 'Kristof' }, 'Student', callback);
		returns { _id: 14, name: 'Kristof' }
	Insert a Node with three labels:
		insertNode({ name:'Darth Vader', level: 99, hobbies: ['lightsaber fighting', 'cycling in space'], shipIds: [123, 321] }, ['User', 'Evil' ,'Man'], callback);
		returns { _id: 17, name:'Darth Vader', level: 99, hobbies: ['lightsaber fighting', 'cycling in space'], shipIds: [123, 321] }	*/

Neo4j.prototype.insertNode = function(node, labels, callback){
	var that = this;
	// Insert node without a label with post request
	if(typeof callback === 'undefined') {
		callback = labels;		
		request
			.post(this.url + '/db/data/node')
			.send(node)
			.end(function(result){
				if(result.body && result.body.data)
					that.addNodeId(result.body, callback);
				else 
					callback(new Error('Response body is empty'), null);
			});
	} else {
		var val = new Validator();

		if(val.labels(labels).hasErrors)
			return callback(val.error(), null);

		// Flexibility: make array of single string
		if(typeof labels === 'string')
			labels = [labels];

		// Insert node and label(s) with cypher query
		if(labels instanceof Array){ //cypher.params(node)
			var query = 'CREATE (data'+  cypher.stringify(labels) + ' {params}) RETURN data';
			this.cypherQuery(query, { params: node }, function(err, res) {				
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
	Get all labels of node 77:
		readLabels(77, callback); 
		returns ['User','Student','Man']
*/

Neo4j.prototype.readLabels = function(node_id, callback){		
	request
		.get(this.url + '/db/data/node/' + node_id + '/labels')		
		.end(function(result){
			if(result.body)
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
					callback(new Error('HTTP Error ' + result.statusCode + ' occurred while deleting a node.'), null);
			}
		});
};

/* Read a Node ---------- */

Neo4j.prototype.readNode = function(node_id, callback){
	var that = this;
	request
		.get(this.url + '/db/data/node/' + node_id)
		.end(function(result){
			switch(result.statusCode){
				case 200:
					that.addNodeId(result.body, callback); // Node found.
					break;
				case 404:
					callback(null, false); // Node doesn't exist.
					break;
				default:
					callback(new Error('HTTP Error ' + result.statusCode + ' occurred while reading a node.'), null);
			}			
		});
};

/* Update a Node ---------- */

Neo4j.prototype.updateNode = function(node_id, node_data, callback){
	var that = this;
	request
		.put(this.url + '/db/data/node/' + node_id + '/properties')
		.send(that.stringifyValueObjects(that.replaceNullWithString(node_data)))
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
				  'label' : 'Person',
				  'property-keys' : [ 'firstname' ]
				}
	Note:
	Compound indexes are not yet supported, only one property per index is allowed.
	So ['firstname', 'lastname'] is not supported yet. */

Neo4j.prototype.insertLabelIndex = function(label, property_key, callback){
	request
			.post(this.url + '/db/data/schema/index/' + label)
			.send({ 'property_keys' : [property_key] })	
			.end(function(result){
				if(result.body)
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
	request
		.del(this.url + '/db/data/index/' + index.type + '/' + index.index)
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
				.end(function(result){
			switch(result.statusCode){
				case 200:
					that.addNodeId(result.body, callback);
					break;
				case 201:
					that.addNodeId(result.body, callback);
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
		returns [ 'User', 'Person', 'Male', 'Animal' ] */

Neo4j.prototype.listAllLabels = function(callback){
	request
	.get(this.url + '/db/data/labels')
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
					  'label' : 'User',
					  'type' : 'UNIQUENESS',
					  'property-keys' : [ 'email' ]
					}			*/

Neo4j.prototype.createUniquenessContstraint = function(label, property_key, callback){	
	var val = new Validator();
	val.label(label).property(property_key);
	
	if(val.hasErrors)
		return callback(val.error(), null);

	request
		.post(this.url + '/db/data/schema/constraint/' + label + '/uniqueness')
		.send({ 'property_keys' : [property_key] })
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
				  'label' : 'User',
				  'property-keys' : [ 'email' ],
				  'type' : 'UNIQUENESS'
				} ]						 		*/

Neo4j.prototype.readUniquenessConstraint = function(label, property, callback){
	var val = new Validator();
	val.label(label).property(property);

	if(val.hasErrors)
		return callback();

	request
		.get(this.url + '/db/data/schema/constraint/' + label + '/uniqueness/' + property)
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
				  'label' : 'User',
				  'property-keys' : [ 'uid' ],
				  'type' : 'UNIQUENESS'
				}, {
				  'label' : 'User',
				  'property-keys' : [ 'email' ],
				  'type' : 'UNIQUENESS'
				} ]						 		*/

Neo4j.prototype.listAllUniquenessConstraintsForLabel = function(label, callback){
	var val = new Validator();
	val.label(label);
	if(val.hasErrors)
		return callback();
	request
		.get(this.url + '/db/data/schema/constraint/' + label + '/uniqueness')
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
				  'label' : 'Product',
				  'property-keys' : [ 'pid' ],
				  'type' : 'UNIQUENESS'
				}, {
				  'label' : 'User',
				  'property-keys' : [ 'email' ],
				  'type' : 'UNIQUENESS'
				} ]						*/

Neo4j.prototype.listAllConstraintsForLabel = function(label, callback){
	var val = new Validator();
	val.label(label);
	if(val.hasErrors)
		return callback()
	request
	.get(this.url + '/db/data/schema/constraint/' + label)
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
				  'label' : 'Product',
				  'property-keys' : [ 'pid' ],
				  'type' : 'UNIQUENESS'
				}, {
				  'label' : 'User',
				  'property-keys' : [ 'email' ],
				  'type' : 'UNIQUENESS'
				} ]								*/

Neo4j.prototype.listAllConstraints = function(callback){
	request
	.get(this.url + '/db/data/schema/constraint')
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
					  'label' : 'User',
					  'type' : 'UNIQUENESS',
					  'property-keys' : [ 'email' ]
					}			*/

Neo4j.prototype.dropUniquenessContstraint = function(label, property_key, callback){	
	var val = new Validator();
	val.label(label).property(property_key);
	
	if(val.hasErrors)
		return callback(val.error(), null);

	request
		.del(this.url + '/db/data/schema/constraint/' + label + '/uniqueness/' + property_key)
		.send({ 'property_keys' : [property_key] })
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

/*	NOTE:
	Details 'statements' property in beginTransaction, addStatementsToTransaction,
	commitTransaction and beginAndCommitTransaction:

	Return results in graph format by adding	resultDataContents : [ 'row', 'graph' ]	to a statement.
	If you want to understand the graph structure of nodes and relationships returned by your query,
	you can specify the 'graph' results data format. 
	For example, this is useful when you want to visualise the graph structure.
	The format collates all the nodes and relationships from all columns of the result,
	and also flattens collections of nodes and relationships, including paths.

	Note the resultDataContents property.

	Example of a 'statements' parameter:
	{
		statements:	[ { statement : 'CREATE ( bike:Bike { weight: 10 } )CREATE ( frontWheel:Wheel { spokes: 3 } )CREATE ( backWheel:Wheel { spokes: 32 } )CREATE p1 = bike -[:HAS { position: 1 } ]-> frontWheel CREATE p2 = bike -[:HAS { position: 2 } ]-> backWheel RETURN bike, p1, p2',
    					resultDataContents : [ 'row', 'graph' ]
					} ]
	}


/*	Begin a transaction
	You begin a new transaction by posting zero or more Cypher statements to the transaction endpoint. 
	The server will respond with the result of your statements, as well as the location of your open transaction.
	In the 'transaction' section you will find the expire date of the transaction. It's a RFC1123 formatted timestamp.
	The transactionId will be added to the result.
	Check the above 'NOTE' for more details about the statements parameter.

	Examples:
	beginTransaction(callback);
	returns  {
				commit: 'http://localhost:7474/db/data/transaction/10/commit',
				results: [],
				transaction: { expires: 'Tue, 24 Sep 2013 19:43:31 +0000' },
				errors: [],
				_id: 10
			}

	beginTransaction({
					  statements : [ {
					    statement : 'CREATE (n {props}) RETURN n',
					    parameters : {
					      props : {
					        name : 'Adam',
					        age: 22
					      }
					    }
					  } ]
					}, calback);	
	returns { 
				commit: 'http://localhost:7474/db/data/transaction/18/commit',
			  	results: [ { columns: [ 'person' ], data: [ { row: [ { age: 22, name: 'Adam' } ] } ] } ],
			  	transaction: { expires: 'Sun, 22 Sep 2013 19:31:17 +0000' },
			  	errors: [],
			  	_id: 18 
			}																								*/

Neo4j.prototype.beginTransaction = function(statements, callback){
	var that = this;
	if(!statements || typeof statements === 'function') {
		callback = statements;
		statements = { statements : [] };
	}
	request
		.post(this.url + '/db/data/transaction')
		.send(statements)
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

/*	Execute statements in an open transaction
	Given that you have an open transaction, you can make a number of requests, 
	each of which executes additional statements, and keeps the transaction open by resetting the transaction timeout.
	If the transaction in rolled back or it does not exist false will be returned (to callback)
	In the 'transaction' section you will find the expire date of the transaction. It's a RFC1123 formatted timestamp.
	The transactionId will be added to the result.
	Check the above 'NOTE' for more details about the statements parameter.

	Example:
		db.addStatementsToTransaction(7, {	
											statements : [ {
												statement : 'CREATE (p:Person {props}) RETURN p',
													parameters : {
														props : {
															name : 'Adam',
															age: 23
														}
													}
												}]
										}, callback);
		returns {
					commit: 'http://localhost:7474/db/data/transaction/22/commit',
					results: [],
					transaction: { expires: 'Wed, 25 Sep 2013 13:45:17 +0000' },
					errors: [],
					transactionId: 22
				}																		*/

Neo4j.prototype.addStatementsToTransaction = function(transactionId, statements, callback){
	var that = this;
	var val = new Validator();
	val.transaction(transactionId);

	if(val.hasErrors)
		return callback(val.error(), null);

	request
		.post(this.url + '/db/data/transaction/' + transactionId)
		.send(statements)
		.end(function(result){
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

/*	Reset transaction timeout of an open transaction
	Every orphaned transaction is automatically expired after a period of inactivity. 
	This may be prevented by resetting the transaction timeout.
	This request will reset the transaction timeout and return the new time at which 
	the transaction will expire as an RFC1123 formatted timestamp value in the “transaction” section of the response.
	If the transaction in rolled back or it does not exist false will be returned (to callback)
	The transactionId will be added to the result.

	Example:
		resetTimeoutTransaction(7, callback);
		returns {
					commit: 'http://localhost:7474/db/data/transaction/7/commit',
					results: [],
					transaction: { expires: 'Tue, 24 Sep 2013 18:13:43 +0000' },
					errors: [],
  					transactionId: 7 
  				}																	*/

Neo4j.prototype.resetTimeoutTransaction = function(transactionId, callback){
	var that = this;
	var val = new Validator();
	val.transaction(transactionId);

	if(val.hasErrors)
		return callback(val.error(), null);

	request
		.post(this.url + '/db/data/transaction/' + transactionId)
		.send({ statements : [ ]})
				.end(function(result){
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

/*	Commit an open transaction
	Given you have an open transaction, you can send a commit request. 
	Optionally, you submit additional statements along with the request that will 
	be executed before committing the transaction.
	If the transaction in rolled back or it does not exist false will be returned (to callback)
	Check the above 'NOTE' for more details about the statements parameter.
	
	Example:
	commitTransaction(7, {	
								statements : [ {
									statement : 'CREATE (p:Person {props}) RETURN p',
										parameters : {
											props : {
												name : 'Adam',
												age: 24,
												favoriteColors: ['Green', 'Vanilla White']
											}
										}
									}]
							});
	returns	{
				results: [ { columns: [ 'p' ],
				data: [ { row: [ {  name: 'Adam',
									age: 24,
									favoriteColors: [ 'Green', 'Vanilla White' ] } ] } ]
						} ],
				errors: [] 
			}					*/

Neo4j.prototype.commitTransaction = function(transactionId, statements, callback){
	var that = this;
	var val = new Validator();
	val.transaction(transactionId);

	if(val.hasErrors)
		return callback(val.error(), null);

	if(!statements || typeof statements === 'function') {
		callback = statements;
		statements = { statements : [] };
	}

	request
		.post(this.url + '/db/data/transaction/' + transactionId + '/commit')
		.send(statements)
		.end(function(result){
			switch(result.statusCode){
				case 200:
					callback(null, result.body);
					break;
				case 404:
					callback(null, false); // Transaction doesn't exist.
					break;
				default:
					callback(new Error('HTTP Error ' + result.statusCode + ' when commiting transaction.'), null);
			} 
		});
};

/*	Rollback an open transaction
	Given that you have an open transaction, you can send a roll back request. 
	The server will roll back the transaction.
	If the transaction was already rolled back or it does not exist false will be returned (to callback)
	If the transaction has been rolled back true will be returned.		

	Examples:
		rollbackTransaction(10, callback); // transaction 10 exists
		returns true
		rollbackTransaction(12345, callback); // transaction 12345 doesn't exist
		returns false																*/

Neo4j.prototype.rollbackTransaction = function(transactionId, callback){
	var that = this;
	var val = new Validator();
	val.transaction(transactionId);

	if(val.hasErrors)
		return callback(val.error(), null);

	request
		.del(this.url + '/db/data/transaction/' + transactionId)
		.end(function(result){
			switch(result.statusCode){
				case 200:
					callback(null, true);
					break;
				case 404:
					callback(null, false); // Transaction doesn't exist.
					break;
				default:
					callback(new Error('HTTP Error ' + result.statusCode + ' when rolling back transaction.'), null);
			} 
		});
};

/*	Begin and commit a transaction in one request
	If there is no need to keep a transaction open across multiple HTTP requests, you can begin a transaction, 
	execute statements, and commit with just a single HTTP request.
	If the transaction in rolled back or it does not exist false will be returned (to callback)
	Check the above 'NOTE' for more details about the statements parameter.

	Examples:
		beginAndCommitTransaction({	
									statements : [ {
										statement : 'CREATE (p:Person {props}) RETURN p',
											parameters : {
												props : {
													name : 'Adam',
													age: 21.17,
													favoriteNumbers: [123, 456789],
													gender: true
												}
											}
										}]
								}, callback);
		returns {	
					results: [ { columns: [ 'p' ],
					data: [ { row: [ {	gender: true,
										name: 'Adam',
										favoriteNumbers: [ 123, 456789 ],
										age: 21.17 } ] } ] } ],
					errors: []
				}

		beginAndCommitTransaction({	
									statements : [ {
										statement : 'CREATE (p:Person {props}) RETURN p',
										parameters : {
											props : {
												name : 'Adam',
												age: 21.17,
												favoriteNumbers: [123, 456789],
												gender: true
											}
										},
										resultDataContents : [ 'row', 'graph' ]
									}]
								}, callback);

		returns {	results: [ { columns: [ 'p' ],
					data: [ { row: [ {	gender: true,
										name: 'Adam',
										favoriteNumbers: [ 123, 456789 ],
										age: 21.17 } ],
										graph:{ nodes: [ {	id: '382',
															labels: [ 'Person' ],
															properties: {	gender: true,
																			name: 'Adam',
																			favoriteNumbers: [ 123, 456789 ],
																			age: 21.17 } } ],
																			relationships: [] } } ] } ],
					errors: [] }																				*/

Neo4j.prototype.beginAndCommitTransaction = function(statements, callback){
	request
		.post(this.url + '/db/data/transaction/commit')
		.set('X-Stream', true)
		.send(statements)
		.end(function(result){			
			switch(result.statusCode){
				case 200:
					callback(null, result.body);
					break;
				case 404:
					callback(null, false); // Transaction doesn't exist.
					break;
				default:
					callback(new Error('HTTP Error ' + result.statusCode + ' when beginning and commiting transaction.'), null);
			} 
		});
};

/* ADVANCED FUNCTIONS ---------- */

/* Get all Relationship Types -------- */

Neo4j.prototype.readRelationshipTypes = function(callback){	
	request
		.get(this.url + '/db/data/relationship/types')
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

/* Extract the id from a url */

Neo4j.prototype.getId = function(url, length){
	var from = this.url.length + length;// Example: length of url and '/db/data/transaction/'
	var to = url.indexOf('/', from);	// Next slash
	if(to === -1)
		to = url.length;
	return parseInt(url.substring(from, to));
};

/* Extract node_id and add it as a property. */

Neo4j.prototype.addNodeId = function(node, callback){	
	if (node && node.self) {
		node.data._id = parseInt(node.self
					.replace(this.removeCredentials(this.url) + '/db/data/node/', '')
					.replace(this.removeCredentials(this.url) + '/db/data/relationship/', ''));  
		callback(null, node.data);
	} else
		callback(null, node);
};

/*	Extract the transaction id and adds it as an _id property. */

Neo4j.prototype.addTransactionId = function(node,  callback){	
	node._id = this.getId(node.commit, TRANSACTION_LENGTH);
	delete node.commit;
	callback(null, node);
};

/*	Extract start node id (_start), end node id (_end) and node id (_id) add it as a property. */

Neo4j.prototype.addRelationshipId = function(relationship, callback){
	if(relationship.data) {
		relationship.data._start = this.getId(relationship.start, NODE_LENGTH);
		relationship.data._end = this.getId(relationship.end, NODE_LENGTH);
		relationship.data._id = this.getId(relationship.self, RELALATIONSHIP_LENGTH);
		relationship.data._type = relationship.type;
		callback(null, relationship.data);
	} else
		callback(new Error("Relationships data property doesn't exist.", null));
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