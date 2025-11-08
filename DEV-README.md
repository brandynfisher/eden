## Setup

```
git clone https://github.com/edenartlab/eve.git
git clone https://github.com/edenartlab/eden.git
```

### Eden

```
cd eden
git checkout staging
```

Create `apps/api/.env.eden`, `apps/eden-mobile/.env` and `apps/media-playground/.env.eden.local`, and copy values (will be shared with you). Replace [USER]:[PASSWORD] in db connection strings.

```
yarn
yarn dev:eden
```

Note: the API will fail to run the first time because the SDK needs to compile. once it's compiled, cancel the process and run `yarn dev:eden` again.

### Eve

```
cd eve
git checkout staging
```

Create `.env.STAGE` and copy values (will be shared with you). Replace [USER]:[PASSWORD] in db connection strings.

```
rye sync
rye run eve api
```