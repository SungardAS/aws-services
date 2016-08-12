# backlog
A node.js 'code backup' module for saving your file changes and more importantly, recovering your code. With backlog, you can recover your node.js file's code by simply setting the key 'backup' to true.

## Using backlog
### Install
Install using npm
```
npm install backlog
```

You can also install by cloning this repository and putting it in the `node_modules` directory of your project.

### Setting it up
backlog is very simple to use. In just a few lines, you can backup your code and retrieve it.

Use the library with require()
```
var backlog = require('backlog')
```

Next, you must set the settings for backup, there are three options in the settings: backup, message, and logFile. This file will be called **app.js**

```
//`app.js` file

var backlog = require('backlog');

backlog.settings({
	message: 'This is my first file change.'
});

backlog.init();
```
Run this file with `node app.js`

This backlog is initiated without a backup save. **The backlog.settings() function is optional but backlog.init() is required and what initiates backlog**. The logs will be written in a file named 'back.log'. Go to back.log and you'll see something similar to this...

`back.log` file output 
```
{
  "1": {
    "filename": "app.js",
    "timestamp": "Tue Jun 11 2013 09:20:43",
    "message": "This is my first file change.",
    "char_count": 476,
    "line_count": 18
  }
}
```

### Backing up the file
Use `backup: true` in the settings.
```
//`app.js` file

var backlog = require('backlog')

backlog.settings({
	backup: true,
	message: 'This is my second file change.'
});

backlog.init()
```

When you run the app.js file again with `node`, the output in your log file should now look similar to this.

```
{
  "1": {
    "filename": "app.js",
    "timestamp": "Tue Jun 11 2013 09:20:43",
    "message": "This is my first file change.",
    "char_count": 476,
    "line_count": 18
  },
  "2": {
    "filename": "app.js",
    "timestamp": "Tue Jun 11 2013 10:05:37",
    "message": "This is my second file change.",
    "char_count": 477,
    "line_count": 18,
    "encoded": "93,0,0,1,0,-78,1,0,0,0,0,0,0,0,59,24,74,-90,39,85,122,99,28,-17,117,36,-123,91,8,119,-72,84,-96,-58,80,10,21,39,-19,46,-73,103,-46,-78,-25,-126,7,-66,24,13,-114,80,66,-29,-115,-47,117,34,-31,-45,-100,-114,45,-1,-46,-61,121,93,-109,-91,106,27,-7,-52,116,-63,124,-99,-117,47,62,-40,-109,109,67,-94,97,-88,121,-19,1,97,-115,-58,47,103,69,-72,121,80,-41,-53,50,6,1,-61,83,76,102,-67,-108,109,-85,10,-81,-81,99,-34,87,2,-12,13,56,-63,61,-88,-6,115,-94,-51,65,17,-40,2,100,-118,-107,-39,61,37,-88,-58,6,84,-105,29,-36,-100,-63,108,-90,71,-96,-22,94,-102,-104,-95,-4,95,33,59,-6,-82,52,-14,102,12,94,73,-37,-81,85,65,-2,-113,-105,22,54,49,-26,-81,51,-29,-126,-51,10,127,-4,-83,-18,104,83,-10,-35,58,68,-89,10,-89,28,22,30,-53,-124,112,18,37,32,35,86,-63,-114,14,3,120,11,1,37,-48,-121,-61,87,-57,-43,40,-77,73,48,81,16,-46,-124,-48,-101,-65,-47,-123,2,-52,-88,-72,-25,89,83,-99,-101,-102,102,39,-42,-119,-108,54,39,96,113,-19,106,-107,-27,-91,-8,-74,17,-30,-119,6,65,-33,-44,74,125,-67,79,50,-30,100,-83,103,88,-25,19,-10,-103,90,59,-1,89,34,-24,-8,-43,89,-96,-26,-6,61,113,90,57,12,125,13,-20,-34,112,-4,85,43,-122,121,125,52,-91,12,-111,-121,-81,-1,-54,77,-104,0"
  }
}
```

As you see above, there is a new index called '2' with a new key. The encoded key has a value of the encoded text of the source file you backed up.

### Retrieving your backups
The encoded key is a compressed version of your code. In order to retrieve this code in a new file, you must run this line in your code. **If your backed up code was the 2nd index in the log file, as seen above, then retrieving the code would look like this.**
```
backlog.retrieve(2, 'back.log');
```

The first parameter of retrieve() is used to resemble the index in your log's json. The second parameter resembles the file name of your log.

A new file named 2_app.js, containing your backed up code, will appear in your directory with your original app.js. 

### Change the file name
logFile is a key used to represent the name of your log file, thus replacing the default back.log.
```
backlog.settings({
	logFile: 'jared.log',
	message: 'This is my code that has this thing in it...'
});
```


## API
### backup.settings(settings)
'settings' should be a associative array (dictionary) with three optional keys, backup (set to a boolean), logFile (set to a string), message (set to a string). Setting **must** always be before init()

### backup.init()
This function is what initiates backlog. Your file should ideally end with it.

### backup.retrieve(key, file)
This is the function for retrieving the encoded source. Key parameter is the key for the backed up code you want to get back (should be an integer more than 0) and can be a string. file parameter represents the backlog generated log file you want to retrieve the code from.

### backup.clearLog(file)
This function is simply used for clearing your backlog generated logs.

## Contact
If you would like to contact me for further information on the project, see the info below.

Email: jawerty210@gmail.com

Github: jawerty

Twitter: @jawerty

Blog: <http://wrightdev.herokuapp.com>

## License
Licensed under the MIT License
