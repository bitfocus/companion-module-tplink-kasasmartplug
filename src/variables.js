export function initVariables() {
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

	if (this.SINGLEPLUGMODE) {
		variables.push({ variableId: 'power_state', name: 'Power State' })
	} else {
		if (this.PLUGINFO.children && this.PLUGINFO.children.length > 0) {
			for (let i = 0; i < this.PLUGINFO.children.length; i++) {
				variables.push({ variableId: 'power_state_' + (i + 1), name: 'Power State ' + (i + 1) })
				variables.push({ variableId: 'alias_' + (i + 1), name: 'Alias ' + (i + 1) })
			}
		}
	}

	this.setVariableDefinitions(variables)
}
export function checkVariables() {
	let variableObj = {}

	try {
		if ('sw_ver' in this.PLUGINFO) {
			variableObj['sw_ver'] = this.PLUGINFO.sw_ver
		}

		if ('hw_ver' in this.PLUGINFO) {
			variableObj['hw_ver'] = this.PLUGINFO.hw_ver
		}

		if ('model' in this.PLUGINFO) {
			variableObj['model'] = this.PLUGINFO.model
		}

		if ('deviceId' in this.PLUGINFO) {
			variableObj['device_id'] = this.PLUGINFO.deviceId
		}

		if ('oemId' in this.PLUGINFO) {
			variableObj['oem_id'] = this.PLUGINFO.oemId
		}

		if ('hwId' in this.PLUGINFO) {
			variableObj['hw_id'] = this.PLUGINFO.hwId
		}

		if ('rssi' in this.PLUGINFO) {
			variableObj['rssi'] = this.PLUGINFO.rssi
		}

		if ('latitude_i' in this.PLUGINFO) {
			variableObj['latitude'] = this.PLUGINFO.latitude_i
		}

		if ('longitude_i' in this.PLUGINFO) {
			variableObj['longitude'] = this.PLUGINFO.longitude_i
		}

		if ('alias' in this.PLUGINFO) {
			variableObj['alias'] = this.PLUGINFO.alias
		}

		if ('mac' in this.PLUGINFO) {
			variableObj['mac_address'] = this.PLUGINFO.mac
		}

		if (this.SINGLEPLUGMODE) {
			variableObj['total_plugs'] = '1'
			variableObj['power_state'] = this.PLUGINFO.relay_state == 1 ? 'On' : 'Off'
		} else {
			if (this.PLUGINFO.children && this.PLUGINFO.children.length > 0) {
				variableObj['total_plugs'] = this.PLUGINFO.children.length

				for (let i = 0; i < this.PLUGINFO.children.length; i++) {
					variableObj['power_state_' + (i + 1)] = this.PLUGINFO.children[i].state == 1 ? 'On' : 'Off'
					variableObj['alias_' + (i + 1)] = this.PLUGINFO.children[i].alias
				}
			}
		}

		this.setVariableValues(variableObj)
	} catch (error) {
		if (String(error).indexOf("Cannot use 'in' operator to search") === -1) {
			this.log('error', 'Error from Plug: ' + String(error))
		}
	}
}
