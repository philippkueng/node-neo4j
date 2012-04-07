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
                db.InsertNode({name:'foobar'}, function(err, result){

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
           db.DeleteNode(node_id, function(err, result){
              done(); 
           });
        });
    });

    
    describe('=> Delete a Node', function(){
        
        var node_id;
        
        // Insert a Node.
        before(function(done){
            db.InsertNode({name:'foobar'}, function(err, result){
                node_id = result.id;
                done();
            });
        })
        
        describe('-> Deleting an existing Node without Relationships', function(){
            it('should delete the Node without issues', function(done){
                db.DeleteNode(node_id, function(err, result){
                    result.should.equal(true);
                    done(); 
                });
            });
        });
        
        describe('-> Delete an non-existig Node', function(){
           it('should return false as a result since Node cannot be found', function(done){
               db.DeleteNode(node_id, function(err, result){
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
            db.InsertNode({name:'foobar'}, function(err, node){
                node_id = node.id;
                done(); 
            });
        });
       
        describe('-> Read an existing Node', function(){
            it('should return the JSON for that node', function(done){
                db.ReadNode(node_id, function(err, result){
                    result.data.name.should.equal('foobar');
                    result.id.should.equal(node_id);
                    done();
                });
            });
        });
       
        // Remove Node afterwards.
        after(function(done){
            db.DeleteNode(node_id, function(err, result){
                done(); 
            });
        });
       
        describe('-> Read an non-existing Node', function(){
            it('should return null for the node and the error messsage', function(done){
                db.ReadNode(99999999, function(err, result){
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
            db.InsertNode({name:'foobar'}, function(err, node){
                node_id = node.id;
                done(); 
            });
        });
       
        describe('-> Update an existing Node with a simple object', function(){
            it('should return true', function(done){
                db.UpdateNode(node_id, {name:'foobar2'}, function(err, result){
                    should.not.exist(err);
                    result.should.equal(true);                 
                    done();
                });
            });
        });
       
        describe('-> Update an existing Node with an object with null values', function(){
            it('should return true', function(done){
                db.UpdateNode(node_id,{name:'foobar3',age:null}, function(err, result){
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
                db.UpdateNode(node_id, test_obj, function(err, result){
                    should.not.exist(err);
                    result.should.equal(true);
                    done();
                });
            });
        });
       
        // Remove Node afterwards.
        after(function(done){
            db.DeleteNode(node_id, function(err, result){
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
                db.InsertRelationship(99999999, 99999998, 'RELATED_TO', {}, function(err, result){
                    should.not.exist(err);
                    result.should.equal(false);
                    done();
                });
            });
        });
       
        var root_node_id;
       
        before(function(done){
            db.InsertNode({name:'foobar'}, function(err, node){
                root_node_id = node.id;
                done(); 
            });
        });
       
        describe('-> Insert a Relationship with other_node not existing', function(){

            it('should return false', function(done){
                db.InsertRelationship(root_node_id, 99999998, 'RELATED_TO', {}, function(err, result){
                    should.not.exist(err);
                    result.should.equal(false);
                    done();
                });
            });

        });
       
        describe('-> Insert a Relationship with root_node not existing', function(){
            it('should return false', function(done){
                db.InsertRelationship(99999998, root_node_id, 'RELATED_TO', {}, function(err, result){
                    should.not.exist(err);
                    result.should.equal(false);
                    done();
                });
            });
        });

        var other_node_id;
        var relationship_id;

        before(function(done){
            db.InsertNode({name:'foobar2'}, function(err, node){
                other_node_id = node.id;
                done();
            });
        });

        describe('-> Insert a Relationship with both nodes existing', function(){
            it('should return true', function(done){
                db.InsertRelationship(root_node_id, other_node_id, 'RELATED_TO', test_obj, function(err, result){
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
            db.DeleteRelationship(relationship_id, function(err, result){
                db.DeleteNode(other_node_id, function(err, result){
                    db.DeleteNode(root_node_id, function(err, result){
                        done();
                    });
                });
            });
        });

    });
    
    describe('=> Delete a Relationship', function(){

        describe('-> Deleting a non existing Relationship', function(){
            it('should return false', function(done){
                db.DeleteRelationship(99999999, function(err, result){
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
            db.InsertNode({name:'foobar'},function(err, node1){
                root_node_id = node1.id;
                db.InsertNode({name:'foobar2'}, function(err, node2){
                    other_node_id = node2.id;
                    db.InsertRelationship(root_node_id, other_node_id, 'RELATED_TO', {}, function(err, result){
                        relationship_id = result.id;
                        done();
                    });
                });
            });
        });

        describe('-> Deleting an existing Relationship', function(){
            it('should return true', function(done){
                db.DeleteRelationship(relationship_id, function(err, result){
                    should.not.exist(err);
                    result.should.equal(true);
                    done();
                });
            });
        });

        after(function(done){
            db.DeleteNode(other_node_id, function(err, result){
                db.DeleteNode(root_node_id, function(err, result){
                    done();
                });
            });
        });
    });

    describe('=> Read a Relationship', function(){
        describe('-> Read a non-existing Relationship', function(){
            it('should return false', function(done){
                db.ReadRelationship(99999999, function(err, result){
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
            db.InsertNode({name:'foobar'}, function(err, node1){
                root_node_id = node1.id;
                db.InsertNode({name:'foobar2'}, function(err, node2){
                    other_node_id = node2.id;
                    db.InsertRelationship(root_node_id, other_node_id, 'RELATED_TO', {}, function(err, relationship){
                        relationship_id = relationship.id;
                        done();
                    });
                });
            });
        });

        describe('-> Read an existing Node', function(){
            it('should return relationship data', function(done){
                db.ReadRelationship(relationship_id, function(err, result){
                    should.not.exist(err);
                    result.should.not.equal(false);
                    result.type.should.equal('RELATED_TO');
                    done();
                });
            });
        });

        after(function(done){
            db.DeleteRelationship(relationship_id, function(err, result){
                db.DeleteNode(other_node_id, function(err, result){
                    db.DeleteNode(root_node_id, function(err, result){
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
                db.UpdateRelationship(99999999, test_obj, function(err, result){
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
            db.InsertNode({name:'foobar'}, function(err, node1){
                root_node_id = node1.id;
                db.InsertNode({name:'foobar2'}, function(err, node2){
                    other_node_id = node2.id;
                    db.InsertRelationship(root_node_id, other_node_id, 'RELATED_TO', {}, function(err, relationship){
                        relationship_id = relationship.id;
                        done();
                    });
                });
            });
        });

        describe('-> Update an existing Relationship', function(){
            it('should return relationship data', function(done){
                db.UpdateRelationship(relationship_id, test_obj, function(err, result){
                    should.not.exist(err);
                    result.should.equal(true);
                    done();
                });
            });
        });

        after(function(done){
            db.DeleteRelationship(relationship_id, function(err, result){
                db.DeleteNode(other_node_id, function(err, result){
                    db.DeleteNode(root_node_id, function(err, result){
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
            db.InsertNode({name:'foobar'}, function(err, node1){
                root_node_id = node1.id;
                db.InsertNode({name:'foobar2'}, function(err, node2){
                    other_node_id = node2.id;
                    db.InsertRelationship(root_node_id, other_node_id, 'RELATED_TO', {}, function(err, relationship){
                        relationship_id = relationship.id;
                        done();
                    });
                });
            });
        });

        describe('-> Retrieve types', function(){
            it('should return an array of types', function(done){
                db.ReadRelationshipTypes(function(err, result){
                    should.not.exist(err);
                    result.length.should.equal(1);
                    result[0].should.equal('RELATED_TO');
                    done();
                });
            });
        });

        after(function(done){
            db.DeleteRelationship(relationship_id, function(err, result){
                db.DeleteNode(other_node_id, function(err, result){
                    db.DeleteNode(root_node_id, function(err, result){
                        done();
                    });
                });
            });
        });

    });

    describe('=> Read all Relationships of a Node', function(){

        describe('-> Read all Relationships of an non-existing node', function(){
            it('should return false', function(done){
                db.ReadAllRelationshipsOfNode(99999999, function(err, result){
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
            db.InsertNode({name:'foobar'}, function(err, node1){
                root_node_id = node1.id;
                db.InsertNode({name:'foobar2'}, function(err, node2){
                    other_node1_id = node2.id;
                    db.InsertRelationship(root_node_id, other_node1_id, 'RELATED_TO', {}, function(err, relationship1){
                        relationship1_id = relationship1.id;

                        db.InsertNode({name:'foobar3'}, function(err, node3){
                            other_node2_id = node3.id;
                            db.InsertRelationship(root_node_id, other_node2_id, 'RELATED_TO', {}, function(err, relationship2){
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
                db.ReadAllRelationshipsOfNode(root_node_id, function(err, result){
                    should.not.exist(err);
                    result.length.should.equal(2);
                    done();
                });
            });
        });

        after(function(done){
            db.DeleteRelationship(relationship1_id, function(err, result){
                db.DeleteRelationship(relationship2_id, function(err, result){
                    db.DeleteNode(other_node1_id, function(err, result){
                        db.DeleteNode(other_node2_id, function(err, result){
                            db.DeleteNode(root_node_id, function(err, result){
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
                db.ReadIncomingRelationshipsOfNode(99999999, function(err, result){
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
            db.InsertNode({name:'foobar'}, function(err, node1){
                root_node_id = node1.id;
                db.InsertNode({name:'foobar2'}, function(err, node2){
                    other_node1_id = node2.id;
                    db.InsertRelationship(other_node1_id, root_node_id, 'RELATED_TO', {}, function(err, relationship1){
                        relationship1_id = relationship1.id;

                        db.InsertNode({name:'foobar3'}, function(err, node3){
                            other_node2_id = node3.id;
                            db.InsertRelationship(other_node2_id, root_node_id, 'RELATED_TO', {}, function(err, relationship2){
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
                db.ReadIncomingRelationshipsOfNode(root_node_id, function(err, result){
                    should.not.exist(err);
                    result.length.should.equal(2);
                    done();
                });
            });
        });

        describe('-> Read Relationships of other_node1', function(){
            it('should return 0 relationships', function(done){
                db.ReadIncomingRelationshipsOfNode(other_node1_id, function(err, result){
                    should.not.exist(err);
                    result.length.should.equal(0);
                    done();
                });
            });
        });

        after(function(done){
            db.DeleteRelationship(relationship1_id, function(err, result){
                db.DeleteRelationship(relationship2_id, function(err, result){
                    db.DeleteNode(other_node1_id, function(err, result){
                        db.DeleteNode(other_node2_id, function(err, result){
                            db.DeleteNode(root_node_id, function(err, result){
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
                db.ReadOutgoingRelationshipsOfNode(99999999, function(err, result){
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
            db.InsertNode({name:'foobar'}, function(err, node1){
                root_node_id = node1.id;
                db.InsertNode({name:'foobar2'}, function(err, node2){
                    other_node1_id = node2.id;
                    db.InsertRelationship(root_node_id, other_node1_id, 'RELATED_TO', {}, function(err, relationship1){
                        relationship1_id = relationship1.id;

                        db.InsertNode({name:'foobar3'}, function(err, node3){
                            other_node2_id = node3.id;
                            db.InsertRelationship(root_node_id, other_node2_id, 'RELATED_TO', {}, function(err, relationship2){
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
                db.ReadOutgoingRelationshipsOfNode(root_node_id, function(err, result){
                    should.not.exist(err);
                    result.length.should.equal(2);
                    done();
                });
            });
        });

        describe('-> Read Relationships of other_node1', function(){
            it('should return 0 relationships', function(done){
                db.ReadOutgoingRelationshipsOfNode(other_node1_id, function(err, result){
                    should.not.exist(err);
                    result.length.should.equal(0);
                    done();
                });
            });
        });

        after(function(done){
            db.DeleteRelationship(relationship1_id, function(err, result){
                db.DeleteRelationship(relationship2_id, function(err, result){
                    db.DeleteNode(other_node1_id, function(err, result){
                        db.DeleteNode(other_node2_id, function(err, result){
                            db.DeleteNode(root_node_id, function(err, result){
                                done();
                            });
                        });
                    });
                });
            });
        });

    });

    /* HELPER FUNCTIONS ------------ */

    describe('=> Testing ReplaceNullWithString', function(){
        var test_obj = {
            name: 'foobar',
            age: null,

        };
        
        describe('-> Testing a small object', function(){
            it('should return the transformed object', function(){
                var node_data = db.ReplaceNullWithString(test_obj);
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
           var node_data = db.StringifyValueObjects(test_obj);
           node_data.name.should.equal('foobar');
           node_data.family.should.equal("{\"mother\":\"barfii\",\"father\":\"barfoo\"}");
        });
    });
   
    describe('=> Testing the AddRelationshipIdForArray function', function(){
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
                db.AddRelationshipIdForArray(relationships, function(err, results){
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