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
            if(result.statusCode === 204 && typeof result.body !== 'undefined'){
                callback(null, result.body);
            } else {
                console.log(result);
                callback(new Error('Error when deleting Node'), null);
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
