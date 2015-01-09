'use strict';
/**
 *  forklink.js - Shawn Rapp 2014-10-11
 *  Party Line library file.
 *  @license MIT. Read LICENSE for more information.
 *  @fileOverview Defines worker object.
 *  @author Shawn Rapp
 * 
 */

/*!
 * Module dependencies.
 */
var child_process = require('child_process');
    
/**
 * ForkLink object declaration
 */
function ForkLink(task, callback) {
    var self = this;

    self.debug_mode = false;
    self.task = {};
    self.task_cmd = task;
    self.worker = {};
    self.event_callback = callback; //exposes to descending
    self.outbound_packets = [];
    self.sending_state = false;
    self.input_stream = require('JSONStream').parse();
    
/**
 * send writes packet as a string to the standard input stream.
 * WE DO NOT VALIDATE THE INTEGRITY OF THE PACKET OR PROCESS IT IN ANYWAY.
 * This is the job of the bus routers and the service itself.  Everything 
 * in this module acts purely as a bridge.
 */
    self.send = function(packet) {
        self.outbound_packets.push(packet);
        
        //already running send in a different thread.
        if (self.sending_state) return;
        
        //set state high this thread is going to send.
        self.sending_state = true; 
        
        //keep sending till we run out of packets
        while(self.outbound_packets.length > 0) {
            var out_packet = self.outbound_packets.pop();
            self.task.stdin.write(JSON.stringify(out_packet));
        }
        
        //set state low this thread is finished.
        self.sending_state = false;
//        self.task.stdin.write(JSON.stringify(packet));
    };
    
    self.worker.send_callback = self.send; //exposes to ascending
}

/**
 * Sets the party line worker to the one in parameter.
 * This is used if developer declares object directly and does not use
 * party line's addFork function.
 * Can also be used to override existing worker.
 */
ForkLink.prototype.setWorker = function(new_worker) {
    var self = this;

    self.worker = new_worker;
    self.worker.send_callback = self.send; //exposes to ascending
};

/**
 * startServices actually generates the fork and ties in the events coming back.
 * We do this because things defined here are under the assumption they will be
 * manually done (unlike in the PartyLine object) and so we hold off executing 
 * fork until developer is ready.  No assuming anything!
 */
ForkLink.prototype.startService = function() {
    var self = this;
    
    var fs = require('fs');
    
    fs.exists(self.task_cmd, function(exists){
        if (exists) {
            try {
                self.task = child_process.spawn(self.task_cmd);
            } catch(err) {
                var packet = {
                    type: "error",
                    data: err
                };
                console.log(packet);
                return;
            }
        } else {
            var out_packet = {
                type: "error",
                data: "Task specified does not exists."
            };
            console.log(out_packet);
            return;
        }
       
        self.task.stdout.pipe(self.input_stream);
        self.input_stream.on('data', function(data){self.processStdOut(self,data)});
        self.task.stderr.on('data', function(data){self.processStdError(self,data)});
        self.task.on('close', function(data){self.handleCloseTask(self,data)});
    });

    //main thread dies we need to kill our task.
    process.on('close', function(){self.task.kill('SIGHUP')});
};


/*-----------------------------------------------------------------------------
  Handler functions that sit outside of the function to be able to mediate.
  Both callback and emit are wrapped in a try as one or both maybe in a state
  of undefined.
  Developer can choose to use callback for packet sniffing or adding another
  layer before packet reaches bus.  Emit puts it straight on the bus.
-----------------------------------------------------------------------------*/
ForkLink.prototype.processStdOut = function(fork_link, data) {
    var self = fork_link; //maintain familar namespace
    var packet = data;
    
    try {
        self.event_callback(packet);
    } catch(err) {
        if (self.debug_mode)
            console.log('stdout callback: '+err);
    }
        
    try {
        self.worker.emit(packet);
    } catch(err) {
        if (self.debug_mode)
            console.log('stdout emit: '+err);
    }
};

ForkLink.prototype.processStdError = function(fork_link, data) {
    var self = fork_link; //maintain familar namespace
    
    self.task.stdin.end();
    var packet = {
        type: "error",
        data: data.toString()
    };
    
    try {
        self.event_callback(packet);
    } catch(err) {
        if (self.debug_mode)
            console.log('stderr callback: '+err);
    }
    
    try {
        self.worker.emit(packet);
    } catch(err) {
        if (self.debug_mode)
            console.log('stderr emit: '+err);
    }
};

ForkLink.prototype.handleCloseTask = function(fork_link, code) {
    var self = fork_link; //maintain familar namespace
    
    var packet = {
        type: "close",
        exit_level: code
    };

    try {
        self.event_callback(packet);
    } catch(err) {
        if (self.debug_mode)
            console.log('close callback: '+err);
    }
    
    try {
        self.worker.emit(packet);
    } catch(err) {
        if (self.debug_mode)
            console.log('close callback: '+err);
    }
};



//push the object to the module
//module.exports = ForkLink;
var forklink = module.exports = exports = ForkLink;