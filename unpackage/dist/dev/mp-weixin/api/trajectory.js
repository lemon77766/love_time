"use strict";
const utils_http = require("../utils/http.js");
const utils_config = require("../utils/config.js");
function updateLocation(locationData) {
  return utils_http.http.post(utils_config.config.API.TRAJECTORY.LOCATION_UPDATE, {
    latitude: locationData.latitude,
    longitude: locationData.longitude,
    address: locationData.address,
    location_name: locationData.location_name
  });
}
function getCurrentLocations() {
  return utils_http.http.get(utils_config.config.API.TRAJECTORY.LOCATION_CURRENT);
}
function getTrajectoryList(params = {}) {
  const defaultParams = {
    showPartnerOnly: true,
    ...params
  };
  if (params.start_date && params.end_date) {
    delete defaultParams.period;
  } else if (!defaultParams.period) {
    defaultParams.period = "30days";
  }
  return utils_http.http.get(utils_config.config.API.TRAJECTORY.LIST, defaultParams);
}
exports.getCurrentLocations = getCurrentLocations;
exports.getTrajectoryList = getTrajectoryList;
exports.updateLocation = updateLocation;
//# sourceMappingURL=../../.sourcemap/mp-weixin/api/trajectory.js.map
