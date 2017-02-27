Package.describe({
    name: "datamaker:naver-connect",
    version: '0.1.5',
    summary: "Naver Connect package to connect naver users to existing users.",
    git: 'https://github.com/datamaker/meteor-naver-connect',
    documentation: 'README.md'
});


Package.on_use(function (api) {
    api.use(['spectrum:accounts-naver@0.0.1'], ['client', 'server']);

    //add dependency for overriding core
    api.use('oauth-encryption@1.2.0', 'server', {weak: true});
    api.use('oauth@1.1.13');
    api.use('spectrum:naver@0.0.1', ['client', 'server']);

    api.add_files(["client.js"], 'client');
    api.add_files(["server.js"], 'server');
});
