const Helpers = require('./helpers');

class Values {
	constructor(config, values, pv) {
		this.DeviceWorkState = WorkState[config[2]];
		this.DeviceMachineType = config[0];
		this.DeviceSoftwareVersion = config[1];
		this.DeviceRatedPower = Helpers.ParseValue(config[4]);
		this.DeviceRadiatorTemperature = Helpers.ParseValue(config[18]);
		this.DeviceTransformerTemperature = Helpers.ParseValue(config[19]);
		this.DeviceBuzzerState = BuzzerState[config[20]];
		this.DeviceSystemFault = FaultCodes[config[21]] || 'None';

		this.PvState = pv.voltage > 5 ? PvState[1] : PvState[2];

		if (pv.power > 2) {
			this.PvState = PvState[0];
		}

		this.PvVoltage = pv.voltage.toFixed(2);
		this.PvCurrent = pv.current.toFixed(2);
		this.PvPower = pv.power.toFixed(2);

		this.BatteryState = BatteryState[config[2] == 1 ? 1 : 0];

		if (pv.power > 2 || Boolean(config[24])) {
			this.BatteryState = BatteryState[3];
		}

		this.BatteryClass = Helpers.ParseValue(config[3]);
		this.BatteryVoltage = Helpers.ParseValue(config[14], 0.1);
		this.BatteryCurrent = Helpers.ParseSignedValue(config[15], 0.1);
		this.BatteryPower = this.GridPower = config[2] == 1 ? Helpers.ParseSignedValue(values[18]) : 0;
		this.BatteryTemperature = Helpers.ParseSignedValue(config[16]);
		this.BatterySocPercent = Helpers.ParseSignedValue(config[17]);

		this.GridCharge = Boolean(config[24]);
		this.GridState = GridState[config[25]];
		this.GridVoltage = Helpers.ParseValue(values[2], 0.1);
		this.GridPower = config[2] == 2 ? Helpers.ParseSignedValue(values[18]) : 0;
		this.GridFrequency = Helpers.ParseValue(values[3], 0.1);

		this.L1Voltage = Helpers.ParseValue(values[6], 0.1);
		this.L1Current = Helpers.ParseValue(values[7], 0.1);
		this.L1Power = Helpers.ParseSignedValue(values[8]);
		this.L1VoltageCurrent = Helpers.ParseSignedValue(values[9]);
		this.L1LoadPercent = Helpers.ParseSignedValue(values[10]);

		this.L2Voltage = Helpers.ParseValue(values[11], 0.1);
		this.L2Current = Helpers.ParseValue(values[12], 0.1);
		this.L2Power = Helpers.ParseSignedValue(values[13]);
		this.L2VoltageCurrent = Helpers.ParseSignedValue(values[14]);
		this.L2LoadPercent = Helpers.ParseSignedValue(values[15]);

		this.OutputVoltage = Helpers.ParseValue(values[16], 0.1);
		this.OutputFrequency = Helpers.ParseValue(values[17], 0.1);
		this.OutputPower = Helpers.ParseSignedValue(values[18]);
		this.OutputVoltageCurrent = Helpers.ParseSignedValue(values[19]);
		this.OutputLoadPercent = Helpers.ParseValue(values[20]);
	}
}

const WorkState = [
	"Self Check",
	"Battery BackUp",
	"Power Line",
	"Stop",
	"Debug",
	"Generator",
	"PowerOff",
	"StandBy",
];

const BuzzerState = [
	"Active",
	"Silence",
];

const BatteryState = [
	"StandBy",
	"In Use",
	"Discharging",
	"Charging",
];

const GridState = [
	"Offline",
	"Connected",
	"Warning",
];

const PvState = [
	"Charging",
	"Daylight",
	"Night",
];

const FaultCodes = {
	1: "Fan error. Please check the fan",
	2: "Temperature of machine is too high. Power off and waiting for 5 minutes",
	3: "Battery voltage is too high. Check the battery specifications",
	4: "Battery voltage is too Low. Check the battery specifications",
	5: "Output short circuited. Remove your load and restart",
	6: "Inverter output voltage is high. Return to repair center",
	7: "Over load. Drecrease your loaded devices",
	11: "Main relay failed",
	28: "Rated load recognition failed",
	51: "Output over current. Check if wiring is connected well and remove abnormal load",
	58: "Inverter output voltage is low. Decreace your loaded devices",
};

