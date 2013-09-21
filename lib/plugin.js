module.exports = function (options) {
    var applicationConfig = {},
        scheme            = options.scheme;
    
    if (scheme) {
        if (typeof options.scheme === "object") {
            if (
                process.env.VCAP_APP_PORT &&
                options.scheme.private === "https"
            ) {
                throw new Error(
                    "'https' is not valid for a private scheme in Cloud Foundry"
                );
            }
            scheme = options.scheme.public;
        }
    }
    
    // Configure hostname.
    if (process.env.VCAP_APPLICATION) {
        applicationConfig = JSON.parse(process.env.VCAP_APPLICATION);
    }
    if (
        !options.hostname &&
        applicationConfig.application_uris &&
        applicationConfig.application_uris.length > 0
    ) {
        options.hostname = applicationConfig.application_uris[0];
    }
    
    if (process.env.VCAP_APP_PORT) {
        // Configure schemes.
        options.scheme = {
            private : "http",
            public  : scheme || "http"
        };
        // Configure ports.
        options.port = {
            private : process.env.VCAP_APP_PORT,
            public  : scheme === "https" ? 443 : 80
        };
    }
    
    return options;
};
