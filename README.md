# Marauders-Map
Real time visualization of map for indoor navigation

1. Install mongodb, nodejs. Ensure mongodb is running
2. Go to root folder (with package.json) and type `npm install`
3. Navigate to /bin and type `node www` to start the server

API

1. Initialize path
==================

GET http://localhost:3000/draw_path?path=Your_path_json_here
Please follow format given in documentation. No error checking is done.
Example:

`http://localhost:3000/draw_path?path=[{"stage":1,"building":"COM1","level":2,"path":[1,2,4,7,10,11,14,15,32,33]},{"stage":2,"building":"COM2","level":3,"path":[1,16,14,2,7,8,9,10,11]},{"stage":3,"building":"COM2","level":2,"path":[14,13,12,11,6,19,20]}]`

Returns this if success:

`{"transaction_id":"1441722440421","status":"OK"}`

2. View map
===========
Go to the following page of your browser

`http://localhost:3000/visualize?transaction_id=1441722440421`

