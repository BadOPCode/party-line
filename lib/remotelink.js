'use strict';
/**
 *  remotelink.js - Shawn Rapp 2014-10-10
 *  Party Line remote link library file.
 * Provides a http link to connect the bus on servers not running on the same system.
 *  @author Shawn Rapp
 *  @version 1.0.0
 *  @license GPL version 3. Read LICENSE for more information.
 *  @fileOverview Defines the remote link object.
 */

/*!
 * Module dependencies.
 */
var flatiron = require('http')
,	director = require('director')
,	request = require('request')
,	worker = require("worker");
	

function RemoteLink() {
	// @property {string}  remote_site    URL of the link of reciever
	this.remote_site = "";
	this.api_seed_key = "";
	this.port = 8080;
	this.server = {};
	//suggested frame
	this.routes = {
		'/api': {
		}
	};
}

RemoteLink.prototype.startServer = function() {
	this.server = flatiron.createServer(function(req, res){
		director.dispatch(req, res, function(err){
			if (err){
				res.writeHead(404);
				res.end();
			}
		});	
	});
	remotelink.server.listen(this.port);
};

RemoteLink.prototype.pushMessage = function(server, message) {
	request.post(server, { form:{ id:this.id, message:message } }, function(error, response, body){
		
	});
};

var remotelink = module.exports = exports = new RemoteLink;