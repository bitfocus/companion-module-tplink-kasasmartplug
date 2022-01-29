//TP-Link Kasa Smart Plug

var tcp = require('../../tcp')
var instance_skel = require('../../instance_skel')
var tplink_smarthome_crypto = require('tplink-smarthome-crypto')
var debug
var log

function instance(system, id, config) {
	var self = this

	// super-constructor
	instance_skel.apply(this, arguments)

	self.variables = {}
	self.polling = null
	self.hungTcp = 0

	self.actions() // export actions

	return self
}

instance.prototype.updateConfig = function (config) {
	var self = this

	self.status(self.STATE_WARNING, 'Connecting')
	self.config = config
	self.getVariables()
	clearInterval(self.polling)
	self.polling = setInterval(() => {
		self.getVariables()
	}, 1000) //1 second
}

instance.prototype.init = function () {
	var self = this

	self.status(self.STATE_WARNING, 'Connecting')
	self.initPresets()
	self.initVariables()
	self.initFeedbacks()
	self.getVariables()
	clearInterval(self.polling)
	self.polling = setInterval(() => {
		self.getVariables()
	}, 1000) //1 second
}

// Return config fields for web config
instance.prototype.config_fields = function () {
	var self = this

	return [
		{
			type: 'text',
			id: 'info',
			label: 'Information',
			width: 12,
			value: 'This module can be used to control TP-Link Kasa Smart Home Wifi devices, like the HS-100 outlet.',
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'Target IP',
			width: 6,
			regex: self.REGEX_IP,
		},
		{
			type: 'textinput',
			id: 'port',
			label: 'Target Port',
			width: 2,
			default: 9999,
			regex: self.REGEX_PORT,
		},
	]
}

// When module gets deleted
instance.prototype.destroy = function () {
	var self = this

	if (self.socket !== undefined) {
		self.socket.destroy()
	}
	clearInterval(self.polling)

	debug('destroy', self.id)
}

instance.prototype.actions = function (system) {
	var self = this

	self.system.emit('instance_actions', self.id, {
		on: { label: 'Turn On' },
		off: { label: 'Turn Off' },
		toggle: { label: 'Toggle' },
	})
}

instance.prototype.action = function (action) {
	var self = this
	var cmd

	switch (action.action) {
		case 'on':
			cmd = tplink_smarthome_crypto.encryptWithHeader('{"system":{"set_relay_state":{"state":1}}}')
			break
		case 'off':
			cmd = tplink_smarthome_crypto.encryptWithHeader('{"system":{"set_relay_state":{"state":0}}}')
			break
		case 'toggle':
			if (self.variables['power'] === 'On') {
				cmd = tplink_smarthome_crypto.encryptWithHeader('{"system":{"set_relay_state":{"state":0}}}')
			} else {
				cmd = tplink_smarthome_crypto.encryptWithHeader('{"system":{"set_relay_state":{"state":1}}}')
			}
			break
	}

	if (cmd !== undefined) {
		if (self.socket !== undefined) {
			self.socket.destroy()
			delete self.socket
		}

		self.status(self.STATE_WARNING, 'Connecting')

		if (self.config.host) {
			self.socket = new tcp(self.config.host, self.config.port)

			self.socket.on('error', function (err) {
				if (err.toString().indexOf('ECONNREFUSED') > -1) {
					self.debug('Network error: Unable to connect to device:' + self.config.host)
					self.log('error', 'Network error: Unable to connect to device:' + self.config.host)
				} else {
					self.debug('Network error (' + self.config.host + ')', err)
					self.log('error', 'Network error: ' + err)
				}

				self.setLocalVariable('power', undefined)
				self.status(self.STATE_ERROR, err.toString())
				clearInterval(self.polling)
				self.polling = setInterval(() => {
					self.getVariables()
				}, 10000) //10 second
				self.socket.destroy()
				delete self.socket
			})

			self.socket.on('connect', function () {
				self.debug('Connected (' + self.config.host + ')')
				self.debug('Turning outlet ' + action.action + ': ' + self.config.host)
				self.socket.send(Buffer.from(cmd, 'hex'))
				self.socket.send(Buffer.from('\r\n'))
				self.socket.send(Buffer.from('\r\n'))
				self.socket.destroy()
				delete self.socket
				self.status(self.STATE_OK)
				self.checkFeedbacks('power')
				clearInterval(self.polling)
				self.getVariables()
				self.polling = setInterval(() => {
					self.getVariables()
				}, 1000) //1 second
			})
		}
	}
}

