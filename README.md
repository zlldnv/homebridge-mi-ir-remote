# homebridge-mi-ir-remote
[![npm version](https://badge.fury.io/js/homebridge-mi-ir-remote.svg)](https://badge.fury.io/js/homebridge-mi-ir-remote)

ChuangMi IR Remote plugin for HomeBridge.   

欢迎加入我们的QQ群 545171648 讨论  
QQ Group:545171648  
Telegram Group: https://t.me/joinchat/EujYfA-JKSwpRlXURD1t6g

## Installation
1. Install HomeBridge, please follow it's [README](https://github.com/nfarina/homebridge/blob/master/README.md).   
If you are using Raspberry Pi, please read [Running-HomeBridge-on-a-Raspberry-Pi](https://github.com/nfarina/homebridge/wiki/Running-HomeBridge-on-a-Raspberry-Pi).   
如果你能阅读中文,你可以阅读 [homebridge非官方安装指南](https://homekit.loli.ren).
2. Make sure you can see HomeBridge in your iOS devices, if not, please go back to step 1.   
3. Install packages.   
4. Install Plugin.

## Supported Types
1.Switch  
2.LightBulb  
3.Projector  
4.Airconditioner  
5.Custom  
6.MomentarySwitch

##
U should active MiLearn from Home app then try to learn each command manually.  
At the meantime, you are supposed to see the command string come out in the HomeBridge console.  
Just like:   
[10/27/2017, 2:39:35 AM] [ChuangmiIRPlatform] [MiIRRemote][irLearn]Learned Code: Z6WDAC8CAAAIBQAAAggAALsiAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAjAAAAAAAQABAQAAAAAAAAAAAAABAQAAAAEAAAABAAAAAQEAAAEBAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAEBAQAAA=   
Just grab the string then fill it to config file, everything should be working after u restart HomeBridge.  

### Custom is used for multi-commands. when you want to add a lot of commands in one switch, just use custom. Custom's data is just like a switch.add your commands in on/off like the sample-config. Just like:  
 "0": "interval|code"
* Because of the limit of JSON, you have to add "number" as the key of the data.Use it just as the sample below.
* interval means the time to send the command after you press the on/off switch.Use 0 to send immediately.
* interval's unit is second. you can use number like 0.5 if you want to send commands within a second.(I don't suggest you set too much commands in a short time.)

### MomentarySwitch is a switch which will automaticly turn off after you turn on it (0.3s). It is used for some situation like you want to launch a channel on button.

## Installation
1. Install HomeBridge, please follow it's [README](https://github.com/nfarina/homebridge/blob/master/README.md).   
If you are using Raspberry Pi, please read [Running-HomeBridge-on-a-Raspberry-Pi](https://github.com/nfarina/homebridge/wiki/Running-HomeBridge-on-a-Raspberry-Pi).   
2. Make sure you can see HomeBridge in your iOS devices, if not, please go back to step 1.   
3. Install packages.   
```
npm install -g miio homebridge-mi-ir-remote
```
## Configuration
```
"platforms": [
    {
        "platform": "ChuangmiIRPlatform",
        "hidelearn": false,
        "learnconfig":{
            "ip": "192.168.31.xx",
            "token": "xxxxxxx"
        },
        "deviceCfgs": [{
            "type": "Switch",
            "ip": "192.168.31.xx",
            "token": "xxxxxxx",
            "Name": "IR Switch",
            "data": {
                "on" : "xxxxxxx",
                "off": "xxxxxxx"
            }
        },{
            "type": "Projector",
            "ip": "192.168.31.xx",
            "token": "xxxxxxxx",
            "Name": "IR Projector",
            "interval": 1,
            "data": {
                "on" : "xxxxxxxxxxxxx",
                "off": "xxxxxxxxxxxxx"
            }
        },{
            "type": "Light",
            "ip": "192.168.31.xx",
            "token": "xxx",
            "Name": "IR LightBulb",
            "data": {
                "100" : "xxxx",
                "75" : "xxxxx",
                "50" : "xxxxx",
                "25" : "xxxxx",
                "off" : "xxxx"
            }
         },{
            "type": "AirConditioner",
            "ip": "192.168.31.xx",
            "token": "xxx",
            "Name": "IR AC",
            "DefaultTemperature": 25,
            "MinTemperature": 16,
            "MaxTemperature": 30,
            "data": {
                "Cool":{
                    "30" : "xxx",
                    "25" : "xxx",
                    "20" : "xxx",
                    "16" : "xxx"
                },
                "Heat":{
                    "30" : "xxx",
                    "25" : "xxx",
                    "20" : "xxx",
                    "16" : "xxx"
                },
                "off" : "xxxx"
            }
        },{
            "type": "Custom",
            "ip": "192.168.31.xx",
            "token": "xxx",
            "Name": "Custom",
            "data": {
                "on": {
                    "0": "0|xxx",
                    "1": "2|xxx",
                    "2": "5|xxx"
                },
                "off": {
                    "0": "1|xxx"
                }
            }
        },{
                "type": "MomentarySwitch",
                "ip": "192.168.31.xx",
                "token": "xxxx",
                "Name": "Momentary Switch",
                "data": "xxxxxx"
        }]
    }]
```
## Get token
Open command prompt or terminal. Run following command:
```
miio --discover
```
Wait until you get output similar to this:
```
Device ID: xxxxxxxx   
Model info: Unknown   
Address: 192.168.88.xx   
Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx via auto-token   
Support: Unknown   
```
"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" is token.   
If token is "???", then reset device and connect device created Wi-Fi hotspot.   
Run following command:   
```
miio --discover --sync
```
Wait until you get output.  
Or you can try to get Your token from any rootrd android device.  
Details in https://github.com/jghaanstra/com.xiaomi-miio/blob/master/docs/obtain_token.md

## Version Logs  
### 0.1.0
1. Rewrite the plugin and added support for both miio.Device and miio.device.
### 0.0.10
1. Add QQ and Telegram group link
### 0.0.7  
1. Support for MomentarySwitch  
### 0.0.6  
1. Support for custom
### 0.0.1
1. support for Switch and IRlearn.  
