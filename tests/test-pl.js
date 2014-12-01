var partyline = require('..');
  
var test  = partyline.addWorker();

test.setContext('testing');
test.setEventCallback(function(packet){
  console.log(packet.message);
});
test.emit({context:"8675309", from:"testing"});

var testfork = new partyline.ForkLink('sh', function(packet){ 
    console.log(packet);
});
testfork.package_output = true;
testfork.unpackage_input = true;
testfork.startService();
testfork.send({data:'ls\n'});
testfork.send({data:'ls /\n'});
testfork.send({data:'exit\n'});