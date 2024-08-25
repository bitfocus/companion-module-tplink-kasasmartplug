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

		this.FOUND_PLUGS = {}

		this.CHOICES_PLUGS = [{ id: 1, label: 'Plug' }]

		this.SINGLEPLUGMODE = true
		this.SCANNING = false
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
		const oldConfig = this.config
		config.interval = 2000

		// stop in case polling has been de-selected by config change
		this.stopInterval()

		if (config.plugId != 'none') {
			const newHost = Object.keys(this.FOUND_PLUGS).length ? this.FOUND_PLUGS[config.plugId].host : null
			if (newHost && config.host != newHost) {
				config.host = newHost
        this.saveConfig(config)
			}
		}

		this.config = config

		if (this.config.scan) {
			if (!this.SCANNING) {
				this.scanForPlugs()
			}
		} else {
			this.FOUND_PLUGS = []
			delete this.config.plugId
		}

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
