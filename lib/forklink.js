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
    this.debug_mode = false;
    this.task = {};
    this.task_cmd = task;
    this.worker = {};
    this.event_callback = callback;
    this.package_output = false;  //by default forked service will generate it's own packets.  Set to true if your calling a non-partyline program.
    this.unpackage_input = false;  //by default forked service can process it's own packets.  Set to true if your calling a non-partyline program.
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
            }
        } else {
           var packet = {
               type: "error",
               data: "Task specified does not exists."
           };
           console.log(packet);
       }
    });
    
    if (typeof(self.task.stdout) != 'undefined') {
        self.task.stdout.on('data', function(data){processStdOut(self,data)});
        self.task.stderr.on('data', function(data){processStdError(self,data)});
        self.task.on('close', function(data){handleCloseTask(self,data)});
    }
    
    //main thread dies we need to kill our task.
    process.on('close', function(){self.task.kill('SIGHUP')});
};

/**
 * send writes packet as a string to the standard input stream.
 * WE DO NOT VALIDATE THE INTEGRITY OF THE PACKET OR PROCESS IT IN ANYWAY.
 * This is the job of the bus routers and the service itself.  Everything 
 * in this module acts purely as a bridge.
 */
ForkLink.prototype.send = function(packet) {
    var self = this;

    if (self.unpackage_input) {
        self.task.stdin.write(packet.data);
    } else {
        self.task.stdin.write(packet);
    }
    //self.task.stdin.end();
};
    
/*-----------------------------------------------------------------------------
  Handler functions that sit outside of the function to be able to mediate.
  Both callback and emit are wrapped in a try as one or both maybe in a state
  of undefined.
  Developer can choose to use callback for packet sniffing or adding another
  layer before packet reaches bus.  Emit puts it straight on the bus.
-----------------------------------------------------------------------------*/
var processStdOut = function(fork_link, data) {
    var self = fork_link; //maintain familar namespace

    var packet = {
        type: "data",
        data: data.toString()
    };

    try {
        if (self.package_output) {
            self.event_callback(packet);
        } else {
            self.event_callback(data.toString());
        }
    } catch(err) {
        if (self.debug_mode)
            console.log('stdout callback: '+err);
    }
        
    try {
        if (self.package_output) {
            self.worker.emit(packet);
        } else {
            self.worker.emit(data);
        }
    } catch(err) {
        if (self.debug_mode)
            console.log('stdout emit: '+err);
    }
};

var processStdError = function(fork_link, data) {
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

var handleCloseTask = function(fork_link, code) {
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