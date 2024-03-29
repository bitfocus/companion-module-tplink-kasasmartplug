import { InstanceBase, InstanceStatus, runEntrypoint } from '@companion-module/base'
import UpgradeScripts from './upgrades.js'

import * as config from './config.js'
import * as actions from './actions.js'
import * as feedbacks from './feedbacks.js'
import * as variables from './variables.js'
import * as presets from './presets.js'

import * as utils from './utils.js'
class kasaplugInstance extends InstanceBase {
	constructor(internal) {
		super(internal)

		// Assign the methods from the listed files to this class
		Object.assign(this, {
			...config,
			...actions,
			...feedbacks,
			...variables,
			...presets,
			...utils,
		})

		this.INTERVAL = null //used for polling device

		this.DEVICE = null

		this.PLUGINFO = {
			sw_ver: '',
			hw_ver: '',
			model: '',
			deviceId: '',
			oemId: '',
			hwId: '',
			rssi: '',
			latitude_i: '',
			longitude_i: '',
			mac: '',
			state: 0,
			alias: '',
			children: [],
		}

		this.CHOICES_PLUGS = [{ id: 1, label: 'Plug' }]

		this.SINGLEPLUGMODE = true
	}

	async destroy() {
		await this.stopInterval()

		if (this.cleanupEvents) this.cleanupEvents()

		if (this.DEVICE) {
			this.DEVICE.closeConnection()

			delete this.DEVICE
		}
	}

	async init(config) {
		this.configUpdated(config)
	}

	configUpdated(config) {
		config.interval = 2000

		// polling is running and polling has been de-selected by config change
		this.stopInterval()

		this.config = config

		this.updateStatus(InstanceStatus.Connecting)

		this.ERRORED = false

		this.getInformation()
		this.setupInterval()

		this.initActions()
		this.initFeedbacks()
		this.initVariables()
		this.initPresets()

		this.checkVariables()
		this.checkFeedbacks()
	}
}

runEntrypoint(kasaplugInstance, UpgradeScripts)
