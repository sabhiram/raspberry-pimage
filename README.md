# Raspberry PiMage

[![Build Status](https://travis-ci.org/sabhiram/raspberry-pimage.svg?branch=master)](https://travis-ci.org/sabhiram/raspberry-pimage) [![Coverage Status](https://img.shields.io/coveralls/sabhiram/raspberry-pimage.svg)](https://coveralls.io/r/sabhiram/raspberry-pimage?branch=master)

A node.js camera control interface for the Raspberry Pi

# Ingredients

#### Raspberry Pi + Camera Module

Get the pi booting whatever raspbian image you want to run. Connect the camera module to the pi and enable it.

[See this link for more detail](http://www.raspberrypi.org/help/camera-module-setup/)

#### Install NodeJS (and node-gyp)

This is just a sample install script, adjust version to taste...

```sh
sudo wget http://nodejs.org/dist/v0.10.2/node-v0.10.2-linux-arm-pi.tar.gz
sudo tar -xvzf node-v0.10.2-linux-arm-pi.tar.gz
sudo rm node-v0.10.2-linux-arm-pi.tar.gz
echo "... and gyp"
sudo /home/pi/node-v0.10.2-linux-arm-pi/bin/npm install -g node-gyp

sudo ln -s /home/pi/node-v0.10.2-linux-arm-pi/bin/node /usr/bin/node
sudo ln -s /home/pi/node-v0.10.2-linux-arm-pi/bin/npm /usr/bin/npm
sudo ln -s /home/pi/node-v0.10.2-linux-arm-pi/bin/node-gyp /usr/bin/node-gyp
```

#### Install git

```sh
sudo apt-get install git -y
```

# Installation

Now the easy part... from the pi:

```sh
git clone https://github.com/sabhiram/raspberry-pimage
cd raspberry-pimage
npm update
npm start
```

# Running Tests

As of recent versions of `npm`, the `npm update` command seems to also fetch any dev dependencies. This allows us to follow the above installation steps and simply type:

```sh
npm test
```
