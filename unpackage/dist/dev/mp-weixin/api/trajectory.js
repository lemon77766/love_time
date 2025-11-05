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
function getTrajectoryPoints(params = {}) {
  return utils_http.http.get(utils_config.config.API.TRAJECTORY.POINTS, params);
}
exports.getCurrentLocations = getCurrentLocations;
exports.getTrajectoryPoints = getTrajectoryPoints;
exports.updateLocation = updateLocation;
//# sourceMappingURL=../../.sourcemap/mp-weixin/api/trajectory.js.map
