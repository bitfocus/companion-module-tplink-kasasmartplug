import { combineRgb } from '@companion-module/base'

export function initFeedbacks() {
	let self = this
	let feedbacks = {}

	const foregroundColor = combineRgb(255, 255, 255) // White
	const backgroundColorRed = combineRgb(255, 0, 0) // Red
	const backgroundColorGreen = combineRgb(0, 255, 0) // Green
	const backgroundColorOrange = combineRgb(255, 102, 0) // Orange

	if (self.config.polling && self.config.interval) {
		if (self.SINGLEPLUGMODE) {
			feedbacks.powerState = {
				type: 'boolean',
				name: 'Power State',
				description: 'Indicate if Plug is On or Off',
				style: {
					color: foregroundColor,
					bgcolor: backgroundColorRed,
				},
				options: [
					{
						type: 'dropdown',
						label: 'Indicate in X State',
						id: 'option',
						default: 1,
						choices: [
							{ id: 0, label: 'Off' },
							{ id: 1, label: 'On' },
						],
					},
				],
				callback: async function (feedback) {
					let opt = feedback.options

					if (self.PLUGINFO) {
						let plug_state = self.PLUGINFO.relay_state

						return plug_state == opt.option
					}

					return false
				},
			}
		} else {
			feedbacks.powerState = {
				type: 'boolean',
				name: 'Power State',
				description: 'Indicate if Plug is On or Off',
				style: {
					color: foregroundColor,
					bgcolor: backgroundColorRed,
				},
				options: [
					{
						type: 'dropdown',
						label: 'Plug',
						id: 'plug',
						default: 1,
						choices: self.CHOICES_PLUGS,
						tooltip: 'The plug on the device',
					},
					{
						type: 'dropdown',
						label: 'Indicate in X State',
						id: 'option',
						default: 1,
						choices: [
							{ id: 0, label: 'Off' },
							{ id: 1, label: 'On' },
						],
					},
				],
				callback: async function (feedback) {
					let opt = feedback.options

					if (self.PLUGINFO && self.PLUGINFO.children) {
						let plug = self.PLUGINFO.children.find((PLUG) => PLUG.id == opt.plug)

						if (plug) {
							let plug_state = plug.state

							return plug_state == opt.option
						}
					}

					return false
				},
			}
		}
	}

	self.setFeedbackDefinitions(feedbacks)
}
