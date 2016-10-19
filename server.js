// OVERRIDE CORE METHOD for custom naver user selection on email
// this can be removed when the pull-request is merged
// https://github.com/meteor/meteor/pull/2318

///
/// OAuth Encryption Support
///

var OAuthEncryption = Package["oauth-encryption"] && Package["oauth-encryption"].OAuthEncryption;


var usingOAuthEncryption = function () {
  return OAuthEncryption && OAuthEncryption.keyIsLoaded();
};


// OAuth service data is temporarily stored in the pending credentials
// collection during the oauth authentication process.  Sensitive data
// such as access tokens are encrypted without the user id because
// we don't know the user id yet.  We re-encrypt these fields with the
// user id included when storing the service data permanently in
// the users collection.
//
var pinEncryptedFieldsToUser = function (serviceData, userId) {
  _.each(_.keys(serviceData), function (key) {
    var value = serviceData[key];
    if (OAuthEncryption && OAuthEncryption.isSealed(value))
      value = OAuthEncryption.seal(OAuthEncryption.open(value), userId);
    serviceData[key] = value;
    console.log('pinEncryptedFieldsToUser', serviceData[key])
  });
};

///
/// MANAGING USER OBJECTS
///

// Updates or creates a user after we authenticate with a 3rd party.
//
// @param serviceName {String} Service name (eg, twitter).
// @param serviceData {Object} Data to store in the user's record
//        under services[serviceName]. Must include an "id" field
//        which is a unique identifier for the user in the service.
// @param options {Object, optional} Other options to pass to insertUserDoc
//        (eg, profile)
// @returns {Object} Object with token and id keys, like the result
//        of the "login" method.
//
Accounts.updateOrCreateUserFromExternalService = function(
  serviceName, serviceData, options) {

  console.log('updateOrCreateUserFromExternalService', serviceName, serviceData, options )

  options = _.clone(options || {});

  if (serviceName === "password" || serviceName === "resume")
    throw new Error(
      "Can't use updateOrCreateUserFromExternalService with internal service "
        + serviceName);
  if (!_.has(serviceData, 'id'))
    throw new Error(
      "Service data for service " + serviceName + " must include id");

  var selector = Accounts.externalServiceSelector(serviceName, serviceData, options);

  console.log('updateOrCreateUserFromExternalService - selector', selector )

  if (! selector)
    return false;

  var user = Meteor.users.findOne(selector);

  console.log('user', user);

  if (user) {
    pinEncryptedFieldsToUser(serviceData, user._id);

    // We *don't* process options (eg, profile) for update, but we do replace
    // the serviceData (eg, so that we keep an unexpired access token and
    // don't cache old email addresses in serviceData.email).
    // XXX provide an onUpdateUser hook which would let apps update
    //     the profile too
    var setAttrs = {};
    _.each(serviceData, function(value, key) {
      setAttrs["services." + serviceName + "." + key] = value;
    });

    console.log('user._id', user._id, setAttrs);

    // XXX Maybe we should re-use the selector above and notice if the update
    //     touches nothing?
    Meteor.users.update(user._id, {$set: setAttrs});
    return {
      type: serviceName,
      userId: user._id
    };
  } else {
    // Create a new user with the service data. Pass other options through to
    // insertUserDoc.
    user = {services: {}};
    user.services[serviceName] = serviceData;

    console.log('aaaaaaa', {
      type: serviceName,
      userId: Accounts.insertUserDoc(options, user)
    } );

    return {
      type: serviceName,
      userId: Accounts.insertUserDoc(options, user)
    };
  }
};

Accounts.externalServiceSelector = function(
  serviceName, serviceData, options){

  console.log('externalServiceSelector', serviceName, serviceData, options);

  var selector = false;

  //check if specific selector is available for service
  var selectorMethod = "externalServiceSelector";
    selectorMethod += serviceName.charAt(0).toUpperCase() + serviceName.slice(1);

  if(Accounts[selectorMethod]){
    selector = Accounts[selectorMethod](serviceName, serviceData, options);
  }

  // Look for a user with the appropriate service user id.
  if(!selector && !! serviceData.id) {
    var serviceIdKey = "services." + serviceName + ".id";
    selector[serviceIdKey] = serviceData.id;
  }

  return selector;
};

/// this must remain in this package after pull request merge

//our custom naver selector to also select users on naver-email
Accounts.externalServiceSelectorNaver = function(
  serviceName, serviceData, options){

  console.log('externalServiceSelectorNaver', serviceName, serviceData, options);

  var serviceIdKey = "services." + serviceName + ".id";
  var selector = {};
  selector["$or"] = [{},{}];
  selector["$or"][0][serviceIdKey] = serviceData.id;
  //also check on email
  selector["$or"][1]["emails.address"] = serviceData.email;
  if (! serviceData.email)
    selector = false;
  return selector;
};

Meteor.methods({
  connectUserWithNaver: function (token, secret) {

    console.log('connectUserWithNaver', token, secret);

    //errors
    if (! this.userId)
      throw new Meteor.Error(403, "user must be loggedin");

    var user = Meteor.user();
    if (user.services && user.services.naver)
      throw new Meteor.Error(403, "user can not have a naver connected account");

    if (Meteor.isServer) {
      var naverData = Naver.retrieveCredential(token, secret);

      if(!naverData)
        throw new Meteor.Error(403, "not able to retreive naver data");

      //check if no accounts exists for this naver user
      var existing = Meteor.users.find({'services.naver.id': naverData.serviceData.id}).count();
      if(existing)
        throw new Meteor.Error(403, "user can not have a naver connected account");

      Meteor.users.update(this.userId, {$set: {'services.naver': naverData.serviceData}});
    }
  }
});
