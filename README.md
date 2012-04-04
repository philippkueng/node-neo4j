# Neo4j REST API Wrapper for Node.js

---

## Installation

        npm install node-neo4j

## Usage

Instantiate a wrapper instance.

        var neo4j = require('node-neo4j);
        db = new neo4j('http://username:password@domain:port');

        
Insert a Node.

        db.InsertNode({
            name: 'Darth Vader',
            sex: 'male'
        },
        function(err, node){
            
            // Output Node properties.
            console.log(node.data);
            
            // Output Node id.
            console.log(node.id);
        });

## License

Copyright (C) 2012 Philipp Küng

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.