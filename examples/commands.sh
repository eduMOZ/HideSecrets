#!/bin/sh
# Commands pasted from a shell history
curl -u robot:Fake-Curl-Pass-77 https://registry.example.test/v2/_catalog
curl -H "X-Api-Key: fakeapikey_0123456789abcdef" https://api.example.test/v1/status
nimbusctl login --user ops --password Fake-Cli-Pass-4321
mysql -h db.internal.example.test -u console -pFake-Mysql-Pass-88 console
sshpass -p 'Fake-Ssh-Pass-31' ssh deploy@10.20.0.7
export NIMBUS_TOKEN=fake_token_a1b2c3d4e5f60718
docker run --rm --user 10001:10001 --name nimbus-hub-backend nimbus/hub-backend:main
cd /srv/nimbus && ls -la
