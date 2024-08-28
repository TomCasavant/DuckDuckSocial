// Message listener for various actions
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'searchMastodon') {
        // Load saved settings from browser.storage.local
        browser.storage.local.get(['client_id', 'client_secret', 'access_token', 'domain', 'numPosts'])
            .then(({ client_id, client_secret, access_token, domain, numPosts = 5 }) => {
				console.log(access_token);
				console.log(domain);
                if (!access_token || !domain) {
                    sendResponse({ success: false, error: 'Missing access token or domain.' });
                    return;
                }

                const searchTerm = message.searchTerm;
                fetch(`https://${domain}/api/v2/search?q=${encodeURIComponent(searchTerm)}&resolve=true&limit=${numPosts}`, {
                    headers: {
                        'Authorization': `Bearer ${access_token}`
                    }
                })
                .then(response => response.json())
                .then(data => {
					console.log(data.statuses); //TODO: For some reason this sendResponse does not work unless I log data.statuses. I have no idea why. Best guess is there's some sort of race condition going on? Though I'm not familiar enough with javascript to know if that's true
                    sendResponse({ success: true, results: data.statuses });
                })
                .catch(error => {
                    sendResponse({ success: false, error: error.message });
                });

                return true;
            })
            .catch(error => {
                sendResponse({ success: false, error: 'Failed to retrieve saved settings.' });
            });
			return true;
    } else if (message.action === 'getSettings') {
        browser.storage.local.get(['domain', 'numPosts'])
            .then(({ domain, numPosts = 5 }) => {
                sendResponse({ domain, numPosts });
            })
            .catch(error => {
                sendResponse({ success: false, error: 'Failed to retrieve settings.' });
            });

        return true;
    } else if (message.action === 'authorize') {
        const domain = message.domain;
		let appRegistrate = null;

        // Register the app and start the OAuth flow
        registerApp(domain).then(appRegistration => {
            console.log('App registration successful:', appRegistration);
			appRegistrate = appRegistration;
            return launchOAuthFlow(appRegistration, domain);
        }).then(redirectUrl => {
            return validate(redirectUrl, domain, appRegistrate); // Pass appRegistration here
        }).then(() => {
            sendResponse({ success: true });
        }).catch(error => {
            console.error('Error during OAuth process:', error);
            sendResponse({ success: false, error: error.message });
        });

        return true;
    }
});

// Registers the app with a mastodon server
async function registerApp(domain) {
    try {
        const response = await fetch(`https://${domain}/api/v1/apps`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_name: 'DuckDuckSocial',
                redirect_uris: browser.identity.getRedirectURL(),  // Use the add-on's redirect URL
                scopes: 'read write',
                website: 'https://tomcasavant.com'
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error registering app:', errorText);
            throw new Error('Failed to register app');
        }

        const appData = await response.json();
        await browser.storage.local.set({
            client_id: appData.client_id,
            client_secret: appData.client_secret,
            redirect_uri: appData.redirect_uri
        });

        return appData;
    } catch (error) {
        console.error('Error during app registration:', error);
        throw error;
    }
}

// Launches OAuth flow 
function launchOAuthFlow(appRegistration, domain) {
    const authorizationUrl = `https://${domain}/oauth/authorize?client_id=${appRegistration.client_id}&redirect_uri=${encodeURIComponent(appRegistration.redirect_uri)}&response_type=code&scope=read`;

    return browser.identity.launchWebAuthFlow({
        interactive: true,
        url: authorizationUrl
    });
}

// Get access token from Authorization
async function exchangeCodeForToken(code, domain, appRegistration) {
    try {
        const response = await fetch(`https://${domain}/oauth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_id: appRegistration.client_id,
                client_secret: appRegistration.client_secret,
                redirect_uri: appRegistration.redirect_uri,
                grant_type: 'authorization_code',
                code: code
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error exchanging code for token:', errorText);
            throw new Error('Failed to exchange authorization code for access token');
        }

        const tokenData = await response.json();
        await browser.storage.local.set({ access_token: tokenData.access_token });
    } catch (error) {
        console.error('Error during token exchange:', error);
        throw error;
    }
}

// Validates the redirect URL
async function validate(redirectUrl, domain, appRegistration) {
    try {
        console.log('Redirect URL:', redirectUrl);

        if (redirectUrl) {
            const code = new URL(redirectUrl).searchParams.get('code');

            if (code) {
                await exchangeCodeForToken(code, domain, appRegistration);
                console.log('Access token saved successfully.');
            } else {
                throw new Error('Authorization code not found in redirect URL.');
            }
        } else {
            throw new Error('No redirect URL returned.');
        }
    } catch (error) {
        console.error('Validation error:', error);
        throw error;
    }
}
