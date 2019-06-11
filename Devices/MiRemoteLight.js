let Service, Characteristic;

MiRemoteLight = function(platform, config) {
  const {ip} = config;
  this.platform = platform;
  this.config = config;
  this.platform.log.debug(`[MiRemoteLight]Initializing MiRemoteLight: ${ip}`);
  return new MiRemoteLightService(this);
};

class MiRemoteLightService {
  constructor({config, platform}) {
    const {Name, token, data, ip} = config;
    this.name = Name;
    this.token = token;
    this.data = data;
    this.platform = platform;
    this.readydevice = false;
    this.device = dThis.platform.getMiioDevice({address: ip, token}, this);
    Service = platform.HomebridgeAPI.hap.Service;
    Characteristic = platform.HomebridgeAPI.hap.Characteristic;
    this.onoffstate = false;
    this.brightness = 100;
  }

  getServices() {
    const self = this;
    const serialNumber = this.token.substring(this.token.length - 8);
    const infoService = new Service.AccessoryInformation();
    infoService
      .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
      .setCharacteristic(Characteristic.Model, "MiIRRemote-Light")
      .setCharacteristic(Characteristic.SerialNumber, serialNumber);

    const MiRemoteLightServices = new Service.Lightbulb(this.name);
    const MiRemoteLightServicesCharacteristic = MiRemoteLightServices.getCharacteristic(Characteristic.On);
    MiRemoteLightServicesCharacteristic.on(
      "set",
      function(value, callback) {
        if (this.readydevice) {
          if (this.onoffstate === "on" && value) {
            self.platform.log.debug("[" + this.name + "]Light: Already On");
            callback(null);
          } else if (this.onoffstate === "off" && value) {
            this.onoffstate = value ? "on" : "off";
            this.device
              .call("miIO.ir_play", {freq: 38400, code: this.data["100"]})
              .then(() => {
                self.platform.log.debug(`[${this.name}]Light: 100`);
                callback(null);
              })
              .catch(function(err) {
                self.platform.log.error(`[ERROR]Light Error: ${err}`);
                callback(err);
              });
          } else {
            this.onoffstate = value ? "on" : "off";
            this.device
              .call("miIO.ir_play", {freq: 38400, code: this.data["off"]})
              .then(() => {
                self.platform.log.debug(`[${this.name}]Light: Off`);
                callback(null);
              })
              .catch(function(err) {
                self.platform.log.error(`[ERROR]Light Error: ${err}`);
                callback(err);
              });
          }
        } else {
          self.platform.log.info(`[${this.name}]Light: Unready`);
          callback(null);
        }
      }.bind(this)
    ).on(
      "get",
      function(callback) {
        callback(null, this.onoffstate);
      }.bind(this)
    );
    MiRemoteLightServices.addCharacteristic(Characteristic.Brightness)
      .on(
        "get",
        function(callback) {
          callback(null, this.brightness);
        }.bind(this)
      )
      .on(
        "set",
        function(value, callback) {
          var brightne;
          if (this.data[value]) {
            this.brightness = brightne = value;
          } else if (value === 0) {
            this.brightness = 0;
            brightne = "off";
          } else {
            var min = 0;
            var max = 100;
            for (let i = value; i > 0; i--) {
              if (this.data[i]) {
                min = i;
                i = -1;
              }
            }
            for (let i = value; i <= 100; i++) {
              if (this.data[i]) {
                max = i;
                i = 101;
              }
            }
            if (min > 0 && max < 100) {
              vmin = value - min;
              vmax = max - value;
              this.brightness = brightne = vmin > vmax ? min : max;

              self.platform.log.error(
                `[${this.name}]Light: Illegal Brightness, Unisset: ${value} Use ${brightne} instead`
              );
            } else {
              this.brightness = brightne = 100;
              self.platform.log.error(
                `[${this.name}]Light: Illegal Brightness, Unisset: ${value} Use ${brightne} instead`
              );
            }
          }
          if (this.readydevice) {
            this.device
              .call("miIO.ir_play", {freq: 38400, code: this.data[brightne]})
              .then(() => {
                self.platform.log.debug("[" + this.name + "]Light: Set to " + this.brightness);
                callback(null, this.brightness);
              })
              .catch(function(err) {
                self.platform.log.error(`[${this.name}][ERROR]Light Error: ${err}`);
                callback(err);
              });
          } else {
            self.platform.log.info(`[${this.name}]Light: Unready`);
            callback(null);
          }
        }.bind(this)
      );
    return [infoService, MiRemoteLightServices];
  }
}
