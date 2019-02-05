const JSE = global.JSE;
const express = require('express');

const router = express.Router();

const fs = require('fs');
const jseAds = require("./../modules/ads.js");

/**
 * @name /advertising/uploadcampaign/*
 * @description Setup a new advertising campaign or edit an existing one
 * @memberof module:jseRouter
 */
router.post('/uploadcampaign/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error advertising.js 12. No Session Variable Supplied"}'); return false; }
	const session = req.body.session; // No need to cleanString because it's only used for comparison
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
		if (goodCredentials) {
			const campaign = {};
			campaign.name = JSE.jseFunctions.cleanString(req.body.name);
			campaign.geos = req.body.geos.map((geo) => { return JSE.jseFunctions.cleanString(geo); });
			campaign.devices = Boolean(req.body.devices);
			campaign.windowsDesktop = Boolean(req.body.windowsDesktop);
			campaign.macDesktop = Boolean(req.body.macDesktop);
			campaign.androidTablet = Boolean(req.body.androidTablet);
			campaign.ipad = Boolean(req.body.ipad);
			campaign.androidPhone = Boolean(req.body.androidPhone);
			campaign.iphone = Boolean(req.body.iphone);
			campaign.other = Boolean(req.body.other);
			campaign.browsers = Boolean(req.body.browsers);
			campaign.chrome = Boolean(req.body.chrome);
			campaign.firefox = Boolean(req.body.firefox);
			campaign.safari = Boolean(req.body.safari);
			campaign.ucbrowser = Boolean(req.body.ucbrowser);
			campaign.opera = Boolean(req.body.opera);
			campaign.edge = Boolean(req.body.edge);
			campaign.ie = Boolean(req.body.ie);
			campaign.category = Boolean(req.body.category);
			campaign.general = Boolean(req.body.general);
			campaign.crypto = Boolean(req.body.crypto);
			campaign.streaming = Boolean(req.body.streaming);
			campaign.adult = Boolean(req.body.adult);
			campaign.domains = Boolean(req.body.domains);
			campaign.domainWhitelist = JSE.jseFunctions.cleanString(req.body.domainWhitelist);
			campaign.domainBlacklist = JSE.jseFunctions.cleanString(req.body.domainBlacklist);
			campaign.publishers = Boolean(req.body.publishers);
			campaign.publisherWhitelist = JSE.jseFunctions.cleanString(req.body.publisherWhitelist);
			campaign.publisherBlacklist = JSE.jseFunctions.cleanString(req.body.publisherBlacklist);
			campaign.url = JSE.jseFunctions.cleanString(req.body.url);
			campaign.currencyJse = Boolean(req.body.currencyJse);
			campaign.currencyUsd = Boolean(req.body.currencyUsd);
			campaign.dailyBudget = JSE.jseFunctions.cleanString(req.body.dailyBudget);
			//campaign.lifetimeBudget = JSE.jseFunctions.cleanString(req.body.lifetimeBudget);
			campaign.bidPrice = JSE.jseFunctions.cleanString(req.body.bidPrice);
			campaign.start = JSE.jseFunctions.cleanString(req.body.start);
			campaign.end = JSE.jseFunctions.cleanString(req.body.end);
			//campaign.frequencyCap = JSE.jseFunctions.cleanString(req.body.frequencyCap);
			campaign.uid = goodCredentials.uid;
			if (req.body.cid && JSE.jseFunctions.cleanString(req.body.cid) !== '0') {
				// modify existing campaign
				campaign.cid = JSE.jseFunctions.cleanString(req.body.cid);
				campaign.paused = false;
				campaign.disabled = 'pending'; // may need an async lookup here
				campaign.archived = false;
			} else {
				const newDate = new Date().getTime();
				const random = Math.floor((Math.random() * 9999) + 1); // setting up a firebase style push variable, timestamp+random
				campaign.cid = String(newDate) +''+ String(random); // Campaign ID
				campaign.paused = false; // user paused
				campaign.disabled = 'pending'; // admin disabled (budgets etc)
				campaign.archived = false;
			}
			campaign.banners = [];
			Object.keys(req.body.creatives).forEach((imgRef) => {
				let base64Data;
				let fileName = false;
				const size = req.body.creatives[imgRef].size;
				const originalFileName = JSE.jseFunctions.cleanString(req.body.creatives[imgRef].originalFileName);
				if (size === '300x100' || size === '728x90' || size === '300x250') {
					if (/^data:image\/png;base64,/.test(req.body.creatives[imgRef].src)) {
						base64Data = req.body.creatives[imgRef].src.replace(/^data:image\/png;base64,/, "");
						fileName = goodCredentials.uid+'_'+campaign.cid+'_'+imgRef+'.png';
					} else if (/^data:image\/gif;base64,/.test(req.body.creatives[imgRef].src)) {
						base64Data = req.body.creatives[imgRef].src.replace(/^data:image\/gif;base64,/, "");
						fileName = goodCredentials.uid+'_'+campaign.cid+'_'+imgRef+'.gif';
					} else if (/^data:image\/jpeg;base64,/.test(req.body.creatives[imgRef].src)) {
						base64Data = req.body.creatives[imgRef].src.replace(/^data:image\/jpeg;base64,/, "");
						fileName = goodCredentials.uid+'_'+campaign.cid+'_'+imgRef+'.jpg';
					}
					if (fileName) {
						if (base64Data.length < 250000) {
							JSE.jseDataIO.storeFile('adx',fileName,base64Data,'base64');
							campaign.banners.push({ fileName, size, originalFileName, paused: false, disabled: 'pending' });
						} else {
							console.log("Error advertising.js 40. File size too large");
						}
					} else	if (/(adx.jsecoin.com|localhost)/.test(req.body.creatives[imgRef].src)) {
						const fileNameSplit = req.body.creatives[imgRef].src.split('/');
						fileName = fileNameSplit[fileNameSplit.length - 1];
						campaign.banners.push({ fileName, size, originalFileName, paused: false, disabled: 'pending' });
					}
				} else {
					// inText creatives here?
					console.log("Error advertising.js 44. Unrecognized file size detected");
				}
			});

			//fs.writeFileSync('./campaign1.json', JSON.stringify(campaign) , 'utf-8');
			JSE.jseDataIO.setVariable('adxCampaigns/'+goodCredentials.uid+'/'+campaign.cid,campaign);

			res.send('{"success":1,"notification":"Campaign has been successfully submitted"}');
		}
	}, function() {
		res.status(401).send('{"fail":1,"notification":"Error advertising.js 19. Invalid Session Variable"}'); return false;
	});
	return false;
});

