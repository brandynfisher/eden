# Updating generators with new versions

Make sure to fill out .env.local and .env.eden

There are four cogs, each of which have at least one generator.

- eden-sd-pipelines : create, remix, interpolate, real2real, interrogate, blend, upscale, controlnet
- eden-sd-pipelines-video : interpolate, real2real
- character : wav2lip
- sdxl-lora-trainer : concept

To add a new versionId for one of the cogs, first update all the parameters in each of its generators. Then, run the following command:

```
node mongo-update-generator.js ENV COG VERSIONID
```

where ENV is local (for local database) or eden (for production).

For example

```
node mongo-update-generator.js eden-sd-pipelines-sdxl local 62f5c82490640b448545c4e82751472e0459904629d52cb98a581105edb7d9c0
```