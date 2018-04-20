/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, new-cap: 0*/
/*eslint-env node, es6 */
"use strict";
var express = require("express");
var async = require("async");

module.exports = function() {
	var app = express.Router();

	//Hello Router
	app.get("/", (req, res) => {
		let output = `Node.js based Controller API Examples</br>
					<a href="${req.baseUrl}/whoAmI">/whoAmI</a> - User Details and Auth Information</br> 
					<a href="${req.baseUrl}/env">/env</a> - Current Application Environment</br> 
					<a href="${req.baseUrl}/org">/org</a> - Current Organization</br> 
					<a href="${req.baseUrl}/space">/space</a> - Current Space</br> 
					<a href="${req.baseUrl}/controller">/controller</a> - Controller API Info</br> 
					<a href="${req.baseUrl}/userinfo">/userinfo</a> - Detailed User Info including Security Context</br> 
					<a href="${req.baseUrl}/info">/info</a> - Controller Info API</br> 
					<a href="${req.baseUrl}/getOrgs">/getOrgs</a> - Controller API: organizations</br> `;
		res.type("text/html").status(200).send(output);
	});

	app.get("/whoAmI", (req, res) => {
		let userContext = req.authInfo;
		let result = JSON.stringify({
			userContext: userContext
		});
		res.type("application/json").status(200).send(result);
	});

	app.get("/env", (req, res) => {
		res.type("application/json").status(200).send(JSON.stringify(process.env));
	});

	app.get("/org", (req, res) => {
		let VCAP = JSON.parse(process.env.VCAP_APPLICATION);
		res.type("application/json").status(200).send(JSON.stringify(VCAP.organization_name));
	});

	app.get("/space", (req, res) => {
		let VCAP = JSON.parse(process.env.VCAP_APPLICATION);
		res.type("application/json").status(200).send(JSON.stringify(VCAP.space_name));
	});

	app.get("/controller", (req, res) => {
		var obj = JSON.parse(process.env.destinations);
		res.type("application/json").status(200).send(JSON.stringify(obj));
	});

	app.get("/userinfo", function(req, res) {
		let xssec = require("@sap/xssec");
		let xsenv = require("@sap/xsenv");
		let accessToken;
		let authWriteScope = false;
		let authReadScope = false;
		let controllerAdminScope = true;
		let userInfo = {
			"name": req.user.id,
			"familyName": req.user.name.familyName,
			"emails": req.user.emails,
			"scopes": [],
			"identity-zone": req.authInfo.identityZone
		};
		accessToken = require(global.__base + "utils/auth").getAccessToken(req);
		let uaa = xsenv.getServices({
			uaa: {
				tag: "xsuaa"
			}
		}).uaa;
		xssec.createSecurityContext(accessToken, uaa, function(error, securityContext) {
			if (error) {
				console.log("Security Context creation failed");
				return;
			}
			console.log("Security Context created successfully");
			userInfo.scopes = securityContext.scopes;
			console.log("Scope checked successfully");
		});

		res.status(200).json(userInfo);
	});

	app.get("/info", (req, res) => {
		let request = require("request");
		let options = {
			url: global.__controller + "/v2/info"
		};
		request.get(
			options,
			function(error, response, body) {
				if (error) {
					console.log(error.toString());
					res.type("text/html").status(200).send(error.toString());
					return;
				}
				res.type("application/json").status(200).send(body);
			}
		);
	});

	app.get("/getOrgs", (req, res) => {
		let request = require("request");
		var options = {
			method: "GET",
			json: true,
			url: global.__controller + "/v2/organizations",				
			auth: {}
		};
		options.auth.bearer = require(global.__base + "utils/auth").getAccessToken(req);
		request.get(
			options,
			function(error, response, body) {
				if (error) {
					console.log(error.toString());
					res.type("text/html").status(200).send(error.toString());
					return;
				}
				res.type("application/json").status(200).send(body);
			}
		);
	});

	return app;
};