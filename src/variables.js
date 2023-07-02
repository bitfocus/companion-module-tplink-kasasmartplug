module.exports = {
	initVariables: function () {
		let self = this
		let variables = []

		variables.push({ variableId: 'sw_ver', name: 'SW Version' })
		variables.push({ variableId: 'hw_ver', name: 'HW Version' })
		variables.push({ variableId: 'model', name: 'Model' })
		variables.push({ variableId: 'device_id', name: 'Device ID' })
		variables.push({ variableId: 'oem_id', name: 'OEM ID' })
		variables.push({ variableId: 'hw_id', name: 'HW ID' })
		variables.push({ variableId: 'rssi', name: 'RSSI' })
		variables.push({ variableId: 'latitude', name: 'Latitude' })
		variables.push({ variableId: 'longitude', name: 'Longitude' })
		variables.push({ variableId: 'alias', name: 'Alias' })
		variables.push({ variableId: 'mac_address', name: 'MAC Address' })

		variables.push({ variableId: 'total_plugs', name: 'Total Plugs on Device' })

		if (self.SINGLEPLUGMODE) {
			variables.push({ variableId: 'power_state', name: 'Power State' })
		} else {
			if (self.PLUGINFO.children && self.PLUGINFO.children.length > 0) {
				for (let i = 0; i < self.PLUGINFO.children.length; i++) {
					variables.push({ variableId: 'power_state_' + (i + 1), name: 'Power State ' + (i + 1) })
					variables.push({ variableId: 'alias_' + (i + 1), name: 'Alias ' + (i + 1) })
				}
			}
		}

		self.setVariableDefinitions(variables)
	},

	checkVariables: function () {
		let self = this

		let variableObj = {}

		try {
			if ('sw_ver' in self.PLUGINFO) {
				variableObj['sw_ver'] = self.PLUGINFO.sw_ver
			}

			if ('hw_ver' in self.PLUGINFO) {
				variableObj['hw_ver'] = self.PLUGINFO.hw_ver
			}

			if ('model' in self.PLUGINFO) {
				variableObj['model'] = self.PLUGINFO.model
			}

			if ('deviceId' in self.PLUGINFO) {
				variableObj['device_id'] = self.PLUGINFO.deviceId
			}

			if ('oemId' in self.PLUGINFO) {
				variableObj['oem_id'] = self.PLUGINFO.oemId
			}

			if ('hwId' in self.PLUGINFO) {
				variableObj['hw_id'] = self.PLUGINFO.hwId
			}

			if ('rssi' in self.PLUGINFO) {
				variableObj['rssi'] = self.PLUGINFO.rssi
			}

			if ('latitude_i' in self.PLUGINFO) {
				variableObj['latitude'] = self.PLUGINFO.latitude_i
			}

			if ('longitude_i' in self.PLUGINFO) {
				variableObj['longitude'] = self.PLUGINFO.longitude_i
			}

			if ('alias' in self.PLUGINFO) {
				variableObj['alias'] = self.PLUGINFO.alias
			}

			if ('mac' in self.PLUGINFO) {
				variableObj['mac_address'] = self.PLUGINFO.mac
			}

			if (self.SINGLEPLUGMODE) {
				variableObj['total_plugs'] = '1'
				variableObj['power_state'] = self.PLUGINFO.relay_state == 1 ? 'On' : 'Off'
			} else {
				if (self.PLUGINFO.children && self.PLUGINFO.children.length > 0) {
					variableObj['total_plugs'] = self.PLUGINFO.children.length

					for (let i = 0; i < self.PLUGINFO.children.length; i++) {
						variableObj['power_state_' + (i + 1)] = self.PLUGINFO.children[i].state == 1 ? 'On' : 'Off'
						variableObj['alias_' + (i + 1)] = self.PLUGINFO.children[i].alias
					}
				}
			}

			self.setVariableValues(variableObj)
		} catch (error) {
			if (String(error).indexOf("Cannot use 'in' operator to search") === -1) {
				self.log('error', 'Error from Plug: ' + String(error))
			}
		}
	},
}
