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
		this.stopInterval()

		if (this.cleanupEvents) this.cleanupEvents()

		if (this.DEVICE) {
			this.DEVICE.closeConnection()

			delete this.DEVICE
		}
	}

	async init(config) {
		this.configUpdated(config)
	}

	async configUpdated(config) {
		const oldConfig = this.config
		let resave = false
		config.interval = 2000

		// stop in case polling has been de-selected by config change
		this.stopInterval()
		if (this.DEVICE) {
			this.DEVICE.closeConnection()
			delete this.DEVICE
		}

		if (this.SCANNING) {
			this.scanner.stopDiscovery()
			this.SCANNING = false
		}

		if (!config.plugId) {
			config.plugId = ''
		}

		if (config.scan && !['', 'none'].includes(config.plugId)) {
			const newHost = Object.keys(this.FOUND_PLUGS).length ? this.FOUND_PLUGS[config.plugId].host : this.config?.host
			if (newHost && config.host != newHost) {
				config.host = newHost
				resave = true
			}
		} else if (!config.scan) {
			config.plugId = ''
		}

		this.config = config

		if (this.config.scan) {
			if (!this.SCANNING) {
				this.scanForPlugs()
			}
		} else {
			this.FOUND_PLUGS = []
			delete this.config.plugId
			resave = true
		}

		if (config.host != '') {
			this.updateStatus(InstanceStatus.Connecting)
		} else {
			this.updateStatus(InstanceStatus.ConnectionFailure, 'IP address not set')
			this.FOUND_PLUGS = []
			resave = true
		}

		if (resave) {
			this.saveConfig(this.config)
		}
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