const ValuesConfig = {
	DeviceWorkState: {
		unit_of_measurement: '',
		icon: 'mdi:state-machine',
		device_class: 'enum',
		state_class: 'measurement',
		options: WorkState
	},
	DeviceMachineType: {
		unit_of_measurement: '',
		icon: 'mdi:power-plug-battery-outline'
	},
	DeviceSoftwareVersion: {
		unit_of_measurement: '',
		icon: 'mdi:counter'
	},
	DeviceRatedPower: {
		unit_of_measurement: 'Wh',
		icon: 'mdi:lightbulb-outline'
	},
	DeviceRadiatorTemperature: {
		unit_of_measurement: '°C',
		icon: 'mdi:thermometer',
		device_class: 'temperature',
		state_class: 'measurement'
	},
	DeviceTransformerTemperature: {
		unit_of_measurement: '°C',
		icon: 'mdi:thermometer',
		device_class: 'temperature',
		state_class: 'measurement'
	},
	DeviceBuzzerState: {
		unit_of_measurement: '',
		icon: 'mdi:bullhorn',
		device_class: 'enum',
		state_class: 'measurement',
		options: BuzzerState
	},
	DeviceSystemFault: {
		unit_of_measurement: '',
		icon: 'mdi:alert-circle-outline',
		device_class: 'enum',
		state_class: 'measurement',
		options: Object.values(FaultCodes)
	},
	PvState: {
		unit_of_measurement: '',
		icon: 'mdi:solar-panel',
		device_class: 'enum',
		state_class: 'measurement',
		options: PvState
	},
	PvVoltage: {
		unit_of_measurement: 'V',
		icon: 'mdi:current-dc',
		device_class: 'voltage',
		state_class: 'measurement'
	},
	PvCurrent: {
		unit_of_measurement: 'A',
		icon: 'mdi:current-dc',
		device_class: 'current',
		state_class: 'measurement'
	},
	PvPower: {
		unit_of_measurement: 'Wh',
		icon: 'mdi:solar-power',
		device_class: 'energy',
		state_class: 'total_increasing',
	},
	BatteryState: {
		unit_of_measurement: '',
		icon: 'mdi:car-battery',
		device_class: 'enum',
		state_class: 'measurement',
		options: BatteryState
	},
	BatteryClass: {
		unit_of_measurement: 'V',
		icon: 'mdi:car-battery',
		device_class: 'voltage',
		state_class: 'measurement'
	},
	BatteryVoltage: {
		unit_of_measurement: 'V',
		icon: 'mdi:current-dc',
		device_class: 'voltage',
		state_class: 'measurement'
	},
	BatteryCurrent: {
		unit_of_measurement: 'A',
		icon: 'mdi:current-dc',
		device_class: 'current',
		state_class: 'measurement'
	},
	BatteryPower: {
		unit_of_measurement: 'Wh',
		icon: 'mdi:home-battery',
		device_class: 'energy',
		state_class: 'total_increasing'
	},
	BatteryTemperature: {
		unit_of_measurement: '°C',
		icon: 'mdi:thermometer',
		device_class: 'temperature',
		state_class: 'measurement'
	},
	BatterySocPercent: {
		unit_of_measurement: '%',
		icon: 'mdi:battery-medium',
		device_class: 'battery',
		state_class: 'measurement'
	},
	GridCharge: {
		unit_of_measurement: '',
		icon: 'mdi:transmission-tower',
		device_class: 'enum',
		state_class: 'measurement',
	},
	GridState: {
		unit_of_measurement: '',
		icon: 'mdi:transmission-tower',
		device_class: 'enum',
		state_class: 'measurement',
		options: GridState
	},
	GridVoltage: {
		unit_of_measurement: 'V',
		icon: 'mdi:current-ac',
		device_class: 'voltage',
		state_class: 'measurement'
	},
	GridPower: {
		unit_of_measurement: 'Wh',
		icon: 'mdi:transmission-tower',
		device_class: 'energy',
		state_class: 'total_increasing'
	},
	GridFrequency: {
		unit_of_measurement: 'Hz',
		icon: 'mdi:sine-wave',
		device_class: 'frequency',
		state_class: 'measurement'
	},
	L1Voltage: {
		unit_of_measurement: 'V',
		icon: 'mdi:current-ac',
		device_class: 'voltage',
		state_class: 'measurement'
	},
	L1Current: {
		unit_of_measurement: 'A',
		icon: 'mdi:current-ac',
		device_class: 'current',
		state_class: 'measurement'
	},
	L1Power: {
		unit_of_measurement: 'Wh',
		icon: 'mdi:current-ac',
		device_class: 'power',
		state_class: 'measurement'
	},
	L1VoltageCurrent: {
		unit_of_measurement: 'VA',
		icon: 'mdi:lightbulb-on-outline',
		device_class: 'apparent_power',
		state_class: 'measurement'
	},
	L1LoadPercent: {
		unit_of_measurement: '%',
		icon: 'mdi:power-plug',
		device_class: 'power_factor',
		state_class: 'measurement'
	},
	L2Voltage: {
		unit_of_measurement: 'V',
		icon: 'mdi:current-ac',
		device_class: 'voltage',
		state_class: 'measurement'
	},
	L2Current: {
		unit_of_measurement: 'A',
		icon: 'mdi:current-ac',
		device_class: 'current',
		state_class: 'measurement'
	},
	L2Power: {
		unit_of_measurement: 'Wh',
		icon: 'mdi:current-ac',
		device_class: 'power',
		state_class: 'measurement'
	},
	L2VoltageCurrent: {
		unit_of_measurement: 'VA',
		icon: 'mdi:lightbulb-on-outline',
		device_class: 'apparent_power',
		state_class: 'measurement'
	},
	L2LoadPercent: {
		unit_of_measurement: '%',
		icon: 'mdi:power-plug',
		device_class: 'power_factor',
		state_class: 'measurement'
	},
	OutputVoltage: {
		unit_of_measurement: 'V',
		icon: 'mdi:current-ac',
		device_class: 'voltage',
		state_class: 'measurement'
	},
	OutputFrequency: {
		unit_of_measurement: 'Hz',
		icons: 'mdi:sine-wave',
		device_class: 'frequency',
		state_class: 'measurement'
	},
	OutputPower: {
		unit_of_measurement: 'Wh',
		icon: 'mdi:power-plug',
		device_class: 'energy',
		state_class: 'total_increasing'
	},
	OutputVoltageCurrent: {
		unit_of_measurement: 'VC',
		icon: 'mdi:power-plug',
		device_class: 'current',
		state_class: 'measurement'
	},
	OutputLoadPercent: {
		unit_of_measurement: '%',
		icon: 'mdi:power-plug',
		device_class: 'power_factor',
		state_class: 'measurement'
	},
};

exports.WorkState = WorkState;
exports.BuzzerState = BuzzerState;
exports.BatteryState = BatteryState;
exports.GridState = GridState;
exports.FaultCodes = FaultCodes;
exports.Values = Values;
exports.ValuesConfig = ValuesConfig;