var Service,Characteristic;

MiRemoteirLearn = function(platform, config) {
    this.platform = platform;
    this.config = config;

    this.platform.log.debug("[irLearn][DEBUG]Initializing learn: " + this.config["ip"]);
    
    return new MiRemoteirLearnButton(this);
}

MiRemoteirLearnButton = function(dThis) {
    this.name = "MiLearn";
    this.token = dThis.config['token'];
    this.platform = dThis.platform;

    this.readydevice = false;
    var configarray = {
        address: dThis.config['ip'],
        token: dThis.config['token']
    };
    this.device = dThis.platform.getMiioDevice(configarray,this);

    Service = dThis.platform.HomebridgeAPI.hap.Service;
    Characteristic = dThis.platform.HomebridgeAPI.hap.Characteristic;

    this.updatetimere = false;
    this.timer;
    this.upt;
    this.MiRemoteirLearnService;
    this.timekey;
}

MiRemoteirLearnButton.prototype.getServices = function() {
    var that = this;
    var services = [];
    var tokensan = this.token.substring(this.token.length-8);
    var infoService = new Service.AccessoryInformation();
    infoService
        .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
        .setCharacteristic(Characteristic.Model, "ChuangMi IR Remote")
        .setCharacteristic(Characteristic.SerialNumber, tokensan);
    services.push(infoService);
    var MiRemoteirLearnButtonService = this.MiRemoteirLearnService = new Service.Switch(this.name);
    var MiRemoteirLearnButtonOnCharacteristic = MiRemoteirLearnButtonService.getCharacteristic(Characteristic.On);
    MiRemoteirLearnButtonOnCharacteristic
        .on('set',function(value, callback) {
            this.platform.log.info("[irLearn] Learn Started");
            if(value == true){
                this.updatetimere = true;
                this.upt = 5;
                this.updateTimer();
            }            
            callback(null);
        }.bind(this))
        .on('get', function(callback) {
            callback(null, false);
        }.bind(this))
        
    services.push(MiRemoteirLearnButtonService);
    return services;
}

MiRemoteirLearnButton.prototype.updateTimer = function() {
    if (this.updatetimere && this.readydevice) {
        clearTimeout(this.timer);
        this.timer = setTimeout(function() {
            this.runTimer();
            this.updateTimer();
        }.bind(this), 1 * 1000);
    }else{
        this.platform.log.info("[irLearn] Learn Failed, Status Unready");
        setTimeout(function() {
            this.MiRemoteirLearnService.getCharacteristic(Characteristic.On).updateValue(false);
        }.bind(this), 3 * 100);
    }
}

MiRemoteirLearnButton.prototype.runTimer = function() {
    var that = this;
    this.upt = this.upt - 1;
    if(this.upt <= 0){
        this.updatetimere = false;
        this.MiRemoteirLearnService.getCharacteristic(Characteristic.On).updateValue(false);
        that.platform.log.info("[irLearn] Learn Stopped");
    }else{
        this.timekey = "123456789012345";
        if(this.upt == 4){
            this.device.call("miIO.ir_learn", {"key":this.timekey}).then(result => {
                that.platform.log.info("[irLearn]irLearn Waiting...");
            }).catch(function(err) {
                if(err == "Error: Call to device timed out"){
                    that.platform.log.debug("[ERROR]irLearn - Remote Offline");
                }else{
                    that.platform.log.debug("[irLearn][ERROR] Error: " + err);
                }
            });
        }else{
            this.device.call("miIO.ir_read", {"key":this.timekey}).then(result => {
                if(result['code'] !== ""){
                    that.platform.log.info("[irLearn]Learned Code: " + result['code']);
                    this.updatetimere = false;
                    this.upt = 0;
                    this.MiRemoteirLearnService.getCharacteristic(Characteristic.On).updateValue(false);
                    that.platform.log.info("[irLearn] Learn Success!");
                }else{
                    that.platform.log.debug("[irLearn][DEBUG]Learn Waiting...");
                }
            }).catch(function(err) {
                if(err == "Error: Call to device timed out"){
                    that.platform.log.debug("[ERROR]irLearn - Remote Offline");
                }else{
                    that.platform.log.error("[irLearn][ERROR] Error: " + err);
                }
                callback(err);
            });
        }
        that.platform.log.debug("[irLearn] " + this.upt + " Seconds left");
    }
}
