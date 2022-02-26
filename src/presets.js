module.exports = {
	setPresets: function (i) {
		let self = i;
		let presets = [];

		const foregroundColor = self.rgb(255, 255, 255) // White
		const backgroundColorRed = self.rgb(255, 0, 0) // Red

		// ########################
		// #### Power Presets ####
		// ########################

		if (self.SINGLEPLUGMODE) {
			presets.push({
				category: 'Power',
				label: 'Power On',
				bank: {
					style: 'text',
					text: 'Power\\nON',
					size: '14',
					color: '16777215',
					bgcolor: self.rgb(0, 0, 0),
				},
				actions: [
					{
						action: 'on'
					}
				],
				feedbacks: [
					{
						type: 'powerState',
						options: {
							option: 1
						},
						style: {
							color: foregroundColor,
							bgcolor: backgroundColorRed
						}
					}
				]
			})
	
			presets.push({
				category: 'Power',
				label: 'Power Off',
				bank: {
					style: 'text',
					text: 'Power\\nOFF',
					size: '14',
					color: '16777215',
					bgcolor: self.rgb(0, 0, 0),
				},
				actions: [
					{
						action: 'off'
					}
				],
				feedbacks: [
					{
						type: 'powerState',
						options: {
							option: 0
						},
						style: {
							color: foregroundColor,
							bgcolor: backgroundColorRed
						}
					}
				]
			})
	
			presets.push({
				category: 'Power',
				label: 'Power Toggle',
				bank: {
					style: 'text',
					text: 'Power\\nTOGGLE',
					size: '14',
					color: '16777215',
					bgcolor: self.rgb(0, 0, 0),
				},
				actions: [
					{
						action: 'toggle'
					}
				]
			})
		}
		else {
			for (let i = 0; i < self.CHOICES_PLUGS.length; i++) {
				presets.push({
					category: 'Power',
					label: 'Power On',
					bank: {
						style: 'text',
						text: 'Power\\nON\\n' + (i+1),
						size: '14',
						color: '16777215',
						bgcolor: self.rgb(0, 0, 0),
					},
					actions: [
						{
							action: 'powerOn',
							options: {
								plug: self.CHOICES_PLUGS[i].id
							}
						}
					],
					feedbacks: [
						{
							type: 'powerState',
							options: {
								plug: self.CHOICES_PLUGS[i].id,
								option: 1
							},
							style: {
								color: foregroundColor,
								bgcolor: backgroundColorRed
							}
						}
					]
				})
		
				presets.push({
					category: 'Power',
					label: 'Power Off',
					bank: {
						style: 'text',
						text: 'Power\\nOFF\\n' + (i+1),
						size: '14',
						color: '16777215',
						bgcolor: self.rgb(0, 0, 0),
					},
					actions: [
						{
							action: 'powerOff',
							options: {
								plug: self.CHOICES_PLUGS[i].id
							}
						}
					],
					feedbacks: [
						{
							type: 'powerState',
							options: {
								plug: self.CHOICES_PLUGS[i].id,
								option: 0
							},
							style: {
								color: foregroundColor,
								bgcolor: backgroundColorRed
							}
						}
					]
				})
		
				presets.push({
					category: 'Power',
					label: 'Power Toggle',
					bank: {
						style: 'text',
						text: 'Power\\nTOGGLE\\n' + (i+1),
						size: '14',
						color: '16777215',
						bgcolor: self.rgb(0, 0, 0),
					},
					actions: [
						{
							action: 'powerToggle',
							options: {
								plug: self.CHOICES_PLUGS[i].id
							}
						}
					]
				})
			}
		}

		return presets;
	}
}