/**
 * @name /advertising/pausecampaign/*
 * @description Pause Campaign
 * @memberof module:jseRouter
 */
router.post('/pausecampaign/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error advertising.js 118. No Session Variable Supplied"}'); return false; }
	const session = req.body.session; // No need to cleanString because it's only used for comparison
	const cid = JSE.jseFunctions.cleanString(req.body.cid);
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
		if (goodCredentials) {
			JSE.jseDataIO.setVariable('adxCampaigns/'+goodCredentials.uid+'/'+cid+'/paused', true);
			res.send('{"success":1,"notification":"Campaign has been successfully paused"}');
		}
	}, function() {
		res.status(401).send('{"fail":1,"notification":"Error advertising.js 89. Invalid Session Variable"}'); return false;
	});
	return false;
});

/**
 * @name /advertising/restartcampaign/*
 * @description Pause Campaign
 * @memberof module:jseRouter
 */
router.post('/restartcampaign/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error advertising.js 137. No Session Variable Supplied"}'); return false; }
	const session = req.body.session; // No need to cleanString because it's only used for comparison
	const cid = JSE.jseFunctions.cleanString(req.body.cid);
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
		if (goodCredentials) {
			JSE.jseDataIO.setVariable('adxCampaigns/'+goodCredentials.uid+'/'+cid+'/paused', false);
			res.send('{"success":1,"notification":"Campaign has been successfully restarted"}');
		}
	}, function() {
		res.status(401).send('{"fail":1,"notification":"Error advertising.js 89. Invalid Session Variable"}'); return false;
	});
	return false;
});

/**
 * @name /advertising/archivecampaign/*
 * @description Pause Campaign
 * @memberof module:jseRouter
 */
router.post('/archivecampaign/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error advertising.js 157. No Session Variable Supplied"}'); return false; }
	const session = req.body.session; // No need to cleanString because it's only used for comparison
	const cid = JSE.jseFunctions.cleanString(req.body.cid);
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
		if (goodCredentials) {
			JSE.jseDataIO.setVariable('adxCampaigns/'+goodCredentials.uid+'/'+cid+'/paused', true);
			JSE.jseDataIO.setVariable('adxCampaigns/'+goodCredentials.uid+'/'+cid+'/archived', true);
			res.send('{"success":1,"notification":"Campaign has been successfully restarted"}');
		}
	}, function() {
		res.status(401).send('{"fail":1,"notification":"Error advertising.js 89. Invalid Session Variable"}'); return false;
	});
	return false;
});

