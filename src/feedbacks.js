module.exports = {
	// ##########################
	// #### Define Feedbacks ####
	// ##########################
	setFeedbacks: function (i) {
		let self = i;
		let feedbacks = {};

		const foregroundColor = self.rgb(255, 255, 255) // White
		const backgroundColorRed = self.rgb(255, 0, 0) // Red
		const backgroundColorGreen = self.rgb(0, 255, 0) // Green
		const backgroundColorOrange = self.rgb(255, 102, 0) // Orange

		if (self.SINGLEPLUGMODE) {
			feedbacks.powerState = {
				type: 'boolean',
				label: 'Power State',
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
							{ id: 1, label: 'On' }
						]
					}
				],
				callback: function (feedback, bank) {
					let opt = feedback.options;

					if (self.PLUGINFO) {
						let plug_state = self.PLUGINFO.relay_state;
					
						if (plug_state == opt.option) {
							return true;
						}
					}
	
					return false
				}
			}
		}
		else {
			feedbacks.powerState = {
				type: 'boolean',
				label: 'Power State',
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
						tooltip: 'The plug on the device'
					},
					{
						type: 'dropdown',
						label: 'Indicate in X State',
						id: 'option',
						default: 1,
						choices: [
							{ id: 0, label: 'Off' },
							{ id: 1, label: 'On' }
						]
					}
				],
				callback: function (feedback, bank) {
					let opt = feedback.options;

					if (self.PLUGINFO && self.PLUGINFO.children) {
						let plug_state = self.PLUGINFO.children.find((PLUG) => PLUG.id == opt.plug).state;
	
						if (plug_state == opt.option) {
							return true;
						}
					}					
	
					return false
				}
			}
		}

		return feedbacks
	}
}
