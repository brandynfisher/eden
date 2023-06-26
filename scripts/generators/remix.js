import baseParameters from './_base.js'

export default [
	...baseParameters,
	{
		name: 'init_image_data',
		label: 'Init image',
		description: 'URL of image to initiate image before diffusion (if null, use random noise)',
		default: null,
		mediaUpload: true,
		isRequired: true,
	},
	{
		name: 'init_image_strength',
		label: 'Init image strength',
		description: 'How much to weight the input init image in the diffusion process. Setting this to 0.0 will only use the guessed prompt and no img_guidance',
		default: 0.2,
		minimum: 0.0,
		maximum: 0.8,
		step: 0.01,
	},
	{
		name: 'n_samples',
		label: 'Samples',
		description: 'Number of samples to create remix',
		default: 1,
		allowedValues: [1, 2, 4],
		optional: true,
	},
	{
		name: 'uc_text',
		label: 'Negative prompt',
		description: 'Unconditional (negative) prompt',
		default: 'nude, naked, nsfw, poorly drawn face, ugly, tiling, out of frame, extra limbs, disfigured, deformed body, blurry, blurred, watermark, text, grainy, signature, cut off, draft',
		optional: true,
	},
	{
		name: 'seed',
		label: 'Seed',
		description: 'Set random seed for reproducibility. If blank, will be set randomly.',
		default: null,
		minimum: 0,
		maximum: 1e8,
		optional: true,
	}
]

