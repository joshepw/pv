const process = require('process');
const mqtt = require('mqtt');
const fs = require('fs');
const ads1x15 = require('ads1x15');
const Config = require('./config');
const Helpers = require('./helpers');
const ModbusRTU = require('modbus-serial');
const Models = require('./models');

const client = mqtt.connect(`mqtt://${Config.MQTT.host}`, {
	username: Config.MQTT.user,
	password: Config.MQTT.pass,
});

const client_status = {
	mqtt_connected: false,
	mbus_connected: false,	
};

/**
 * Send data to services
 * 
 * @param {Models.Values} values 
 */
const onSendData = (values) => {
	Object.keys(Models.ValuesConfig).forEach(key => {
		client.publish(`homeassistant/sensor/must-inverter/${key}`, `${values[key]}`);
	});
};

/**
 * Get ADC converter values 
 */
const readADCValues = async () => {
	const adc = new ads1x15(0x01);
	await adc.openBus(1);

	// measure / 1e3
	const measure_adc_current = (await adc.readSingleEnded({channel: 0})) / 1e3;
	const measure_adc_vcc = (await adc.readSingleEnded({channel: 1})) / 1e3;
	const measure_adc_voltage = (await adc.readSingleEnded({
		channelPositive: 2,
		channelNegative: 3,
	})) / 1e3;

	const voltage = measure_adc_voltage * 100;
	const current = (measure_adc_current - measure_adc_vcc) * 100;
	const power = (voltage * current) / 2;

	return {
		voltage,
		current: current > 1 ? current : 0,
		power: power > 1 ? power : 0
	};
};

/**
 * Connect to serial port
 */
const connectToSerial = () => {
	(async () => {
		const timeout = 10;

		while (!client_status.mbus_connected) {
			try {
				const modbus = new ModbusRTU();
				const interval = 5 * 1000;
	
				if (!fs.existsSync(Config.Serial.port)) {
					throw new Error(`The port is not available, will be try again in ${timeout}s ...`);
				}
		
				console.log(`[MBUS] ${new Date()} - Connected to ${Config.Serial.port}`);
				client_status.mbus_connected = true;
		
				modbus.connectRTUBuffered(Config.Serial.port, Config.Serial.config);
				modbus.setTimeout(timeout * 1000);
				modbus.setID(10);
		
				setInterval(async () => {
					const config = (await modbus.readHoldingRegisters(30000, 27)).data;
					const values = (await modbus.readHoldingRegisters(30030, 30)).data;
					const pv = await readADCValues();
		
					onSendData(new Models.Values(config, values, pv));
				}, interval);
			} catch (error) {
				client_status.mbus_connected = false;
				console.warn(`[MBUS] ${new Date()} - ${error}`);
		
				await Helpers.Sleep(timeout * 1000);
			}
		}
	})();
};

client.on('connect', () => {
	client_status.mqtt_connected = true;
	console.log(`[MQTT] ${new Date()} - Connected to ${Config.MQTT.host}`);

	Object.keys(Models.ValuesConfig).forEach(key => {
		const payload = {
			name: key.split(/(?=[A-Z])/).join(' '),
			unit_of_measurement: Models.ValuesConfig[key][0],
			state_topic: `homeassistant/sensor/must-inverter/${key}`,
			icon: `mdi:${Models.ValuesConfig[key][1]}`
		};

		if (Models.ValuesConfig[key].length > 2) {
			payload.device_class = Models.ValuesConfig[key][2];
			payload.state_class = Models.ValuesConfig[key][3];
		}

		client.publish(`homeassistant/sensor/must-inverter/${key}/config`, JSON.stringify(payload));
	});

	try {
		connectToSerial();
	} catch (e) {
		console.log(e)
	}
});

client.on('close', () => {
	client_status.mqtt_connected = false;
	process.exit(1);
});