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
			width: 4,
			regex: Regex.IP,
		},
		{
			type: 'static-text',
			id: 'poll',
			width: 12,
			label: 'Polling',
			value: 'Because Polling is necessary for proper module re-connet on error.\n\Since v2.1.4 it is always enabled',
		},
	]
}
