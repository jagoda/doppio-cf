doppio-cf
=========

`doppio-cf` is a plugin that allows [doppio][1] to intelligently configure the
underlying server instance when running in a Cloud Foundry environment.

## Usage

First install the packages:

    npm install doppio
    npm install doppio-cf

Then load the plugin:

    var doppio = require("doppio"),
        server;
    
    doppio.loadPlugin("doppio-cf");
    server = doppio();

See the [doppio.loadPlugin()][2] documentation for more details.

[1]: https://github.com/jagoda/doppio "Doppio"
[2]: https://github.com/jagoda/doppio#doppioloadpluginid "doppio.loadPlugin()"
