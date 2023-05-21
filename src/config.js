const { Regex } = require('@companion-module/base')

module.exports = {
	getConfigFields() {
		return [
			{
				type: 'static-text',
				id: 'info',
				width: 12,
				label: 'Information',
				value: 'This module controls TP-Link Kasa Smart Plugs. It supports both single plug and multi plug devices.',
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Plug IP',
				default: '192.168.0.5',
				width: 4,
				regex: Regex.IP
			},
			{
				type: 'checkbox',
				id: 'polling',
				label: 'Enable Polling',
				default: false,
				width: 12
			},
			{
				type: 'static-text',
				id: 'intervalInfo',
				width: 12,
				label: 'Update Interval',
				value: 'Please enter the amount of time in milliseconds to request new information from the device. Set to 0 to disable. Do not use an interval less than 2000 or the device may stop responding.',
				isVisible: (configValues) => configValues.polling === true,
			},
			{
				type: 'textinput',
				id: 'interval',
				label: 'Update Interval',
				width: 3,
				default: 2000,
				isVisible: (configValues) => configValues.polling === true,
			},
			{
				type: 'checkbox',
				id: 'verbose',
				label: 'Enable Verbose Logging',
				default: false,
				width: 12
			},
			{
				type: 'static-text',
				id: 'info3',
				width: 12,
				label: ' ',
				value: `
				<div class="alert alert-info">
					<div>
						Enabling Verbose Logging will push all incoming and outgoing data to the log, which is helpful for debugging.
					</div>
				</div>
				`,
				isVisible: (configValues) => configValues.verbose === true,
			}
		]
	}
}