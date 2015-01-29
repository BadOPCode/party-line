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
    var fl_self = this; //Node gets lost on callbacks if your using self in multiple objects.

    fl_self.debug_mode = false;
    fl_self.task = {};
    fl_self.task_cmd = task;
    fl_self.worker = {};
    fl_self.event_callback = callback; //exposes to descending
    fl_self.outbound_packets = [];
    fl_self.sending_state = false;
    fl_self.input_stream = require('JSONStream').parse();

    var winston = require('winston');
    fl_self.logger = new (winston.Logger)({
        transports: [new (winston.transports.File)({ filename: 'PL-forklink.log' })]
    });
    // fl_self.logger.add(fl_self.logger.transports.File, {filename: __dirname+'/pl-forklink.log'});
    // fl_self.logger.remove(fl_self.logger.transports.Console);
    
    
/**
 * send writes packet as a string to the standard input stream.
 * WE DO NOT VALIDATE THE INTEGRITY OF THE PACKET OR PROCESS IT IN ANYWAY.
 * This is the job of the bus routers and the service itself.  Everything 
 * in this module acts purely as a bridge.
 */
    fl_self.send = function(packet) {
        fl_self.outbound_packets.push(packet);
        
        //already running send in a different thread.
        if (fl_self.sending_state) return;
        
        //set state high this thread is going to send.
        fl_self.sending_state = true; 
        
        //keep sending till we run out of packets
        while(fl_self.outbound_packets.length > 0) {
            var out_packet = fl_self.outbound_packets.pop();
            var out_str = JSON.stringify(out_packet);
            fl_self.task.stdin.write(out_str);
        }
        
        //set state low this thread is finished.
        fl_self.sending_state = false;
    };
    
    fl_self.worker.send_callback = fl_self.send; //exposes to ascending
    fl_self.logger.info("Initialized");
}

/**
 * Sets the party line worker to the one in parameter.
 * This is used if developer declares object directly and does not use
 * party line's addFork function.
 * Can also be used to override existing worker.
 */
ForkLink.prototype.setWorker = function(new_worker) {
    var fl_self = this;

    fl_self.worker = new_worker;
    fl_self.worker.send_callback = fl_self.send; //exposes to ascending
};

/**
 * startServices actually generates the fork and ties in the events coming back.
 * We do this because things defined here are under the assumption they will be
 * manually done (unlike in the PartyLine object) and so we hold off executing 
 * fork until developer is ready.  No assuming anything!
 */
ForkLink.prototype.startService = function() {
    var fl_self = this;
    
    var fs = require('fs');
    
    fs.exists(fl_self.task_cmd, function(exists){
        if (exists) {
            try {
                fl_self.task = child_process.spawn(fl_self.task_cmd);
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
       
        fl_self.task.stdout.pipe(fl_self.input_stream);
        fl_self.input_stream.on('data', function(data){fl_self.processStdOut(fl_self,data)});
        fl_self.task.stderr.on('data', function(data){fl_self.processStdError(fl_self,data)});
        fl_self.task.on('close', function(data){fl_self.handleCloseTask(fl_self,data)});
    });

    //main thread dies we need to kill our task.
    process.on('close', function(){fl_self.task.kill('SIGHUP')});
};


/*-----------------------------------------------------------------------------
  Handler functions that sit outside of the function to be able to mediate.
  Both callback and emit are wrapped in a try as one or both maybe in a state
  of undefined.
  Developer can choose to use callback for packet sniffing or adding another
  layer before packet reaches bus.  Emit puts it straight on the bus.
-----------------------------------------------------------------------------*/
ForkLink.prototype.processStdOut = function(fork_link, data) {
    var fl_self = fork_link; //maintain familar namespace
    var packet = data;
    
    try {
        fl_self.event_callback(packet);
    } catch(err) {
        fl_self.logger.error('stdout callback: '+err);
    }
        
    try {
        fl_self.worker.emit(packet);
    } catch(err) {
        fl_self.logger.error("stdout emit: "+err);
    }
};

ForkLink.prototype.processStdError = function(fork_link, data) {
    var fl_self = fork_link; //maintain familar namespace
    
    fl_self.task.stdin.end();
    var packet = {
        type: "error",
        data: data.toString()
    };
    
    try {
        fl_self.event_callback(packet);
    } catch(err) {
        fl_self.logger.error('stderr callback: '+err);
    }
    
    try {
        fl_self.worker.emit(packet);
    } catch(err) {
        fl_self.logger.error('stderr emit: '+err);
    }
};

ForkLink.prototype.handleCloseTask = function(fork_link, code) {
    var fl_self = fork_link; //maintain familar namespace
    
    var packet = {
        type: "close",
        exit_level: code
    };

    try {
        fl_self.event_callback(packet);
    } catch(err) {
        fl_self.logger.error('close callback: '+err);
    }
    
    try {
        fl_self.worker.emit(packet);
    } catch(err) {
        fl_self.logger.error('close callback: '+err);
    }
};



//push the object to the module
//module.exports = ForkLink;
var forklink = module.exports = exports = ForkLink;