'use strict';
/**
 *  sap.js - Shawn Rapp 2014-12-4
 *  Party Line service advertisement protocol manager
 *  @author Shawn Rapp
 *  @version 1.0.0
 *  @license MIT. Read LICENSE for more information.
 *  @fileOverview Main library file.
 */

var SAPAgent = function() {
    this.services_stack = [];
};

/**
 * when a new service provider connects to bus it can list itself as being a listener to a context
 */
SAPAgent.prototype.registerService = function(worker_id, context) {
    var new_service = { 
        worker_id: worker_id,
        context: context
    };
    this.services_stack.push(new_service);
};

/**
 * Unregisters the service provider
 */
SAPAgent.prototype.unregisterService = function(worker_id, context) {
    var self = this;
    var new_stack = [];
    
    /* currently this is a overkill approach to removing a service listener but
    I plan to put other checks in here as well.
    */
    self.services_stack.forEach(function(service){
        if (service.context != context || service.worker_id != worker_id) {
            new_stack.push(service);
        }
    });
    
    self.services_stack = new_stack;
};

/**
 * A requester can get a list of services registered to a context.
 * returns all decendants from context
 */
SAPAgent.prototype.queryService = function(context) {
    var self = this;
    var ret_stack = [];
    var regX = new RegExp("(^"+context+")(\\..+)?");
    self.services_stack.forEach(function(service){
        if (service.context.match(regX))
            ret_stack.push(service.worker_id);
    });
};
