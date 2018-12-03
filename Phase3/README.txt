
Background:
-----------

1. There are two parts to the assignment
2. The 'broker-node' is a Node app which acts as the broker for the publisher and subscribers
3. The 'pub-sub-client' is the client app (Node app) which can publish as well as subscribe to notifications for certain topics


Instructions on how to run:
---------------------------

1. Dockerfile is under 'phase2/broker-node/' and 'phase2/pub-sub-client/'
2. Commands to run the docker instances:

	# Run this under 'phase2/broker-node/'
	docker build -t sonal/broker-node .
	docker run -p <BROKER-PORT>:1337 sonal/broker-node
	# Note: You can choose your <BROKER-PORT>

	# Run this under 'phase2/pub-sub-client/'
	docker build -t sonal/pub-sub-client .
	docker run -p <CLIENT-PORT>:3000 sonal/pub-sub-client
	# Note: You can choose your <CLIENT-PORT>

3. Now go to localhost:<CLIENT-PORT>, you will see sevral instances of the 'clients' for the pub-sub system

Interacting with the client:
----------------------------

1. The centralized broker is running on the port you ran it on <BROKER-PORT>
2. Each box on this page is an independent client 
3. To connect the client to the broker, enter the broker port and click on 'connect' button
4. As soon as a client gets connected, the broker opens a socket with the client and assigns an ID to it 
5. Each client can be a publisher and subscriber both 
6. To publish, enter the text to be published and its topic. All subscribers will receive the post 
7. To subscribe to topics, just select the topics for each client