module.exports = {
	// ##########################
	// #### Instance Actions ####
	// ##########################
	setActions: function (i) {
		let self = i;
		let actions = {};

		// ########################
		// #### Power Actions ####
		// ########################

		if (self.SINGLEPLUGMODE) {
			actions.on = {
				label: 'Power On',
				callback: function (action, bank) {
					self.power(1, 1);
				}
			}
	
			actions.off = {
				label: 'Power Off',
				callback: function (action, bank) {
					self.power(1, 0);
				}
			}
	
			actions.toggle = {
				label: 'Power Toggle',
				callback: function (action, bank) {
					self.powerToggle(1);
				}
			}
		}
		else {
			actions.powerOn = {
				label: 'Power On',
				options: [
					{
						type: 'dropdown',
						label: 'Plug',
						id: 'plug',
						default: self.CHOICES_PLUGS[0].id,
						choices: self.CHOICES_PLUGS,
						tooltip: 'The plug on the device to control'
					}
				],
				callback: function (action, bank) {
					self.power(action.options.plug, 1);
				}
			}
	
			actions.powerOff = {
				label: 'Power Off',
				options: [
					{
						type: 'dropdown',
						label: 'Plug',
						id: 'plug',
						default: self.CHOICES_PLUGS[0].id,
						choices: self.CHOICES_PLUGS,
						tooltip: 'The plug on the device to control'
					}
				],
				callback: function (action, bank) {
					self.power(action.options.plug, 0);
				}
			}
	
			actions.powerToggle = {
				label: 'Power Toggle',
				options: [
					{
						type: 'dropdown',
						label: 'Plug',
						id: 'plug',
						default: self.CHOICES_PLUGS[0].id,
						choices: self.CHOICES_PLUGS,
						tooltip: 'The plug on the device to control'
					}
				],
				callback: function (action, bank) {
					self.powerToggle(action.options.plug);
				}
			}
		}

		return actions
	}
}