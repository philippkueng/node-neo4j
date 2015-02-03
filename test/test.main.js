'use strict';

/*jshint expr: true*/

var should = require('should'),
    step = require('step'),
    neo4j = require('../index'),
    util = require('util');

var url = 'http://:4287e44985b04c7536c523ca6ea8e67c@localhost:7474';
var db = new neo4j(url);

function onlyResult(err, result) {
    should.not.exist(err);
    should.exist(result);
}

function onlyError(err, result) {
    should.exist(err);
    should.not.exist(result);
}

function isTrue(err, result) {
    onlyResult(err, result);
    result.should.equal(true);
}

function isFalse(err, result) {
    onlyResult(err, result);
    result.should.equal(false);
}

function debug(obj) {
    console.info(util.inspect(obj, {
        depth: 10
    }));
}

/*
 * ---------------------------
 * MAKE SURE NODE 0 IS REMOVED
 * ---------------------------
 */
before(function (done) {
    db.deleteNode(0, function (err, node) {
        done();
    });
});

console.log('* -------------------------------------------');
console.log('* RUN TESTS WITH AGAINST EMPTY NEO4J INSTANCE. NODE 0 WILL BE REMOVED.');
console.log('* -------------------------------------------');

describe('Testing Node specific operations for Neo4j', function () {
    describe('\n=> Create a Node', function () {
        var firstNodeId, secondNodeId, thirdNodeId, fourthNodeId, fifthNodeId;

        describe('-> A first simple valid node insertion with no labels', function () {
            it('should return the JSON for this node', function (done) {
                db.insertNode({
                    name: 'Crazy Taco',
                    age: 7,
                    favoriteColors: ['red', 'orange']
                }, function (err, result) {
                    onlyResult(err, result);
                    result.should.have.keys('_id', 'name', 'age', 'favoriteColors');
                    result.name.should.equal('Crazy Taco');
                    result.age.should.equal(7);
                    result.favoriteColors.should.be.an.instanceOf(Array);
                    result.favoriteColors.should.have.lengthOf(2);
                    result.favoriteColors.should.containEql('red');
                    result.favoriteColors.should.containEql('orange');
                    result._id.should.be.an.Number;
                    firstNodeId = result._id;
                    done();
                });
            });
        });

        describe('-> A second valid node insertion with one label (string)', function () {
            it('should return the JSON for this node', function (done) {
                db.insertNode({
                    name: 'Darth Vader',
                    level: 99,
                    hobbies: ['lightsaber fighting', 'cycling in space'],
                    shipIds: [123, 321]
                }, 'User', function (err, result) {
                    onlyResult(err, result);
                    result.should.have.keys('_id', 'name', 'level', 'hobbies', 'shipIds');
                    result.name.should.equal('Darth Vader');
                    result.level.should.equal(99);
                    result.hobbies.should.be.an.instanceOf(Array);
                    result.hobbies.should.have.lengthOf(2);
                    result.hobbies.should.containEql('lightsaber fighting');
                    result.hobbies.should.containEql('cycling in space');
                    result.shipIds.should.be.an.instanceOf(Array);
                    result.shipIds.should.have.lengthOf(2);
                    result.shipIds.should.containEql(123);
                    result.shipIds.should.containEql(321);
                    result._id.should.be.an.Number;
                    secondNodeId = result._id;
                    done();
                });
            });
        });

        describe('-> A third valid node insertion with one label (array with one string)', function () {
            it('should return the JSON for this node', function (done) {
                db.insertNode({
                    name: 'Philipp',
                    level: 7
                }, ['User'], function (err, result) {
                    onlyResult(err, result);
                    result.name.should.equal('Philipp');
                    result.level.should.be.an.Number;
                    result.level.should.equal(7);
                    result._id.should.be.an.Number;
                    thirdNodeId = result._id;
                    done();
                });
            });
        });

        describe('-> A fourth valid node insertion with three labels', function () {
            it('should return the JSON for this node', function (done) {
                db.insertNode({
                    name: 'Kristof'
                }, ['User', 'Student', 'Man'], function (err, result) {
                    onlyResult(err, result);
                    result.name.should.equal('Kristof');
                    result._id.should.be.an.Number;
                    fourthNodeId = result._id;
                    done();
                });
            });
        });

        describe('-> An invalid node insertion with wrong "labels" parameter', function () {
            it('should give an error', function (done) {
                db.insertNode({
                    name: 'Mister Error'
                }, ':Must:Be:Array:Or:String', function (err, result) {
                    onlyError(err, result);
                    done();
                });
            });
        });

        describe('-> A node with an empty array as pointed out by @sovos in issue 12', function () {
            it('should succeed', function (done) {
                db.insertNode({
                    name: 'sovos',
                    cars: []
                }, function (err, result) {
                    onlyError(err, result);
                    done();
                });
            });
        });

        describe('-> Get labels of the second node', function () {
            it('should return an array with one label', function (done) {
                db.readLabels(secondNodeId, function (err, result) {
                    onlyResult(err, result);
                    result.should.be.an.instanceOf(Array);
                    result.should.have.lengthOf(1);
                    result.should.containEql('User');
                    done();
                });
            });
        });

        describe('-> Get labels of the fourth node', function () {
            it('should return an array with three labels', function (done) {
                db.readLabels(fourthNodeId, function (err, result) {
                    onlyResult(err, result);
                    result.should.be.an.instanceOf(Array);
                    result.should.have.lengthOf(3);
                    result.should.containEql('User');
                    result.should.containEql('Student');
                    result.should.containEql('Man');
                    done();
                });
            });
        });

        describe('-> A node with properties containing Unicode characters', function () {
            it('should return the JSON for that node', function (done) {
                db.insertNode({
                    name: '√ fööbar √'
                }, function (err, result) {
                    onlyResult(err, result);
                    should.exist(result.name);
                    result.name.should.equal('√ fööbar √');
                    result._id.should.be.an.Number;
                    fifthNodeId = result._id;
                    done();
                });
            });
        });

        // Remove these four nodes afterwards
        after(function (done) {
            step(
                function deleteNodes() {
                    db.deleteNode(firstNodeId, this.parallel());
                    db.deleteNode(secondNodeId, this.parallel());
                    db.deleteNode(thirdNodeId, this.parallel());
                    db.deleteNode(fourthNodeId, this.parallel());
                    db.deleteNode(fifthNodeId, this.parallel());
                },
                function afterDelete(err, result) {
                    onlyResult(err, result);
                    done();
                }
            );
        });
    }); /* END \n=> Create a Node */

    describe('\n=> Delete a Node', function () {
        var node_id;

        // Insert a Node.
        before(function (done) {
            db.insertNode({
                name: 'foobar'
            }, function (err, result) {
                onlyResult(err, result);
                node_id = result._id;
                done();
            });
        });

        describe('-> Deleting an existing Node without Relationships', function () {
            it('should delete the Node and return true', function (done) {
                db.deleteNode(node_id, function (err, result) {
                    isTrue(err, result);
                    done();
                });
            });
        });

        describe('-> Delete an non-existing Node', function () {
            it('should return false as a result since Node cannot be found', function (done) {
                db.deleteNode(node_id, function (err, result) {
                    isFalse(err, result);
                    done();
                });
            });
        });

        after(function (done) {
            db.deleteNode(node_id, function (err, result) {
                isFalse(err, result);
                done();
            });
        });
    }); /* END \n=> Delete a Node */

    describe('\n=> Delete Nodes by labels and properties', function () {
        var nodeIdOne,
            nodeIdTwo;

        //Insert a Node.
        before(function (done) {
            db.insertNode({
                userid: '111',
                name: 'foobar',
                age: 22
            }, ['User'], function (err, result) {
                onlyResult(err, result);
                nodeIdOne = result._id;
                db.insertNode({
                    userid: '222',
                    name: 'foobar'
                }, ['User', 'Student'], function (err, result) {
                    onlyResult(err, result);
                    nodeIdTwo = result._id;
                    done();
                });
            });
        });

        describe('-> Deleting an existing Node', function () {
            it('should delete the Node and return number of removed Nodes', function (done) {
                db.deleteNodesWithLabelsAndProperties('User', {
                    userid: '111'
                }, function (err, result) {
                    onlyResult(err, result);
                    result.should.equal(1);
                    done();
                });
            });
        });

        describe('-> Deleting an non-existing Node', function () {
            it('should delete the Node and return number of removed Nodes', function (done) {
                db.deleteNodesWithLabelsAndProperties('User', {
                    userid: '666'
                }, function (err, result) {
                    onlyResult(err, result);
                    result.should.equal(0);
                    done();
                });
            });
        });

        describe('-> Deleting a existing Nodes', function () {
            it('should delete the Node and return number of removed Nodes', function (done) {
                db.deleteNodesWithLabelsAndProperties(['User'], {}, function (err, result) {
                    onlyResult(err, result);
                    result.should.equal(1);
                    done();
                });
            });
        });
    }); /* END \n=> Delete a Node */


    describe('\n=> Read a Node', function () {
        var node_id;

        //Insert a Node.
        before(function (done) {
            db.insertNode({
                name: 'foobar'
            }, function (err, result) {
                onlyResult(err, result);
                node_id = result._id;
                done();
            });
        });

        describe('-> Read an existing Node', function () {
            it('should return the JSON for that node', function (done) {
                db.readNode(node_id, function (err, result) {
                    onlyResult(err, result);
                    result.should.have.property('name', 'foobar');
                    result.should.have.property('_id', node_id);
                    done();
                });
            });
        });

        // Remove Node afterwards
        after(function (done) {
            db.deleteNode(node_id, function (err, result) {
                isTrue(err, result);
                done();
            });
        });

        describe('-> Read an non-existing Node', function () {
            it('should return false because the node does not exist', function (done) {
                db.readNode(123456789, function (err, result) {
                    isFalse(err, result);
                    done();
                });
            });
        });
    }); /* END \n=> Read a Node */

    describe('\n=> Replace a Node\'s properties by node id', function () {
        var node_id;

        //Insert a Node.
        before(function (done) {
            db.insertNode({
                name: 'foobar'
            }, function (err, result) {
                onlyResult(err, result);
                node_id = result._id;
                done();
            });
        });

        describe('-> Replace a non-existing Node with a simple object', function () {
            it('should return false because Node does not exist', function (done) {
                db.replaceNodeById(123456789, {
                    name: 'foobar2'
                }, function (err, result) {
                    isFalse(err, result);
                    done();
                });
            });
        });

        describe('-> Replace an existing Node with a simple object, check if alias works', function () {
            it('should return true', function (done) {
                db.updateNode(node_id, {
                    name: 'foobar2'
                }, function (err, result) {
                    isTrue(err, result);
                    done();
                });
            });
        });

        describe('-> Replace an existing Node with a simple object and an array as mentioned by @sovos in issue 12', function () {
            it('should return true', function (done) {
                db.updateNode(node_id, {
                    name: 'foobar2',
                    cars: ['Volvo', 'Mercedes']
                }, function (err, result) {
                    isTrue(err, result);
                    done();
                });
            });
        });

        describe('-> Replace an existing Node with a simple object and an empty array as mentioned by @sovos in issue 12', function () {
            it('should return true', function (done) {
                db.updateNode(node_id, {
                    name: 'foobar2',
                    cars: []
                }, function (err, result) {
                    isTrue(err, result);
                    done();
                });
            });
        });

        describe('-> Replace an existing Node with an object with null values', function () {
            it('should return true', function (done) {
                db.replaceNodeById(node_id, {
                    name: 'foobar3',
                    age: null
                }, function (err, result) {
                    isTrue(err, result);
                    done();
                });
            });
        });

        describe('-> Replace an existing Node with an object with an object as value', function () {
            var test_obj = {
                name: 'foobar',
                family: {
                    mother: 'barfii',
                    father: 'barfoo'
                }
            };

            it('should return true', function (done) {
                db.replaceNodeById(node_id, test_obj, function (err, result) {
                    isTrue(err, result);
                    done();
                });
            });
        });

        // Remove Node afterwards.
        after(function (done) {
            db.deleteNode(node_id, function (err, result) {
                isTrue(err, result);
                done();
            });
        });
    }); /* END \n=> Replace a Node */

    describe('\n=> Update a Node by node id', function () {
        var node_id;

        //Insert a Node.
        before(function (done) {
            db.insertNode({
                name: 'foobar'
            }, function (err, result) {
                onlyResult(err, result);
                node_id = result._id;
                done();
            });
        });

        describe('-> Update a non-existing Node with a simple object', function () {
            it('should return false because Node does not exist', function (done) {
                db.updateNodeById(123456789, {
                    name: 'foobar2'
                }, function (err, result) {
                    onlyError(err, result);
                    done();
                });
            });
        });

        describe('-> UpdateTwo an existing Node with a simple object', function () {
            it('should return node because Node', function (done) {
                db.updateNodeById(node_id, {
                    name: 'updatedFoobar',
                    price: 1.25,
                    colors: ['blue', 'green']
                }, function (err, result) {
                    onlyResult(err, result);
                    result.should.have.keys('_id', 'name', 'price', 'colors');
                    result._id.should.equal(node_id);
                    result.name.should.equal('updatedFoobar');
                    result.price.should.equal(1.25);
                    result.colors.should.be.an.instanceOf(Array);
                    result.colors.should.have.lengthOf(2);
                    result.colors.should.containEql('blue');
                    result.colors.should.containEql('green');
                    done();
                });
            });
        });

        // Remove Node afterwards.
        after(function (done) {
            db.deleteNode(node_id, function (err, result) {
                isTrue(err, result);
                done();
            });
        });
    }); /* END \n=> Update a Node by node id */

    describe('\n=> Update Node(s) with label(s) and properties', function () {
        var nodeIdOne,
            nodeIdTwo;

        //Insert a Node.
        before(function (done) {
            db.insertNode({
                userid: '123',
                name: 'foobar',
                age: 22
            }, ['User'], function (err, result) {
                onlyResult(err, result);
                nodeIdOne = result._id;
                db.insertNode({
                    userid: '654',
                    name: 'foobar'
                }, ['User', 'Student'], function (err, result) {
                    onlyResult(err, result);
                    nodeIdTwo = result._id;
                    done();
                });
            });
        });

        describe('-> Update non-existing Nodes with new properties', function () {
            it('should return empty array because no Nodes where updated', function (done) {
                db.updateNodesWithLabelsAndProperties(['User'], {
                    name: 'notfound'
                }, {
                    name: 'bar'
                }, function (err, result) {
                    onlyResult(err, result);
                    done();
                });
            });
        });

        describe('-> Update existing Nodes, change properties', function () {
            it('should return updated Nodes', function (done) {
                db.updateNodesWithLabelsAndProperties('User', {
                    userid: '123'
                }, {
                    name: 'new_foobar',
                    age: 25
                }, function (err, result) {
                    onlyResult(err, result);
                    result.should.be.an.instanceOf(Array);
                    result.should.have.lengthOf(1);
                    result[0].should.have.keys('_id', 'userid', 'name', 'age');
                    result[0]._id.should.equal(nodeIdOne);
                    result[0].name.should.equal('new_foobar');
                    result[0].age.should.equal(25);
                    done();
                });
            });
        });

        describe('-> Update existing Nodes, same property in oldProperties as in newProperties', function () {
            it('should return updated Nodes', function (done) {
                db.updateNodesWithLabelsAndProperties(['User', 'Student'], {
                    name: 'foobar'
                }, {
                    name: 'new_foobar'
                }, function (err, result) {
                    onlyResult(err, result);
                    result.should.be.an.instanceOf(Array);
                    result.should.have.lengthOf(1);
                    result[0].should.have.keys('_id', 'userid', 'name');
                    result[0]._id.should.equal(nodeIdTwo);
                    result[0].name.should.equal('new_foobar');
                    done();
                });
            });
        });

        describe('-> Update existing Nodes, no labels and add new property', function () {
            it('should return updated Nodes', function (done) {
                db.updateNodesWithLabelsAndProperties([], {
                    userid: '123'
                }, {
                    name: 'new_foo',
                    extra: 'add-new-property',
                    bonus: 'bonus'
                }, function (err, result) {
                    onlyResult(err, result);
                    result.should.be.an.instanceOf(Array);
                    result.should.have.lengthOf(1);
                    result[0].should.have.keys('_id', 'userid', 'name', 'age', 'extra', 'bonus');

                    db.readNodesWithLabelsAndProperties('User', {
                        userid: '123'
                    }, function (err, result) {
                        onlyResult(err, result);
                        result.should.be.an.instanceOf(Array);
                        result.should.have.lengthOf(1);
                        result[0]._id.should.equal(nodeIdOne);
                        result[0].name.should.equal('new_foo');
                        result[0].age.should.be.a.Number;
                        result[0].extra.should.equal('add-new-property');
                        result[0].bonus.should.equal('bonus');
                        done();
                    });
                });
            });
        });

        describe('-> Update existing Nodes, remove properties', function () {
            it('should return updated Nodes', function (done) {
                db.updateNodesWithLabelsAndProperties(['User'], {
                    userid: '123'
                }, {
                    name: 'new_name'
                }, ['extra', 'bonus'], true, function (err, result) {
                    onlyResult(err, result);
                    result.should.be.an.instanceOf(Array);
                    result.should.have.lengthOf(1);
                    result[0].should.have.keys('_id', 'userid', 'name', 'age');

                    db.readNodesWithLabelsAndProperties('User', {
                        userid: '123'
                    }, function (err, result) {
                        onlyResult(err, result);
                        result.should.be.an.instanceOf(Array);
                        result.should.have.lengthOf(1);
                        result[0].should.have.keys('_id', 'userid', 'name', 'age');
                        result[0]._id.should.equal(nodeIdOne);
                        result[0].name.should.equal('new_name');
                        result[0].age.should.be.a.Number;
                        done();
                    });
                });
            });
        });

        describe('-> Update existing Nodes, don\'t return updated nodes', function () {
            it('should return nothing', function (done) {
                db.updateNodesWithLabelsAndProperties(['User'], {}, {
                    name: 'all-users-the-same-name'
                }, [], false, function (err, result) {
                    onlyResult(err, result);
                    result.should.be.an.instanceOf(Array);
                    result.should.have.lengthOf(0);
                    done();
                });
            });
        });

        describe('-> Update multiple Nodes with only labels', function () {
            it('should return updated Nodes', function (done) {
                db.updateNodesWithLabelsAndProperties(['User'], {}, {
                    name: 'new_foo'
                }, function (err, result) {
                    onlyResult(err, result);
                    result.should.be.an.instanceOf(Array);
                    result.should.have.lengthOf(2);
                    done();
                });
            });
        });

        // Remove Node afterwards.
        after(function (done) {
            db.deleteNode(nodeIdOne, function (err, result) {
                isTrue(err, result);
                db.deleteNode(nodeIdTwo, function (err, result) {
                    isTrue(err, result);
                    done();
                });
            });
        });
    }); /* END \n=> Update Node(s) with label(s) and properties */

    describe('\n=> Insert a Relationship', function () {
        var root_node_id, other_node_id, relationship_id;
        var test_obj = {
            importance: 'high',
            age: null,
            description: {
                positive: 'fullfilling',
                negative: 'too time consuming'
            }
        };

        describe('-> Insert a Relationship with root_node and other_node not existing', function () {
            it('should return false', function (done) {
                db.insertRelationship(123456789, 987654321, 'RELATED_TO', {}, function (err, result) {
                    isFalse(err, result);
                    done();
                });
            });
        });

        before(function (done) {
            db.insertNode({
                name: 'foobar'
            }, function (err, result) {
                onlyResult(err, result);
                root_node_id = result._id;
                done();
            });
        });

        describe('-> Insert a Relationship with other_node not existing', function () {
            it('should return false', function (done) {
                db.insertRelationship(root_node_id, 123456789, 'RELATED_TO', {}, function (err, result) {
                    isFalse(err, result);
                    done();
                });
            });
        });

        describe('-> Insert a Relationship with root_node not existing', function () {
            it('should return false', function (done) {
                db.insertRelationship(123456789, root_node_id, 'RELATED_TO', {}, function (err, result) {
                    isFalse(err, result);
                    done();
                });
            });
        });

        before(function (done) {
            db.insertNode({
                name: 'foobar2'
            }, function (err, result) {
                onlyResult(err, result);
                other_node_id = result._id;
                done();
            });
        });

        describe('-> Insert a Relationship with both nodes existing', function () {
            it('should return the relationship', function (done) {
                db.insertRelationship(root_node_id, other_node_id, 'RELATED_TO', test_obj, function (err, result) {
                    onlyResult(err, result);
                    result.should.have.keys('_id', '_start', '_end', '_type', 'importance', 'description', 'age');
                    result._type.should.equal('RELATED_TO');
                    result.importance.should.equal('high');
                    result.age.should.equal('');
                    relationship_id = result._id; // Used for later cleanup process.
                    done();
                });
            });
        });

        after(function (done) {
            db.deleteRelationship(relationship_id, function (err, result) {
                isTrue(err, result);
                db.deleteNode(other_node_id, function (err, result) {
                    isTrue(err, result);
                    db.deleteNode(root_node_id, function (err, result) {
                        isTrue(err, result);
                        done();
                    });
                });
            });
        });
    }); /* END \n=> Insert a Relationship */

    describe('\n=> Delete a Relationship', function () {

        describe('-> Deleting a non existing Relationship', function () {
            it('should return false', function (done) {
                db.deleteRelationship(123456789, function (err, result) {
                    isFalse(err, result);
                    done();
                });
            });
        });

        var root_node_id;
        var other_node_id;
        var relationship_id;

        // Creating 2 Nodes and a Relationship connecting them.
        before(function (done) {
            db.insertNode({
                name: 'foobar'
            }, function (err, node1) {
                onlyResult(err, node1);
                root_node_id = node1._id;
                db.insertNode({
                    name: 'foobar2'
                }, function (err, node2) {
                    onlyResult(err, node2);
                    other_node_id = node2._id;
                    db.insertRelationship(root_node_id, other_node_id, 'RELATED_TO', {}, function (err, result) {
                        onlyResult(err, result);
                        relationship_id = result._id;
                        done();
                    });
                });
            });
        });

        describe('-> Deleting an existing Relationship', function () {
            it('should return true', function (done) {
                db.deleteRelationship(relationship_id, function (err, result) {
                    isTrue(err, result);
                    done();
                });
            });
        });

        after(function (done) {
            db.deleteNode(other_node_id, function (err, result) {
                isTrue(err, result);
                db.deleteNode(root_node_id, function (err, result) {
                    isTrue(err, result);
                    done();
                });
            });
        });
    }); /* END \n=> Delete a Relationship */

    describe('\n=> Read a Relationship', function () {
        var root_node_id;
        var other_node_id;
        var relationship_id;

        before(function (done) {
            db.insertNode({
                name: 'foobar'
            }, function (err, node1) {
                onlyResult(err, node1);
                root_node_id = node1._id;
                db.insertNode({
                    name: 'foobar2'
                }, function (err, node2) {
                    onlyResult(err, node2);
                    other_node_id = node2._id;
                    db.insertRelationship(root_node_id, other_node_id, 'RELATED_TO', {}, function (err, relationship) {
                        onlyResult(err, relationship);
                        relationship_id = relationship._id;
                        done();
                    });
                });
            });
        });

        describe('-> Read a non-existing Relationship', function () {
            it('should return false', function (done) {
                db.readRelationship(123456789, function (err, result) {
                    isFalse(err, result);
                    done();
                });
            });
        });

        describe('-> Read an existing Relationship', function () {
            it('should return relationship data', function (done) {
                db.readRelationship(relationship_id, function (err, result) {
                    onlyResult(err, result);
                    result.should.have.keys('_id', '_start', '_end', '_type');
                    result._type.should.equal('RELATED_TO');
                    done();
                });
            });
        });

        after(function (done) {
            db.deleteRelationship(relationship_id, function (err, result) {
                isTrue(err, result);
                db.deleteNode(other_node_id, function (err, result) {
                    isTrue(err, result);
                    db.deleteNode(root_node_id, function (err, result) {
                        isTrue(err, result);
                        done();
                    });
                });
            });
        });
    }); /* END \n=> Read a Relationship */

    describe('\n=> Update a Relationship', function () {
        var root_node_id, other_node_id, relationship_id;
        var test_obj = {
            importance: 'high',
            age: null,
            description: {
                positive: 'fullfilling',
                negative: 'too time consuming'
            }
        };

        describe('-> Update a non-existing Relationship', function () {
            it('should return false', function (done) {
                db.updateRelationship(99999999, test_obj, function (err, result) {
                    isFalse(err, result);
                    done();
                });
            });
        });

        before(function (done) {
            db.insertNode({
                name: 'foobar'
            }, function (err, result) {
                onlyResult(err, result);
                root_node_id = result._id;
                db.insertNode({
                    name: 'foobar2'
                }, function (err, result) {
                    onlyResult(err, result);
                    other_node_id = result._id;
                    db.insertRelationship(root_node_id, other_node_id, 'RELATED_TO', {}, function (err, result) {
                        onlyResult(err, result);
                        relationship_id = result._id;
                        done();
                    });
                });
            });
        });

        describe('-> Update an existing Relationship', function () {
            it('should return true if update was successful', function (done) {
                db.updateRelationship(relationship_id, test_obj, function (err, result) {
                    isTrue(err, result);
                    done();
                });
            });
        });

        after(function (done) {
            db.deleteRelationship(relationship_id, function (err, result) {
                isTrue(err, result);
                db.deleteNode(other_node_id, function (err, result) {
                    isTrue(err, result);
                    db.deleteNode(root_node_id, function (err, result) {
                        isTrue(err, result);
                        done();
                    });
                });
            });
        });
    }); /* END \n=> Update a Relationship */

    describe('\n=> Insert an Index', function () {

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

        describe('-> Insert a non existing index without configuration', function () {
            it('should return the index', function (done) {
                db.insertNodeIndex(test_index1, function (err, result) { //debug(err);debug(result);
                    onlyResult(err, result);
                    result.template.should.equal('http://localhost:7474/db/data/index/node/test_index1/{key}/{value}');
                    done();
                });
            });
        });

        describe('-> Insert a non existing index with configuration', function () {
            it('should return the index', function (done) {
                db.insertIndex(test_index2, function (err, result) { //debug(err);debug(result);
                    onlyResult(err, result);
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
						  "property_keys" : [ "firstname" ]
						}
			Note:
			Compound indexes are not yet supported, only one property per index is allowed.
			So ['firstname', 'lastname'] is not supported yet. */

        describe('-> Insert a non existing index on ONLY ONE property of a label', function () {
            it('should return the index', function (done) {
                db.insertLabelIndex(test_index3_label, test_index3_property, function (err, result) {
                    onlyResult(err, result);
                    result.should.have.property('label', 'Person');
                    result.should.have.property('property_keys');
                    result['property_keys'].should.be.an.instanceOf(Array);
                    result['property_keys'].should.have.lengthOf(1);
                    result['property_keys'].should.containEql('firstname');
                    done();
                });
            });
        });

        after(function (done) {
            db.deleteIndex(test_index2, function (err, result) {
                isTrue(err, result);
                db.deleteIndex({
                    type: 'node',
                    index: test_index1
                }, function (err, result) {
                    isTrue(err, result);
                    db.deleteLabelIndex(test_index3_label, test_index3_property, function (err, result) {
                        isTrue(err, result);
                        done();
                    });
                });
            });
        });
    }); /* END \n=> Insert an Index */

    describe('\n=> List indexes', function () {
        var label = 'City';
        var propertyOne = 'postalcode';
        var propertyTwo = 'name';

        before(function (done) {
            db.insertIndex({
                type: 'node',
                index: 'list_test_index'
            }, function (err, result) {
                onlyResult(err, result);
                /* Create an index on postalcode & an index on name of a City */
                db.insertLabelIndex('City', 'postalcode', function (err, result) {
                    onlyResult(err, result);
                    db.insertLabelIndex('City', 'name', function (err, result) {
                        onlyResult(err, result);
                        done();
                    });
                });
            });
        });

        describe('-> List all existing indexes', function () {
            it('should return the indexes', function (done) {
                db.listNodeIndexes(function (err, result) { //debug(err);debug(result);
                    onlyResult(err, result);
                    result.list_test_index.template.should.equal('http://localhost:7474/db/data/index/node/list_test_index/{key}/{value}');
                    result.list_test_index.provider.should.equal('lucene');
                    result.list_test_index.type.should.equal('exact');
                    done();
                });
            });
        });

        describe('-> List indexes for a label', function () {
            it('should return the indexes of that label', function (done) {
                db.listLabelIndexes(label, function (err, result) {
                    onlyResult(err, result);
                    result.should.be.an.instanceOf(Array);
                    result.should.have.lengthOf(2);
                    done();
                });
            });
        });

        after(function (done) {
            db.deleteIndex({
                type: 'node',
                index: 'list_test_index'
            }, function (err, result) {
                isTrue(err, result);
                db.deleteLabelIndex(label, propertyOne, function (err, result) {
                    isTrue(err, result);
                    db.deleteLabelIndex(label, propertyTwo, function (err, result) {
                        isTrue(err, result);
                        done();
                    });
                });
            });
        });
    }); /* END \n=> List indexes */

    describe('\n=> Delete an Index', function () {
        var label = 'City';
        var property = 'postalcode';

        before(function (done) {
            db.insertNodeIndex('delete_test_index', function (err, result) { //debug(err);debug(result);
                onlyResult(err, result);
                db.insertLabelIndex(label, property, function (err, result) { //debug(err);debug(result);
                    onlyResult(err, result);
                    done();
                });
            });
        });

        describe('-> Delete existing node', function () {
            it('should delete the node', function (done) {
                db.deleteNodeIndex('delete_test_index', function (err, result) {
                    isTrue(err, result);
                    done();
                });
            });
        });

        describe('-> Delete existing label index', function () {
            it('should return true if label index for that property was deleted', function (done) {
                db.deleteLabelIndex(label, property, function (err, result) {
                    isTrue(err, result);
                    done();
                });
            });
        });

        describe('-> Delete non-existing label index', function () {
            it('should return false because index does not exist', function (done) {
                db.deleteLabelIndex(label, property, function (err, result) {
                    isFalse(err, result);
                    done();
                });
            });
        });
    }); /* END \n=> Delete an Index -------*/

    describe('\n=> Add a Node to an Index', function () {
        var root_node_id;

        before(function (done) {
            db.insertNodeIndex('add_node_test_index', function (err, result) { //debug(err);debug(result);
                onlyResult(err, result);
                db.insertNode({
                    name: 'foobar'
                }, function (err, result) {
                    onlyResult(err, result);
                    root_node_id = result._id;
                    done();
                });
            });
        });

        describe('-> Add a non-existing Node to an Index', function () {
            it('should return an error', function (done) {
                db.addNodeToIndex(123456789, 'add_node_test_index', 'test_index_key', 'test_index_value', function (err, result) { //debug(err);debug(result);
                    onlyError(err, result);
                    done();
                });
            });
        });

        describe('-> Add an existing Node to an Index', function () {
            it('should return the Node', function (done) {
                db.addNodeToIndex(root_node_id, 'add_node_test_index', 'test_index_key', 'test_index_value', function (err, result) {
                    onlyResult(err, result);
                    result.should.have.keys('_id', 'name');
                    result.name.should.equal('foobar');
                    result._id.should.be.an.Number;
                    done();
                });
            });
        });

        describe('-> Add an already existing Node to the same Index', function () {
            it('should return the Node', function (done) {
                db.addNodeToIndex(root_node_id, 'add_node_test_index', 'test_index_key', 'test_index_value', function (err, result) {
                    onlyResult(err, result);
                    result.should.have.keys('_id', 'name');
                    result.name.should.equal('foobar');
                    result._id.should.be.an.Number;
                    done();
                });
            });
        });

        after(function (done) {
            db.deleteNode(root_node_id, function (err, result) {
                isTrue(err, result);
                done();
            });
        });
    }); /* END \n=> Add a Node to an Index */

    describe('\n=> Add one or multiple Labels to a Node', function () {
        var nodeId;
        before(function (done) {
            db.insertNode({
                name: 'Brussels'
            }, function (err, result) {
                onlyResult(err, result);
                nodeId = result._id;
                done();
            });
        });

        describe('-> Add one Label to a Node', function () {
            it('should return true if label was successfully added', function (done) {
                db.addLabelsToNode(nodeId, 'City', function (err, result) {
                    isTrue(err, result);
                    db.readLabels(nodeId, function (err, result) {
                        onlyResult(err, result);
                        result.should.be.an.instanceOf(Array);
                        result.should.have.lengthOf(1);
                        result.should.containEql('City');
                        done();
                    });
                });
            });
        });

        describe('-> Add multiple Labels to a Node', function () {
            it('should return true if the labels were successfully added', function (done) {
                db.addLabelsToNode(nodeId, ['Capital', 'Belgium', 'Frietjes'], function (err, result) {
                    isTrue(err, result);
                    db.readLabels(nodeId, function (err, result) {
                        onlyResult(err, result);
                        result.should.be.an.instanceOf(Array);
                        result.should.have.lengthOf(4);
                        result.should.containEql('City');
                        result.should.containEql('Capital');
                        result.should.containEql('Belgium');
                        result.should.containEql('Frietjes');
                        done();
                    });
                });
            });
        });

        describe('-> Add wrong Label to a Node', function () {
            it('should return an error', function (done) {
                db.addLabelsToNode(nodeId, null, function (err, result) {
                    onlyError(err, result);
                    done();
                });
            });
        });

        describe('-> Add multiple labels with one wrong Label to a Node', function () {
            it('should return an error', function (done) {
                db.addLabelsToNode(nodeId, ['User', ''], function (err, result) {
                    onlyError(err, result);
                    done();
                });
            });
        });

        describe('-> Add a Label to a non-existing Node', function () {
            it('should return false because Node does not exist', function (done) {
                db.addLabelsToNode(123456789, 'City', function (err, result) {
                    isFalse(err, result);
                    done();
                });
            });
        });

        after(function (done) {
            db.deleteNode(nodeId, function (err, result) {
                isTrue(err, result);
                done();
            });
        });
    }); /* END \n=> Add one or multiple Labels to a Node -------*/

    describe('\n=> Replace all Labels on a Node', function () {
        var nodeId;
        before(function (done) {
            db.insertNode({
                name: 'Brussels'
            }, function (err, result) {
                onlyResult(err, result);
                nodeId = result._id;
                db.addLabelsToNode(nodeId, ['Capital', 'Belgium', 'Frietjes'], function (err, result) {
                    isTrue(err, result);
                    done();
                });
            });
        });

        describe('-> Replace all labels by one new label', function () {
            it('should return true if the labels were successfully changed', function (done) {
                db.replaceLabelsFromNode(nodeId, 'Dutch', function (err, result) {
                    isTrue(err, result);
                    db.readLabels(nodeId, function (err, result) {
                        onlyResult(err, result);
                        result.should.be.an.instanceOf(Array);
                        result.should.have.lengthOf(1);
                        result.should.containEql('Dutch');
                        done();
                    });
                });
            });
        });

        describe('-> Replace all labels by multiple new labels', function () {
            it('should return true if the labels were successfully changed', function (done) {
                db.replaceLabelsFromNode(nodeId, ['Dutch', 'French', 'German'], function (err, result) {
                    isTrue(err, result);
                    db.readLabels(nodeId, function (err, result) {
                        onlyResult(err, result);
                        result.should.be.an.instanceOf(Array);
                        result.should.containEql('Dutch');
                        result.should.containEql('French');
                        result.should.containEql('German');
                        done();
                    });
                });
            });
        });

        describe('-> Replace all labels by an invalid label: [null]', function () {
            it('should return an error', function (done) {
                db.replaceLabelsFromNode(nodeId, [null], function (err, result) {
                    onlyError(err, result);
                    done();
                });
            });
        });

        describe('-> Replace all labels by an invalid label: [""]', function () {
            it('should return an error', function (done) {
                db.replaceLabelsFromNode(nodeId, [''], function (err, result) {
                    onlyError(err, result);
                    done();
                });
            });
        });

        describe('-> Replace all labels by an invalid label: null', function () {
            it('should return an error', function (done) {
                db.replaceLabelsFromNode(nodeId, null, function (err, result) {
                    onlyError(err, result);
                    done();
                });
            });
        });

        describe('-> Replace all labels of a non-existing Node', function () {
            it('should return false because Node does not exist', function (done) {
                db.replaceLabelsFromNode(123456789, ['City'], function (err, result) {
                    isFalse(err, result);
                    done();
                });
            });
        });

        after(function (done) {
            db.deleteNode(nodeId, function (err, result) {
                isTrue(err, result);
                done();
            });
        });
    }); /* END \n=> Replace all Labels on a Node -------*/

    describe('\n=> deleteLabelFromNode: Remove label from a Node', function () {
        var nodeId;

        before(function (done) {
            db.insertNode({
                name: 'Brussels'
            }, function (err, result) {
                onlyResult(err, result);
                nodeId = result._id;
                db.addLabelsToNode(nodeId, ['Capital', 'Belgium', 'Frietjes'], function (err, result) {
                    isTrue(err, result);
                    done();
                });
            });
        });

        describe('-> Remove label from existing Node', function () {
            it('should return true if the label was successfully removed', function (done) {
                db.deleteLabelFromNode(nodeId, 'Frietjes', function (err, result) {
                    isTrue(err, result);
                    db.readLabels(nodeId, function (err, result) {
                        onlyResult(err, result);
                        result.should.be.an.instanceOf(Array);
                        result.should.have.lengthOf(2);
                        result.should.containEql('Capital');
                        result.should.containEql('Belgium');
                        done();
                    });
                });
            });
        });

        describe('-> Remove label from non-existing Node', function () {
            it('should return false because Node does not exist', function (done) {
                db.deleteLabelFromNode(123456789, 'Capital', function (err, result) {
                    isFalse(err, result);
                    done();
                });
            });
        });

        describe('-> Remove label from Node, given an invalid node id: null', function () {
            it('should return an error', function (done) {
                db.deleteLabelFromNode(null, 'Capital', function (err, result) {
                    onlyError(err, result);
                    done();
                });
            });
        });

        describe('-> Remove label from Node, given an invalid node id: -7', function () {
            it('should return an error', function (done) {
                db.deleteLabelFromNode(-7, 'Capital', function (err, result) {
                    onlyError(err, result);
                    done();
                });
            });
        });

        describe('-> Remove label from Node, given an invalid node id: 10.7', function () {
            it('should return an error', function (done) {
                db.deleteLabelFromNode(10.7, 'Capital', function (err, result) {
                    onlyError(err, result);
                    done();
                });
            });
        });

        describe('-> Remove label from Node, given an invalid label: ["Capital"]', function () {
            it('should return an error', function (done) {
                db.deleteLabelFromNode(nodeId, ['Capital'], function (err, result) {
                    onlyError(err, result);
                    done();
                });
            });
        });

        describe('-> Remove label from Node, given an invalid label: ""', function () {
            it('should return an error', function (done) {
                db.deleteLabelFromNode(nodeId, '', function (err, result) {
                    onlyError(err, result);
                    done();
                });
            });
        });

        describe('-> Remove label from Node, given an invalid label: 123', function () {
            it('should return an error', function (done) {
                db.deleteLabelFromNode(nodeId, 123, function (err, result) {
                    onlyError(err, result);
                    done();
                });
            });
        });

        after(function (done) {
            db.deleteNode(nodeId, function (err, result) {
                isTrue(err, result);
                done();
            });
        });
    }); /* END \n=> Remove label from a Node -------*/

    describe('\n=> readNodesWithLabel: Get all nodes with a label', function () {
        var nodeIdOne;
        var nodeIdTwo;

        before(function (done) {
            db.insertNode({
                name: 'Brussels'
            }, function (err, result) {
                onlyResult(err, result);
                nodeIdOne = result._id;
                db.addLabelsToNode(nodeIdOne, ['Capital', 'Belgium'], function (err, result) {
                    isTrue(err, result);
                    db.insertNode({
                        name: 'Ghent'
                    }, ['City', 'Belgium'], function (err, result) {
                        onlyResult(err, result);
                        nodeIdTwo = result._id;
                        done();
                    });
                });
            });
        });

        describe('-> Get all nodes with an existing label', function () {
            it('should return two nodes with that label', function (done) {
                db.readNodesWithLabel('Belgium', function (err, result) {
                    onlyResult(err, result);
                    result.should.be.an.instanceOf(Array);
                    result.should.have.lengthOf(2);
                    result[0]._id.should.equal(nodeIdOne);
                    result[1]._id.should.equal(nodeIdTwo);
                    done();
                });
            });
        });

        describe('-> Get all nodes with an existing label', function () {
            it('should return one node with that label', function (done) {
                db.readNodesWithLabel('Capital', function (err, result) {
                    onlyResult(err, result);
                    result.should.be.an.instanceOf(Array);
                    result.should.have.lengthOf(1);
                    result[0]._id.should.equal(nodeIdOne);
                    done();
                });
            });
        });

        describe('-> Get nodes with a non-existing label', function () {
            it('should return no nodes (empty array)', function (done) {
                db.readNodesWithLabel('NotExisting', function (err, result) {
                    onlyResult(err, result);
                    result.should.be.an.instanceOf(Array);
                    result.should.have.lengthOf(0);
                    done();
                });
            });
        });

        after(function (done) {
            db.deleteNode(nodeIdOne, function (err, result) {
                isTrue(err, result);
                db.deleteNode(nodeIdTwo, function (err, result) {
                    isTrue(err, result);
                    done();
                });
            });
        });
    }); /* END \n=> readNodesWithLabel: Get all nodes with a label -------*/

    describe('\n=> readNodesWithLabelsAndProperties: Get nodes by labels and properties', function () {
        var nodeIdOne;
        var nodeIdTwo;

        before(function (done) {
            db.insertNode({
                name: '√ Kört&rijk',
                tourism: true
            }, ['Capital', 'Belgium'], function (err, result) {
                onlyResult(err, result);
                nodeIdOne = result._id;
                db.insertNode({
                    inhabitants: 650000,
                    tourism: true
                }, ['City', 'Belgium'], function (err, result) {
                    onlyResult(err, result);
                    nodeIdTwo = result._id;
                    done();
                });
            });
        });

        describe('-> Get nodes by multiple labels and one property with special characters', function () {
            it('should return one node with these labels and property', function (done) {
                db.readNodesWithLabelsAndProperties(['Capital', 'Belgium'], {
                    name: '√ Kört&rijk'
                }, function (err, result) {
                    onlyResult(err, result);
                    result.should.be.an.instanceOf(Array);
                    result.should.have.lengthOf(1);
                    should.exist(result[0]._id);
                    result[0]._id.should.equal(nodeIdOne);
                    done();
                });
            });
        });

        describe('-> Get nodes by one label and multiple properties', function () {
            it('should return one node with that label and properties', function (done) {
                db.readNodesWithLabelsAndProperties('City', {
                    inhabitants: 650000,
                    tourism: true
                }, function (err, result) {
                    onlyResult(err, result);
                    result.should.be.an.instanceOf(Array);
                    result.should.have.lengthOf(1);
                    should.exist(result[0]._id);
                    result[0]._id.should.equal(nodeIdTwo);
                    done();
                });
            });
        });

        describe('-> Get nodes by one label and one property', function () {
            it('should return two node with that label and property', function (done) {
                db.readNodesWithLabelsAndProperties('Belgium', {
                    tourism: true
                }, function (err, result) {
                    onlyResult(err, result);
                    result.should.be.an.instanceOf(Array);
                    result.should.have.lengthOf(2);
                    should.exist(result[0]._id);
                    should.exist(result[1]._id);
                    done();
                });
            });
        });

        describe('-> Get nodes by label and non-existing property', function () {
            it('should return no nodes (empty array)', function (done) {
                db.readNodesWithLabelsAndProperties('Belgium', {
                    'NotExisting': 123456789
                }, function (err, result) {
                    onlyResult(err, result);
                    result.should.be.an.instanceOf(Array);
                    result.should.have.lengthOf(0);
                    done();
                });
            });
        });

        describe('-> Get nodes by label and invalid property: string (must be json)', function () {
            it('should return an error because "property" needs to be json', function (done) {
                db.readNodesWithLabelsAndProperties('Belgium', 'Nöt Existing √', function (err, result) {
                    onlyError(err, result);
                    done();
                });
            });
        });

        after(function (done) {
            db.deleteNode(nodeIdOne, function (err, result) {
                isTrue(err, result);
                db.deleteNode(nodeIdTwo, function (err, result) {
                    isTrue(err, result);
                    done();
                });
            });
        });
    }); /* END \n=> readNodesWithLabelsAndProperties:  Get nodes by label and property -------*/

    describe('\n=> listAllLabels:  List all labels', function () {
        var nodeIdOne;
        var nodeIdTwo;

        before(function (done) {
            db.insertNode({
                name: 'Brussels'
            }, ['Capital', 'Belgium'], function (err, result) {
                onlyResult(err, result);
                nodeIdOne = result._id;
                db.insertNode({
                    name: 'Ghent',
                    inhabitants: 650000
                }, ['City', 'Belgium'], function (err, result) {
                    onlyResult(err, result);
                    nodeIdTwo = result._id;
                    done();
                });
            });
        });

        describe('-> List all labels', function () {
            it('should return all labels ever used', function (done) {
                db.listAllLabels(function (err, result) {
                    onlyResult(err, result);
                    result.should.be.an.instanceOf(Array);
                    result.should.containEql('Capital');
                    result.should.containEql('City');
                    result.should.containEql('Belgium');
                    done();
                });
            });
        });

        after(function (done) {
            db.deleteNode(nodeIdOne, function (err, result) {
                isTrue(err, result);
                db.deleteNode(nodeIdTwo, function (err, result) {
                    isTrue(err, result);
                    done();
                });
            });
        });
    }); /* END \n=> listAllLabels:  List all labels -------*/

    /*	Create a uniqueness constraint on a property.
		Example:
			createUniquenessContstraint('User','email', callback);
			returns 	{
						  "label" : "User",
						  "type" : "UNIQUENESS",
						  "property_keys" : [ "email" ]
						}									*/

    describe('\n=> createUniquenessContstraint: Create a uniqueness constraint on a property', function () {
        var nodeIdOne, nodeIdTwo;

        // Create two nodes with a different email
        before(function (done) {
            db.insertNode({
                email: 'node_one@neo4j.be'
            }, 'User', function (err, result) {
                onlyResult(err, result);
                nodeIdOne = result._id;
                db.insertNode({
                    email: 'node_two@neo4j.be'
                }, 'User', function (err, result) {
                    onlyResult(err, result);
                    nodeIdTwo = result._id;
                    done();
                });
            });
        });

        describe('-> Create a new uniqueness constraint on a property', function () {
            it('should return JSON for this constraint', function (done) {
                db.createUniquenessContstraint('User', 'email', function (err, result) {
                    onlyResult(err, result);
                    result.should.have.property('label', 'User');
                    result.should.have.property('type', 'UNIQUENESS');
                    result.should.have.property('property_keys');
                    result['property_keys'].should.be.an.instanceOf(Array);
                    result['property_keys'].should.have.lengthOf(1);
                    result['property_keys'].should.containEql('email');
                    done();
                });
            });
        });

        describe('-> Create an existing uniqueness constraint on a property', function () {
            it('should return false because the constraint already exists', function (done) {
                db.createUniquenessContstraint('User', 'email', function (err, result) {
                    isFalse(err, result);
                    done();
                });
            });
        });

        after(function (done) {
            step(
                function deleteNodes() {
                    db.deleteNode(nodeIdOne, this.parallel());
                    db.deleteNode(nodeIdTwo, this.parallel());
                    db.dropUniquenessContstraint('User', 'email', this.parallel());
                },
                function afterDelete(err, result) {
                    onlyResult(err, result);
                    done();
                }
            );
        });
    }); /* END \n=> createUniquenessContstraint:  Create a uniqueness constraint on a property */

    /*	Get a specific uniqueness constraint for a label and a property
		Example:
		readUniquenessConstraint('User','email', callback);
		returns [ {
				  "label" : "User",
				  "property_keys" : [ "email" ],
				  "type" : "UNIQUENESS"
				} ]						 		*/

    describe('\n=> readUniquenessConstraint: Get a specific uniqueness constraint for a label and a property', function () {
        // Create a constraint on user id and email
        before(function (done) {
            db.createUniquenessContstraint('User', 'uid', function (err, result) {
                onlyResult(err, result);
                db.createUniquenessContstraint('User', 'email', function (err, result) {
                    onlyResult(err, result);
                    done();
                });
            });
        });

        describe('-> Get a specific uniqueness constraint for a label and a property', function () {
            it('should return an array with one uniqueness constraint', function (done) {
                db.readUniquenessConstraint('User', 'email', function (err, result) {
                    onlyResult(err, result);
                    result.should.be.an.instanceOf(Array);
                    result.should.have.lengthOf(1);
                    result[0].should.have.property('label', 'User');
                    result[0].should.have.property('property_keys');
                    result[0].should.have.property('type', 'UNIQUENESS');
                    result[0]['property_keys'].should.have.lengthOf(1);
                    result[0]['property_keys'].should.containEql('email');
                    done();
                });
            });
        });

        describe('-> Get a specific uniqueness constraint for a label and a non-existing property', function () {
            it('should return false because property does not exist', function (done) {
                db.readUniquenessConstraint('User', 'NotExisting', function (err, result) {
                    isFalse(err, result);
                    done();
                });
            });
        });

        describe('-> Get a specific uniqueness constraint for a non-existing label and a property', function () {
            it('should return false because property does not exist', function (done) {
                db.readUniquenessConstraint('NotExisting', 'email', function (err, result) {
                    isFalse(err, result);
                    done();
                });
            });
        });

        after(function (done) {
            db.dropUniquenessContstraint('User', 'uid', function (err, result) {
                isTrue(err, result);
                db.dropUniquenessContstraint('User', 'email', function (err, result) {
                    isTrue(err, result);
                    db.listAllConstraints(function (err, result) {
                        onlyResult(err, result);
                        result.should.be.an.instanceOf(Array);
                        result.should.have.lengthOf(0);
                        done();
                    });
                });
            });
        });
    }); /* END \n=> readUniquenessConstraint: Get a specific uniqueness constraint for a label and a property */

    /*	Get all uniqueness constraints for a label.
		returns an array of all uniqueness constraints.
		Example:
			listAllUniquenessConstraintsForLabel('User', callback);
			returns [ {
					  "label" : "User",
					  "property_keys" : [ "uid" ],
					  "type" : "UNIQUENESS"
					}, {
					  "label" : "User",
					  "property_keys" : [ "email" ],
					  "type" : "UNIQUENESS"
					} ]								*/

    describe('\n=> listAllUniquenessConstraintsForLabel: Get all uniqueness constraints for a label', function () {
        // Create a constraint on user id and email
        before(function (done) {
            db.createUniquenessContstraint('User', 'uid', function (err, result) {
                onlyResult(err, result);
                db.createUniquenessContstraint('User', 'email', function (err, result) {
                    onlyResult(err, result);
                    done();
                });
            });
        });

        describe('-> Get all uniqueness constraints', function () {
            it('should return an array with two uniqueness constraints', function (done) {
                db.listAllUniquenessConstraintsForLabel('User', function (err, result) {
                    onlyResult(err, result);
                    result.should.be.an.instanceOf(Array);
                    result.should.have.lengthOf(2);
                    result[0].should.have.property('label');
                    result[0].should.have.property('property_keys');
                    result[0].should.have.property('type', 'UNIQUENESS');
                    result[0]['property_keys'].should.have.lengthOf(1);
                    result[1].should.have.property('label');
                    result[1].should.have.property('property_keys');
                    result[1].should.have.property('type', 'UNIQUENESS');
                    result[1]['property_keys'].should.have.lengthOf(1);
                    done();
                });
            });
        });

        after(function (done) {
            db.dropUniquenessContstraint('User', 'uid', function (err, result) {
                isTrue(err, result);
                db.dropUniquenessContstraint('User', 'email', function (err, result) {
                    isTrue(err, result);
                    db.listAllConstraints(function (err, result) {
                        onlyResult(err, result);
                        result.should.be.an.instanceOf(Array);
                        result.should.have.lengthOf(0);
                        done();
                    });
                });
            });
        });
    }); /* END \n=> listAllUniquenessConstraintsForLabel: Get all uniqueness constraints for a label */

    /*	Get all constraints for a label.
		returns an array of all uniqueness constraints.
		Example:
			listAllConstraintsForLabel('User', callback);
			returns [ {
					  "label" : "User",
					  "property_keys" : [ "uid" ],
					  "type" : "UNIQUENESS"
					}, {
					  "label" : "User",
					  "property_keys" : [ "email" ],
					  "type" : "UNIQUENESS"
					} ]								*/

    describe('\n=> listAllConstraintsForLabel: Get all constraints for a label', function () {
        // Create a constraint on user id and email
        before(function (done) {
            db.createUniquenessContstraint('User', 'uid', function (err, result) {
                onlyResult(err, result);
                db.createUniquenessContstraint('User', 'email', function (err, result) {
                    onlyResult(err, result);
                    done();
                });
            });
        });

        describe('-> Get all constraints for a User', function () {
            it('should return an array with two constraints', function (done) {
                db.listAllUniquenessConstraintsForLabel('User', function (err, result) {
                    onlyResult(err, result);
                    result.should.be.an.instanceOf(Array);
                    result.should.have.lengthOf(2);
                    result[0].should.have.property('label');
                    result[0].should.have.property('property_keys');
                    result[0].should.have.property('type', 'UNIQUENESS');
                    result[0]['property_keys'].should.have.lengthOf(1);
                    result[1].should.have.property('label');
                    result[1].should.have.property('property_keys');
                    result[1].should.have.property('type', 'UNIQUENESS');
                    result[1]['property_keys'].should.have.lengthOf(1);
                    done();
                });
            });
        });

        after(function (done) {
            db.dropUniquenessContstraint('User', 'uid', function (err, result) {
                isTrue(err, result);
                db.dropUniquenessContstraint('User', 'email', function (err, result) {
                    isTrue(err, result);
                    db.listAllConstraints(function (err, result) {
                        onlyResult(err, result);
                        result.should.be.an.instanceOf(Array);
                        result.should.have.lengthOf(0);
                        done();
                    });
                });
            });
        });
    }); /* END \n=> listAllConstraintsForLabel: Get all constraints for a label */

    /*	Get all constraints.
		returns an array of all constraints.
		Example:
			listAllConstraints(callback);
			returns [ {
					  "label" : "Product",
					  "property_keys" : [ "pid" ],
					  "type" : "UNIQUENESS"
					}, {
					  "label" : "User",
					  "property_keys" : [ "email" ],
					  "type" : "UNIQUENESS"
					} ]								*/

    describe('\n=> listAllConstraints: Get all constraints', function () {
        // Create a constraint on product id and email
        before(function (done) {
            db.createUniquenessContstraint('Product', 'pid', function (err, result) {
                onlyResult(err, result);
                db.createUniquenessContstraint('User', 'email', function (err, result) {
                    onlyResult(err, result);
                    done();
                });
            });
        });

        describe('-> Get all constraints', function () {
            it('should return an array with two constraints', function (done) {
                db.listAllConstraints(function (err, result) {
                    onlyResult(err, result);
                    result.should.be.an.instanceOf(Array);
                    result.should.have.lengthOf(2);
                    result[0].should.have.property('label');
                    result[0].should.have.property('property_keys');
                    result[0].should.have.property('type', 'UNIQUENESS');
                    result[0]['property_keys'].should.have.lengthOf(1);
                    result[1].should.have.property('label');
                    result[1].should.have.property('property_keys');
                    result[1].should.have.property('type', 'UNIQUENESS');
                    result[1]['property_keys'].should.have.lengthOf(1);
                    done();
                });
            });
        });

        after(function (done) {
            db.dropUniquenessContstraint('Product', 'pid', function (err, result) {
                isTrue(err, result);
                db.dropUniquenessContstraint('User', 'email', function (err, result) {
                    isTrue(err, result);
                    db.listAllConstraints(function (err, result) {
                        onlyResult(err, result);
                        result.should.be.an.instanceOf(Array);
                        result.should.have.lengthOf(0);
                        done();
                    });
                });
            });
        });


    }); /* END \n=> listAllConstraints: Get all constraints */

    /*	Drop uniqueness constraint for a label and a property.
		Example:
			createUniquenessContstraint('User','email', callback);
			returns true */

    describe('\n=> dropUniquenessContstraint: Drop uniqueness constraint for a label and a property', function () {
        // Create a constraint
        before(function (done) {
            db.createUniquenessContstraint('User', 'email', function (err, result) {
                onlyResult(err, result);
                done();
            });
        });

        describe('-> Drop uniqueness constraint for a existing label and a property', function () {
            it('should return true if the constraint was successfully removed', function (done) {
                db.dropUniquenessContstraint('User', 'email', function (err, result) {
                    isTrue(err, result);
                    done();
                });
            });
        });

        describe('-> Drop uniqueness constraint for a invalid label and a property', function () {
            it('should return an error', function (done) {
                db.dropUniquenessContstraint(null, null, function (err, result) {
                    onlyError(err, result);
                    done();
                });
            });
        });
    }); /* END \n=> dropUniquenessContstraint: Drop uniqueness constraint for a label and a property */

    describe('\n=> Transactions', function () {
        var transactionIdOne, transactionIdTwo, transactionIdThree;
        var statementsOne = {
            statements: [{
                statement: 'CREATE (p:Person {props}) RETURN p',
                parameters: {
                    props: {
                        name: 'Adam',
                        age: 22
                    }
                }
            }]
        };
        var statementsTwo = {
            statements: [{
                statement: 'CREATE (p:Person {props}) RETURN p',
                parameters: {
                    props: {
                        name: 'Adam',
                        age: 23
                    }
                }
            }]
        };
        var statementsThree = {
            statements: [{
                statement: 'CREATE (p:Person {props}) RETURN p',
                parameters: {
                    props: {
                        name: 'Adam',
                        age: 24,
                        favoriteColors: ['Green', 'Vanilla White']
                    }
                }
            }]
        };
        var statementsFour = {
            statements: [{
                statement: 'CREATE (p:Person {props}) RETURN p',
                parameters: {
                    props: {
                        name: 'Adam',
                        age: 21.17,
                        favoriteNumbers: [123, 456789],
                        gender: true
                    }
                },
                resultDataContents: ['row', 'graph']
            }]
        };

        describe('-> beginTransaction: Start a transaction with on statement', function () {
            it('should return the json of that transaction', function (done) {
                db.beginTransaction(statementsOne, function (err, result) {
                    onlyResult(err, result);
                    should.exist(result._id);
                    result._id.should.be.an.Number;
                    transactionIdOne = result._id;
                    done();
                });
            });
        });

        describe('-> addStatementsToTransaction: Add a statement to an open transaction', function () {
            it('should return the json of that transaction', function (done) {
                db.addStatementsToTransaction(transactionIdOne, statementsTwo, function (err, result) {
                    should.exist(result._id);
                    result._id.should.be.an.Number;
                    result._id.should.equal(transactionIdOne);
                    done();
                });
            });
        });

        describe('-> addStatementsToTransaction: Add one statement to an non-existing transaction', function () {
            it('should return false because transaction does not exist', function (done) {
                db.addStatementsToTransaction(123456789, statementsTwo, function (err, result) {
                    isFalse(err, result);
                    done();
                });
            });
        });

        describe('-> resetTimeoutTransaction: Reset transaction timeout of an open transaction', function () {
            it('should return true if timout has been reset', function (done) {
                db.resetTimeoutTransaction(transactionIdOne, function (err, result) {
                    onlyResult(err, result); // should contains some keys with empty arrays
                    result.should.have.keys('_id', 'results', 'transaction', 'errors');
                    result._id.should.equal(transactionIdOne);
                    result.errors.should.be.an.instanceOf(Array);
                    result.errors.should.have.lengthOf(0);
                    done();
                });
            });
        });

        describe('-> resetTimeoutTransaction: Reset transaction timeout of an non-existing transaction', function () {
            it('should return false because transaction does not exist', function (done) {
                db.resetTimeoutTransaction(123456789, function (err, result) {
                    isFalse(err, result);
                    done();
                });
            });
        });

        describe('-> commitTransaction: Commit an open transaction with one statement', function () {
            it('should return the json of that transaction', function (done) {
                db.commitTransaction(transactionIdOne, function (err, result) {
                    onlyResult(err, result);
                    result.should.not.equal(false);
                    done();
                });
            });
        });

        describe('-> beginTransaction: Start a second transaction with no statements', function () {
            it('should return the json of that transaction', function (done) {
                db.beginTransaction(function (err, result) {
                    onlyResult(err, result);
                    should.exist(result._id);
                    result._id.should.be.an.Number;
                    transactionIdTwo = result._id;
                    done();
                });
            });
        });

        describe('-> commitTransaction: Commit an second open transaction with no statements', function () {
            it('should return the json of that transaction', function (done) {
                db.commitTransaction(transactionIdTwo, statementsThree, function (err, result) {
                    onlyResult(err, result);
                    result.should.have.keys('results', 'errors');
                    result.errors.should.be.an.instanceOf(Array);
                    result.errors.should.have.lengthOf(0);
                    done();
                });
            });
        });

        describe('-> beginAndCommitTransaction: Begin a transaction, execute statements, and commit transaction', function () {
            it('should return the json of that transaction', function (done) {
                db.beginAndCommitTransaction(statementsFour, function (err, result) {
                    onlyResult(err, result);
                    result.should.have.keys('results', 'errors');
                    result.errors.should.be.an.instanceOf(Array);
                    result.errors.should.have.lengthOf(0);
                    done();
                });
            });
        });

        describe('-> beginTransaction: Start a third transaction', function () {
            it('should return the json of that transaction', function (done) {
                db.beginTransaction(statementsOne, function (err, result) {
                    onlyResult(err, result);
                    should.exist(result._id);
                    result._id.should.be.an.Number;
                    transactionIdThree = result._id;
                    done();
                });
            });
        });

        describe('-> rollbackTransaction: Rollback an non-existing transaction', function () {
            it('should return false because transaction does not exist', function (done) {
                db.rollbackTransaction(123456789, function (err, result) {
                    isFalse(err, result);
                    done();
                });
            });
        });

        describe('-> rollbackTransaction: Rollback an open transaction', function () {
            it('should return true if rollback was successful', function (done) {
                db.rollbackTransaction(transactionIdThree, function (err, result) {
                    isTrue(err, result);
                    done();
                });
            });
        });

        after(function (done) {
            db.readNodesWithLabelsAndProperties('Person', {
                name: 'Adam'
            }, function (err, result) {
                onlyResult(err, result);
                result.should.be.an.instanceOf(Array);
                result.should.have.lengthOf(4);
                for (var i = 0; i < 4; i++) {
                    should.exist(result[i]._id);
                }
                step(
                    function deleteNodes() {
                        for (var j = 0; j < 4; j++) {
                            db.deleteNode(result[j]._id, this.parallel());
                        }
                    },
                    function afterDelete(err, result) {
                        onlyResult(err, result);
                        done();
                    }
                );
            });
        }); // after
    }); /* END => Transactions  */

    // describe('\n=> Remove all ')

    /* ADVANCED FUNCTIONS ---------- */

    describe('\n=> Read Relationship Types already within the DB', function () {
        var root_node_id, other_node_id, relationship_id;

        before(function (done) {
            db.insertNode({
                name: 'foobar'
            }, function (err, node1) {
                onlyResult(err, node1);
                root_node_id = node1._id;
                db.insertNode({
                    name: 'foobar2'
                }, function (err, node2) {
                    onlyResult(err, node2);
                    other_node_id = node2._id;
                    db.insertRelationship(root_node_id, other_node_id, 'RELATED_TO', {}, function (err, relationship) {
                        onlyResult(err, relationship);
                        relationship_id = relationship._id;
                        done();
                    });
                });
            });
        });

        describe('-> Retrieve types', function () {
            it('should return an array of types', function (done) {
                db.readRelationshipTypes(function (err, result) {
                    onlyResult(err, result);
                    result.should.be.an.instanceOf(Array);
                    result.should.have.lengthOf(1);
                    result[0].should.equal('RELATED_TO');
                    done();
                });
            });
        });

        after(function (done) {
            db.deleteRelationship(relationship_id, function (err, result) {
                isTrue(err, result);
                db.deleteNode(other_node_id, function (err, result) {
                    isTrue(err, result);
                    db.deleteNode(root_node_id, function (err, result) {
                        isTrue(err, result);
                        done();
                    });
                });
            });
        });
    }); /* END => Read Relationship Types already within the DB */


    describe('\n=> Read all Relationships of a Node', function () {
        var root_node_id, other_node1_id, other_node2_id;
        var relationship1_id, relationship2_id;

        describe('-> Read all Relationships of an non-existing node', function () {
            it('should return false', function (done) {
                db.readAllRelationshipsOfNode(99999999, function (err, result) {
                    isFalse(err, result);
                    done();
                });
            });
        });

        before(function (done) {
            db.insertNode({
                name: 'foobar'
            }, function (err, node1) {
                onlyResult(err, node1);
                root_node_id = node1._id;
                db.insertNode({
                    name: 'foobar2'
                }, function (err, node2) {
                    onlyResult(err, node2);
                    other_node1_id = node2._id;
                    db.insertRelationship(root_node_id, other_node1_id, 'RELATED_TO', {}, function (err, relationship1) {
                        onlyResult(err, relationship1);
                        relationship1_id = relationship1._id;
                        db.insertNode({
                            name: 'foobar3'
                        }, function (err, node3) {
                            onlyResult(err, node3);
                            other_node2_id = node3._id;
                            db.insertRelationship(root_node_id, other_node2_id, 'RELATED_TO', {}, function (err, relationship2) {
                                onlyResult(err, relationship2);
                                relationship2_id = relationship2._id;
                                done();
                            });
                        });
                    });
                });
            });
        });

        describe('-> Read Relationships of root_node', function () {
            it('should return 2 relationships', function (done) {
                db.readAllRelationshipsOfNode(root_node_id, function (err, result) {
                    onlyResult(err, result);
                    result.should.be.an.instanceOf(Array);
                    result.should.have.lengthOf(2);
                    done();
                });
            });
        });

        after(function (done) {
            db.deleteRelationship(relationship1_id, function (err, result) {
                isTrue(err, result);
                db.deleteRelationship(relationship2_id, function (err, result) {
                    isTrue(err, result);
                    db.deleteNode(other_node1_id, function (err, result) {
                        isTrue(err, result);
                        db.deleteNode(other_node2_id, function (err, result) {
                            isTrue(err, result);
                            db.deleteNode(root_node_id, function (err, result) {
                                isTrue(err, result);
                                done();
                            });
                        });
                    });
                });
            });
        });
    }); /* END => Read all Relationships of a Node */

    describe('\n=> Read typed Relationships of a Node', function () {
        var root_node_id, other_node1_id, other_node2_id;
        var relationship1_id, relationship2_id;
        var types = ['RELATED_TO', 'SOMETHING_ELSE'];

        describe('-> Read typed Relationships of an non-existing node', function () {
            it('should return false', function (done) {
                db.readTypedRelationshipsOfNode(99999999, types, function (err, result) {
                    isFalse(err, result);
                    done();
                });
            });
        });

        before(function (done) {
            db.insertNode({
                name: 'foobar'
            }, function (err, node1) {
                onlyResult(err, node1);
                root_node_id = node1._id;
                db.insertNode({
                    name: 'foobar2'
                }, function (err, node2) {
                    onlyResult(err, node2);
                    other_node1_id = node2._id;
                    db.insertRelationship(root_node_id, other_node1_id, 'RELATED_TO', {}, function (err, relationship1) {
                        onlyResult(err, relationship1);
                        relationship1_id = relationship1._id;
                        db.insertNode({
                            name: 'foobar3'
                        }, function (err, node3) {
                            onlyResult(err, node3);
                            other_node2_id = node3._id;
                            db.insertRelationship(root_node_id, other_node2_id, 'SOMETHING_ELSE', {}, function (err, relationship2) {
                                onlyResult(err, relationship2);
                                relationship2_id = relationship2._id;
                                done();
                            });
                        });
                    });
                });
            });
        });

        describe('-> Read typed Relationships of root_node', function () {
            it('should return 2 relationships', function (done) {
                db.readTypedRelationshipsOfNode(root_node_id, types, function (err, result) {
                    onlyResult(err, result);
                    result.should.be.an.instanceOf(Array);
                    result.should.have.lengthOf(2);
                    done();
                });
            });
        });

        after(function (done) {
            db.deleteRelationship(relationship1_id, function (err, result) {
                isTrue(err, result);
                db.deleteRelationship(relationship2_id, function (err, result) {
                    isTrue(err, result);
                    db.deleteNode(other_node1_id, function (err, result) {
                        isTrue(err, result);
                        db.deleteNode(other_node2_id, function (err, result) {
                            isTrue(err, result);
                            db.deleteNode(root_node_id, function (err, result) {
                                isTrue(err, result);
                                done();
                            });
                        });
                    });
                });
            });
        });
    }); /* END => Read typed Relationships of a Node */

    describe('\n=> Read incoming Relationships of a Node', function () {
        var root_node_id, other_node1_id, other_node2_id;
        var relationship1_id, relationship2_id;

        describe('-> Read incoming Relationships of an non-existing node', function () {
            it('should return false', function (done) {
                db.readIncomingRelationshipsOfNode(99999999, function (err, result) {
                    isFalse(err, result);
                    done();
                });
            });
        });

        before(function (done) {
            db.insertNode({
                name: 'foobar'
            }, function (err, node1) {
                onlyResult(err, node1);
                root_node_id = node1._id;
                db.insertNode({
                    name: 'foobar2'
                }, function (err, node2) {
                    onlyResult(err, node2);
                    other_node1_id = node2._id;
                    db.insertRelationship(other_node1_id, root_node_id, 'RELATED_TO', {}, function (err, relationship1) {
                        onlyResult(err, relationship1);
                        relationship1_id = relationship1._id;
                        db.insertNode({
                            name: 'foobar3'
                        }, function (err, node3) {
                            onlyResult(err, node3);
                            other_node2_id = node3._id;
                            db.insertRelationship(other_node2_id, root_node_id, 'RELATED_TO', {}, function (err, relationship2) {
                                onlyResult(err, relationship2);
                                relationship2_id = relationship2._id;
                                done();
                            });
                        });
                    });
                });
            });
        });

        describe('-> Read Relationships of root_node', function () {
            it('should return 2 relationships', function (done) {
                db.readIncomingRelationshipsOfNode(root_node_id, function (err, result) {
                    onlyResult(err, result);
                    result.should.be.an.instanceOf(Array);
                    result.should.have.lengthOf(2);
                    done();
                });
            });
        });

        describe('-> Read Relationships of other_node1', function () {
            it('should return 0 relationships', function (done) {
                db.readIncomingRelationshipsOfNode(other_node1_id, function (err, result) {
                    onlyResult(err, result);
                    result.should.be.an.instanceOf(Array);
                    result.should.have.lengthOf(0);
                    done();
                });
            });
        });

        after(function (done) {
            db.deleteRelationship(relationship1_id, function (err, result) {
                isTrue(err, result);
                db.deleteRelationship(relationship2_id, function (err, result) {
                    isTrue(err, result);
                    db.deleteNode(other_node1_id, function (err, result) {
                        isTrue(err, result);
                        db.deleteNode(other_node2_id, function (err, result) {
                            isTrue(err, result);
                            db.deleteNode(root_node_id, function (err, result) {
                                isTrue(err, result);
                                done();
                            });
                        });
                    });
                });
            });
        });
    }); /* END => Read incoming Relationships of a Node */

    describe('\n=> Read all outgoing Relationships of a Node', function () {
        var root_node_id, other_node1_id, other_node2_id, relationship1_id, relationship2_id;

        before(function (done) {
            db.insertNode({
                name: 'foobar'
            }, function (err, node1) {
                onlyResult(err, node1);
                root_node_id = node1._id;
                db.insertNode({
                    name: 'foobar2'
                }, function (err, node2) {
                    onlyResult(err, node2);
                    other_node1_id = node2._id;
                    db.insertRelationship(root_node_id, other_node1_id, 'RELATED_TO', {}, function (err, relationship1) {
                        onlyResult(err, relationship1);
                        relationship1_id = relationship1._id;
                        db.insertNode({
                            name: 'foobar3'
                        }, function (err, node3) {
                            onlyResult(err, node3);
                            other_node2_id = node3._id;
                            db.insertRelationship(root_node_id, other_node2_id, 'RELATED_TO', {}, function (err, relationship2) {
                                onlyResult(err, relationship2);
                                relationship2_id = relationship2._id;
                                done();
                            });
                        });
                    });
                });
            });
        });

        describe('-> Read outgoing Relationships of an non-existing node', function () {
            it('should return false', function (done) {
                db.readOutgoingRelationshipsOfNode(99999999, function (err, result) {
                    isFalse(err, result);
                    done();
                });
            });
        });

        describe('-> Read Relationships of root_node', function () {
            it('should return 2 relationships', function (done) {
                db.readOutgoingRelationshipsOfNode(root_node_id, function (err, result) {
                    onlyResult(err, result);
                    result.should.be.an.instanceOf(Array);
                    result.should.have.lengthOf(2);
                    done();
                });
            });
        });

        describe('-> Read Relationships of other_node1', function () {
            it('should return 0 relationships', function (done) {
                db.readOutgoingRelationshipsOfNode(other_node1_id, function (err, result) {
                    onlyResult(err, result);
                    result.should.be.an.instanceOf(Array);
                    result.should.have.lengthOf(0);
                    done();
                });
            });
        });

        after(function (done) {
            db.deleteRelationship(relationship1_id, function (err, result) {
                isTrue(err, result);
                db.deleteRelationship(relationship2_id, function (err, result) {
                    isTrue(err, result);
                    db.deleteNode(other_node1_id, function (err, result) {
                        isTrue(err, result);
                        db.deleteNode(other_node2_id, function (err, result) {
                            isTrue(err, result);
                            db.deleteNode(root_node_id, function (err, result) {
                                isTrue(err, result);
                                done();
                            });
                        });
                    });
                });
            });
        });
    }); /* END => Read all outgoing Relationships of a Node */

    describe('\n=> Read all outgoing typed Relationships of a Node', function () {
        var root_node_id, other_node1_id, other_node2_id;
        var relationship1_id, relationship2_id;
        var types = ['RELATED_TO', 'SOMETHING_ELSE'];

        describe('-> Read typed Relationships of an non-existing node', function () {
            it('should return false', function (done) {
                db.readTypedRelationshipsOfNode(99999999, types, function (err, result) {
                    isFalse(err, result);
                    done();
                });
            });
        });

        before(function (done) {
            db.cypherQuery(
                'CREATE (root {name: "foobar"}),\
        (n1 {name: "foobar2"}),\
        (n2 {name: "foobar3"}),\
        (root)-[r1:RELATED_TO]->(n1),\
        (root)-[r2:SOMETHING_ELSE]->(n2)\
        RETURN id(root), id(n1), id(n2), id(r1), id(r2)', function (err, result) {
                    onlyResult(err, result);
                    root_node_id = result.data[0][0];
                    other_node1_id = result.data[0][1];
                    other_node2_id = result.data[0][2];
                    relationship1_id = result.data[0][3];
                    relationship2_id = result.data[0][4];
                    done();
                });
        });

        describe('-> Read typed outgoing Relationships of root_node', function () {
            it('should return 2 relationships', function (done) {
                db.readRelationshipsOfNode(root_node_id, {
                    direction: 'out',
                    types: types
                }, function (err, result) {
                    onlyResult(err, result);
                    result.should.be.an.instanceOf(Array);
                    result.should.have.lengthOf(2);
                    done();
                });
            });
        });

        describe('-> Read all Relationships of root_node', function () {
            it('should return 2 relationships', function (done) {
                db.readRelationshipsOfNode(root_node_id, {}, function (err, result) {
                    onlyResult(err, result);
                    result.should.be.an.instanceOf(Array);
                    result.should.have.lengthOf(2);
                    done();
                });
            });
        });

        after(function (done) {
            db.cypherQuery('MATCH (root)-[r]->(m) DELETE (root), r, m', function (err, result) {
                onlyResult(err, result);
                result.columns.should.have.lengthOf(0);
                result.data.should.have.lengthOf(0);
                done();
            });
        });
    }); /* END => Read all outgoing typed Relationships of a Node */

    describe('\n=> Test Cyper Query Functionality against non existing nodes', function () {

        describe('-> Run a cypher query against a non existing node', function () {
            it('should return an error since node does not exist', function (done) {
                db.cypherQuery("start x=node(12345) return x", null, function (err, result) {
                    onlyError(err, result);
                    done();
                });
            });
        });

        describe('-> Run the cypher query from issue 2 from @glefloch against non existing nodes', function (done) {
            it('should return a error since the nodes do not exist', function (done) {
                db.cypherQuery("START d=node(12345), e=node(54321) MATCH p=shortestPath(d -[*..15]-> e) RETURN p", null, function (err, result) {
                    onlyError(err, result);
                    done();
                });
            });
        });

        // issue got updated according to recent changes in 2.0.0-RC1 http://blog.neo4j.org/2013/11/neo4j-200-rc1-final-preparations.html
        describe('-> Run the cypher query from issue 8 by @electrichead against non existing nodes', function (done) {
            it('should return empty data array since no data matches the query', function (done) {
                db.cypherQuery("start a=node(*) with a OPTIONAL MATCH a-[r1:RELATED_TO]->o return a.name,o.name", null, function (err, result) {
                    onlyResult(err, result);
                    result.should.have.keys('columns', 'data');
                    result.data.should.be.an.instanceOf(Array);
                    result.data.should.have.lengthOf(0);
                    result.columns.should.be.an.instanceOf(Array);
                    result.columns.should.have.lengthOf(2);
                    result.columns.should.containEql('a.name');
                    result.columns.should.containEql('o.name');
                    done();
                });
            });
        });

        describe('-> Run the cypher query from issue 30 by @adambaker against non existing nodes', function (done) {
            it('should return an empty data array', function (done) {
                db.cypherQuery("MATCH (n:ex) RETURN n.p1, n.p2", null, function (err, result) {
                    onlyResult(err, result);
                    result.should.have.keys('columns', 'data');
                    result.columns.should.containEql('n.p1');
                    result.columns.should.containEql('n.p2');
                    result.data.should.have.lengthOf(0);
                    done();
                });
            });
        });
    }); /* END => Test Cyper Query Functionality against non existing nodes */

    describe('\n=> Test Cypher Query Functionality against existing nodes and relationships', function () {
        var root_node_id, other_node1_id, other_node2_id, relationship1_id, relationship2_id;

        before(function (done) {
            db.insertNode({
                name: 'foobar'
            }, function (err, node1) {
                onlyResult(err, node1);
                root_node_id = node1._id;
                db.insertNode({
                    name: 'foobar2'
                }, function (err, node2) {
                    onlyResult(err, node2);
                    other_node1_id = node2._id;
                    db.insertRelationship(root_node_id, other_node1_id, 'RELATED_TO', {}, function (err, relationship1) {
                        onlyResult(err, relationship1);
                        relationship1_id = relationship1._id;
                        db.insertNode({
                            name: 'foobar3'
                        }, function (err, node3) {
                            onlyResult(err, node3);
                            other_node2_id = node3._id;
                            db.insertRelationship(root_node_id, other_node2_id, 'RELATED_TO', {}, function (err, relationship2) {
                                onlyResult(err, relationship2);
                                relationship2_id = relationship2._id;
                                done();
                            });
                        });
                    });
                });
            });
        });

        describe('-> Run a cypher query against an existing root node', function () {
            it('should return a dataset with a single node', function (done) {
                db.cypherQuery("START user = node({id}) RETURN user", {
                    id: root_node_id
                }, function (err, result) {
                    onlyResult(err, result);
                    result.should.have.keys('columns', 'data');
                    result.data.should.be.an.instanceOf(Array);
                    result.data.should.have.lengthOf(1);
                    result.columns.should.be.an.instanceOf(Array);
                    result.columns.should.have.lengthOf(1);
                    result.columns.should.containEql('user');
                    should.exist(result.data[0]._id);
                    result.data[0]._id.should.equal(root_node_id);
                    done();
                });
            });
        });

        describe('-> Run a cypher query against root_node retrieving all nodes related to it with a RELATED_TO type relationship', function (done) {
            it('should return a dataset with 2 nodes', function (done) {
                db.cypherQuery("START user = node({id}) MATCH user-[:RELATED_TO]->friends RETURN friends", {
                    id: root_node_id
                }, function (err, result) {
                    onlyResult(err, result);
                    result.should.have.keys('columns', 'data');
                    result.data.should.be.an.instanceOf(Array);
                    result.data.should.have.lengthOf(2);
                    result.columns.should.be.an.instanceOf(Array);
                    result.columns.should.have.lengthOf(1);
                    result.columns.should.containEql('friends');
                    should.exist(result.data[0].name);
                    should.exist(result.data[1].name);
                    should.exist(result.data[0]._id);
                    should.exist(result.data[1]._id);
                    done();
                });
            });
        });

        describe('-> Run the cypher query from issue 2 from @glefloch', function (done) {
            it('should return a valid response', function (done) {
                db.cypherQuery("START d=node({dId}), e=node({eId}) MATCH p=shortestPath(d -[*..15]-> e) RETURN p", {
                    dId: root_node_id,
                    eId: other_node1_id
                }, function (err, result) { //debug(err);debug(result);
                    onlyResult(err, result);
                    result.should.have.keys('columns', 'data');
                    result.data.should.be.an.instanceOf(Array);
                    result.data.should.have.lengthOf(1);
                    result.columns.should.be.an.instanceOf(Array);
                    result.columns.should.have.lengthOf(1);
                    result.columns.should.containEql('p');
                    should.exist(result.data[0].start);
                    should.exist(result.data[0].end);
                    result.data[0].nodes.should.have.lengthOf(2);
                    result.data[0].relationships.should.have.lengthOf(1);
                    done();
                });
            });
        });

        // issue got updated according to recent changes in 2.0.0-RC1 http://blog.neo4j.org/2013/11/neo4j-200-rc1-final-preparations.html
        describe('-> Run the cypher query from issue 8 by @electrichead against existing nodes', function (done) {
            it('should return a valid response', function (done) {
                db.cypherQuery("START a=node(*) OPTIONAL MATCH a-[r1:RELATED_TO]->o RETURN a.name,o.name", function (err, result) {
                    onlyResult(err, result);
                    result.data.should.be.an.instanceOf(Array);
                    result.data.should.have.lengthOf(4);
                    result.data[0].should.have.lengthOf(2);
                    result.data[1].should.have.lengthOf(2);
                    result.data[2].should.have.lengthOf(2);
                    result.data[3].should.have.lengthOf(2);
                    result.columns.should.be.an.instanceOf(Array);
                    result.columns.should.have.lengthOf(2);
                    result.data.should.containDeep([['foobar', 'foobar2'],
                                                    ['foobar', 'foobar3']]);
                    result.columns.should.containEql('a.name');
                    done();
                });
            });
        });

        describe('-> Run a cypher query with params from issue 9 by @withjam against existing nodes', function (done) {
            it('should return a valid response', function (done) {
                db.cypherQuery('MATCH (x {name: {root_node}})-[r]->(friends) RETURN friends', {
                    root_node: 'foobar'
                }, function (err, result) {
                    onlyResult(err, result);
                    result.columns.should.containEql('friends');
                    result.data.should.be.an.instanceOf(Array);
                    result.data.should.have.lengthOf(2);
                    result.data.should.containDeep([{name: 'foobar2'},
                                                    {name: 'foobar3'}]);
                    done();
                });
            });
        });

        /* TODO: fix error
		describe('-> Run the cypher query from issue 7 from @Zaxnyd', function(done){
			it('should return a node and the relationships', function(done){
				db.cypherQuery("START r=relationship(*) MATCH (s)-[r]->(t) RETURN *", function(err, result){debug(err);debug(result);
					should.not.exist(err);
					result.length.should.equal(6);
					result.columns.length.should.equal(3);
					done();
				});
			});
		});*/

        after(function (done) {
            db.deleteRelationship(relationship1_id, function (err, result) {
                isTrue(err, result);
                db.deleteRelationship(relationship2_id, function (err, result) {
                    isTrue(err, result);
                    db.deleteNode(other_node1_id, function (err, result) {
                        isTrue(err, result);
                        db.deleteNode(other_node2_id, function (err, result) {
                            isTrue(err, result);
                            db.deleteNode(root_node_id, function (err, result) {
                                isTrue(err, result);
                                done();
                            });
                        });
                    });
                });
            });
        });
    }); /* END => Test Cypher Query Functionality against existing nodes and relationships */

    describe('\n=> Tests for github issues related to cypher queries', function () {
        before(function (done) {
            db.cypherQuery("CREATE (:ex {p1: 1, p2: 2}), (:ex {p1: 3, p2: 4})", null, function (err, result) {
                done();
            });
        });

        describe('-> Run the cypher query from issue 30 by @adambaker against existing nodes', function (done) {
            it('should return a nested array', function (done) {
                db.cypherQuery("MATCH (n:ex) RETURN n.p1, n.p2", null, function (err, result) {
                    onlyResult(err, result);
                    result.should.have.keys('columns', 'data');
                    result.columns.should.containEql('n.p1');
                    result.columns.should.containEql('n.p2');
                    result.data.should.have.lengthOf(2);
                    result.data[0].should.have.lengthOf(2);
                    result.data[1].should.have.lengthOf(2);
                    done();
                });
            });
        });

        after(function (done) {
            db.cypherQuery("MATCH (n:ex) DELETE n", null, function (err, result) {
                done();
            });
        });
    }); /* END => Tests for github issues related to cypher queries */

    describe('\n=> Test Batch Query Functionality', function () {
        var root_node_id, other_node1_id, other_node2_id, relationship1_id, relationship2_id;

        before(function (done) {
            db.insertNode({
                name: 'foobar'
            }, function (err, node1) {
                onlyResult(err, node1);
                root_node_id = node1._id;
                db.insertNode({
                    name: 'foobar2'
                }, function (err, node2) {
                    onlyResult(err, node2);
                    other_node1_id = node2._id;
                    db.insertRelationship(root_node_id, other_node1_id, 'RELATED_TO', {}, function (err, relationship1) {
                        onlyResult(err, relationship1);
                        relationship1_id = relationship1._id;
                        db.insertNode({
                            name: 'foobar3'
                        }, function (err, node3) {
                            onlyResult(err, node3);
                            other_node2_id = node3._id;
                            db.insertRelationship(root_node_id, other_node2_id, 'RELATED_TO', {}, function (err, relationship2) {
                                onlyResult(err, relationship2);
                                relationship2_id = relationship2._id;
                                done();
                            });
                        });
                    });
                });
            });
        });

        describe('-> Run a batch query against non existing nodes', function (done) {
            it('should return an error', function (done) {
                db.batchQuery([{
                    method: "GET",
                    to: "/node/100",
                    id: 0
                }, {
                    method: "GET",
                    to: "/node/101",
                    id: 1
                }], function (err, result) {
                    onlyError(err, result);
                    done();
                });
            });
        });

        describe('-> Run a batch query against existing nodes and relationships', function (done) {
            it('should return a valid result', function (done) {
                db.batchQuery([{
                    method: "GET",
                    to: "/node/" + root_node_id,
                    id: 0
                }, {
                    method: "GET",
                    to: "/node/" + other_node1_id,
                    id: 1
                }], function (err, result) { //debug(err);debug(result);
                    onlyResult(err, result);
                    done();
                });
            });
        });

        after(function (done) {
            db.deleteRelationship(relationship1_id, function (err, result) {
                isTrue(err, result);
                db.deleteRelationship(relationship2_id, function (err, result) {
                    isTrue(err, result);
                    db.deleteNode(other_node1_id, function (err, result) {
                        isTrue(err, result);
                        db.deleteNode(other_node2_id, function (err, result) {
                            isTrue(err, result);
                            db.deleteNode(root_node_id, function (err, result) {
                                isTrue(err, result);
                                done();
                            });
                        });
                    });
                });
            });
        });
    });

    /* HELPER FUNCTIONS ------------ */

    describe('\n=> Testing replaceNullWithString', function () {
        var test_obj = {
            name: 'foobar',
            age: null
        };

        describe('-> Testing a small object', function () {
            it('should return the transformed object', function () {
                var node_data = db.replaceNullWithString(test_obj);
                node_data.name.should.equal('foobar');
                node_data.age.should.equal('');
            });
        });
    });

    describe('\n=> Testing an object with an object as value', function () {
        var test_obj = {
            name: 'foobar',
            family: {
                mother: 'barfii',
                father: 'barfoo'
            }
        };

        it('should return the transformed object', function () {
            var node_data = db.stringifyValueObjects(test_obj);
            node_data.name.should.equal('foobar');
            node_data.family.should.equal("{\"mother\":\"barfii\",\"father\":\"barfoo\"}");
        });
    });

    describe('\n=> Testing the addRelationshipIdForArray function', function () {
        var relationships = [{
            start: 'http://localhost:7474/db/data/node/147',
            data: {},
            self: 'http://localhost:7474/db/data/relationship/54',
            property: 'http://localhost:7474/db/data/relationship/54/properties/{key}',
            properties: 'http://localhost:7474/db/data/relationship/54/properties',
            type: 'RELATED_TO',
            extensions: {},
            end: 'http://localhost:7474/db/data/node/148'
        }, {
            start: 'http://localhost:7474/db/data/node/147',
            data: {},
            self: 'http://localhost:7474/db/data/relationship/55',
            property: 'http://localhost:7474/db/data/relationship/55/properties/{key}',
            properties: 'http://localhost:7474/db/data/relationship/55/properties',
            type: 'RELATED_TO',
            extensions: {},
            end: 'http://localhost:7474/db/data/node/149'
        }];

        describe('-> Extend the response', function () {
            it('should return an extended array', function (done) {
                db.addRelationshipIdForArray(relationships, function (err, results) {
                    onlyResult(err, results);
                    results.should.be.an.instanceOf(Array);
                    results.should.have.lengthOf(2);
                    results[0]._id.should.equal(54);
                    results[1]._id.should.equal(55);
                    results[0]._start.should.equal(147);
                    results[0]._end.should.equal(148);
                    results[1]._start.should.equal(147);
                    results[1]._end.should.equal(149);
                    done();
                });
            });
        });
    });
});
