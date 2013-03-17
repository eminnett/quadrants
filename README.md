Quadrants Task Manager
======================

Quadrants is an in development project by Edward Minnett.


Tasks
-----

* Put on server.
* Set up deployment process.
* Animate task position changes (buggy on first attempt);
* Add multi-touch support.
* Create a global event dispatcher in order to clean up event dispatching across the app. (if this is needed)
* Add date support.
* Create (or at least begin creating) a responsive layout.
* Develop the ability to resize quadrants (this will be best combined with a responsive layout).
* Make wishlist for next round of development.


Development Notes
-----------------

* JS files pass JSLint with the following settings.
	`{
		"nomen": true,
		"browser": true,
		"devel": true,
		"plusplus": true,
		"todo": true,
		"predef": [
			"require",
			"define"
		]
	}`