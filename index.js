require("./Devices/MiRemoteirLearn");
require("./Devices/MiRemoteSwitch");
require("./Devices/MiRemoteCustom");
require("./Devices/MiRemoteLight");
require("./Devices/MiRemoteProjector");
require("./Devices/MiRemoteAirConditioner");
require("./Devices/MiRemoteMomentarySwitch");

const miio = require("miio");
const {version} = require("./package.json");

let HomebridgeAPI;

function checkPlatformConfig(homebridge, platform) {
  const configJSON = require(homebridge.user.configPath());
  const {platforms} = configJSON;
  for (const i in platforms) {
    if (platforms[i].platform === platform) {
      return true;
    }
  }
  return false;
}

module.exports = function(homebridge) {
  if (!checkPlatformConfig(homebridge, "ChuangmiIRPlatform")) {
    return;
  }

  HomebridgeAPI = homebridge;

  HomebridgeAPI.registerPlatform("homebridge-mi-ir-remote", "ChuangmiIRPlatform", ChuangmiIRPlatform, true);
};

class ChuangmiIRPlatform {
  constructor(log, config, api) {
    if (config == null) {
      return;
    }
    this.HomebridgeAPI = HomebridgeAPI;
    this.log = log;
    this.config = config;
    this.api = api;

    this.api.on(
      "didFinishLaunching",
      function() {
        this.log.info("Done!");
      }.bind(this)
    );

    this.log.info("Loading v%s ", version);
  }

  accessories(callback) {
    const LoadedAccessories = [];
    if (this.config.hidelearn == false) {
      LoadedAccessories.push(new MiRemoteirLearn(this, this.config.learnconfig));
    }
    const {deviceCfgs} = this.config;

    if (deviceCfgs instanceof Array) {
      for (let i = 0; i < deviceCfgs.length; i++) {
        const deviceCfg = deviceCfgs[i];
        if (
          deviceCfg.type == null ||
          deviceCfg.type == "" ||
          deviceCfg.token == null ||
          deviceCfg.token == "" ||
          deviceCfg.ip == null ||
          deviceCfg.ip == ""
        ) {
          continue;
        }

        switch (deviceCfg.type) {
          case "Switch":
            LoadedAccessories.push(new MiRemoteSwitch(this, deviceCfg));
            break;
          case "Light":
            LoadedAccessories.push(new MiRemoteLight(this, deviceCfg));
            break;
          case "Projector":
            LoadedAccessories.push(new MiRemoteProjector(this, deviceCfg));
            break;
          case "AirConditioner":
            LoadedAccessories.push(new MiRemoteAirConditioner(this, deviceCfg));
            break;
          case "Custom":
            LoadedAccessories.push(new MiRemoteCustom(this, deviceCfg));
            break;
          case "MomentarySwitch":
            LoadedAccessories.push(new MiRemoteMomentarySwitch(this, deviceCfg));
            break;
          default:
            this.log.error(`device type: ${deviceCfg.type}Unexist!`);
            break;
        }
      }
      this.log.info(`Loaded accessories: ${LoadedAccessories.length}`);
    }

    callback(LoadedAccessories);
  }

  getMiioDevice(configarray, dthat) {
    let device = "";
    const that = this;
    try {
      device = new miio.Device(configarray);
      dthat.device = device;
      dthat.readydevice = true;
      this.log.debug("Uppercase Success！");
      return device;
    } catch (e) {
      this.log.debug("Uppercase failed");
    }
    try {
      device = new miio.device(configarray).then(function(device) {
        dthat.readydevice = true;
        dthat.device = device;
        that.log.debug(`Linked To ${configarray.address}`);
      });
      this.log.debug("Lowercase Success！");
    } catch (e) {
      this.log.debug("Lowercase failed");
    }
  }
}
