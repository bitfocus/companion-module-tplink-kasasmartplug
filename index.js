//TP-Link Kasa Smart Plug

var tcp           = require('../../tcp');
var instance_skel = require('../../instance_skel');
var debug;
var log;

function instance(system, id, config) {
	var self = this;

	// super-constructor
	instance_skel.apply(this, arguments);

	self.actions(); // export actions

	return self;
}

instance.prototype.updateConfig = function(config) {
	var self = this;

	self.config = config;
	self.status(self.STATE_OK);
};

instance.prototype.init = function() {
	var self = this;
	self.status(self.STATE_OK);
};

// Return config fields for web config
instance.prototype.config_fields = function () {
	var self = this;

	return [
		{
			type: 'text',
			id: 'info',
			label: 'Information',
			width: 12,
			value: 'This module can be used to control TP-Link Kasa Smart Home Wifi devices, like the HS-100 outlet.'
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'Target IP',
			width: 6,
			regex: self.REGEX_IP
		},
		{
			type: 'textinput',
			id: 'port',
			label: 'Target Port',
			width: 2,
			default: 9999,
			regex: self.REGEX_PORT
        }
	]
};

// When module gets deleted
instance.prototype.destroy = function() {
	var self = this;

	if (self.socket !== undefined) {
		self.socket.destroy();
	}

	debug('destroy', self.id);
};

instance.prototype.actions = function(system) {
	var self = this;

	self.system.emit('instance_actions', self.id, {
		'on': {
			label: 'Turn On'
		},
		'off': {
			label: 'Turn Off'
		}
	});
}

instance.prototype.action = function(action) {
	var self = this;
	var cmd;

	switch(action.action) {
		case 'on':
			cmd = '0000002AD0F281F88BFF9AF7D5EF94B6C5A0D48BF99CF091E8B7C4B0D1A5C0E2D8A381F286E793F6D4EEDFA2DFA2';
			break;
		case 'off':
			cmd = '0000002AD0F281F88BFF9AF7D5EF94B6C5A0D48BF99CF091E8B7C4B0D1A5C0E2D8A381F286E793F6D4EEDEA3DEA3';
			break;
	}

	if (cmd !== undefined) {		
		if (self.socket !== undefined) {
			self.socket.destroy();
			delete self.socket;
		}

		self.status(self.STATE_WARNING, 'Connecting');

		if (self.config.host) {
			self.socket = new tcp(self.config.host, self.config.port);

			self.socket.on('error', function (err) {
				if (err.toString().indexOf('ECONNREFUSED') > -1) {
					self.debug('Network error: Unable to connect to device:' + self.config.host);
					self.log('error','Network error: Unable to connect to device:' + self.config.host);
				}
				else {
					self.debug('Network error (' + self.config.host + ')', err);
					self.log('error','Network error: ' + err);
				}
				
				self.status(self.STATE_ERROR, err);
				self.socket.destroy();
				delete self.socket;
			});

			self.socket.on('connect', function () {
				self.debug('Connected (' + self.config.host + ')');
				self.debug('Turning outlet ' + action.action + ': ' + self.config.host);
				self.socket.send(Buffer.from(cmd, 'hex'));
				self.socket.send(Buffer.from('\r\n'));
				self.socket.destroy();
				delete self.socket;
				self.status(self.STATE_OK);
			});
		}
	}
}

instance_skel.extendedBy(instance);
exports = module.exports = instance;
