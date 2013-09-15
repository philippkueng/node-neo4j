var should = require('should'),
    neo4j = require('../main'),
    util = require('util');

var url = 'http://localhost:7474';

var db = new neo4j(url);

/*
 *
 * ---------------------------
 * MAKE SURE NODE 0 IS REMOVED
 * ---------------------------
 *
 */

db.deleteNode(0, function(err, node){
    console.log('node 0 removed');
});


/*
 *
 * -------------------------------------------
 * RUN TESTS WITH AGAINST EMPTY NEO4J INSTANCE
 * -------------------------------------------
 *
 */

describe('Testing Node specific operations for Neo4j', function(){

/* START => Create a Node */

    describe('=> Create a Node', function(){
        var node_id;
        var secondNodeId;
        var thirdNodeId;

		describe('-> A first simple valid node insertion with no labels', function(){
			it('should return the JSON for the first node', function(done){
				db.insertNode({name:'foobar'}, function(err, result){
					node_id = result.id;
					should.not.exist(err);
					should.exist(result);
					result.data.name.should.equal('foobar');
					result.id.should.not.equal('');
					done();
				});
			});
		});

		describe('-> A second valid node insertion with one label', function(){
			it('should return the JSON for the second node', function(done){
				db.insertNode({ name:'Philipp' },['User'], function(err, result){                	
					secondNodeId = result.id;
					should.not.exist(err);
					should.exist(result);
					result.data.name.should.equal('Philipp');
					result.id.should.not.equal('');
					done();
				});
			});
		});

		describe('-> A third valid node insertion with three labels', function(){
			it('should return the JSON for the third node', function(done){
				db.insertNode({ name:'Kristof' },['User','Student','Man'], function(err, result){                	
					thirdNodeId = result.id;
					should.not.exist(err);
					should.exist(result);
					result.data.name.should.equal('Kristof');
					result.id.should.not.equal('');
					done();
				});
			});
		});

		describe('-> An invalid node insertion with wrong "labels" parameter', function(){
			it('should give an error', function(done){
				db.insertNode({ name:'Mister Error' }, ':Must:Be:Array', function(err, result){                	
					should.exist(err);
					should.not.exist(result);					
					done();
				});
			});
		});

		describe('-> Get labels of the second node', function(){
			it('should return an array with one label', function(done){
				db.readLabels(secondNodeId, function(err, result){
					should.not.exist(err);
					should.exist(result);
					result.should.be.an.instanceOf(Array);
					result.should.have.lengthOf(1);
					result.should.include('User');
					done();
				});
			});
		});

		describe('-> Get labels of the third node', function(){
			it('should return an array with three labels', function(done){
				db.readLabels(thirdNodeId, function(err, result){
					should.not.exist(err);
					should.exist(result);
					result.should.be.an.instanceOf(Array);
					result.should.have.lengthOf(3);
					result.should.include('User');
					result.should.include('Student');
					result.should.include('Man');
					done();
				});
			});
		});

        // Remove these three nodes afterwards
		after(function(done){
			db.deleteNode(node_id, function(err, result){
				db.deleteNode(secondNodeId, function(err, result){
					db.deleteNode(thirdNodeId, function(err, result){
						done();
					});
				});
			});
		});

        var second_node_id;

        describe('-> A node with properties containing Unicode characters', function(){
            it('should return the JSON for that node', function(done){
                db.insertNode({name:'√ fööbar √'}, function(err, result){
                    second_node_id = result.id;
                    should.exist(result);
                    result.data.name.should.equal('√ fööbar √');
                    result.id.should.not.equal('');
                    done();
                });
            });
        });

        after(function(done){
            db.deleteNode(second_node_id, function(err, result){
                done();
            });
        });
    });

/* END => Create a Node */

/* START => Delete a Node */

    describe('=> Delete a Node', function(){
        var node_id;

        // Insert a Node.
        before(function(done){
            db.insertNode({name:'foobar'}, function(err, result){
                node_id = result.id;
                done();
            });
        })

        describe('-> Deleting an existing Node without Relationships', function(){
            it('should delete the Node without issues', function(done){
                db.deleteNode(node_id, function(err, result){
                    result.should.equal(true);
                    done();
                });
            });
        });

        describe('-> Delete an non-existig Node', function(){
           it('should return false as a result since Node cannot be found', function(done){
               db.deleteNode(node_id, function(err, result){
                  result.should.equal(false);
                  done();
               });
           });
        });

        after(function(done){
            db.deleteNode(node_id, function(err, result){
                done();
            });
        });
    });

/* END => Delete a Node */

/* START => Read a Node */

    describe('=> Read a Node', function(){
        var node_id;

        //Insert a Node.
        before(function(done){
            db.insertNode({name:'foobar'}, function(err, node){
                node_id = node.id;
                done();
            });
        });

        describe('-> Read an existing Node', function(){
            it('should return the JSON for that node', function(done){
                db.readNode(node_id, function(err, result){
                    result.data.name.should.equal('foobar');
                    result.id.should.equal(node_id);
                    done();
                });
            });
        });

        // Remove Node afterwards.
        after(function(done){
            db.deleteNode(node_id, function(err, result){
                done();
            });
        });

        describe('-> Read an non-existing Node', function(){
            it('should return null for the node and the error messsage', function(done){
                db.readNode(99999999, function(err, result){
                    should.not.exist(result);
                    done();
                });
            });
        });
    });

/* END => Read a Node */

/* START => Update a Node */

    describe('=> Update a Node', function(){
        var node_id;

        //Insert a Node.
        before(function(done){
            db.insertNode({name:'foobar'}, function(err, node){
                node_id = node.id;
                done();
            });
        });

        describe('-> Update an existing Node with a simple object', function(){
            it('should return true', function(done){
                db.updateNode(node_id, {name:'foobar2'}, function(err, result){
                    should.not.exist(err);
                    result.should.equal(true);
                    done();
                });
            });
        });

        describe('-> Update an existing Node with an object with null values', function(){
            it('should return true', function(done){
                db.updateNode(node_id,{name:'foobar3',age:null}, function(err, result){
                    should.not.exist(err);
                    result.should.equal(true);
                    done();
                });
            });
        });

        describe('-> Update an existing Node with an object with an object as value', function(){
            var test_obj = {
                name: 'foobar',
                family: {
                    mother: 'barfii',
                    father: 'barfoo'
                }
            };

            it('should return true', function(done){
                db.updateNode(node_id, test_obj, function(err, result){
                    should.not.exist(err);
                    result.should.equal(true);
                    done();
                });
            });
        });

        // Remove Node afterwards.
        after(function(done){
            db.deleteNode(node_id, function(err, result){
                done();
            });
        });
    });

/* END => Update a Node */

/* START => Insert a Relationship */

    describe('=> Insert a Relationship', function(){

        var test_obj = {
                importance: 'high',
                age: null,
                description: {
                    positive: 'fullfilling',
                    negative: 'too time consuming'
                }
        };

        describe('-> Insert a Relationship with root_node and other_node not existing', function(){
            it('should return false', function(done){
                db.insertRelationship(99999999, 99999998, 'RELATED_TO', {}, function(err, result){
                    should.not.exist(err);
                    result.should.equal(false);
                    done();
                });
            });
        });

        var root_node_id;

        before(function(done){
            db.insertNode({name:'foobar'}, function(err, node){
                root_node_id = node.id;
                done();
            });
        });

        describe('-> Insert a Relationship with other_node not existing', function(){

            it('should return false', function(done){
                db.insertRelationship(root_node_id, 99999998, 'RELATED_TO', {}, function(err, result){
                    should.not.exist(err);
                    result.should.equal(false);
                    done();
                });
            });

        });

        describe('-> Insert a Relationship with root_node not existing', function(){
            it('should return false', function(done){
                db.insertRelationship(99999998, root_node_id, 'RELATED_TO', {}, function(err, result){
                    should.not.exist(err);
                    result.should.equal(false);
                    done();
                });
            });
        });

        var other_node_id;
        var relationship_id;

        before(function(done){
            db.insertNode({name:'foobar2'}, function(err, node){
                other_node_id = node.id;
                done();
            });
        });

        describe('-> Insert a Relationship with both nodes existing', function(){
            it('should return true', function(done){
                db.insertRelationship(root_node_id, other_node_id, 'RELATED_TO', test_obj, function(err, result){
                    relationship_id = result.id; // Used for later cleanup process.
                    should.not.exist(err);
                    result.type.should.equal('RELATED_TO');
                    result.data.importance.should.equal('high');
                    result.data.age.should.equal('');
                    done();
                });
            });
        });

        after(function(done){
            db.deleteRelationship(relationship_id, function(err, result){
                db.deleteNode(other_node_id, function(err, result){
                    db.deleteNode(root_node_id, function(err, result){
                        done();
                    });
                });
            });
        });
    });

/* END => Insert a Relationship */

/* START => Delete a Relationship */

    describe('=> Delete a Relationship', function(){

        describe('-> Deleting a non existing Relationship', function(){
            it('should return false', function(done){
                db.deleteRelationship(99999999, function(err, result){
                    should.not.exist(err);
                    result.should.equal(false);
                    done();
                });
            });
        });

        var root_node_id;
        var other_node_id;
        var relationship_id;

        // Creating 2 Nodes and a Relationship connecting them.
        before(function(done){
            db.insertNode({name:'foobar'},function(err, node1){
                root_node_id = node1.id;
                db.insertNode({name:'foobar2'}, function(err, node2){
                    other_node_id = node2.id;
                    db.insertRelationship(root_node_id, other_node_id, 'RELATED_TO', {}, function(err, result){
                        relationship_id = result.id;
                        done();
                    });
                });
            });
        });

        describe('-> Deleting an existing Relationship', function(){
            it('should return true', function(done){
                db.deleteRelationship(relationship_id, function(err, result){
                    should.not.exist(err);
                    result.should.equal(true);
                    done();
                });
            });
        });

        after(function(done){
            db.deleteNode(other_node_id, function(err, result){
                db.deleteNode(root_node_id, function(err, result){
                    done();
                });
            });
        });
    });

/* END => Delete a Relationship */

    describe('=> Read a Relationship', function(){
        describe('-> Read a non-existing Relationship', function(){
            it('should return false', function(done){
                db.readRelationship(99999999, function(err, result){
                    should.not.exist(err);
                    result.should.equal(false);
                    done();
                });
            });
        });

        var root_node_id;
        var other_node_id;
        var relationship_id;

        before(function(done){
            db.insertNode({name:'foobar'}, function(err, node1){
                root_node_id = node1.id;
                db.insertNode({name:'foobar2'}, function(err, node2){
                    other_node_id = node2.id;
                    db.insertRelationship(root_node_id, other_node_id, 'RELATED_TO', {}, function(err, relationship){
                        relationship_id = relationship.id;
                        done();
                    });
                });
            });
        });

        describe('-> Read an existing Node', function(){
            it('should return relationship data', function(done){
                db.readRelationship(relationship_id, function(err, result){
                    should.not.exist(err);
                    result.should.not.equal(false);
                    result.type.should.equal('RELATED_TO');
                    done();
                });
            });
        });

        after(function(done){
            db.deleteRelationship(relationship_id, function(err, result){
                db.deleteNode(other_node_id, function(err, result){
                    db.deleteNode(root_node_id, function(err, result){
                        done();
                    });
                });
            });
        });
    });

    describe('=> Update a Relationship', function(){

        var test_obj = {
                importance: 'high',
                age: null,
                description: {
                    positive: 'fullfilling',
                    negative: 'too time consuming'
                }
            };

        describe('-> Update a non-existing Relationship', function(){
            it('should return false', function(done){
                db.updateRelationship(99999999, test_obj, function(err, result){
                    should.not.exist(err);
                    result.should.equal(false);
                    done();
                });
            });
        });

        var root_node_id;
        var other_node_id;
        var relationship_id;

        before(function(done){
            db.insertNode({name:'foobar'}, function(err, node1){
                root_node_id = node1.id;
                db.insertNode({name:'foobar2'}, function(err, node2){
                    other_node_id = node2.id;
                    db.insertRelationship(root_node_id, other_node_id, 'RELATED_TO', {}, function(err, relationship){
                        relationship_id = relationship.id;
                        done();
                    });
                });
            });
        });

        describe('-> Update an existing Relationship', function(){
            it('should return relationship data', function(done){
                db.updateRelationship(relationship_id, test_obj, function(err, result){
                    should.not.exist(err);
                    result.should.equal(true);
                    done();
                });
            });
        });

        after(function(done){
            db.deleteRelationship(relationship_id, function(err, result){
                db.deleteNode(other_node_id, function(err, result){
                    db.deleteNode(root_node_id, function(err, result){
                        done();
                    });
                });
            });
        });
    });
    
    describe('=> Insert an Index', function(){
        
        var test_index1 = 'test_index1';
        var test_index2 = {
            type: 'node',
            index: 'test_index2',
            config: {
                type: 'fulltext',
                provider: 'lucene'
            }  
        };
        var test_index3_label = 'Person';
        var test_index3_property = 'firstname'; // only one property supported right now

        describe('-> Insert a non existing index without configuration', function(){
            it('should return the index', function(done){
                db.insertNodeIndex(test_index1, function(err, result){
                    should.not.exist(err);
                    result.template.should.equal('http://localhost:7474/db/data/index/node/test_index1/{key}/{value}');
                    done();
                });
            });
        });
        
        describe('-> Insert a non existing index with configuration', function(){
            it('should return the index', function(done){
                db.insertIndex(test_index2, function(err, result){
                    should.not.exist(err);
                    result.template.should.equal('http://localhost:7474/db/data/index/node/test_index2/{key}/{value}');
                    result.type.should.equal('fulltext');
                    result.provider.should.equal('lucene');
                    done();
                });
            });
        });

        /*	Create an index on a property of a label 
			Example:
			Create an index on the first name and last name of a person.
				insertLabelIndex('Person', 'firstname', callback);
				returns {
						  "label" : "Person",
						  "property-keys" : [ "firstname" ]
						}
			Note:
			Compound indexes are not yet supported, only one property per index is allowed.
			So ['firstname', 'lastname'] is not supported yet. */

        describe('-> Insert a non existing index on ONLY ONE property of a label', function(){
            it('should return the index', function(done){
                db.insertLabelIndex(test_index3_label, test_index3_property, function(err, result){
                    should.not.exist(err);
                    should.exist(result);
                    result.should.have.property('label','Person');
                    result.should.have.property('property-keys');                    
                    result['property-keys']
                    done();
                });
            });
        });
        
        after(function(done){
            db.deleteIndex(test_index2, function(err, result){
                if (err) throw err;
                db.deleteIndex({type: 'node', index: test_index1}, function(err, result){
                    if (err) throw err;
					db.deleteLabelIndex(test_index3_label, test_index3_property, function(err, result){
						if (err) throw err;
						done();
                	});
                });
            });
        });
    }); // END => Insert an Index

/* START => List indexes */

    describe('=> List indexes', function(){
    	var label = 'City';
    	var propertyOne = 'postalcode';
    	var propertyTwo = 'name';

        before(function(done){
            db.insertIndex({type: 'node', index: 'list_test_index'}, function(err, result){
                if (err) throw err;
                /* Create an index on postalcode & an index on name of a City */
                db.insertLabelIndex('City', 'postalcode', function(err, result){
                	if (err) throw err;
                	db.insertLabelIndex('City', 'name', function(err, result){
                		if (err) throw err;
                		done();
            		});
            	});
            });
        });
        
        describe('-> List all existing indexes', function(){
            it('should return the indexes', function(done){
                db.listNodeIndexes(function(err, result){
                    should.not.exist(err);
                    result.list_test_index.template.should.equal('http://localhost:7474/db/data/index/node/list_test_index/{key}/{value}');
                    result.list_test_index.provider.should.equal('lucene');
                    result.list_test_index.type.should.equal('exact');
                    done();
                });
            });
        });

        describe('-> List indexes for a label', function(){
            it('should return the indexes of that label', function(done){
                db.listLabelIndexes(label, function(err, result){
					should.not.exist(err);
					should.exist(result);
					result.should.be.an.instanceOf(Array);
					result.should.have.lengthOf(2);
                    done();
                });
            });
        });
        
		after(function(done){
			db.deleteIndex({type: 'node', index: 'list_test_index'}, function(err, result){
				if (err) throw err;
				db.deleteLabelIndex(label, propertyOne, function(err, result){
					if (err) throw err;
					db.deleteLabelIndex(label, propertyTwo, function(err, result){
						if (err) throw err;
						done(); 
					});
				});
            });
        });
    });

/* END => List indexes */

/* START => Delete an Index -------*/

    describe('=> Delete an Index', function(){
    	var label = 'City';
    	var property = 'postalcode';

        before(function(done){
            db.insertNodeIndex('delete_test_index', function(err, result){
				if (err) throw err;
				db.insertLabelIndex(label, property, function(err, result){
					if (err) throw err;
					done();
				});
			});
		});

        describe('-> Delete existing node', function(){
            it('should delete the node', function(done){
                db.deleteNodeIndex('delete_test_index', function(err, result){
                    should.not.exist(err);
                    result.should.equal(true);
                    done();
                });
            });
        });       

        describe('-> Delete existing label index', function(){
            it('should delete the label index for that property and return true', function(done){
                db.deleteLabelIndex(label, property, function(err, result){
                    should.not.exist(err);
                    result.should.equal(true);
                    done();
                });
            });
        });

        describe('-> Delete non-existing label index', function(){
            it('should return false because index does not exist', function(done){
                db.deleteLabelIndex(label, property, function(err, result){
                    should.not.exist(err);
                    result.should.equal(false);
                    done();
                });
            });
        });
    });

/* END => Delete an Index -------*/

/* START => Add a Node to an Index -------*/

    describe('=> Add a Node to an Index', function(){
        root_node_id = null;
        before(function(done){
            db.insertNodeIndex('add_node_test_index', function(err, result){
                if (err) throw err;
                db.insertNode({name:'foobar'}, function(err, node1){
                    root_node_id = node1.id;
                    done();
                });
            });
        });

        describe('-> Add a non-existing Node to an Index', function(){
            it('should throw an error', function(done){
                db.addNodeToIndex(99999, 'add_node_test_index', 'test_index_key', 'test_index_value', function(err, result){
                    should.exist(err);
                    should.not.exist(result);
                    done();
                });
            });
        });

        describe('-> Add an existing Node to an Index', function(){
            it('should throw an error', function(done){
                db.addNodeToIndex(root_node_id, 'add_node_test_index', 'test_index_key', 'test_index_value', function(err, result){
                    should.not.exist(err);
                    should.exist(result);
                    should.exist(result.indexed);
                    result.data.name.should.equal('foobar');
                    done();
                });
            });
        });

        after(function(done){
            db.deleteNode(root_node_id, function(err, result){
                if (err) throw err;
                done();
            });
        });
    });

/* END => Add a Node to an Index -------*/

/* START => Add one or multiple Labels to a Node -------*/

	describe('=> Add one or multiple Labels to a Node', function(){
		var nodeId;
		before(function(done){
			db.insertNode({name:'Brussels'}, function(err, node){
				nodeId = node.id;
				done();
			});
		});

		describe('-> Add one Label to a Node', function(){
			it('should return true if label was successfully added', function(done){
				db.addLabelsToNode(nodeId, 'City', function(err, result){                	
					should.not.exist(err);
					should.exist(result);
					result.should.equal(true);					
					db.readLabels(nodeId, function (err, result) {
						should.not.exist(err);
						should.exist(result);
						result.should.be.an.instanceOf(Array);
						result.should.have.lengthOf(1);
						result.should.include('City');
						done();
					});
				});
			});
		});

		describe('-> Add multiple Labels to a Node', function(){
			it('should return true if the labels were successfully added', function(done){
				db.addLabelsToNode(nodeId, ['Capital','Belgium','Frietjes'], function(err, result){                	
					should.not.exist(err);
					should.exist(result);
					result.should.equal(true);
					db.readLabels(nodeId, function (err, result) {
						should.not.exist(err);
						should.exist(result);
						result.should.be.an.instanceOf(Array);
						result.should.have.lengthOf(4);
						result.should.include('City');
						result.should.include('Capital');
						result.should.include('Belgium');
						result.should.include('Frietjes');
						done();
					});
				});
			});
		});

		describe('-> Add wrong Label to a Node', function(){
			it('should return an error message', function(done){
				db.addLabelsToNode(nodeId, null, function(err, result){
					should.exist(err);
					should.not.exist(result);
					done();
				});
			});
		});

		describe('-> Add multiple labels with one wrong Label to a Node', function(){
			it('should return an error message', function(done){
				db.addLabelsToNode(nodeId, ['User', ''], function(err, result){
					should.exist(err);
					should.not.exist(result);
					done();
				});
			});
		});

		describe('-> Add a Label to a non-existing Node', function(){
			it('should return false because Node does not exist', function(done){
				db.addLabelsToNode(123456789, 'City', function(err, result){
					should.not.exist(err);
					should.exist(result);
					result.should.equal(false);
					done();
				});
			});
		});

        after(function(done){
            db.deleteNode(nodeId, function(err, result){
                if (err) throw err;
                done();
            });
        });
    }); 

/* END => Add one or multiple Labels to a Node -------*/

/* START => Replace all Labels on a Node -------*/

	describe('=> Replace all Labels on a Node', function(){
		var nodeId;
		before(function(done){
			db.insertNode({name:'Brussels'}, function(err, node){
				nodeId = node.id;
				db.addLabelsToNode(nodeId, ['Capital','Belgium','Frietjes'], function(err, result){   
					if (err) throw err;
					done();
				});
			});
		});

		describe('-> Replace all labels by one new label', function(){
			it('should return true if the labels were successfully changed', function(done){
				db.replaceLabelsFromNode(nodeId, 'Dutch', function(err, result){                	
					should.not.exist(err);
					should.exist(result);
					result.should.equal(true);
					db.readLabels(nodeId, function (err, result) {
						should.not.exist(err);
						should.exist(result);
						result.should.be.an.instanceOf(Array);
						result.should.have.lengthOf(1);
						result.should.include('Dutch');						
						done();
					});
				});
			});
		});

		describe('-> Replace all labels by multiple new labels', function(){
			it('should return true if the labels were successfully changed', function(done){
				db.replaceLabelsFromNode(nodeId, ['Dutch', 'French', 'German'], function(err, result){                	
					should.not.exist(err);
					should.exist(result);
					result.should.equal(true);
					db.readLabels(nodeId, function (err, result) {
						should.not.exist(err);
						should.exist(result);
						result.should.be.an.instanceOf(Array);
						result.should.have.lengthOf(3);
						result.should.include('Dutch');
						result.should.include('French');
						result.should.include('German');
						done();
					});
				});
			});
		});

		describe('-> Replace all labels by an invalid label: [null]', function(){
			it('should return an error message', function(done){
				db.replaceLabelsFromNode(nodeId, [null], function(err, result){
					should.exist(err);
					should.not.exist(result);
					done();
				});
			});
		});

		describe('-> Replace all labels by an invalid label: [""]', function(){
			it('should return an error message', function(done){
				db.replaceLabelsFromNode(nodeId, [''], function(err, result){					
					should.exist(err);
					should.not.exist(result);
					done();
				});
			});
		});

		describe('-> Replace all labels by an invalid label: null', function(){
			it('should return an error message', function(done){
				db.replaceLabelsFromNode(nodeId, null, function(err, result){					
					should.exist(err);
					should.not.exist(result);
					done();
				});
			});
		});		

		describe('-> Replace all labels of a non-existing Node', function(){
			it('should return false because Node does not exist', function(done){
				db.replaceLabelsFromNode(123456789, ['City'], function(err, result){					
					should.not.exist(err);
					should.exist(result);
					result.should.equal(false);
					done();
				});
			});
		});

        after(function(done){
            db.deleteNode(nodeId, function(err, result){
                if (err) throw err;
                done();
            });
        });
    }); 

/* END => Replace all Labels on a Node -------*/






    // describe('=> Remove all ')

    /* ADVANCED FUNCTIONS ---------- */

    describe('=> Read Relationship Types already within the DB', function(){

        var root_node_id;
        var other_node_id;
        var relationship_id;

        before(function(done){
            db.insertNode({name:'foobar'}, function(err, node1){
                root_node_id = node1.id;
                db.insertNode({name:'foobar2'}, function(err, node2){
                    other_node_id = node2.id;
                    db.insertRelationship(root_node_id, other_node_id, 'RELATED_TO', {}, function(err, relationship){
                        relationship_id = relationship.id;
                        done();
                    });
                });
            });
        });

        describe('-> Retrieve types', function(){
            it('should return an array of types', function(done){
                db.readRelationshipTypes(function(err, result){

                    should.not.exist(err);
                    result.length.should.equal(1);
                    result[0].should.equal('RELATED_TO');
                    done();
                });
            });
        });

        after(function(done){
            db.deleteRelationship(relationship_id, function(err, result){
                db.deleteNode(other_node_id, function(err, result){
                    db.deleteNode(root_node_id, function(err, result){
                        done();
                    });
                });
            });
        });

    });

    describe('=> Read all Relationships of a Node', function(){

        describe('-> Read all Relationships of an non-existing node', function(){
            it('should return false', function(done){
                db.readAllRelationshipsOfNode(99999999, function(err, result){
                    should.not.exist(err);
                    result.should.equal(false);
                    done();
                });
            });
        });

        var root_node_id;
        var other_node1_id;
        var other_node2_id;
        var relationship1_id;
        var relationship2_id;

        before(function(done){
            db.insertNode({name:'foobar'}, function(err, node1){
                root_node_id = node1.id;
                db.insertNode({name:'foobar2'}, function(err, node2){
                    other_node1_id = node2.id;
                    db.insertRelationship(root_node_id, other_node1_id, 'RELATED_TO', {}, function(err, relationship1){
                        relationship1_id = relationship1.id;

                        db.insertNode({name:'foobar3'}, function(err, node3){
                            other_node2_id = node3.id;
                            db.insertRelationship(root_node_id, other_node2_id, 'RELATED_TO', {}, function(err, relationship2){
                                relationship2_id = relationship2.id;
                                done();
                            });
                        });
                    });
                });
            });
        });

        describe('-> Read Relationships of root_node', function(){
            it('should return 2 relationships', function(done){
                db.readAllRelationshipsOfNode(root_node_id, function(err, result){
                    should.not.exist(err);
                    result.length.should.equal(2);
                    done();
                });
            });
        });

        after(function(done){
            db.deleteRelationship(relationship1_id, function(err, result){
                db.deleteRelationship(relationship2_id, function(err, result){
                    db.deleteNode(other_node1_id, function(err, result){
                        db.deleteNode(other_node2_id, function(err, result){
                            db.deleteNode(root_node_id, function(err, result){
                                done();
                            });
                        });
                    });
                });
            });
        });

    });


    describe('=> Read incoming Relationships of a Node', function(){

        describe('-> Read incoming Relationships of an non-existing node', function(){
            it('should return false', function(done){
                db.readIncomingRelationshipsOfNode(99999999, function(err, result){
                    should.not.exist(err);
                    result.should.equal(false);
                    done();
                });
            });
        });

        var root_node_id;
        var other_node1_id;
        var other_node2_id;
        var relationship1_id;
        var relationship2_id;

        before(function(done){
            db.insertNode({name:'foobar'}, function(err, node1){
                root_node_id = node1.id;
                db.insertNode({name:'foobar2'}, function(err, node2){
                    other_node1_id = node2.id;
                    db.insertRelationship(other_node1_id, root_node_id, 'RELATED_TO', {}, function(err, relationship1){
                        relationship1_id = relationship1.id;

                        db.insertNode({name:'foobar3'}, function(err, node3){
                            other_node2_id = node3.id;
                            db.insertRelationship(other_node2_id, root_node_id, 'RELATED_TO', {}, function(err, relationship2){
                                relationship2_id = relationship2.id;
                                done();
                            });
                        });
                    });
                });
            });
        });

        describe('-> Read Relationships of root_node', function(){
            it('should return 2 relationships', function(done){
                db.readIncomingRelationshipsOfNode(root_node_id, function(err, result){
                    should.not.exist(err);
                    result.length.should.equal(2);
                    done();
                });
            });
        });

        describe('-> Read Relationships of other_node1', function(){
            it('should return 0 relationships', function(done){
                db.readIncomingRelationshipsOfNode(other_node1_id, function(err, result){
                    should.not.exist(err);
                    result.length.should.equal(0);
                    done();
                });
            });
        });

        after(function(done){
            db.deleteRelationship(relationship1_id, function(err, result){
                db.deleteRelationship(relationship2_id, function(err, result){
                    db.deleteNode(other_node1_id, function(err, result){
                        db.deleteNode(other_node2_id, function(err, result){
                            db.deleteNode(root_node_id, function(err, result){
                                done();
                            });
                        });
                    });
                });
            });
        });

    });

    describe('=> Read all outgoing Relationships of a Node', function(){

        describe('-> Read outgoing Relationships of an non-existing node', function(){
            it('should return false', function(done){
                db.readOutgoingRelationshipsOfNode(99999999, function(err, result){
                    should.not.exist(err);
                    result.should.equal(false);
                    done();
                });
            });
        });

        var root_node_id;
        var other_node1_id;
        var other_node2_id;
        var relationship1_id;
        var relationship2_id;

        before(function(done){
            db.insertNode({name:'foobar'}, function(err, node1){
                root_node_id = node1.id;
                db.insertNode({name:'foobar2'}, function(err, node2){
                    other_node1_id = node2.id;
                    db.insertRelationship(root_node_id, other_node1_id, 'RELATED_TO', {}, function(err, relationship1){
                        relationship1_id = relationship1.id;

                        db.insertNode({name:'foobar3'}, function(err, node3){
                            other_node2_id = node3.id;
                            db.insertRelationship(root_node_id, other_node2_id, 'RELATED_TO', {}, function(err, relationship2){
                                relationship2_id = relationship2.id;
                                done();
                            });
                        });
                    });
                });
            });
        });

        describe('-> Read Relationships of root_node', function(){
            it('should return 2 relationships', function(done){
                db.readOutgoingRelationshipsOfNode(root_node_id, function(err, result){
                    should.not.exist(err);
                    result.length.should.equal(2);
                    done();
                });
            });
        });

        describe('-> Read Relationships of other_node1', function(){
            it('should return 0 relationships', function(done){
                db.readOutgoingRelationshipsOfNode(other_node1_id, function(err, result){
                    should.not.exist(err);
                    result.length.should.equal(0);
                    done();
                });
            });
        });

        after(function(done){
            db.deleteRelationship(relationship1_id, function(err, result){
                db.deleteRelationship(relationship2_id, function(err, result){
                    db.deleteNode(other_node1_id, function(err, result){
                        db.deleteNode(other_node2_id, function(err, result){
                            db.deleteNode(root_node_id, function(err, result){
                                done();
                            });
                        });
                    });
                });
            });
        });

    });

    describe('=> Test Cyper Query Functionality against non existing nodes', function(){

        describe('-> Run a cypher query against a non existing node', function(){
            it('should return an error since node does not exist', function(done){
                db.cypherQuery("start x=node(100) return x", null, function(err, result){
                    should.exist(err);
                    should.not.exist(result);
                    done();
                });
            });
        });

        describe('-> Run the cypher query from issue 2 from @glefloch against non existing nodes', function(done){
            it('should return a error since the nodes do not exist', function(done){
                db.cypherQuery("START d=node(100), e=node(102) MATCH p=shortestPath(d -[*..15]-> e) RETURN p", null, function(err, result){
                    should.exist(err);
                    should.not.exist(result);
                    done();
                });
            });
        });

        describe('-> Run the cypher query from issue 8 by @electrichead against non existing nodes', function(done){
            it('should return null since no data matches the query', function(done){
                db.cypherQuery("start a=node(*) with a match a-[r1?:RELATED_TO]->o return a.name,o.name", null, function(err, result){
                    should.not.exist(err);
                    should.exist(result);
                    result.data.length.should.equal(0);
                    result.columns.length.should.equal(2);
                    result.columns[0].should.equal('a.name');
                    done();
                });
            });
        });
    });

    describe('=> Test Cypher Query Functionality against existing nodes and relationships', function(){
        var root_node_id;
        var other_node1_id;
        var other_node2_id;
        var relationship1_id;
        var relationship2_id;

        before(function(done){
            db.insertNode({name:'foobar'}, function(err, node1){
                root_node_id = node1.id;
                db.insertNode({name:'foobar2'}, function(err, node2){
                    other_node1_id = node2.id;
                    db.insertRelationship(root_node_id, other_node1_id, 'RELATED_TO', {}, function(err, relationship1){
                        relationship1_id = relationship1.id;

                        db.insertNode({name:'foobar3'}, function(err, node3){
                            other_node2_id = node3.id;
                            db.insertRelationship(root_node_id, other_node2_id, 'RELATED_TO', {}, function(err, relationship2){
                                relationship2_id = relationship2.id;
                                done();
                            });
                        });
                    });
                });
            });
        });
        
        describe('-> Run a cypher query against an existing root node', function(){
            it('should return a dataset with a single node', function(done){
                db.cypherQuery("START user = node({id}) RETURN user", { id: root_node_id }, function(err, result){
                	//console.log('RESULT IS: ' + util.inspect(result));
                    should.not.exist(err);
                    result.data.length.should.equal(1);
                    result.data[0].id.should.equal(root_node_id);
                    result.columns.length.should.equal(1);
                    done();
                });
            });
        });

        describe('-> Run a cypher query against root_node retrieving all nodes related to it with a RELATED_TO type relationship', function(done){
            it('should return a dataset with 2 nodes', function(done){
                db.cypherQuery("START user = node({id}) MATCH user-[:RELATED_TO]->friends RETURN friends", { id: root_node_id }, function(err, result){
                    should.not.exist(err);
                    result.data.length.should.equal(2);
                    result.columns.length.should.equal(1);
                    should.exist(result.data[0].id);
                    should.exist(result.data[1].id);
                    done();
                });
            });
        });

        describe('-> Run the cypher query from issue 2 from @glefloch', function(done){
            it('should return a valid response', function(done){
                db.cypherQuery("START d=node({dId}), e=node({eId}) MATCH p=shortestPath(d -[*..15]-> e) RETURN p", 
                	{ dId: root_node_id, eId: other_node1_id }, function(err, result){
                    should.not.exist(err);
                    result.data.length.should.equal(1);
                    result.columns.length.should.equal(1);
                    should.exist(result.data[0].start);
                    result.data[0].nodes.length.should.equal(2);
                    result.data[0].relationships.length.should.equal(1);
                    should.exist(result.data[0].end);
                    done();
                });
            });
        });

        describe('-> Run the cypher query from issue 8 by @electrichead against non existing nodes', function(done){
            it('should return a valid response', function(done){
                db.cypherQuery("START a=node(*) match a-[r1?:RELATED_TO]->o RETURN a.name,o.name", function(err, result){
                    should.not.exist(err);
                    should.exist(result);
                    result.data.length.should.equal(8);
                    result.data[0].should.equal('foobar');
                    result.data[1].should.equal('foobar2');
                    result.data[2].should.equal('foobar');
                    result.data[3].should.equal('foobar3');
                    result.columns.length.should.equal(2);
                    result.columns[0].should.equal('a.name');
                    done();
                });
            });
        });
        
        describe('-> Run the cypher query from issue 7 from @Zaxnyd', function(done){
            it('should return a node and the relationships', function(done){
                db.cypherQuery("START r=relationship(*) MATCH (s)-[r]->(t) RETURN *", function(err, result){
                	should.not.exist(err);
                    result.data.length.should.equal(6);
                    result.columns.length.should.equal(3);
                    done();
                });
            });
        });

        after(function(done){
            db.deleteRelationship(relationship1_id, function(err, result){
                db.deleteRelationship(relationship2_id, function(err, result){
                    db.deleteNode(other_node1_id, function(err, result){
                        db.deleteNode(other_node2_id, function(err, result){
                            db.deleteNode(root_node_id, function(err, result){
                                done();
                            });
                        });
                    });
                });
            });
        });

    });


    describe('=> Test Batch Query Functionality', function(){
        describe('-> Run a batch query against non existing nodes', function(done){
            it('should return an error', function(done){
                db.batchQuery([{
                    method: "GET",
                    to: "/node/100",
                    id: 0
                },{
                    method: "GET",
                    to: "/node/101",
                    id: 1
                }], function(err, result){
                    should.exist(err);
                    should.not.exist(result);
                    done();
                });
            });
        });

        var root_node_id;
        var other_node1_id;
        var other_node2_id;
        var relationship1_id;
        var relationship2_id;

        before(function(done){
            db.insertNode({name:'foobar'}, function(err, node1){
                root_node_id = node1.id;
                db.insertNode({name:'foobar2'}, function(err, node2){
                    other_node1_id = node2.id;
                    db.insertRelationship(root_node_id, other_node1_id, 'RELATED_TO', {}, function(err, relationship1){
                        relationship1_id = relationship1.id;

                        db.insertNode({name:'foobar3'}, function(err, node3){
                            other_node2_id = node3.id;
                            db.insertRelationship(root_node_id, other_node2_id, 'RELATED_TO', {}, function(err, relationship2){
                                relationship2_id = relationship2.id;
                                done();
                            });
                        });
                    });
                });
            });
        });

        describe('-> Run a batch query against existing nodes and relationships', function(done){
            it('should return an error', function(done){
                db.batchQuery([{
                    method: "GET",
                    to: "/node/" + root_node_id,
                    id: 0
                },{
                    method: "GET",
                    to: "/node/" + other_node1_id,
                    id: 1
                }], function(err, result){
                    should.not.exist(err);
                    should.exist(result);
                    done();
                });
            });
        });

        after(function(done){
            db.deleteRelationship(relationship1_id, function(err, result){
                db.deleteRelationship(relationship2_id, function(err, result){
                    db.deleteNode(other_node1_id, function(err, result){
                        db.deleteNode(other_node2_id, function(err, result){
                            db.deleteNode(root_node_id, function(err, result){
                                done();
                            });
                        });
                    });
                });
            });
        });
    });


    /* HELPER FUNCTIONS ------------ */

    describe('=> Testing replaceNullWithString', function(){
        var test_obj = {
            name: 'foobar',
            age: null,

        };

        describe('-> Testing a small object', function(){
            it('should return the transformed object', function(){
                var node_data = db.replaceNullWithString(test_obj);
                node_data.name.should.equal('foobar');
                node_data.age.should.equal('');
            });
        });
    });

    describe('=> Testing an object with an object as value', function(){
        var test_obj = {
          name: 'foobar',
          family: {
              mother: 'barfii',
              father: 'barfoo'
          }
        };

        it('should return the transformed object', function(){
           var node_data = db.stringifyValueObjects(test_obj);
           node_data.name.should.equal('foobar');
           node_data.family.should.equal("{\"mother\":\"barfii\",\"father\":\"barfoo\"}");
        });
    });

    describe('=> Testing the addRelationshipIdForArray function', function(){
        var relationships = [{
                start: 'http://localhost:7474/db/data/node/147',
                data: {},
                self: 'http://localhost:7474/db/data/relationship/54',
                property: 'http://localhost:7474/db/data/relationship/54/properties/{key}',
                properties: 'http://localhost:7474/db/data/relationship/54/properties',
                type: 'RELATED_TO',
                extensions: {},
                end: 'http://localhost:7474/db/data/node/148'
            },{
                start: 'http://localhost:7474/db/data/node/147',
                data: {},
                self: 'http://localhost:7474/db/data/relationship/55',
                property: 'http://localhost:7474/db/data/relationship/55/properties/{key}',
                properties: 'http://localhost:7474/db/data/relationship/55/properties',
                type: 'RELATED_TO',
                extensions: {},
                end: 'http://localhost:7474/db/data/node/149' }];

        describe('-> Extend the response', function(){
            it('should return an extended array', function(done){
                db.addRelationshipIdForArray(relationships, function(err, results){
                    should.not.exist(err);
                    results.length.should.equal(2);
                    results[0].id.should.equal('54');
                    results[1].id.should.equal('55');
                    results[0].start_node_id.should.equal('147');
                    results[0].end_node_id.should.equal('148');
                    results[1].start_node_id.should.equal('147');
                    results[1].end_node_id.should.equal('149');
                    done();
                });
            });
        });
    });


});