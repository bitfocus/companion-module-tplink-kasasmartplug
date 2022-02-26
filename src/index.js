var instance_skel = require('../../../instance_skel')
var actions = require('./actions.js')
var presets = require('./presets.js')
var feedbacks = require('./feedbacks.js')
var variables = require('./variables.js')

var debug;

const { Client, Plug } = require('tplink-smarthome-api');

instance.prototype.PLUGINFO = {
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
	children: []
};
instance.prototype.CHOICES_PLUGS = [ {id: 1, label: 'Plug'} ];

instance.prototype.DEVICE = null;

instance.prototype.SINGLEPLUGMODE = true;

// ########################
// #### Instance setup ####
// ########################
function instance(system, id, config) {
	let self = this

	// super-constructor
	instance_skel.apply(this, arguments)

	return self
};

instance.GetUpgradeScripts = function () {
	
};

// When module gets deleted
instance.prototype.destroy = function () {
	let self = this;

	try {
		if (self.DEVICE) {
			self.DEVICE.closeConnection();
		}
	}
	catch(error) {
		self.DEVICE = null;
	}

	debug('destroy', self.id)
};

// Initalize module
instance.prototype.init = function () {
	let self = this;

	debug = self.debug;
	log = self.log;

	self.status(self.STATUS_WARNING, 'connecting');

	self.getInformation();
	self.actions(); // export actions
	self.init_presets();
	self.init_variables();
	self.checkVariables();
	self.init_feedbacks();
	self.checkFeedbacks();
};

// Update module after a config change
instance.prototype.updateConfig = function (config) {
	let self = this;
	self.config = config;

	self.status(self.STATUS_WARNING, 'connecting');
	
	self.getInformation();
	self.actions(); // export actions
	self.init_presets();
	self.init_variables();
	self.checkVariables();
	self.init_feedbacks();
	self.checkFeedbacks();
};

instance.prototype.handleError = function(err) {
	let self = this;

	let error = err.toString();

	Object.keys(err).forEach(function(key) {
		if (key === 'code') {
			if (err[key] === 'ECONNREFUSED') {
				error = 'Unable to communicate with Device. Connection refused. Is this the right IP address? Is it still online?';
				self.log('error', error);
				self.status(self.STATUS_ERROR);
			}
		}
	});
};

instance.prototype.getInformation = async function () {
	//Get all information from Device
	let self = this;

	if (self.config.host) {
		try {
			if (!self.DEVICE) {
				let client = new Client();
				self.DEVICE = await client.getDevice({ host: self.config.host }, { timeout: 20000 });
			}
			
			self.DEVICE.getSysInfo()
			.then((info) => {
				self.PLUGINFO = info;

				if (self.PLUGINFO) {
					self.status(self.STATUS_OK);

					try {
						self.updateData();
						self.monitorPlugs();
					}
					catch(error) {
						self.handleError(error);
					}

					self.actions(); // export actions
					self.init_presets();
					self.init_variables();
					self.checkVariables();
					self.init_feedbacks();
					self.checkFeedbacks();
				}
			})
			.catch((error) => {
				self.handleError(error);
			});
		}
		catch(error) {
			self.handleError(error);
		}
	}
};


instance.prototype.updateData = function () {
	let self = this;
	//check the number of children (total plugs) the device has and update the action list appropriately

	if (self.PLUGINFO.children && self.PLUGINFO.children.length > 0) {
		self.SINGLEPLUGMODE = false;
		self.CHOICES_PLUGS = [];

		for (let i = 0; i < self.PLUGINFO.children.length; i++) {
			let plugObj = {
				id: self.PLUGINFO.children[i].id.toString(),
				label: self.PLUGINFO.children[i].alias
			}
			self.CHOICES_PLUGS.push(plugObj);
		}
	}
	else {
		self.SINGLEPLUGMODE = true;

		self.CHOICES_PLUGS = [];
		let plugObj = {
			id: 1,
			label: 'Plug'
		}
		self.CHOICES_PLUGS.push(plugObj);
	}
};

instance.prototype.monitorPlugs = async function() {
	let self = this;

	if (self.PLUGINFO.children && self.PLUGINFO.children.length > 0) {
		for (let i = 0; i < self.PLUGINFO.children.length; i++) {
			let client = new Client();
			let childPlug = await client.getDevice({ host: self.config.host, childId: self.PLUGINFO.children[i].id }, { timeout: 20000 })
			self.monitorEvents(childPlug);
		}
	}
	else {
		//let client = new Client();
		//let childPlug = await client.getDevice({ host: self.config.host }, { timeout: 20000 })
		self.monitorEvents(self.DEVICE);
	}
}