/**
 * @name /advertising/duplicatecampaign/*
 * @description Duplicate Campaign
 * @memberof module:jseRouter
 */
router.post('/duplicatecampaign/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error advertising.js 157. No Session Variable Supplied"}'); return false; }
	const session = req.body.session; // No need to cleanString because it's only used for comparison
	const cid = JSE.jseFunctions.cleanString(req.body.cid);
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
		if (goodCredentials) {
			JSE.jseDataIO.getVariable('adxCampaigns/'+goodCredentials.uid+'/'+cid+'/', function(campaign) {
				const newCampaign = campaign;
				newCampaign.name += ' Copy';
				const newDate = new Date().getTime();
				const random = Math.floor((Math.random() * 9999) + 1); // setting up a firebase style push variable, timestamp+random
				newCampaign.cid = String(newDate) +''+ String(random); // Campaign ID
				// Note banner filenames will still include old campaign ID.
				JSE.jseDataIO.setVariable('adxCampaigns/'+goodCredentials.uid+'/'+newCampaign.cid+'/',newCampaign);
				res.send('{"success":1,"notification":"Campaign has been successfully duplicated"}');
			});
		}
	}, function() {
		res.status(401).send('{"fail":1,"notification":"Error advertising.js 89. Invalid Session Variable"}'); return false;
	});
	return false;
});

/**
 * @name /advertising/blacklist/*
 * @description Modify domain and publisher blacklists
 * @memberof module:jseRouter
 */
router.post('/blacklist/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error advertising.js 185. No Session Variable Supplied"}'); return false; }
	const session = req.body.session; // No need to cleanString because it's only used for comparison
	const cid = JSE.jseFunctions.cleanString(req.body.cid);
	const addSubtract = JSE.jseFunctions.cleanString(req.body.addSubtract);
	const blacklist = JSE.jseFunctions.cleanString(req.body.blacklist);
	const field = JSE.jseFunctions.cleanString(req.body.field);
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
		if (goodCredentials) {
			if (blacklist === 'domainBlacklist' || blacklist === 'publisherBlacklist') {
				JSE.jseDataIO.getVariable('adxCampaigns/'+goodCredentials.uid+'/'+cid+'/', function(campaign) {
					let blNew = campaign[blacklist] || '';
					if (addSubtract === 'add') {
						blNew += field+"\n";
						JSE.jseDataIO.setVariable('adxCampaigns/'+goodCredentials.uid+'/'+cid+'/'+blacklist,blNew);
						if (blacklist === 'domainBlacklist' && campaign.domains) {
							JSE.jseDataIO.setVariable('adxCampaigns/'+goodCredentials.uid+'/'+cid+'/domains',false);
						} else if (blacklist === 'publisherBlacklist' && campaign.publishers) {
							JSE.jseDataIO.setVariable('adxCampaigns/'+goodCredentials.uid+'/'+cid+'/publishers',false);
						}
					} else if (addSubtract === 'remove') {
						blNew = blNew.split(field+"\n").join('');
						JSE.jseDataIO.setVariable('adxCampaigns/'+goodCredentials.uid+'/'+cid+'/'+blacklist,blNew);
						if (blNew === '') {
							if (blacklist === 'domainBlacklist' && !campaign.domains) {
								JSE.jseDataIO.setVariable('adxCampaigns/'+goodCredentials.uid+'/'+cid+'/domains',true);
							} else if (blacklist === 'publisherBlacklist' && !campaign.publishers) {
								JSE.jseDataIO.setVariable('adxCampaigns/'+goodCredentials.uid+'/'+cid+'/publishers',true);
							}
						}
					}
					res.send('{"success":1,"notification":"Blacklist Updated"}');
				});
			}
		}
	}, function() {
		res.status(401).send('{"fail":1,"notification":"Error advertising.js 89. Invalid Session Variable"}'); return false;
	});
	return false;
});

/**
 * @name /advertising/getcampaigns/*
 * @description Get campaign data
 * @memberof module:jseRouter
 */
router.post('/getcampaigns/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error advertising.js 12. No Session Variable Supplied"}'); return false; }
	const session = req.body.session; // No need to cleanString because it's only used for comparison
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
		if (goodCredentials) {
			JSE.jseDataIO.getVariable('adxCampaigns/'+goodCredentials.uid+'/', function(campaigns) {
				res.send(JSON.stringify(campaigns));
			});
		}
	}, function() {
		res.status(401).send('{"fail":1,"notification":"Error advertising.js 89. Invalid Session Variable"}'); return false;
	});
	return false;
});

/**
 * @name /advertising/getadvstats/*
 * @description Get basic advertising stats data
 * @memberof module:jseRouter
 */
