Party Line Bus Module
=====================

Author
------

Shawn Rapp 2014-10-09


Description
-----------

Party Line creates a bus that provides internal and external API links of communication.
This is the first (maybe fatal) step in making a easy open standard enterprise solution.
Warning this is experimental and in design phase.

What problem does it solve?
---------------------------

Party Line is designed with the intentions of being used for large websites.  The approach is to make the core of the web services a service bus instead of starting with a core system that connects to services in a star bus fashion.  While star bus is faster and smaller, (In the networking world it would be directly connecting a cable to each server that would potentially want to talk to each other) but is much more complex to setup and maintain.  Party Line puts the bus at the core and every piece of the web transaction can be broken into small single purposed subsystems.  Because it is bus communication at the very heart, you can load in as many of these single purposed subsystems.  You can load multiple of the same type of subsystem in fact.  This allows for fast scaling; upgrading or changing hot; simplifying cloud distributing.
Scaling up and down your servers to best ultiize memory and CPU is made easy and can be done without any disruptions to the end users.  Load balancing isn't a impossible juggling act.
While Party Line was designed to tackle issues with large websites it could also be used for non-website problems.  Party Line only stipulates how to address and route data.  But it has no concern what the data is its transporting.  So it's quite feasible to use Party Line for a remote administration protocol or monitoring.  As I design Party Line I actually think of scenarios like this to maintain that Party Line remains simplistic and doesn't overreach in any one niche.

Terminology
-----------

Address or Worker ID: the worker id that a subsystem is connected as.  This is automatically generated by the system every time the subsystem is created.  All ID's are formed with GUID's.
Bus ID: The bus id is the address of the processor bus.  This is generated on startup of the bus and is never explicitly designated.
Explicit Address: Is an address that starts with a dot (.) and contains the bus id and the worker id.  All ID's are formed with GUID's. 
Context: is the loose addressing scheme that a subsystem can broadcast or listen on.  For example a context for a HTML page generator might be 'web.html'.
Processor Bus or Bus:  The lowest level of the system.  It essentially handles routing and SAP's for subs.
Processor: The interface the sub talks to that packages from the sub into a Party Line communication.
Worker: Provides a common interface between the processor bus and the processor.  It handles naunce issues and answers questions for subs that is outside of the scope of the bus.  This layer is responsible for keeping things moving.
Sub or Subsystem:  Highest level of the system.  How and what the sub is totally depends on the processor.  This can litterally be anything from a command line application to database server. 
SAP:  a service provided by the bus itself.  It sends a list of subs set to listen on queried contexts.

Overview
--------

Most people working with Party Line will only be interested in the subsystem layers. But even as a sub developer it is very helpful to know some of the layers bellow you to be able to write and debug quicker.
In a nutshell starting from the lowest to the highest the stack looks like this...

Process Bus <---> Worker <---> Processor <---> Sub

Processor bus is the lowest layer.  It performs routing and provides a interface for SAPs.  The worker layer is a layer that ensures validity to what is passed between processor bus and processor.  It can intercept packets that it can answer for a processor rather than pushing that query up to the processor bus.  For example it ensures that all packets are signed with the from field. If the packet doesn't have a from field it will put it in the packet before sending it to the processor bus.  The processor is actually an abstract layer that communicates with a sub type to the worker.  This allows subs to be written in many different styles.  A sub may not even realize it is a sub for the example of the command processor IE cmdlink.  The subsystem running is a regular command line program that the cmdlink process wrappers to allow it to communicate accross the bus.  Where as a forklink processor the sub is actually expected to have some knowledge of it being a Party Line sub.  The processor layer allows quick and easy method of extending the party line functionality that is reusable for multiple subs.  There is no restrictions on what a processor can do and there for no restrictions on what a sub can be.  As of writing this document the only real requirement is that the processor MUST have a send method that is passed to the worker so it can send data to your processor.  It's intended to be feasible to be able to wrapper up database engines and anything you can dream up to be placed a subsystem.
Lastly there is the SAP system, which is a simple database that subs can post available services they offer and query for services.  This is a common interface and a bit primitive in nature on finding services.  It is completely based on the context that you set your subs to listen for and so other subs requesting a service has a general idea of who out there is listening.  It is the responsibility of a service sub to respond to all requests that come through to its context its listening on.  Ignoring requests is absolutely forbidden behavior.  If it has no ability to answer the request it needs to respond back to the requesting sub a packet with the type "noResponse".  Failure to do this will cause requesting subs to possibly indifintely wait for a response to the silent sub.  It is slated to have the worker place a timeout that can be adjusted by the processor, where a noResponse will be filled for silent service subs.  But this still a bad practice and will cause unnecessary lagged performance.  If you register a listening context you must respond to all incoming requests.



How To Use
----------


API Function List
-----------------
setListenContext
``` {"context":"bus","type":"setListenContext","listen_context":["web.html"]} ```

sapQuery
``` {"context":"bus","type":"sapQuery","service_context":"web.html"} ```

whoAmI
``` {"context":"bus","type":"whoAmI"} ```

youAre
``` {"from":"bus","type":"youAre","worker_id":"0bd361f0-3a0a-497b-bd64-63b14a279d06","bus_id":"a54543a3-0be5-4a69-8c88-d1adab94e676"} ```


To Do
-----
- Bus to Bus routing
- Remote processors (SSH tunneled)
- Documentation
