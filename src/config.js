import { Regex } from '@companion-module/base'

export function getConfigFields() {
	let cf = []
	cf.push(
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
	)
	cf.push({
		type: 'checkbox',
		id: 'scan',
		label: 'Scan network for Kasa Plugs?',
		default: true,
		width: 12,
	})

	let ch = [{id: 'none', label: 'No Kasa Plugs Located'}]
	let def = 'none'
	if (Object.keys(this.FOUND_PLUGS || {}).length == 0) {
    if (this.config) {
		this.config.plugId = 'none'
		this.saveConfig(this.config)
    }
	} else {
		ch = [{ id: 'none', label: 'No plug selected' }]
		const plugs = this.FOUND_PLUGS
		this.config.plugId = 'none'
		for (const pId of Object.keys(plugs)) {
			ch.push({ id: pId, label: `${plugs[pId].alias} at ${plugs[pId].host} (${plugs[pId].mac})` })
		}
	}
	cf.push({
		type: 'dropdown',
		id: 'plugId',
		label: 'Select Plug by Alias',
		tooltip: 'Name and IP of Kasa Plugs located',
		isVisible: (opt, data) => {
			return !!opt.scan
		},
		width: 12,
		default: def,
		choices: ch,
	})
	cf.push(
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
			value:
				'Disabling Polling will prevent automatic reconnect on error.\nFeedback and variables will not always match the plug state.',
		},
	)

	return cf
}
