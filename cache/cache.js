const NodeCache = require( "node-cache" );
const myCache = new NodeCache();

exports.getKey = function(key){
    return myCache.get(key);
}

exports.setKey = function(key, value, stdTTL = 1000){
    return myCache.set(key, value, stdTTL);
}

exports.setManyKeys = function(listKeyValues = [],stdTTL = 1000){
    return myCache.mset(listKeyValues, stdTTL);
}

exports.getTtl = function(key){
    return myCache.getTtl(key);
}