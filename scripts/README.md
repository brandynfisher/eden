## Updating generators versions

Inside of scripts directory, you need to have `.env.eden`, `.env.stage`, and `.env.local` files filled out with the following variables to update generators on main, stage, and local, respectively.

```
MONGO_URI=...
MONGO_DB_NAME=...
```

Make sure the parameter values inside of scripts/generators are correct (pull latest version of monorepo), and run all scripts from /scripts folder:

* ENV stands for which environment: `eden`, `stage`, and `local` stand for main, stage, and localhost respectively.
* COG is which group of generators. `eden-sd-pipelines-sdxl` is for all image endpoints, `eden-sd-pipelines-sdxl-video` is for all video endpoints, `sdxl-lora-trainer` is for the LoRA trainer, and `character` is for the wav2lip-associated endpoints.
* VERSIONID is Replicate's version id.

To register a new generator, and then make it the default generator (2 steps), run:

```
# register generator
node mongo-update-generator.js ENV COG VERSIONID

# set to default
node mongo-set-generator-default.js ENV COG VERSIONID
```

For example

```
node mongo-update-generator.js stage eden-sd-pipelines-sdxl 62f5c82490640b448545c4e82751472e0459904629d52cb98a581105edb7d9c0
node mongo-set-generator-default.js stage eden-sd-pipelines-sdxl 62f5c82490640b448545c4e82751472e0459904629d52cb98a581105edb7d9c0


node mongo-update-generator.js stage eden-comfyui 4787e5ee4d766b965e548c53dc7c846706df6a96a07c0e391373b5267138d2f6
node mongo-set-generator-default.js stage eden-comfyui 4787e5ee4d766b965e548c53dc7c846706df6a96a07c0e391373b5267138d2f6


node mongo-update-generator.js stage sdxl-lora-trainer e063e410c8cfa8972f3372f8fa1c3290f3a2b6de732c5f226eba918c4cf9e585
node mongo-set-generator-default.js stage sdxl-lora-trainer e063e410c8cfa8972f3372f8fa1c3290f3a2b6de732c5f226eba918c4cf9e585


```

will register [this version of the SDXL cog](https://replicate.com/abraham-ai/eden-sd-pipelines-sdxl/versions/62f5c82490640b448545c4e82751472e0459904629d52cb98a581105edb7d9c0) along all image (not video) endpoints on stage. 

### Cogs

There are four cogs, each of which have at least one generator.

* **eden-sd-pipelines** : create, remix, interpolate, real2real, interrogate, blend, upscale, controlnet
* **eden-sd-pipelines-video** : interpolate, real2real
* **character** : wav2lip
* **sdxl-lora-trainer** : concept

