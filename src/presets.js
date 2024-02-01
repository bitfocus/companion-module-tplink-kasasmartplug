import { combineRgb } from '@companion-module/base'

export function initPresets() {
	let self = this
	let presets = []

	const foregroundColor = combineRgb(255, 255, 255) // White
	const backgroundColorRed = combineRgb(255, 0, 0) // Red





	// ########################
	// #### Power Presets ####
	// ########################
	if (self.SINGLEPLUGMODE) {
		presets.push({
			type: 'button',
			category: 'Power',
			name: 'Power On',
			style: {
				text: 'Power\\nON',
				size: '14',
				color: '16777215',
				bgcolor: combineRgb(0, 0, 0),
			},
			steps: [
				{
					down: [
						{
							actionId: 'on',
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'powerState',
					options: {
						option: 1,
					},
					style: {
						color: foregroundColor,
						bgcolor: backgroundColorRed,
					},
				},
			],
		})

		presets.push({
			type: 'button',
			category: 'Power',
			name: 'Power Off',
			style: {
				text: 'Power\\nOFF',
				size: '14',
				color: '16777215',
				bgcolor: combineRgb(0, 0, 0),
			},
			steps: [
				{
					down: [
						{
							actionId: 'off',
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'powerState',
					options: {
						option: 0,
					},
					style: {
						color: foregroundColor,
						bgcolor: backgroundColorRed,
					},
				},
			],
		})

		presets.push({
			type: 'button',
			category: 'Power',
			name: 'Power Toggle',
			style: {
				text: 'Power\\nTOGGLE',
				size: '14',
				color: '16777215',
				bgcolor: combineRgb(0, 0, 0),
			},
			steps: [
				{
					down: [
						{
							actionId: 'toggle',
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'powerState',
					options: {
						option: 1,
					},
					style: {
						color: foregroundColor,
						bgcolor: backgroundColorRed,
					},
				},
			],
		})
	} else {
		for (let i = 0; i < self.CHOICES_PLUGS.length; i++) {
			presets.push({
				type: 'button',
				category: 'Power',
				name: 'Power On',
				style: {
					text: 'Power\\nON\\n' + (i + 1),
					size: '14',
					color: '16777215',
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [
					{
						down: [
							{
								actionId: 'powerOn',
								options: {
									plug: self.CHOICES_PLUGS[i].id,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'powerState',
						options: {
							plug: self.CHOICES_PLUGS[i].id,
							option: 1,
						},
						style: {
							color: foregroundColor,
							bgcolor: backgroundColorRed,
						},
					},
				],
			})

			presets.push({
				type: 'button',
				category: 'Power',
				name: 'Power Off',
				style: {
					text: 'Power\\nOFF\\n' + (i + 1),
					size: '14',
					color: '16777215',
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [
					{
						down: [
							{
								actionId: 'powerOff',
								options: {
									plug: self.CHOICES_PLUGS[i].id,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'powerState',
						options: {
							plug: self.CHOICES_PLUGS[i].id,
							option: 0,
						},
						style: {
							color: foregroundColor,
							bgcolor: backgroundColorRed,
						},
					},
				],
			})

			presets.push({
				type: 'button',
				category: 'Power',
				name: 'Power Toggle',
				style: {
					text: 'Power\\nTOGGLE\\n' + (i + 1),
					size: '14',
					color: '16777215',
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [
					{
						down: [
							{
								actionId: 'powerToggle',
								options: {
									plug: self.CHOICES_PLUGS[i].id,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'powerState',
						options: {
							plug: self.CHOICES_PLUGS[i].id,
							option: 1,
						},
						style: {
							color: foregroundColor,
							bgcolor: backgroundColorRed,
						},
					},
				],
			})
		}
	}

	self.setPresetDefinitions(presets)
}
