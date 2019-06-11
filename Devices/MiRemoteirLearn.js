let Service, Characteristic;

MiRemoteirLearn = function(platform, config) {
  const {ip} = config;
  this.platform = platform;
  this.config = config;
  this.platform.log.debug(`[irLearn][DEBUG]Initializing learn: ${ip}`);
  return new MiRemoteirLearnButton(this);
};

class MiRemoteirLearnButton {
  constructor({config, platform}) {
    const {token, ip} = config;
    this.name = "MiLearn";
    this.token = token;
    this.platform = platform;

    this.readydevice = false;

    this.device = dThis.platform.getMiioDevice({address: ip, token}, this);

    Service = platform.HomebridgeAPI.hap.Service;
    Characteristic = platform.HomebridgeAPI.hap.Characteristic;

    this.updatetimere = false;
    this.timer;
    this.upt;
    this.MiRemoteirLearnService;
    this.timekey;
  }

  getServices() {
    const serialNumber = this.token.substring(this.token.length - 8);
    const infoService = new Service.AccessoryInformation();
    infoService
      .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
      .setCharacteristic(Characteristic.Model, "ChuangMi IR Remote")
      .setCharacteristic(Characteristic.SerialNumber, serialNumber);

    const MiRemoteirLearnButtonService = (this.MiRemoteirLearnService = new Service.Switch(this.name));
    const MiRemoteirLearnButtonOnCharacteristic = MiRemoteirLearnButtonService.getCharacteristic(Characteristic.On);
    MiRemoteirLearnButtonOnCharacteristic.on(
      "set",
      function(value, callback) {
        this.platform.log.info("[irLearn] Learn Started");
        if (value === true) {
          this.updatetimere = true;
          this.upt = 5;
          this.updateTimer();
        }
        callback(null);
      }.bind(this)
    ).on(
      "get",
      function(callback) {
        callback(null, false);
      }.bind(this)
    );

    return [infoService, MiRemoteirLearnButtonService];
  }

  updateTimer() {
    if (this.updatetimere && this.readydevice) {
      clearTimeout(this.timer);
      this.timer = setTimeout(
        function() {
          this.runTimer();
          this.updateTimer();
        }.bind(this),
        1 * 1000
      );
    } else {
      this.platform.log.info("[irLearn] Learn Failed, Status Unready");
      setTimeout(
        function() {
          this.MiRemoteirLearnService.getCharacteristic(Characteristic.On).updateValue(false);
        }.bind(this),
        3 * 100
      );
    }
  }

  runTimer() {
    const self = this;
    this.upt = this.upt - 1;
    if (this.upt <= 0) {
      this.updatetimere = false;
      this.MiRemoteirLearnService.getCharacteristic(Characteristic.On).updateValue(false);
      self.platform.log.info("[irLearn] Learn Stopped");
    } else {
      this.timekey = "123456789012345";
      if (this.upt == 4) {
        this.device
          .call("miIO.ir_learn", {key: this.timekey})
          .then(() => {
            self.platform.log.info("[irLearn]irLearn Waiting...");
          })
          .catch(function(err) {
            if (err == "Error: Call to device timed out") {
              self.platform.log.debug("[ERROR]irLearn - Remote Offline");
            } else {
              self.platform.log.debug(`[irLearn][ERROR] Error: ${err}`);
            }
          });
      } else {
        this.device
          .call("miIO.ir_read", {key: this.timekey})
          .then(result => {
            if (result["code"] !== "") {
              self.platform.log.info(`[irLearn]Learned Code: ${result["code"]}`);
              this.updatetimere = false;
              this.upt = 0;
              this.MiRemoteirLearnService.getCharacteristic(Characteristic.On).updateValue(false);
              self.platform.log.info("[irLearn] Learn Success!");
            } else {
              self.platform.log.debug("[irLearn][DEBUG]Learn Waiting...");
            }
          })
          .catch(function(err) {
            if (err === "Error: Call to device timed out") {
              self.platform.log.debug("[ERROR]irLearn - Remote Offline");
            } else {
              self.platform.log.error(`[irLearn][ERROR] Error: ${err}`);
            }
            callback(err);
          });
      }
      self.platform.log.debug(`[irLearn] ${this.upt} Seconds left`);
    }
  }
}
