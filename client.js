Accounts.oauth.tryConnectAfterPopupClosed = function (credentialToken, callback) {

    var credentialSecret = OAuth._retrieveCredentialSecret(credentialToken) || null;
    Meteor.call('connectUserWithNaver', credentialToken, credentialSecret, function () {
        if (!!callback)
            callback(arguments);
    });
};

Accounts.oauth.credentialRequestForConnectCompleteHandler = function (callback) {

    return function (credentialTokenOrError) {
        if (credentialTokenOrError && credentialTokenOrError instanceof Error) {
            callback && callback(credentialTokenOrError);
        } else {
            Accounts.oauth.tryConnectAfterPopupClosed(credentialTokenOrError, callback);
        }
    };
};

Meteor.connectWithNaver = function (options, callback) {

    // support a callback without options
    if (!callback && typeof options === "function") {
        callback = options;
        options = null;
    }

    var credentialRequestCompleteCallback = Accounts.oauth.credentialRequestForConnectCompleteHandler(callback);
    Naver.requestCredential(options, credentialRequestCompleteCallback);
};