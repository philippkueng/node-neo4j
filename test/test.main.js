var should = require('should'),
    neo4j = require('../main');

var url = 'http://localhost:7474';

var db = new neo4j(url);

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
                    result.should.not.equal(null);
                    done(); 
                });
            });
        });
        
        // it('should return a valid response', function(err, result){
        //     console.log(node_self);
        //     db.DeleteNode(node_self, function(err, result){
        //         result.should.not.equal(null);
        //         done();
        //     });
        // });
    });
   
});