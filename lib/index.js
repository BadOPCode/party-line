'use strict';
/**
 *  index.js - Shawn Rapp 2014-10-10
 *  Party Line library file.
 *  @author Shawn Rapp
 *  @version 1.0.0
 *  @license MIT. Read LICENSE for more information.
 *  @fileOverview Main library file.
 */

/**
 * Module dependencies.
 */

/**
 * Constructor for PartyLine
 */
function PartyLine() {
	this.process_bus = [];
	this.Worker = require('./worker');
	this.ForkLink = require('./forklink.js');

	console.log('PartyLine bus: Initialized.');	
}

/**
 * Creates a new worker and adds it to the process bus stack.
 */
PartyLine.prototype.addWorker = function(new_worker) {
	var new_proc = (new_worker || new this.Worker(this));

	this.process_bus.push(new_proc);
	
	return new_proc;
};

PartyLine.prototype.addLocalProcess = function(task, event_callback) {
	var new_proc = new partyline.ForkLink(task, event_callback); //create a new fork object
	var new_worker = new partyline.Worker(this); //create a worker
	new_proc.setWorker(new_worker); //attach worker to fork object
	partyline.process_bus.push(new_worker); //attach worker to bus
	
	return new_proc;
};

/**
 *  Removes a processor
 *  @param {int} from  The first position to remove from array. Negative numbers starts from the end.
 *  @param {int} to  Optional last position to remove from array.  Negative numbers start from the end.
 */
PartyLine.prototype.removeWorkerFromStack = function(from, to) {
  var rest = this.process_bus.slice((to || from) + 1 || this.process_bus.length);
  this.process_bus.length = from < 0 ? this.process_bus.length + from : from;
  return this.process_bus.push.apply(this.process_bus, rest);
};

/**
 *  Removes process based on worker ID.
 *  @param {string} worker_id  ID key to remove out of of the processor stack.
 */
PartyLine.prototype.removeWorkerById = function(worker_id) {
	var found = [];
	this.process_bus.forEach(function(proc, index, ar){
		//technically there should only be one ID but search entire stack to clean any residue.
		//in future will take this opprotunity to scan and clean bus for other issues.
		if (proc.configuration.worker_id == worker_id) {
			found.push(index);
		}
	});
	found.forEach(function(pos, index, ar){
		this.process_bus.removeWorkerFromStack(pos);
	});
};

/**
 * distributes the packet accross all the connected processors
 * @param {object} packet  JSON packet to send accross bus.
 */
PartyLine.prototype.emit = function(packet) {
	var routed_packet = packet; // allow in pre-routing to be rewritten or altered

	if (routed_packet.context.match(/(^|\.)(8675309$)/)) { //loopback
		routed_packet = { //generate a packet to be sent to process requesting promiscious loopback testing.
			message: "Jenny Jenny who can I turn to\nYou give me something I can hold on to\nI know you'll think I'm like the others before\nWho saw your name and number on the wall\nJenny I've got your number\nI need to make you mine\nJenny don't change your number",
			context: packet.from,
			from: packet.context
		};
	}
	
	if (routed_packet.context == "bus") { //asking the bus controller
		switch(routed_packet.type) {
		}
	}

	this.process_bus.forEach(function(proc, index, ar){
		if (proc.configuration.worker_id == routed_packet.context) {
			proc.on(routed_packet);
		}
		var regPat = new RegExp("^"+routed_packet.context);
		if (proc.context.match(regPat)) { //this packet is designated to go to this processor module
			proc.on(routed_packet);
		} else { //failed match
		}
	});
};

var partyline = module.exports = exports = new PartyLine;