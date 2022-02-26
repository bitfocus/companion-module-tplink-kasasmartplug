module.exports = {
	// ##########################
	// #### Define Variables ####
	// ##########################
	setVariables: function (i) {
		let self = i;
		let variables = [];

		variables.push({ name: 'sw_ver', label: 'SW Version' });
		variables.push({ name: 'hw_ver', label: 'HW Version' });
		variables.push({ name: 'model', label: 'Model' });
		variables.push({ name: 'device_id', label: 'Device ID' });
		variables.push({ name: 'oem_id', label: 'OEM ID' });
		variables.push({ name: 'hw_id', label: 'HW ID' });
		variables.push({ name: 'rssi', label: 'RSSI' });
		variables.push({ name: 'latitude', label: 'Latitude' });
		variables.push({ name: 'longitude', label: 'Longitude' });
		variables.push({ name: 'alias', label: 'Alias' });
		variables.push({ name: 'mac_address', label: 'MAC Address' });

		variables.push({ name: 'total_plugs', label: 'Total Plugs on Device' });

		if (self.SINGLEPLUGMODE) {
			variables.push({ name: 'power_state', label: 'Power State' });
		}
		else {
			if (self.PLUGINFO.children && self.PLUGINFO.children.length > 0) {
				for (let i = 0; i < self.PLUGINFO.children.length; i++) {
					variables.push({ name: 'power_state_' + (i+1), label: 'Power State ' + (i+1) });
					variables.push({ name: 'alias_' + (i+1), label: 'Alias ' + (i+1) });
				}
			}
		}

		return variables
	},

	// #########################
	// #### Check Variables ####
	// #########################
	checkVariables: function (i) {
		let self = i;

		try {
			if ('sw_ver' in self.PLUGINFO) {
				self.setVariable('sw_ver', self.PLUGINFO.sw_ver);
			}

			if ('hw_ver' in self.PLUGINFO) {
				self.setVariable('hw_ver', self.PLUGINFO.hw_ver);
			}

			if ('model' in self.PLUGINFO) {
				self.setVariable('model', self.PLUGINFO.model);
			}

			if ('deviceId' in self.PLUGINFO) {
				self.setVariable('device_id', self.PLUGINFO.deviceId);
			}

			if ('oemId' in self.PLUGINFO) {
				self.setVariable('oem_id', self.PLUGINFO.oemId);
			}

			if ('hwId' in self.PLUGINFO) {
				self.setVariable('hw_id', self.PLUGINFO.hwId);
			}

			if ('rssi' in self.PLUGINFO) {
				self.setVariable('rssi', self.PLUGINFO.rssi);
			}

			if ('latitude_i' in self.PLUGINFO) {
				self.setVariable('latitude', self.PLUGINFO.latitude_i);
			}

			if ('longitude_i' in self.PLUGINFO) {
				self.setVariable('longitude', self.PLUGINFO.longitude_i);
			}

			if ('alias' in self.PLUGINFO) {
				self.setVariable('alias', self.PLUGINFO.alias);
			}

			if ('mac' in self.PLUGINFO) {
				self.setVariable('mac_address', self.PLUGINFO.mac);
			}

			if (self.SINGLEPLUGMODE) {
				self.setVariable('total_plugs', '1');
				self.setVariable('power_state', (self.PLUGINFO.relay_state == 1 ? 'On' : 'Off'));
			}
			else {
				if (self.PLUGINFO.children && self.PLUGINFO.children.length > 0) {
					self.setVariable('total_plugs', self.PLUGINFO.children.length);
	
					for (let i = 0; i < self.PLUGINFO.children.length; i++) {
						self.setVariable('power_state_' + (i+1), (self.PLUGINFO.children[i].state == 1 ? 'On' : 'Off'));
						self.setVariable('alias_' + (i+1), self.PLUGINFO.children[i].alias);
					}
				}
			}
		}
		catch(error) {
			if (String(error).indexOf('Cannot use \'in\' operator to search') === -1) {
				self.log('error', 'Error from Plug: ' + String(error));
			}
		}
	}
}
