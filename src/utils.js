import { InstanceStatus } from '@companion-module/base'

import tsa from 'tplink-smarthome-api'
const { Client } = tsa

const client = new Client()

export async function power(plugId, powerState) {
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

		this.updatePlugState(plugId, powerState)
	} catch (error) {
		this.handleError(error)
	}
}
export async function powerToggle(plugId) {
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
}
export async function getInformation() {
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
			this.PLUGSETUP = {}
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
}
export function updateData() {
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
}
export async function monitorPlugs() {
	try {
		// if (this.cleanupEvents) this.cleanupEvents()
		// delete this.cleanupEvents

		if (this.PLUGINFO.children && this.PLUGINFO.children.length > 0) {
			const cleanupFns = []
			let didInit = false

			for (const plugInfo of this.PLUGINFO.children) {
				// TODO - these should be cached to avoid this constant recreation
				if (!this.PLUGSETUP[plugInfo.id]) {
					let childPlug = await client.getDevice({ host: this.config.host, childId: plugInfo.id }, { timeout: 20000 })
					cleanupFns.push(this.monitorEvents(childPlug))
					this.PLUGSETUP[plugInfo.id] = childPlug
					didInit = true
				}
			}

			if (didInit) {
				this.cleanupEvents = () => {
					for (const fn of cleanupFns) {
						if (fn) fn()
					}
				}
			}
		} else {
			this.cleanupEvents = this.monitorEvents(this.DEVICE)
		}
	} catch (error) {
		this.handleError(error)
	}
}
export function monitorEvents(plug) {
	if (!plug.companionSetupEvents) {
		plug.companionSetupEvents = true

		// Device (Common) Events
		plug.on('emeter-realtime-update', (emeterRealtime) => {
			let i = emeterRealtime
		})

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
			logEvent('in-use-update', device, inUse)
			self.checkFeedbacks()
			self.checkVariables()
		})
	}

	// deprecated
	// const pollInterval = this.config.polling ? this.config.interval : 0
	// if (plug.companionPollInterval !== pollInterval) {
	// 	plug.companionPollInterval = pollInterval

	// 	plug.stopPolling()
	// 	if (pollInterval) {
	// 		plug.startPolling(pollInterval)
	// 	}
	// }

	return () => {
		//		plug.stopPolling()
		plug.removeAllListeners()
	}
}
export function updatePlugState(plugId, powerState) {
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
}
export async function setupInterval() {
	if (this.INTERVAL !== null) {
		clearInterval(this.INTERVAL)
		this.INTERVAL = null
	}

	this.config.interval = parseInt(this.config.interval)

	if (this.config.polling && this.config.interval > 0) {
		this.log('info', 'Starting Update Interval.')
		this.INTERVAL = setInterval(this.getInformation.bind(this), this.config.interval)
	}
}
export async function stopInterval() {
	if (this.INTERVAL) {
		this.log('info', 'Stopping Update Interval.')
		clearInterval(this.INTERVAL)
	}
	this.INTERVAL = null
}
export function handleError(err) {
	let stoppit = true

	let errorStr = err.toString()

	this.updateStatus(InstanceStatus.UnknownError)

	if ('code' in err) {
		if (err['code'] === 'ECONNREFUSED') {
			errorStr =
				'Unable to communicate with Device. Connection refused. Is this the right IP address? Is it still online?'
			this.updateStatus(InstanceStatus.ConnectionFailure)
		} else if (['ECLOSED'].includes(err['code'])) {
			stoppit = false
		}
	}

	if (this.INTERVAL && stoppit) {
		this.log('error', 'Stopping Update interval due to error.')
		this.stopInterval()
	}

	this.log('error', errorStr)
}
