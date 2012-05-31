var should = require('should'),
    neo4j = require('../main');

var url = 'http://localhost:7474';

var db = new neo4j(url);

/*
 *
 * -------------------------------------------
 * RUN TESTS WITH AGAINST EMPTY NEO4J INSTANCE
 * -------------------------------------------
 *
 */

describe('Testing Node specific operations for Neo4j', function(){

    describe('=> Create a Node', function(){
        var node_id;

        describe('-> A simple valid node insertion', function(){
            it('should return the JSON for that node', function(done){
                db.insertNode({name:'foobar'}, function(err, result){

                    node_id = result.id;

                    result.should.not.equal(null);
                    result.data.name.should.equal('foobar');
                    result.id.should.not.equal('');
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

        var second_node_id;

        describe('-> A node with properties containging Unicode characters', function(){
            it('should return the JSON for that node', function(done){
                db.insertNode({name:'fööbar'}, function(err, result){

                    second_node_id = result.id;

                    result.should.not.equal(null);
                    result.data.name.should.equal('fööbar');
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

    });

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

    describe('=> Test Cyper Query Functionality', function(){

        describe('-> Run a cypher query against a non existing node', function(){
            it('should return an error since node does not exist', function(done){
                db.cypherQuery("start x=node(100) return x", function(err, result){
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

        describe('-> Run a cypher query against an existing root node', function(){
            it('should return a dataset with a single node', function(done){
                db.cypherQuery("START user = node(" + root_node_id + ") RETURN user", function(err, result){
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
                db.cypherQuery("START user = node(" + root_node_id + ") MATCH user-[:RELATED_TO]->friends RETURN friends", function(err, result){
                    should.not.exist(err);
                    result.data.length.should.equal(2);
                    result.columns.length.should.equal(1);
                    should.exist(result.data[0].id);
                    should.exist(result.data[1].id);
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