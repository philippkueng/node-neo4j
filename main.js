var request = require('superagent');

module.exports = Neo4j;

function Neo4j(url){
    if(typeof url !== 'undefined' && url !== ''){
        this.url = url;
    } else {
        this.url = 'http://localhost:7474';
    }
};

/* Insert a Node --------- */

Neo4j.prototype.InsertNode = function(node, callback){
    var that = this;
    request
        .post(this.url + '/db/data/node')
        .send(node)
        .set('Accept', 'application/json')
        .end(function(result){
            if(typeof result.body !== 'undefined'){
                that.AddNodeId(result.body, callback);
            } else {
                callback(new Error('Response is empty'), null);
            }
        });
};



/* Delete a Node --------- */
// Nodes with Relationships cannot be deleted -> deliver proper error message

Neo4j.prototype.DeleteNode = function(node_id, callback){
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

Neo4j.prototype.ReadNode = function(node_id, callback){
    var that = this;
    request
        .get(this.url + '/db/data/node/' + node_id)
        .set('Accept', 'application/json')
        .end(function(result){
           if(typeof result.body !== 'undefined'){
               if(result.statusCode === 200){
                   that.AddNodeId(result.body, callback);   
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

Neo4j.prototype.UpdateNode = function(node_id, node_data, callback){
    var that = this;
    request
        .put(this.url + '/db/data/node/' + node_id + '/properties')
        .send(that.ReplaceNullWithString(node_data))
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


/* HELPER METHODS --------- */

/* Strips username and password from URL so that the node_id can be extracted. */

Neo4j.prototype.RemoveCredentials = function(path){
    if(typeof path !== 'undefined' && path !== ''){
        return path.replace(/[a-z0-9]+\:[a-z0-9]+\@/, '');
    } else {
        return '';
    }
};


/* Extract node_id and add it as a property. */

Neo4j.prototype.AddNodeId = function(node, callback){    
    node.id = node.self.replace(this.RemoveCredentials(this.url) + '/db/data/node/', '');
    callback(null, node);
};


/* Replace null values with an empty string */

Neo4j.prototype.ReplaceNullWithString = function(node_data, callback){

    for(var key in node_data){
        if(node_data.hasOwnProperty(key) && node_data[key] === null){
            node_data[key] = '';
        }
    }
    
    return node_data;
};


