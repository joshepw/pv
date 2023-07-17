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
		this.DeviceSystemFault = FaultCodes[config[21]];
		
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
		this.BatteryPower = this.BatteryVoltage * this.BatteryCurrent;
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
	DeviceWorkState: ['', 'state-machine'],
	DeviceMachineType: ['', 'power-plug-battery-outline'],
	DeviceSoftwareVersion: ['', 'counter'],
	DeviceRatedPower: ['Wh', 'lightbulb-outline'],
	DeviceRadiatorTemperature: ['°C', 'thermometer', 'temperature', 'measurement'],
	DeviceTransformerTemperature: ['°C', 'thermometer', 'temperature', 'measurement'],
	DeviceBuzzerState: ['', 'bullhorn'],
	DeviceSystemFault: ['', 'alert-circle-outline'],
	PvState: ['', 'solar-panel'],
	PvVoltage: ['Vdc', 'current-dc', 'voltage', 'measurement'],
	PvCurrent: ['Adc', 'current-dc', 'current', 'measurement'],
	PvPower: ['Wh', 'solar-power', 'power', 'measurement'],
	BatteryState: ['', 'car-battery'],
	BatteryClass: ['', 'car-battery'],
	BatteryVoltage: ['Vdc', 'current-dc', 'voltage', 'measurement'],
	BatteryCurrent: ['Adc', 'current-dc', 'current', 'measurement'],
	BatteryPower: ['Wh', 'current-dc', 'power', 'measurement'],
	BatteryTemperature: ['°C', 'thermometer', 'temperature', 'measurement'],
	BatterySocPercent: ['%', 'battery-medium'],
	GridCharge: ['', 'transmission-tower'],
	GridState: ['', 'transmission-tower'],
	GridVoltage: ['Vac', 'current-ac', 'voltage', 'measurement'],
	GridPower: ['Wh', 'current-ac', 'power', 'measurement'],
	GridFrequency: ['Hz', 'sine-wave', 'frequency', 'measurement'],
	L1Voltage: ['Vac', 'current-ac', 'voltage', 'measurement'],
	L1Current: ['Aac', 'current-ac', 'current', 'measurement'],
	L1Power: ['Wh', 'current-ac', 'power', 'measurement'],
	L1VoltageCurrent: ['VA', 'lightbulb-on-outline', 'apparent_power', 'measurement', 'current', 'measurement'],
	L1LoadPercent: ['%', 'power-plug', 'power_factor', 'measurement'],
	L2Voltage: ['', 'current-ac', 'voltage', 'measurement'],
	L2Current: ['', 'current-ac', 'current', 'measurement'],
	L2Power: ['Wh', 'current-ac', 'power', 'measurement'],
	L2VoltageCurrent: ['VA', 'lightbulb-on-outline', 'apparent_power', 'measurement', 'current', 'measurement'],
	L2LoadPercent: ['%', 'power-plug', 'power_factor', 'measurement'],
	OutputVoltage: ['Vac', 'current-ac', 'voltage', 'measurement'],
	OutputFrequency: ['Hz', 'sine-wave', 'frequency', 'measurement'],
	OutputPower: ['Wh', 'current-ac', 'power', 'measurement'],
	OutputVoltageCurrent: ['VC', 'power-plug', 'current', 'measurement'],
	OutputLoadPercent: ['%', 'power-plug', 'power_factor', 'measurement'],
};

exports.WorkState = WorkState;
exports.BuzzerState = BuzzerState;
exports.BatteryState = BatteryState;
exports.GridState = GridState;
exports.FaultCodes = FaultCodes;
exports.Values = Values;
exports.ValuesConfig = ValuesConfig;