import { Regex } from '@companion-module/base'

export function getConfigFields() {
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
			default: '',
			width: 12,
			regex: Regex.IP,
		},
		{
			type: 'checkbox',
			id: 'polling',
			width: 6,
			label: 'Polling',
			default: true,
		},
		{
			type: 'static-text',
			id: 'info2',
			width: 6,
			label: 'Notice!',
			value: 'Disabling Polling will prevent automatic reconnect on error.\nFeedback and variables will not always match the plug state.',
		},
	]
}
