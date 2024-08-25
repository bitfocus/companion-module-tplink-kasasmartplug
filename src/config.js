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

	let ch = []
	if (Object.keys(this.FOUND_PLUGS || {}).length == 0) {
		ch = [{ id: 'none', label: 'No Kasa Plugs located' }]
	} else {
		const plugs = this.FOUND_PLUGS
		for (const pId of Object.keys(plugs)) {
			ch.push({ id: pId, label: `${plugs[pId].alias} at ${plugs[pId].host} (${plugs[pId].mac})` })
		}
    if (this.config.plugId == 'none') {
			this.config.plugId = ch[0].id
      this.config.host = this.FOUND_PLUGS[ch[0].id].host
			this.saveConfig(this.config)
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
		default: this.config?.plugId ? this.config.plugId : ch[0].id,
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