instance.prototype.monitorEvents = function(plug) {
	let self = this;

	// Device (Common) Events
	plug.on('emeter-realtime-update', (emeterRealtime) => {
	});

	// Plug Events
	plug.on('power-on', () => {
		self.updatePlugState(plug.id, 1);
	});
	plug.on('power-off', () => {
		self.updatePlugState(plug.id, 0);
	});
	plug.on('power-update', (powerOn) => {
		self.updatePlugState(plug.id, powerOn);
	});
	plug.on('in-use', () => {
	});
	plug.on('not-in-use', () => {
	});
	plug.on('in-use-update', (inUse) => {
		//logEvent('in-use-update', device, inUse);
		//self.checkFeedbacks();
		//self.checkVariables();
	});	

	if (self.config.interval > 0) {
		plug.startPolling(self.config.interval);
	}
};

instance.prototype.updatePlugState = function(plugId, powerState) {
	let self = this;

	if (self.SINGLEPLUGMODE) {
		self.PLUGINFO.relay_state = powerState;
	}
	else {
		for (let i = 0; i < self.PLUGINFO.children.length; i++) {
			if (self.PLUGINFO.children[i].id === plugId) {
				self.PLUGINFO.children[i].state = powerState;
				break;
			}
		}
	}

	self.checkFeedbacks();
	self.checkVariables();
};

// Return config fields for web config
instance.prototype.config_fields = function () {
	let self = this

	return [
		{
			type: 'text',
			id: 'info',
			width: 12,
			label: 'Information',
			value: 'This module controls TP-Link Kasa Smart Plugs. It supports both single plug and multi plug devices.',
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'Plug IP',
			width: 4,
			regex: self.REGEX_IP
		},
		{
			type: 'text',
			id: 'dummy1',
			width: 12,
			label: ' ',
			value: ' ',
		},
		{
			type: 'text',
			id: 'intervalInfo',
			width: 12,
			label: 'Update Interval',
			value: 'Please enter the amount of time in milliseconds to request new information from the plug. Set to 0 to disable.',
		},
		{
			type: 'textinput',
			id: 'interval',
			label: 'Update Interval',
			width: 3,
			default: 0
		}
	]
};

// ##########################
// #### Instance Presets ####
// ##########################
instance.prototype.init_presets = function () {
	this.setPresetDefinitions(presets.setPresets(this));
};

// ############################
// #### Instance Variables ####
// ############################
instance.prototype.init_variables = function () {
	this.setVariableDefinitions(variables.setVariables(this));
};

// Setup Initial Values
instance.prototype.checkVariables = function () {
	variables.checkVariables(this);
};

// ############################
// #### Instance Feedbacks ####
// ############################
instance.prototype.init_feedbacks = function (system) {
	this.setFeedbackDefinitions(feedbacks.setFeedbacks(this));
};

// ##########################
// #### Instance Actions ####
// ##########################
instance.prototype.actions = function (system) {
	this.setActions(actions.setActions(this));
};

instance.prototype.power = async function(plugId, powerState) {
	let self = this;

	let plugName = self.CHOICES_PLUGS.find((PLUG) => PLUG.id == plugId).label;

	if (self.config.host) {
		try {
			self.log('info', `Setting ${plugName} Power State to: ${(powerState ? 'On' : 'Off')}`);
			
			if (self.SINGLEPLUGMODE) {
				self.DEVICE.setPowerState(powerState);
			}
			else {
				let client = new Client();
				let plug = await client.getDevice({ host: self.config.host, childId: plugId }, { timeout: 20000 });
				plug.setPowerState(powerState);
			}		
			
			//self.updatePlugState(plugId, powerState);
		}
		catch(error) {
			self.handleError(error);
		};
	}
};

instance.prototype.powerToggle = async function(plugId) {
	let self = this;

	let plugName = self.CHOICES_PLUGS.find((PLUG) => PLUG.id == plugId).label;

	if (self.config.host) {
		try {
			let client = new Client();
			let plug;
			if (self.SINGLEPLUGMODE) {
				plug = await client.getDevice({ host: self.config.host });
			}
			else {
				plug = await client.getDevice({ host: self.config.host, childId: plugId });
			}
			self.log('info', `Toggling ${plugName} Power`);
			plug.togglePowerState();
		}
		catch(error) {
			self.handleError(error);
		};
	}
};

instance_skel.extendedBy(instance);
exports = module.exports = instance;