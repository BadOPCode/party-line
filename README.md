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

How To Use
----------


API Function List
-----------------


To Do
-----
- Bus to Bus routing
- SAP services. This would allow a sub to know if it has exhausted every possible service that it's current bus knows about. Also would improve routing for Bus to Bus.
