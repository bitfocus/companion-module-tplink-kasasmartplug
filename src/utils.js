const { InstanceStatus } = require('@companion-module/base')

const { Client } = require('tplink-smarthome-api')

const client = new Client()

module.exports = {
	power: async function (plugId, powerState) {
		let self = this

		let plugName = ''

		let plugObj = self.CHOICES_PLUGS.find((PLUG) => PLUG.id == plugId)
		if (plugObj) {
			plugName = plugObj.label
		}

		if (self.config.host) {
			try {
				self.log('info', `Setting ${plugName} Power State to: ${powerState ? 'On' : 'Off'}`)

				if (self.SINGLEPLUGMODE) {
					self.DEVICE.setPowerState(powerState)
				} else {
					let plug = await client.getDevice({ host: self.config.host, childId: plugId }, { timeout: 20000 })
					plug.setPowerState(powerState)
				}

				//self.updatePlugState(plugId, powerState);
			} catch (error) {
				self.handleError(error)
			}
		}
	},

	powerToggle: async function (plugId) {
		let self = this

		let plugName = ''

		let plugObj = self.CHOICES_PLUGS.find((PLUG) => PLUG.id == plugId)
		if (plugObj) {
			plugName = plugObj.label
		}

		if (self.config.host) {
			try {
				let plug
				if (self.SINGLEPLUGMODE) {
					plug = await client.getDevice({ host: self.config.host })
				} else {
					plug = await client.getDevice({ host: self.config.host, childId: plugId })
				}
				self.log('info', `Toggling ${plugName} Power`)
				plug.togglePowerState()
			} catch (error) {
				self.handleError(error)
			}
		}
	},

	setAlias: function (newName) {
		let self = this

		if (self.config.host) {
			try {
				if (self.config.alias !== '') {
					self.log('info', 'Setting Plug Alias to: ' + newName)

					if (!self.DEVICE) {
						self.DEVICE = client.getDevice({ host: self.config.host })
					}

					self.DEVICE.then((device) => {
						device.setAlias(newName)
					})
				}
			} catch (error) {
				self.handleError(error)
			}
		}
	},

	getInformation: async function () {
		//Get all information from Device
		let self = this

		if (self.config.host) {
			try {
				if (!self.DEVICE) {
					self.DEVICE = await client.getDevice({ host: self.config.host }, { timeout: 20000 })
				}

				self.DEVICE.getSysInfo()
					.then((info) => {
						self.PLUGINFO = info

						if (self.PLUGINFO) {
							self.updateStatus(InstanceStatus.Ok)

							try {
								self.updateData()
								self.monitorPlugs()
							} catch (error) {
								self.handleError(error)
							}

							self.initActions() // export actions
							self.initFeedbacks()
							self.initVariables()
							self.initPresets()

							self.checkVariables()
							self.checkFeedbacks()
						}
					})
					.catch((error) => {
						self.handleError(error)
					})
			} catch (error) {
				self.handleError(error)
			}
		}
	},

	updateData: function () {
		let self = this
		//check the number of children (total plugs) the device has and update the action list appropriately

		if (self.PLUGINFO.children && self.PLUGINFO.children.length > 0) {
			self.SINGLEPLUGMODE = false
			self.CHOICES_PLUGS = []

			for (let i = 0; i < self.PLUGINFO.children.length; i++) {
				let plugObj = {
					id: self.PLUGINFO.children[i].id.toString(),
					label: self.PLUGINFO.children[i].alias,
				}
				self.CHOICES_PLUGS.push(plugObj)
			}
		} else {
			self.SINGLEPLUGMODE = true

			self.CHOICES_PLUGS = []
			let plugObj = {
				id: 1,
				label: 'Plug',
			}
			self.CHOICES_PLUGS.push(plugObj)
		}
	},

	monitorPlugs: async function () {
		let self = this

		if (self.PLUGINFO.children && self.PLUGINFO.children.length > 0) {
			for (let i = 0; i < self.PLUGINFO.children.length; i++) {
				let childPlug = await client.getDevice(
					{ host: self.config.host, childId: self.PLUGINFO.children[i].id },
					{ timeout: 20000 }
				)
				self.monitorEvents(childPlug)
			}
		} else {
			//let childPlug = await client.getDevice({ host: self.config.host }, { timeout: 20000 })
			self.monitorEvents(self.DEVICE)
		}
	},

	monitorEvents: function (plug) {
		let self = this

		// Device (Common) Events
		plug.on('emeter-realtime-update', (emeterRealtime) => {})

		// Plug Events
		plug.on('power-on', () => {
			self.updatePlugState(plug.id, 1)
		})
		plug.on('power-off', () => {
			self.updatePlugState(plug.id, 0)
		})
		plug.on('power-update', (powerOn) => {
			self.updatePlugState(plug.id, powerOn)
		})
		plug.on('in-use', () => {})
		plug.on('not-in-use', () => {})
		plug.on('in-use-update', (inUse) => {
			//logEvent('in-use-update', device, inUse);
			//self.checkFeedbacks();
			//self.checkVariables();
		})

		if (self.config.polling) {
			plug.startPolling(self.config.interval)
		}
	},

	updatePlugState: function (plugId, powerState) {
		let self = this

		if (self.SINGLEPLUGMODE) {
			self.PLUGINFO.relay_state = powerState
		} else {
			if (self.PLUGINFO.children && self.PLUGINFO.children.length > 0) {
				for (let i = 0; i < self.PLUGINFO.children.length; i++) {
					if (self.PLUGINFO.children[i].id === plugId) {
						self.PLUGINFO.children[i].state = powerState
						break
					}
				}
			}
		}

		self.checkFeedbacks()
		self.checkVariables()
	},

	setupInterval: function () {
		let self = this

		if (self.INTERVAL !== null) {
			clearInterval(self.INTERVAL)
			self.INTERVAL = null
		}

		self.config.interval = parseInt(self.config.interval)

		if (self.config.interval > 0) {
			self.log('info', 'Starting Update Interval.')
			self.INTERVAL = setInterval(self.getInformation.bind(self), self.config.interval)
		}
	},

	stopInterval: function () {
		let self = this

		self.log('info', 'Stopping Update Interval.')

		if (self.INTERVAL) {
			clearInterval(self.INTERVAL)
			self.INTERVAL = null
		}
	},

	handleError: function (err) {
		let self = this

		self.log('error', 'Stopping Update interval due to error.')
		self.stopInterval()

		let error = err.toString()

		self.updateStatus(InstanceStatus.UnknownError)

		Object.keys(err).forEach(function (key) {
			if (key === 'code') {
				if (err[key] === 'ECONNREFUSED') {
					error =
						'Unable to communicate with Device. Connection refused. Is this the right IP address? Is it still online?'
					self.updateStatus(InstanceStatus.ConnectionFailure)
				}
			}
		})

		self.log('error', error)
	},
}
