import { test } from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { initActions } from '../src/actions.js'
import { initFeedbacks } from '../src/feedbacks.js'
import { checkVariables } from '../src/variables.js'
import { getConfigFields } from '../src/config.js'
import { power, updatePlugState, monitorEvents, updateData, setupInterval, stopInterval } from '../src/utils.js'

function instance(single = true) {
	return {
		SINGLEPLUGMODE: single,
		config: { host: '127.0.0.1', scan: false },
		CHOICES_PLUGS: [{ id: 1, label: 'Plug' }],
		PLUGINFO: single ? { relay_state: 0, alias: 'Desk' } : { children: [{ id: 'child1', alias: 'Desk', state: 0 }] },
		log() {},
		setActionDefinitions(value) {
			this.actions = value
		},
		setFeedbackDefinitions(value) {
			this.feedbacks = value
		},
		setVariableValues(value) {
			this.variables = value
		},
		checkFeedbacks() {},
		checkVariables,
		updatePlugState,
		power,
		handleError(error) {
			throw error
		},
	}
}

test('single-plug power actions write device state, feedback and variables', async () => {
	const self = instance()
	const writes = []
	self.DEVICE = {
		async setPowerState(state) {
			writes.push(state)
		},
	}
	initActions.call(self)
	initFeedbacks.call(self)
	await self.actions.on.callback({ options: {} })
	assert.deepEqual(writes, [1])
	assert.equal(self.variables.power_state, 'On')
	assert.equal(await self.feedbacks.powerState.callback({ options: { option: 1 } }), true)
	await self.actions.off.callback({ options: {} })
	assert.deepEqual(writes, [1, 0])
	assert.equal(self.variables.power_state, 'Off')
	assert.equal(await self.feedbacks.powerState.callback({ options: { option: 1 } }), false)
	self.ERRORED = true
	await self.actions.on.callback({ options: {} })
	assert.deepEqual(writes, [1, 0])
})

test('multi-plug actions select the child and device events update feedback and variables', async () => {
	const self = instance(false)
	updateData.call(self)
	initActions.call(self)
	initFeedbacks.call(self)
	const calls = []
	self.power = async (...args) => calls.push(args)
	await self.actions.powerOn.callback({ options: { plug: 'child1' } })
	await self.actions.powerOff.callback({ options: { plug: 'child1' } })
	assert.deepEqual(calls, [
		['child1', 1],
		['child1', 0],
	])
	const device = Object.assign(new EventEmitter(), { id: 'child1' })
	const cleanup = monitorEvents.call(self, device)
	device.emit('power-on')
	assert.equal(self.variables.power_state_1, 'On')
	assert.equal(self.variables.alias_1, 'Desk')
	assert.equal(await self.feedbacks.powerState.callback({ options: { plug: 'child1', option: 1 } }), true)
	device.emit('power-off')
	assert.equal(self.variables.power_state_1, 'Off')
	cleanup()
	assert.equal(device.listenerCount('power-on'), 0)
})

test('discovery config visibility and polling can be disabled and stopped', async () => {
	const self = instance()
	const selection = getConfigFields.call(self).find((field) => field.id === 'plugId')
	assert.equal(selection.isVisible({ scan: true }), true)
	assert.equal(selection.isVisible({ scan: false }), false)
	let polls = 0
	self.getInformation = async () => polls++
	self.config.interval = 2000
	await setupInterval.call(self)
	assert.equal(polls, 1)
	self.config.polling = true
	await setupInterval.call(self)
	assert.ok(self.INTERVAL)
	stopInterval.call(self)
	assert.equal(self.INTERVAL, null)
})
