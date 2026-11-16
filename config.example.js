/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
// Product settings for HideSecrets: EXAMPLE, for an invented product called "Nimbus Hub".
//
// HideSecrets works without any settings. They only make it recognize the product you install:
// copy this file to config.local.js next to index.html and put your own values in it.
// config.local.js is ignored by git: keep it out of any public repository.
// The tests (tests/verify.js) use this example file.
var HIDESECRETS_CONFIG = {
  // The product's host names follow <service>.<vendor>.<customer domain>,
  // for example hub.nimbus.example-customer.test: the customer part gets its own checkbox
  vendor: 'nimbus',
  services: ['hub', 'api', 'auth', 'files'],
  // Configuration variables whose value is <vendor>.<customer domain>
  domainVariables: ['NIMBUS_DOMAIN'],
  // The product's own public domains (download site, image registry): they identify no customer and stay visible
  publicDomains: ['nimbus-cloud.test'],
  // Generic account and machine names used when installing the product: "nimbus@nimbus" stays visible
  genericNames: ['nimbus'],
  // Internal endings that are not on the usual list (.corp, .intranet…): their domains are masked like the others
  extraTlds: ['intranet'],
  // Words to mask wherever they appear: project, customer or site names in comments and free text
  terms: ['project-aurora']
};
