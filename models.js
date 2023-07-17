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
		
		this.PvState = pv.power > 2 ? PvState[0] : PvState[2];

		if (pv.voltage > 5) {
			this.PvState = PvState[1];
		}

		this.PvVoltage = pv.voltage;
		this.PvCurrent = pv.current;
		this.PvPower = pv.power;

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
		this.OutputFrecuency = Helpers.ParseValue(values[17], 0.1);
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
	DeviceRadiatorTemperature: ['oC', 'thermometer'],
	DeviceTransformerTemperature: ['oC', 'thermometer'],
	DeviceBuzzerState: ['', 'bullhorn'],
	DeviceSystemFault: ['', 'alert-circle-outline'],
	PvState: ['', 'solar-panel'],
	PvVoltage: ['Vdc', 'current-dc'],
	PvCurrent: ['Adc', 'current-dc'],
	PvPower: ['Wh', 'solar-power'],
	BatteryState: ['', 'car-battery'],
	BatteryClass: ['', 'car-battery'],
	BatteryVoltage: ['Vdc', 'current-dc'],
	BatteryCurrent: ['Adc', 'current-dc'],
	BatteryPower: ['Wh', 'current-dc'],
	BatteryTemperature: ['oC', 'thermometer'],
	BatterySocPercent: ['%', 'battery-medium'],
	GridCharge: ['', 'transmission-tower'],
	GridState: ['', 'transmission-tower'],
	GridVoltage: ['Vac', 'current-ac'],
	GridFrequency: ['Hz', 'sine-wave'],
	L1Voltage: ['Vac', 'current-ac'],
	L1Current: ['Aac', 'current-ac'],
	L1Power: ['Wh', 'current-ac'],
	L1VoltageCurrent: ['VA', 'lightbulb-on-outline'],
	L1LoadPercent: ['%', 'power-plug'],
	L2Voltage: ['', 'current-ac'],
	L2Current: ['', 'current-ac'],
	L2Power: ['Wh', 'current-ac'],
	L2VoltageCurrent: ['VA', 'lightbulb-on-outline'],
	L2LoadPercent: ['%', 'power-plug'],
	OutputVoltage: ['Vac', 'current-ac'],
	OutputFrecuency: ['Hz', 'sine-wave'],
	OutputPower: ['Wh', 'current-ac'],
	OutputVoltageCurrent: ['VC', 'power-plug'],
	OutputLoadPercent: ['%', 'power-plug'],
};

exports.WorkState = WorkState;
exports.BuzzerState = BuzzerState;
exports.BatteryState = BatteryState;
exports.GridState = GridState;
exports.FaultCodes = FaultCodes;
exports.Values = Values;
exports.ValuesConfig = ValuesConfig;