# Seeding Local DB with real data from production

Fille out .env (see 1pw)

To copy the 100 latest creations from production to local, run the following commands:
```
telepresence connect
node mongo-migrate-data.js 100
node mongo-init-eden.js
```
