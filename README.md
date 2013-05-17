# Neo4j REST API wrapper for Node.js

---

## Installation

    npm install node-neo4j

## Usage

In order to use the library you either have to create a [heroku](http://www.heroku.com/) app and add the [Neo4j Addon](https://addons.heroku.com/neo4j) there or install it locally.<br/>If you're using OS X i highly recommend installing Neo4j via [Homebrew](http://mxcl.github.com/homebrew/).

    $ brew install neo4j
    $ neo4j start

**Instantiate a wrapper instance**

    var neo4j = require('node-neo4j');
    db = new neo4j('http://username:password@domain:port');


### Node operations
        
**Insert a Node**

    db.insertNode({
        name: 'Darth Vader',
        sex: 'male'
    },function(err, node){
        if(err) throw err;
        
        // Output node properties.
        console.log(node.data);
        
        // Output node id.
        console.log(node.id);
    });

**Read a Node**

    db.readNode(12, function(err, node){
        if(err) throw err;
    
        // Output node properties.
        console.log(node.data);
       
        // Output node id.
        console.log(node.id);
    });

**Update a Node**

Will remove any assigned properties and replace them with the ones given below.

    db.updateNode(12, {name:'foobar2'}, function(err, node){
        if(err) throw err;

        if(node === true){
            // node updated
        } else {
            // node not found, hence not updated
        }
    });
        
**Delete a Node**

    db.deleteNode(12, function(err, node){
        if(err) throw err;
       
        if(node === true){
            // node deleted
        } else {
            // node not deleted because not found or because of existing relationships
        }
    });


### Relationship operations

**Insert a Relationship**

    db.insertRelationship(root_node_id, other_node_id, 'RELATIONSHIP_TYPE', {
        age: '5 years',
        sideeffects: {
            positive: 'happier',
            negative: 'less time'
        }}, function(err, relationship){
            if(err) throw err;

            // Output relationship properties.
            console.log(relationship.data);

            // Output relationship id.
            console.log(relationship.id);

            // Output relationship start_node_id.
            console.log(relationship.start_node_id);

            // Output relationship end_node_id.
            console.log(relationship.end_node_id);
    });

**Read a Relationship**

    db.readRelationship(relationship_id, function(err, relationship){
        if(err) throw err;

        // Same properties for relationship object as with InsertRelationship
    });

**Update a Relationship**

Will remove any assigned properties and replace them with the ones given below.

    db.updateRelationship(relationship_id, {
            age: '6 years'
        }, function(err, relationship){
            if(err) throw err;

            if(relationship === true){
                // relationship updated
            } else {
                relationship not found, hence not updated.
            }
    });

**Delete a Relationship**

    db.deleteRelationship(relationship_id, function(err, relationship){
        if(err) throw err;

        if(relationship === true){
            // relationship deleted
        } else {
            // relationship not deleted because not found.
        }
    });


### Index operations

This documentation only contains calls to Node specific index functions however to call those functions for Relationships, just replace `Node` with `Relationship`.

**Insert an Index**

    db.insertNodeIndex('the_index_name', function(err, result){
        if (err) throw err;

        console.log(result); // return the index template and configuration
    });

    // insert an index with a custom configuration
    db.insertNodeIndex({
        index: 'the_index_name',
        config: {
            type: 'fulltext',
            provider: 'lucene'
        }
    }, function(err, result){
        if (err) throw err;

        console.log(result); // return the index template with its custom configuration
    });

**Delete an Index**

    db.deleteNodeIndex('the_index_name', function(err, result){
        if (err) throw err;

        console.log(result) // will be true, if the deletion is successful
    });

**List all Indexes**

    db.listNodeIndexes(function(err, result){
        if (err) throw err;

        console.log(result); // an object with all indexes and their templates and configurations
    });
		
**Add a node to an index**

    db.addNodeToIndex(node_id, 'the_index_name', 'an_indexed_key', 'an_indexed_value', function(err, result){
        if (err) throw err;
        
        console.log(result); // will return the index 
    });

### Advanced relationship operations

**Get all relationship types used within the Neo4j database**

Will also return types of those relationships that have been deleted.

    db.readRelationshipTypes(function(err, result){
        if(err) throw err;

        console.log(result); // eg. ['RELATED_TO', 'LOVES', 'KNOWNS']
    });

**Get all relationships of a node**

Will return incoming aswell as outgoing nodes.

    db.readAllRelationshipsOfNode(node_id, function(err, relationships){
        if(err) throw err;

        console.log(relationships); // delivers an array of relationship objects.
    });

**Get all incoming relationships of a node**

    db.readIncomingRelationshipsOfNode(node_id, function(err, relationships){
        if(err) throw err;

        console.log(relationships); // delivers an array of relationships objects.
    });

**Get all outgoing relationships of a node**

    db.readOutgoingRelationshipsOfNode(node_id, function(err, relationships){
        if(err) throw err;

        console.log(relationships); // delivers an array of relationships objects.
    });

**Run a cyper query against Neo4j**

    db.cypherQuery("START user = node(123) MATCH user-[:RELATED_TO]->friends RETURN friends", function(err, result){
        if(err) throw err;

        console.log(result.data); // delivers an array of query results
        console.log(result.columns); // delivers an array of names of objects getting returned
    });

**Run a batch query against Neo4j**

For more information about what queries are possible checkout the [Neo4j REST API documentation](http://docs.neo4j.org/chunked/stable/rest-api-batch-ops.html).

    db.batchQuery([
        {
            method: "GET",
            to: "/node/100",
            id: 0
        },{
            method: "GET",
            to: "/node/102",
            id: 1
        }
    ], function(err, result){
        if(err) throw err;

        console.log(result); // delivers an array of query results
    });

## Tests

This API wrapper relies on [mocha](https://github.com/visionmedia/mocha) for testing, therefore when you want to run the tests follow the steps below.

    $ git clone git://github.com/philippkueng/node-neo4j.git
    $ cd node-neo4j/
    $ npm install
    $ npm test

## Issues or Feature Requests?

In case you run into an issue while using the wrapper or you have a feature request please let me know by [creating a new issue](https://github.com/philippkueng/node-neo4j/issues) or contacting me via [twitter](https://twitter.com/philippkueng).

## License

Copyright (C) 2012 Philipp Küng

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
