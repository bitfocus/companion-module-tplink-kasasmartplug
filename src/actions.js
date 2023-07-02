module.exports = {
	initActions: function () {
		let self = this
		let actions = {}

		if (self.SINGLEPLUGMODE) {
			actions.on = {
				name: 'Power On',
				options: [],
				callback: async function (action) {
					self.power(1, 1)
				},
			}

			actions.off = {
				name: 'Power Off',
				options: [],
				callback: async function (action) {
					self.power(1, 0)
				},
			}

			actions.toggle = {
				name: 'Power Toggle',
				options: [],
				callback: async function (action) {
					self.powerToggle(1)
				},
			}
		} else {
			actions.powerOn = {
				name: 'Power On',
				options: [
					{
						type: 'dropdown',
						label: 'Plug',
						id: 'plug',
						default: self.CHOICES_PLUGS[0].id,
						choices: self.CHOICES_PLUGS,
						tooltip: 'The plug on the device to control',
					},
				],
				callback: async function (action) {
					self.power(action.options.plug, 1)
				},
			}

			actions.powerOff = {
				name: 'Power Off',
				options: [
					{
						type: 'dropdown',
						label: 'Plug',
						id: 'plug',
						default: self.CHOICES_PLUGS[0].id,
						choices: self.CHOICES_PLUGS,
						tooltip: 'The plug on the device to control',
					},
				],
				callback: async function (action) {
					self.power(action.options.plug, 0)
				},
			}

			actions.powerToggle = {
				name: 'Power Toggle',
				options: [
					{
						type: 'dropdown',
						label: 'Plug',
						id: 'plug',
						default: self.CHOICES_PLUGS[0].id,
						choices: self.CHOICES_PLUGS,
						tooltip: 'The plug on the device to control',
					},
				],
				callback: async function (action) {
					self.powerToggle(action.options.plug)
				},
			}
		}

		self.setActionDefinitions(actions)
	},
}
