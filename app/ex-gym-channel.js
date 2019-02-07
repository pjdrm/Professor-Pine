"use strict";

const Gym = require('./gym'),
  Helper = require('./helper'),
  Raid = require('./raid');

class ExGymChannel {
  constructor() {
  }

  initialize() {
    Helper.client.on('raidCreated', (raid, reportingMemberId) => {
      const gym = Gym.getGym(raid.gymId);

      if ((gym.hasHostedEx || gym.hasExTag) && !raid.isExclusive) {
        return raid.createPotentialExRaidMessage();
      } else {
        return false;
      }
    });
  }
}

module.exports = new ExGymChannel();