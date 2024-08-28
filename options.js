document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('settingsForm');
    const domainInput = document.getElementById('domain');
    const numPostsInput = document.getElementById('numPosts');
    const messageElement = document.querySelector('.message');

    // Load saved settings
    loadSettings();

    form.addEventListener('submit', function(event) {
        event.preventDefault();
        saveSettings();
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

        browser.storage.local.set({
            domain: domain,
            numPosts: numPosts
        }).then(() => {
            updateMessage('Settings saved successfully!');
        }).catch(error => {
            console.error('Failed to save settings:', error);
            updateMessage('Failed to save settings.');
        });
    }

    function loadSettings() {
        browser.storage.local.get(['domain', 'numPosts'])
            .then(({ domain, numPosts = 5 }) => {
                if (domain) domainInput.value = domain;
                if (numPosts) numPostsInput.value = numPosts;
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
