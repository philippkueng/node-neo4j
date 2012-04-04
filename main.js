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
    request
        .post(this.url + '/db/data/node')
        .send(node)
        .set('Accept', 'application/json')
        .end(function(result){
            // console.log(result.body.data);
            if(typeof result.body !== 'undefined'){
                // callback(null, JSON.parse(result.body));
                callback(null, result.body);
            } else {
                callback(new Error('Response is empty'), null);
            }
        });
};



/* Delete a Node --------- */
// Nodes with Relationships cannot be deleted -> deliver proper error message
// superagent has no method delete as of yet!!

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
            
            // console.log(result);
            // callback(null, {});
        });
};

var getPathWithoutUsernameAndPassword = function(path){
    if(typeof path !== 'undefined'){
        return path.replace(/[^a-zA-Z0-9]+\:[^a-zA-Z0-9]+\@/, '');
    }
};

module.exports.getPathWithoutUsernameAndPassword = getPathWithoutUsernameAndPassword;

