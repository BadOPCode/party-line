'use strict';
/**
 *  worker.js - Shawn Rapp 2014-10-11
 *  Party Line library file.
 *  @license GPL version 3. Read LICENSE for more information.
 *  @fileOverview Defines worker object.
 *  @author Shawn Rapp
 * 
 * Workers attach to the process bus and provide a interface between the 
 * process bus and the modules who call them.
 * The context addressing is a simple broadcast to granular rooms.  
 * IE:  A message sent to 'house.bedroom' will also be heard by a worker registered
 * to 'house.bedroom.closet'
 */


/**
 * Module dependencies
 */


/**
 * Constructor for a PartyLine worker.
 */
function Worker(main_bus, configuration) {
	this.main_bus = main_bus; // can be instanced unattached
	this.event_callback = {};
	this.configuration = { //pointless stub to help developers understand what a configuration object should look like
		context: '',
		worker_id: require("node-uuid").v4()
	};

	if (configuration) {
		this.configuration = configuration;
	}
}

/**
 * Sets this instanced worker to a bus.
 */
Worker.prototype.attachToBus = function(new_bus) {
	this.main_bus = new_bus;
};

/**
 * Sets the function to do call back to the external module who is using the worker.
 */
Worker.prototype.setEventCallback = function(cb) {
	this.event_callback = cb;
};

/**
 * Registers the context address that this worker listens for
 */
Worker.prototype.setContext = function(new_context) {
	this.context = new_context;
};

/**
 * Sends a message to the process bus.
 */
Worker.prototype.emit = function(packet) {
	if (this.main_bus) {
		packet.from = this.configuration.worker_id;
		this.main_bus.emit(packet);
	} else {
		console.log('PL ERROR: Trying to emit with worker '+this.configuration.worker_id+' while not attached to bus.');
	}
};

/**
 * defines a event that is called when a message is delivered to worker from process bus.
 */
Worker.prototype.on = function(packet) {
	if (this.event_callback) {
		this.event_callback(packet);
	} else {
		console.log("PL ERROR: No callback is set while the bus event is being triggered.");
	}
};

module.exports = exports = Worker;
//var worker = module.exports = exports = new Worker;