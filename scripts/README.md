# Updating generators with new versions

There are three cogs, each of which have at least one generator.

- eden-sd-pipelines : create, remix, interpolate, real2real, interrogate
- character : wav2lip
- eden-sd-lora : lora

To add a new versionId for one of the cogs, first update all the parameters in each of its generators. Then, run the following command:

```
node mongo-update-generator.js COG VERSIONID
```

For example

```
node mongo-update-generator.js eden-sd-pipelines 79befe687d0930473e5528b59673890c694250b615e8405bc8f245f906ae8042
```