instance.prototype.initPresets = function () {
	var self = this
	var presets = []

	presets.push({
		category: 'Commands',
		label: 'Power Toggle',
		bank: {
			style: 'text',
			text: 'Power Toggle',
			size: '18',
			color: this.rgb(255, 255, 255),
			bgcolor: this.rgb(0, 0, 0),
		},
		feedbacks: [
			{
				type: 'power',
				options: {
					bg: this.rgb(0, 255, 0),
					fg: this.rgb(0, 0, 0),
					state: 'On',
				},
			},
			{
				type: 'power',
				options: {
					bg: this.rgb(255, 0, 0),
					fg: this.rgb(0, 0, 0),
					state: 'Off',
				},
			},
		],
		actions: [{ action: 'toggle' }],
	})
	this.setPresetDefinitions(presets)
}

instance.prototype.setLocalVariable = function (name, value) {
	var self = this
	// var changed = this.variables[name] !== value;
	self.variables[name] = value
	self.setVariable(name, value)
}

instance.prototype.initVariables = function () {
	var self = this
	const variables = []

	variables.push({
		label: 'Power state',
		name: 'power',
	})
	self.setLocalVariable('power', undefined)
	self.setVariableDefinitions(variables)
}

instance.prototype.getVariables = function () {
	var self = this
	var cmd = tplink_smarthome_crypto.encryptWithHeader('{"system":{"get_sysinfo":{}}}')
	if (cmd !== undefined) {
		if (self.socket !== undefined) {
			if (++self.hungTcp > 10) {
				self.setLocalVariable('power', undefined)
				self.checkFeedbacks('power')
				self.status(self.STATE_WARNING, 'Connecting')
				self.socket.destroy()
				delete self.socket
				clearInterval(self.polling)
				self.polling = setInterval(() => {
					self.getVariables()
				}, 10000) //10 second
			} else {
				return
			}
		}

		if (self.config.host) {
			var result
			self.socket = new tcp(self.config.host, self.config.port)

			self.socket.on('error', function (err) {
				if (err.toString().indexOf('ECONNREFUSED') > -1) {
					self.debug('Network error: Unable to connect to device:' + self.config.host)
					self.log('error', 'Network error: Unable to connect to device:' + self.config.host)
				} else {
					self.debug('Network error (' + self.config.host + ')', err)
					self.log('error', 'Network error: ' + err)
				}

				self.setLocalVariable('power', undefined)
				self.status(self.STATE_ERROR, err.toString())
				clearInterval(self.polling)
				self.polling = setInterval(() => {
					self.getVariables()
				}, 10000) //10 second
				self.socket.destroy()
				delete self.socket
			})

			self.socket.on('data', function (data) {
				response = JSON.parse(tplink_smarthome_crypto.decryptWithHeader(data).toString())
				if (response.system && response.system.get_sysinfo && response.system.get_sysinfo.relay_state) {
					self.setLocalVariable('power', 'On')
				} else {
					self.setLocalVariable('power', 'Off')
				}
				self.socket.send(Buffer.from('\r\n'))
				self.checkFeedbacks('power')
			})

			self.socket.on('connect', function () {
				self.status(self.STATE_OK)
				self.debug('Connected (' + self.config.host + ')')
				self.socket.send(Buffer.from(cmd, 'hex'))
				self.socket.send(Buffer.from('\r\n'))
				clearInterval(self.polling)
				self.polling = setInterval(() => {
					self.getVariables()
				}, 1000) //1 second
				self.hungTcp = 0
			})

			self.socket.on('end', function () {
				self.socket.destroy()
				delete self.socket
			})
		}
	}
}

instance.prototype.initFeedbacks = function () {
	var self = this
	const feedbacks = {}
	feedbacks['power'] = {
		label: 'Change background color by power status',
		description: 'If the state of the outlet matches the specified value, change background color of the bank',
		options: [
			{
				type: 'colorpicker',
				label: 'Foreground color',
				id: 'fg',
				default: self.rgb(0, 0, 0),
			},
			{
				type: 'colorpicker',
				label: 'Background color',
				id: 'bg',
				default: self.rgb(255, 255, 0),
			},
			{
				type: 'dropdown',
				label: 'Power state',
				id: 'state',
				default: 'On',
				choices: [
					{ id: 'On', label: 'On' },
					{ id: 'Off', label: 'Off' },
				],
			},
		],
		callback: function (feedback) {
			if (self.variables['power'] === feedback.options.state) {
				return { color: feedback.options.fg, bgcolor: feedback.options.bg }
			}
		},
	}
	self.setFeedbackDefinitions(feedbacks)
}

instance_skel.extendedBy(instance)
exports = module.exports = instance
