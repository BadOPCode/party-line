'use strict';
/**
 *  worker.js - Shawn Rapp 2014-10-11
 *  Party Line library file.
 *  @license MIT. Read LICENSE for more information.
 *  @fileOverview Defines worker object.
 *  @author Shawn Rapp
 *
 * Workers attach to the process bus and provide a interface between the
 * process bus and the process modules who call them.
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
    var wk_self = this;

    wk_self.main_bus = main_bus; // can be instanced unattached
    wk_self.event_callback = {}; //packet event override.
    wk_self.send_callback = {}; //packets to be delivered to child process
    wk_self.configuration = { //pointless stub to help developers understand what a configuration object should look like
        context: '',
        worker_id: require("node-uuid").v4()
    };

    if (configuration) {
        wk_self.configuration = configuration;
    }
}

/**
 * Sets this instanced worker to a bus.
 */
Worker.prototype.attachToBus = function (new_bus) {
    var wk_self = this;

    wk_self.main_bus = new_bus;
};

/**
 * Sets the function to do call back to the external module who is using the worker.
 */
Worker.prototype.setEventCallback = function (cb) {
    var wk_self = this;

    wk_self.event_callback = cb;
};

/**
 * Registers the context address that this worker listens for
 */
Worker.prototype.setListenContext = function (new_context) {
    var wk_self = this;

    wk_self.configuration.context = new_context;
};

/**
 *  Matches matches context_pattern to possible matches for listeners.
 */
Worker.prototype.matchContext = function (context_pattern) {
    var wk_self = this;

    var search_context = context_pattern;

    //if the sub set listener to all than every packet is forwarded
    wk_self.configuration.context.forEach(function (listener) {
        if (listener == 'all')
            retVal = true;
    });

    //matches a explicit context that specifies .bus_id.worker_id
    if (search_context.match(/^\.(.+)\.(.+)/)) {
        var res = search_context.match(/^\.(.+)\.(.+)/);
        if (res[1] != wk_self.main_bus.id) {
            //not the right bus
            return false;
        }

        //on correct bus; set the search for the worker
        search_context = res[2];
    }

    if (search_context == wk_self.configuration.worker_id) {
        return true;
    } else if (context_pattern.match(/^\./)) {
        //bad explicit context
        return false;
    }

    //contains context
    var regPat = new RegExp("(^" + search_context + ")(\\..+)?");
    if (typeof (wk_self.configuration.context) === "string") {
        if (wk_self.configuration.context.match(regPat))
            return true;
    } else {
        var retVal = false;
        wk_self.configuration.context.forEach(function (listener) {
            if (listener.match(regPat))
                retVal = true;
        });
        return retVal;
    }

    return false;
};

Worker.prototype.send = function (packet) {
    var wk_self = this;

    if (wk_self.send_callback) {
        wk_self.send_callback(packet);
    } else {
        console.log("PL ERROR: No send callback is set while the bus event is being triggered.");
    }
};

/**
 * Sends a message to the process bus.
 */
Worker.prototype.emit = function (packet) {
    var wk_self = this;

    if (wk_self.main_bus) {
        packet.from = wk_self.configuration.worker_id;
        //intercept control packets that don't have to go to the bus controller
        if (packet.context == "bus") { //requesting from the bus controller
            switch (packet.type) {
                case "whoAmI":
                    var outgoing_packet = {
                        from: "bus",
                        context: packet.from,
                        type: "youAre",
                        worker_id: wk_self.configuration.worker_id,
                        bus_id: wk_self.main_bus.id
                    };
                    wk_self.send(outgoing_packet);
                    break;
                case "setListenContext":
                    wk_self.setListenContext(packet.listen_context);
                    wk_self.main_bus.emit(packet);
                    break;
                default:
                    //nothing for worker so actually send it up to the bus.
                    wk_self.main_bus.emit(packet);
            }
        } else {
            wk_self.main_bus.emit(packet);
        }
    } else {
        console.log('PL ERROR: Trying to emit with worker ' + wk_self.configuration.worker_id + ' while not attached to bus.');
    }
};

/**
 * defines a event that is called when a message is delivered to worker from process bus.
 */
Worker.prototype.on = function (packet) {
    var wk_self = this;

    if (wk_self.event_callback) {
        wk_self.event_callback(packet);
    } else {
        console.log("PL ERROR: No event callback is set while the bus event is being triggered.");
    }
};

module.exports = exports = Worker;
//var worker = module.exports = exports = new Worker;