router.post('/getadvstats/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error advertising.js 12. No Session Variable Supplied"}'); return false; }
	const session = req.body.session; // No need to cleanString because it's only used for comparison
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
		if (goodCredentials) {
			JSE.jseDataIO.getVariable('adxAdvStats/'+goodCredentials.uid+'/', function(result) {
				res.send(JSON.stringify(result));
			});
		}
	}, function() {
		res.status(401).send('{"fail":1,"notification":"Error advertising.js 109. Invalid Session Variable"}'); return false;
	});
	return false;
});

/**
 * @name /storeclick/:postback/*
 * @description Store a click in localStorage for global tracking pixel
 * @memberof module:jseRouter
 */
router.get('/storeclick/:advid/:postback/*', function(req, res) {
	const js = `<script>
		localStorage.setItem('postback'+${req.params.advid}, ${req.params.postback});
	</script>`;
	res.send(js);
});

/**
 * @name /globalpixel/*
 * @description Global pixel url <img src="https://load.jsecoin.com/advertising/globalpixel/?aid=145&value=1" />
 * @memberof module:jseRouter
 */
router.get('/globalpixel/*', function(req, res) {
	const js = `<script>
		if (localStorage && localStorage.postback${req.query.aid}) {
			var postback = localStorage.postback${req.query.aid};
			var value = ${req.query.value || 1};
			(new Image()).src = 'https://load.jsecoin.com/advertising/s2spixel/?aid=${req.query.aid}&value='+value+'&postback='+postback;
		}
	</script>`;
	res.send(js);
});

/**
 * @name /s2spixel/*
 * @description s2s postback url
 * @memberof module:jseRouter
 */
router.get('/s2spixel/*', async(req, res) => {
	const aid = String(req.query.aid).split(/[^0-9]/).join('');
	const value = String(req.query.value).split(/[^0-9.]/).join('') || 1;
	const postback = String(req.query.postback).split(/[^0-9]/).join('');
	let found = false;
	if (aid && value && postback && (postback + value + aid).length < 1000) {
		const rightNow = new Date();
		for (let i = 0; i < 7 && found === false; i += 1) { // 0-6 = 7 days
			rightNow.setDate(rightNow.getDate()-0);
			const yymmdd = rightNow.toISOString().slice(2,10).replace(/-/g,"");
			const adImpression = await JSE.jseDataIO.asyncGetVar(`adxClicks/${aid}/${postback}`); // eslint-disable-line
			if (adImpression) {
				jseAds.logAdStat(adImpression,'k');
				found = true;
			}
		}
	}
	if (found) {
		res.send(1);
	} else {
		res.send(0);
	}
});

/**
 * @name /showcase/*
 * @description get adxShowcase for ad catalog
 * @memberof module:jseRouter
 */
router.post('/showcase/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error advertising.js 12. No Session Variable Supplied"}'); return false; }
	const session = req.body.session; // No need to cleanString because it's only used for comparison
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
		if (goodCredentials) {
			JSE.jseDataIO.getVariable('adxShowcase/', function(adxShowcase) {
				res.send(JSON.stringify(adxShowcase));
			});
		}
	}, function() {
		res.status(401).send('{"fail":1,"notification":"Error advertising.js 191. Invalid Session Variable"}'); return false;
	});
	return false;
});

/**
 * @name /advertising/stats/:report/*
 * @description Routes for adx stats
 * @memberof module:jseRouter
 */
router.post('/stats/:report/*', function (req, res) {
	if (!req.body.session) { res.status(400).send('{"fail":1,"notification":"Error advertising.js 12. No Session Variable Supplied"}'); return false; }
	const session = req.body.session;
	JSE.jseDataIO.getCredentialsBySession(session,function(goodCredentials) {
		if (goodCredentials) {
			const report = JSE.jseFunctions.cleanString(req.params.report);
			if (report === 'adxAdvStats' || report === 'adxAdvDomains' || report === 'adxAdvPubIDs' || report === 'adxAdvCreatives' || report === 'adxAdvGeos' || report === 'adxAdvDevices' || report === 'adxAdvBrowsers' || report === 'adxPubStats' || report === 'adxPubDomains' || report === 'adxPubSubIDs' || report === 'adxPubAdvIDs' || report === 'adxPubGeos' || report === 'adxPubDevices' || report === 'adxPubPlacements') {
				JSE.jseDataIO.getVariable(report+'/'+goodCredentials.uid,function(returnObject) {
					res.send(returnObject);
				});
			}
		}
	});
	return false;
});

module.exports = router;
