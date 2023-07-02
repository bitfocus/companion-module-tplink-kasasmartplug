const { InstanceBase, InstanceStatus, runEntrypoint } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')

const config = require('./config')
const actions = require('./actions')
const feedbacks = require('./feedbacks')
const variables = require('./variables')
const presets = require('./presets')

const utils = require('./utils')

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
			relay_state: 0,
			alias: '',
			children: [],
		}

		this.CHOICES_PLUGS = [{ id: 1, label: 'Plug' }]

		this.SINGLEPLUGMODE = true
	}

	async destroy() {
		let self = this

		self.stopInterval()

		if (self.DEVICE) {
			self.DEVICE.closeConnection()
		}
	}

	async init(config) {
		this.configUpdated(config)
	}

	async configUpdated(config) {
		// polling is running and polling has been de-selected by config change
		this.stopInterval()

		this.config = config

		this.updateStatus(InstanceStatus.Connecting)

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
