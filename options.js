document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('settingsForm');
    const domainInput = document.getElementById('domain');
    const numPostsInput = document.getElementById('numPosts');
	const apiKeyInput = document.getElementById('apiKey');
    const messageElement = document.querySelector('.message');
	const toggleButton = document.getElementById('toggleAdvancedSettings');
	const advancedSettings = document.querySelector('.advanced-settings');

    // Load saved settings
    loadSettings();

    form.addEventListener('submit', function(event) {
        event.preventDefault();
        saveSettings();
    });
	
    toggleButton.addEventListener('click', function() {
        const isVisible = advancedSettings.style.display === 'block';
        advancedSettings.style.display = isVisible ? 'none' : 'block';
        toggleButton.textContent = isVisible ? 'Show Advanced Settings' : 'Hide Advanced Settings';
    });

    document.getElementById('connectMastodon').addEventListener('click', function(event) {
        const domain = domainInput.value;

        if (!domain) {
            updateMessage('Mastodon server domain is required!');
            return;
        }

        browser.runtime.sendMessage({
            action: 'authorize',
            domain: domain
        }).then(response => {
            if (response.success) {
                updateMessage('Connected to Mastodon successfully!');
            } else {
                updateMessage('Failed to connect to Mastodon: ' + response.error);
            }
        }).catch(error => {
            console.error('Error during OAuth process:', error);
            updateMessage('Failed to connect to Mastodon. Please try again.');
        });
    });

    function saveSettings() {
        const domain = domainInput.value;
        const numPosts = numPostsInput.value;
        const apiKey = apiKeyInput.value;

        browser.storage.local.set({
            domain: domain,
            numPosts: numPosts,
            apiKey: apiKey  // Save the API key as well
        }).then(() => {
            updateMessage('Settings saved successfully!');
        }).catch(error => {
            console.error('Failed to save settings:', error);
            updateMessage('Failed to save settings.');
        });
    }
	
    function loadSettings() {
        browser.storage.local.get(['domain', 'numPosts', 'apiKey'])
            .then(({ domain, numPosts = 5, apiKey }) => {
                if (domain) domainInput.value = domain;
                if (numPosts) numPostsInput.value = numPosts;
                if (apiKey) {
					apiKeyInput.value = apiKey;
					advancedSettingsDiv.style.display = 'block';
				}
            })
            .catch(error => {
                console.error('Failed to load settings:', error);
            });
    }

    function updateMessage(message) {
        messageElement.textContent = message;
        messageElement.style.color = 'red';
	}
});


