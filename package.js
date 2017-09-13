Package.describe({
    name: "datamaker:naver-connect",
    version: '0.1.9',
    summary: "Naver Connect package to connect naver users to existing users.",
    git: 'https://github.com/datamaker/meteor-naver-connect',
    documentation: 'README.md'
});

Package.on_use(function (api) {
    api.use(['datamaker:accounts-naver@0.0.4'], ['client', 'server']);

    //add dependency for overriding core
    api.use('oauth-encryption@1.2.0', 'server', {weak: true});
    api.use('oauth@1.1.13');
    api.use('datamaker:naver-oauth@0.0.4', ['client', 'server']);

    api.addFiles(["client.js"], 'client');
    api.addFiles(["server.js"], 'server');
});
