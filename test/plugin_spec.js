var async   = require("async"),
    doppio  = require("doppio"),
    expect  = require("chai").expect,
    request = require("request");

describe("The plugin", function () {
    
    var server;
    
    function loadEnvironment () {
        var env = loadEnvironment.env || {};
        
        Object.keys(process.env).forEach(function (key) {
            if (key in env) {
                process.env[key] = env[key];
            }
            else {
                delete process.env[key];
            }
        });
    }
    
    function saveEnvironment () {
        var env = loadEnvironment.env = {};
        
        Object.keys(process.env).forEach(function (key) {
            env[key] = process.env[key];
        });
    }
    
    function checkResponse (response, body, callback) {
        expect(response.statusCode).to.equal(200);
        expect(body).to.equal("okay");
        callback();
    }
    
    function testHandler (request, response) {
        response.writeHead(200, { "Content-Type": "text/plain" });
        response.end("okay");
    }
    
    before(function () {
        doppio.loadPlugin("..");
    });
    
    after(function () {
        doppio.unloadPlugins();
    });
    
    beforeEach(function () {
        saveEnvironment();
    });
    
    afterEach(function (done) {
        loadEnvironment();
        try {
            server.stop(done);
            server = null;
        }
        catch (error) {
            // Ignore errors.
            done();
        }
    });
    
    it("can get the external hostname from Cloud Foundry", function (done) {
        process.env.VCAP_APPLICATION =
            "{\"application_uris\":[\"test.cf.com\"]}";
        server = doppio();
        
        async.waterfall(
            [
                function (next) {
                    server.start(next);
                },
                function (next) {
                    expect(server.url()).to.match(
                        /http:\/\/test.cf.com:\d{1,5}\//
                    );
                    next();
                }
            ],
            done
        );
    });
    
    it("gives preference to explicitly configured hostnames", function (done) {
        process.env.VCAP_APPLICATION =
            "{\"application_uris\":[\"test.cf.com\"]}";
        server = doppio({ hostname: "test.foo.com" });
        
        async.waterfall(
            [
                function (next) {
                    server.start(next);
                },
                function (next) {
                    expect(server.url()).to.match(
                        /http:\/\/test.foo.com:\d{1,5}\//
                    );
                    next();
                }
            ],
            done
        );
    });
    
    it("can get the port configuration from Cloud Foundry", function (done) {
        process.env.VCAP_APP_PORT = "54321";
        server = doppio(testHandler);
        
        async.waterfall(
            [
                function (next) {
                    server.start(next);
                },
                function (next) {
                    // Cloud Foundry public port is typically 80.
                    expect(server.url()).to.equal("http://localhost:80/");
                    request.get("http://localhost:54321", next);
                },
                checkResponse
            ],
            done
        );
    });
    
    it("gives preference to Cloud Foundry ports", function (done) {
        process.env.VCAP_APP_PORT = "54321";
        server = doppio({ port: 12345 }, testHandler);
        
        async.waterfall(
            [
                function (next) {
                    server.start(next);
                },
                function (next) {
                    expect(server.url()).to.equal("http://localhost:80/");
                    request.get("http://localhost:54321", next);
                },
                checkResponse
            ],
            done
        );
    });
    
    it("only changes the URL when the scheme is set", function (done) {
        process.env.VCAP_APP_PORT = "54321";
        
        async.waterfall(
            [
                function (next) {
                    server = doppio(
                        { port: 12345, scheme: "https" },
                        testHandler
                    );
                    server.start(next);
                },
                function (next) {
                    expect(server.url()).to.equal("https://localhost:443/");
                    request.get("http://localhost:54321", next);
                },
                checkResponse,
                function (next) {
                    server.stop(next);
                },
                function (next) {
                    server = doppio(
                        {
                            scheme : {
                                private : "http",
                                public  : "http"
                            }
                        },
                        testHandler
                    );
                    server.start(next);
                },
                function (next) {
                    expect(server.url()).to.equal("http://localhost:80/");
                    request.get("http://localhost:54321", next);
                },
                checkResponse
            ],
            done
        );
    });
    
    it(
        "throws an error explicitly using 'https' for the private scheme",
        function () {
            process.env.VCAP_APP_PORT = "54321";
            expect(function () {
                doppio(
                    {
                        scheme : {
                            private : "https",
                            public  : "http"
                        }
                    }
                );
            }).to.throw(
                "'https' is not valid for a private scheme in Cloud Foundry"
            );
        }
    );
    
});
