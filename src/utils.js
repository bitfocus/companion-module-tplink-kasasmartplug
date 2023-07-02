const { InstanceStatus } = require('@companion-module/base')

const { Client } = require('tplink-smarthome-api')

const client = new Client()

module.exports = {
	power: async function (plugId, powerState) {
		if (!this.config.host) return

		const plugName = this.CHOICES_PLUGS.find((PLUG) => PLUG.id == plugId)?.label || ''

		try {
			this.log('info', `Setting ${plugName} Power State to: ${powerState ? 'On' : 'Off'}`)

			if (this.SINGLEPLUGMODE) {
				await this.DEVICE.setPowerState(powerState)
			} else {
				let plug = await client.getDevice({ host: this.config.host, childId: plugId }, { timeout: 20000 })
				await plug.setPowerState(powerState)
			}

			//self.updatePlugState(plugId, powerState);
		} catch (error) {
			this.handleError(error)
		}
	},

	powerToggle: async function (plugId) {
		if (!this.config.host) return

		const plugName = this.CHOICES_PLUGS.find((PLUG) => PLUG.id == plugId)?.label || ''

		try {
			let plug
			if (this.SINGLEPLUGMODE) {
				plug = await client.getDevice({ host: this.config.host })
			} else {
				plug = await client.getDevice({ host: this.config.host, childId: plugId })
			}
			this.log('info', `Toggling ${plugName} Power`)
			await plug.togglePowerState()
		} catch (error) {
			this.handleError(error)
		}
	},

	// setAlias: function (newName) {
	// 	let self = this

	// 	if (self.config.host) {
	// 		try {
	// 			if (self.config.alias !== '') {
	// 				self.log('info', 'Setting Plug Alias to: ' + newName)

	// 				if (!self.DEVICE) {
	// 					self.DEVICE = await client.getDevice({ host: self.config.host })
	// 				}

	// 				self.DEVICE.then((device) => {
	// 					device.setAlias(newName)
	// 				})
	// 			}
	// 		} catch (error) {
	// 			self.handleError(error)
	// 		}
	// 	}
	// },

	getInformation: async function () {
		//Get all information from Device

		if (!this.config.host) return

		if (this.pollRunning) {
			this.pollPending = true
			return
		}
		this.pollRunning = true
		this.pollPending = false

		try {
			if (!this.DEVICE) {
				console.log('reload device')
				this.DEVICE = await client.getDevice({ host: this.config.host }, { timeout: 20000 })
			}

			this.PLUGINFO = await this.DEVICE.getSysInfo()

			if (this.PLUGINFO) {
				this.updateStatus(InstanceStatus.Ok)

				try {
					this.updateData()
					this.monitorPlugs()
				} catch (error) {
					this.handleError(error)
				}

				// TODO - this is rather costly to reinit everything for every poll

				this.initActions() // export actions
				this.initFeedbacks()
				this.initVariables()
				this.initPresets()

				this.checkVariables()
				this.checkFeedbacks()
			}
		} catch (error) {
			this.handleError(error)
		}

		this.pollRunning = false
		if (this.pollPending) {
			this.getInformation()
		}
	},

	updateData: function () {
		//check the number of children (total plugs) the device has and update the action list appropriately

		if (this.PLUGINFO.children && this.PLUGINFO.children.length > 0) {
			this.SINGLEPLUGMODE = false
			this.CHOICES_PLUGS = []

			for (const plugInfo of this.PLUGINFO.children) {
				this.CHOICES_PLUGS.push({
					id: plugInfo.id.toString(),
					label: plugInfo.alias,
				})
			}
		} else {
			this.SINGLEPLUGMODE = true

			this.CHOICES_PLUGS = [
				{
					id: 1,
					label: 'Plug',
				},
			]
		}
	},

	monitorPlugs: async function () {
		try {
			if (this.cleanupEvents) this.cleanupEvents()
			delete this.cleanupEvents

			if (this.PLUGINFO.children && this.PLUGINFO.children.length > 0) {
				const cleanupFns = []

				for (const plugInfo of this.PLUGINFO.children) {
					// TODO - these should be cached to avoid this constant recreation
					let childPlug = await client.getDevice({ host: this.config.host, childId: plugInfo.id }, { timeout: 20000 })
					cleanupFns.push(this.monitorEvents(childPlug))
				}

				this.cleanupEvents = () => {
					for (const fn of cleanupFns) {
						if (fn) fn()
					}
				}
			} else {
				this.cleanupEvents = this.monitorEvents(this.DEVICE)
			}
		} catch (error) {
			this.handleError(error)
		}
	},

	monitorEvents: function (plug) {
		if (!plug.companionSetupEvents) {
			plug.companionSetupEvents = true

			// Device (Common) Events
			plug.on('emeter-realtime-update', (emeterRealtime) => {})

			// Plug Events
			const plugId = plug.id
			plug.on('power-on', () => {
				this.updatePlugState(plugId, 1)
			})
			plug.on('power-off', () => {
				this.updatePlugState(plugId, 0)
			})
			plug.on('power-update', (powerOn) => {
				this.updatePlugState(plugId, powerOn)
			})
			plug.on('in-use', () => {})
			plug.on('not-in-use', () => {})
			plug.on('in-use-update', (inUse) => {
				//logEvent('in-use-update', device, inUse);
				//self.checkFeedbacks();
				//self.checkVariables();
			})
		}

		const pollInterval = this.config.polling ? this.config.interval : 0
		if (plug.companionPollInterval !== pollInterval) {
			plug.companionPollInterval = pollInterval

			plug.stopPolling()
			if (pollInterval) {
				plug.startPolling(pollInterval)
			}
		}

		return () => {
			plug.stopPolling()
			plug.removeAllListeners()
		}
	},

	updatePlugState: function (plugId, powerState) {
		if (this.SINGLEPLUGMODE) {
			this.PLUGINFO.relay_state = powerState
		} else {
			if (this.PLUGINFO.children && this.PLUGINFO.children.length > 0) {
				for (const plugInfo of this.PLUGINFO.children) {
					if (plugInfo.id === plugId) {
						plugInfo.state = powerState
						break
					}
				}
			}
		}

		this.checkFeedbacks()
		this.checkVariables()
	},

	setupInterval: function () {
		if (this.INTERVAL !== null) {
			clearInterval(this.INTERVAL)
			this.INTERVAL = null
		}

		this.config.interval = parseInt(this.config.interval)

		if (this.config.polling && this.config.interval > 0) {
			this.log('info', 'Starting Update Interval.')
			this.INTERVAL = setInterval(this.getInformation.bind(this), this.config.interval)
		}
	},

	stopInterval: function () {
		this.log('info', 'Stopping Update Interval.')

		if (this.INTERVAL) {
			clearInterval(this.INTERVAL)
			this.INTERVAL = null
		}
	},

	handleError: function (err) {
		this.log('error', 'Stopping Update interval due to error.')
		this.stopInterval()

		let errorStr = err.toString()

		this.updateStatus(InstanceStatus.UnknownError)

		if ('code' in err && err['code'] === 'ECONNREFUSED') {
			errorStr =
				'Unable to communicate with Device. Connection refused. Is this the right IP address? Is it still online?'
			this.updateStatus(InstanceStatus.ConnectionFailure)
		}

		this.log('error', errorStr)
	},
}
